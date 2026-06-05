#!/usr/bin/env node
// Codex Desktop 작업로그 수집기. ~/.codex/sessions/**/*.jsonl 을 폴링해 Supabase ai_logs에 적재.
// claude의 logger.mjs와 같은 테이블/스키마, metadata.tool="codex"로 구분.
//
// 왜 폴링인가: Codex 앱은 claude code 같은 lifecycle 훅이 없고, 앱 안에서 스크립트를 돌리면
// 매번 컨펌창이 뜬다. 그래서 앱과 무관한 OS 데몬(launchd)이 세션 jsonl을 감시해 적재한다.
//
// 멱등성: 상태파일(~/.codex/.todam-logged.json)에 {파일경로: 처리한 줄 수}를 기록.
// 완결된 turn(task_started~task_complete)까지만 처리하고, 진행 중 turn은 다음 실행으로 미룬다.
// POST 성공해야 offset을 전진시켜 유실/중복을 막는다.

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { homedir } from "node:os";

const CLAUDE_DIR = dirname(dirname(fileURLToPath(import.meta.url))); // .claude
const ENV_FILE = join(CLAUDE_DIR, ".env");
const SESSIONS_DIR = join(homedir(), ".codex", "sessions");
const STATE_FILE = join(homedir(), ".codex", ".todam-logged.json");
const SCAN_DAYS = 3; // 최근 N일 수정된 세션만 스캔 (백필 폭주 방지)

function loadEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

// Codex Desktop은 user_message 앞에 IDE 컨텍스트 프리앰블을 붙인다.
// 실제 프롬프트는 "## My request for Codex:" 마커 뒤. 마커 없으면 원본 유지(서브에이전트 지시 등).
function stripIdePreamble(msg) {
  if (typeof msg !== "string") return msg;
  const marker = "## My request for Codex:";
  const i = msg.indexOf(marker);
  if (i === -1) return msg;
  return msg.slice(i + marker.length).replace(/^[:\s]+/, "").trim() || msg;
}

function sh(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", timeout: 2000, stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch { return null; }
}

// 세션 트리(.../YYYY/MM/DD/*.jsonl)에서 최근 SCAN_DAYS일 수정 파일 수집
function recentSessionFiles() {
  const out = [];
  const cutoff = Date.now() - SCAN_DAYS * 86400 * 1000;
  function walk(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith(".jsonl")) {
        try { if (statSync(p).mtimeMs >= cutoff) out.push(p); } catch { /* noop */ }
      }
    }
  }
  walk(SESSIONS_DIR);
  return out;
}

// 한 세션 파일 → ai_logs row 배열 + 새 처리 줄 수.
// startLine 이후만 처리. 완결 turn 끝까지만.
function parseSession(file, startLine, env) {
  const lines = readFileSync(file, "utf8").split("\n");
  // 세션 메타는 항상 첫 줄
  let meta = null;
  try { meta = JSON.parse(lines[0] || "{}"); } catch { /* noop */ }
  const mp = meta?.payload || {};
  const isSub = mp.thread_source === "subagent";
  const agentRole = mp.agent_role ?? null;
  const sessionId = mp.id ?? null;
  const cwd = mp.cwd ?? null;
  const branch = mp.git?.branch ?? (cwd ? sh("git rev-parse --abbrev-ref HEAD", cwd) : null);
  const userName = env.USER_NAME || (cwd ? sh("git config user.name", cwd) : null);

  const rows = [];
  let processedUpto = startLine; // 이 줄 수까지 확정 처리(완결 turn 끝)
  let curTools = {}; // 현재 turn의 function_call 집계
  let pendingPrompts = []; // 현재 turn의 user_message들 [{content, ts}] — task_complete 때 함께 flush

  const baseRow = (extra) => ({
    project: env.PROJECT || "todam",
    user_name: userName,
    agent: isSub ? agentRole : null,
    metadata: {
      tool: "codex",
      session_id: sessionId,
      branch: branch || null,
      cwd,
      transcript_path: file,
    },
    ...extra,
  });

  for (let i = Math.max(startLine, 1); i < lines.length; i++) {
    const raw = lines[i];
    if (!raw) continue;
    let e;
    try { e = JSON.parse(raw); } catch { continue; }
    const ts = e.timestamp || new Date().toISOString();
    const pl = (e.type === "event_msg" || e.type === "response_item") && e.payload ? e.payload : {};
    const pt = pl.type;

    if (e.type === "event_msg" && pt === "task_started") {
      curTools = {};
      pendingPrompts = [];
    } else if (e.type === "event_msg" && pt === "user_message") {
      // 아직 push 안 함 — task_complete 때 함께 flush(중복/유실 방지)
      pendingPrompts.push({ content: stripIdePreamble(pl.message ?? null), ts });
    } else if (e.type === "response_item" && pt === "function_call") {
      const name = pl.name || "unknown";
      curTools[name] = (curTools[name] || 0) + 1;
    } else if (e.type === "event_msg" && pt === "task_complete") {
      // 완결 turn → user_message들 + Stop 함께 적재
      for (const p of pendingPrompts) {
        rows.push(baseRow({
          event_type: isSub ? "Subagent" : "UserPromptSubmit",
          content: p.content,
          created_at: p.ts,
        }));
      }
      const stop = baseRow({
        event_type: "Stop",
        content: pl.last_agent_message ?? null,
        created_at: ts,
      });
      if (Object.keys(curTools).length) stop.metadata.tools_used = { ...curTools };
      rows.push(stop);
      processedUpto = i + 1; // 완결 turn 끝 → 여기까지 확정
      curTools = {};
      pendingPrompts = [];
    }
  }
  return { rows, processedUpto };
}

// node 내장 fetch 사용 → curl 의존 없음(윈도우/mac 동일 동작).
async function postBatch(rows, env) {
  const url = (env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("YOUR_") || key.includes("YOUR_")) return false;
  try {
    const res = await fetch(`${url}/rest/v1/ai_logs`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(20000),
    });
    return res.ok;
  } catch { return false; }
}

async function main() {
  const env = { ...loadEnv(ENV_FILE), ...process.env };
  let state = {};
  if (existsSync(STATE_FILE)) { try { state = JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch { /* noop */ } }

  for (const file of recentSessionFiles()) {
    const start = state[file] || 0;
    const totalLines = (() => { try { return readFileSync(file, "utf8").split("\n").length; } catch { return 0; } })();
    if (totalLines <= start) continue; // 새 줄 없음

    const { rows, processedUpto } = parseSession(file, start, env);
    if (!rows.length) { if (!env.DRY_RUN) state[file] = Math.max(start, processedUpto); continue; }

    if (env.DRY_RUN) {
      console.log(`\n# ${file} (줄 ${start}→${processedUpto}, ${rows.length} rows)`);
      for (const r of rows) console.log(`  ${r.event_type} | agent=${r.agent} | tool=${r.metadata.tool} | branch=${r.metadata.branch} | tools_used=${JSON.stringify(r.metadata.tools_used || null)} | ${(r.content || "").slice(0, 50).replace(/\n/g, " ")}`);
      continue;
    }

    const ok = await postBatch(rows, env);
    if (ok) state[file] = processedUpto; // 성공 시에만 전진
    // 실패면 offset 유지 → 다음 실행 재시도
  }

  if (!env.DRY_RUN) { try { writeFileSync(STATE_FILE, JSON.stringify(state)); } catch { /* noop */ } }
}

main();
