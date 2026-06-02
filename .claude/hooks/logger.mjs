#!/usr/bin/env node
// AI 작업로그 수집기. UserPromptSubmit + Stop 훅에서 호출됨.
// 동작: 로컬 .claude/logs/ai_logs.jsonl 즉시 append → Supabase로 detach POST(안 기다림).
// 목적: "이 프롬프트 → 이 결과" 추적. 태그/요약은 하지 않음(스크럼 워크플로우가 추론).

import { readFileSync, existsSync, appendFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { spawn, execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK_DIR = dirname(fileURLToPath(import.meta.url));
const CLAUDE_DIR = dirname(HOOK_DIR); // .claude
const LOG_DIR = join(CLAUDE_DIR, "logs");
const LOG_FILE = join(LOG_DIR, "ai_logs.jsonl");
const ENV_FILE = join(CLAUDE_DIR, ".env");

// .env 파싱 (KEY=VALUE 라인, 의존성 없음)
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

// stdin 전부 읽기
async function readStdin() {
  let s = "";
  for await (const c of process.stdin) s += c;
  return s;
}

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: 1500, stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

// transcript(jsonl)에서 마지막 assistant 텍스트 추출
function lastAssistantText(transcriptPath) {
  try {
    if (!transcriptPath || !existsSync(transcriptPath)) return null;
    const lines = readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      let e;
      try { e = JSON.parse(lines[i]); } catch { continue; }
      const msg = e.message ?? e;
      if (e.type !== "assistant" && msg?.role !== "assistant") continue;
      const content = msg?.content;
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        const text = content.filter((p) => p?.type === "text").map((p) => p.text).join("\n").trim();
        if (text) return text;
      }
    }
  } catch { /* noop */ }
  return null;
}

// 서브에이전트 transcript(<session>/subagents/agent-*.jsonl)에서 내부 툴 사용 집계.
// toolUseId로 meta.json 정확 매칭, 없으면 가장 최근 수정된 transcript fallback.
function subagentToolsUsed(transcriptPath, toolUseId) {
  try {
    if (!transcriptPath) return null;
    const subDir = join(transcriptPath.replace(/\.jsonl$/, ""), "subagents");
    if (!existsSync(subDir)) return null;
    const files = readdirSync(subDir);

    let target = null;
    if (toolUseId) {
      for (const mf of files.filter((f) => f.endsWith(".meta.json"))) {
        try {
          const meta = JSON.parse(readFileSync(join(subDir, mf), "utf8"));
          if (meta.toolUseId === toolUseId) { target = mf.replace(/\.meta\.json$/, ".jsonl"); break; }
        } catch { /* noop */ }
      }
    }
    if (!target) {
      let t = 0;
      for (const jf of files.filter((f) => f.endsWith(".jsonl"))) {
        const ms = statSync(join(subDir, jf)).mtimeMs;
        if (ms > t) { t = ms; target = jf; }
      }
    }
    if (!target || !existsSync(join(subDir, target))) return null;

    const counts = {};
    for (const line of readFileSync(join(subDir, target), "utf8").split("\n")) {
      if (!line) continue;
      let e; try { e = JSON.parse(line); } catch { continue; }
      const c = e.message?.content;
      if (Array.isArray(c)) for (const p of c) if (p?.type === "tool_use") counts[p.name] = (counts[p.name] || 0) + 1;
    }
    return Object.keys(counts).length ? counts : null;
  } catch { return null; }
}

async function main() {
  const raw = await readStdin();
  let data = {};
  try { data = JSON.parse(raw || "{}"); } catch { /* noop */ }

  const env = { ...loadEnv(ENV_FILE), ...process.env };
  const event = data.hook_event_name || "unknown";

  // PostToolUse는 서브에이전트(Agent 툴, 구버전 Task)만 기록. 그 외 툴은 스킵.
  const isAgentTool = data.tool_name === "Agent" || data.tool_name === "Task";
  if (event === "PostToolUse" && !isAgentTool) process.exit(0);

  // content / agent / event_type 결정
  let content = null;
  let agent = env.AGENT_ROLE || null; // 서브에이전트 역할(planner/implementer/reviewer)
  let eventType = event;
  let toolsUsed = null; // 서브에이전트가 내부에서 쓴 툴 집계
  if (event === "UserPromptSubmit") content = data.prompt ?? null;
  else if (event === "Stop") content = lastAssistantText(data.transcript_path);
  else if (event === "PostToolUse" && isAgentTool) {
    eventType = "Subagent";
    agent = data.tool_input?.subagent_type ?? agent; // 어떤 서브에이전트였나
    content = data.tool_input?.prompt ?? data.tool_input?.description ?? null; // 받은 지시
    toolsUsed = subagentToolsUsed(data.transcript_path, data.tool_use_id); // {Read:4,Bash:9,...}
  }

  const branch = env.BRANCH || sh("git branch --show-current");
  const record = {
    project: env.PROJECT || "todam",
    user_name: env.USER_NAME || sh("git config user.name"),
    agent,
    event_type: eventType,
    content,
    metadata: {
      tool: env.TOOL || "claude", // 어떤 CLI: claude | codex
      session_id: data.session_id ?? null,
      branch: branch || null,
      cwd: data.cwd ?? null,
      transcript_path: data.transcript_path ?? null,
      ...(toolsUsed ? { tools_used: toolsUsed } : {}), // 서브에이전트 내부 툴 집계
    },
    created_at: new Date().toISOString(),
  };

  // 1) 로컬 append (즉시, 유실 방지)
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_FILE, JSON.stringify(record) + "\n");
  } catch { /* noop */ }

  // 2) Supabase로 detach POST (안 기다림). 크레덴셜 없으면 스킵 → 로컬만.
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;
  if (url && key && !url.includes("YOUR_") && !key.includes("YOUR_")) {
    const child = spawn(
      "curl",
      [
        "-s", "-X", "POST",
        `${url.replace(/\/$/, "")}/rest/v1/ai_logs`,
        "-H", `apikey: ${key}`,
        "-H", `Authorization: Bearer ${key}`,
        "-H", "Content-Type: application/json",
        "-H", "Prefer: return=minimal",
        "--max-time", "10",
        "-d", JSON.stringify(record),
      ],
      { detached: true, stdio: "ignore" }
    );
    child.unref();
  }

  // UserPromptSubmit는 stdout이 컨텍스트에 주입됨 → 아무것도 출력 안 함.
  process.exit(0);
}

main().catch(() => process.exit(0));
