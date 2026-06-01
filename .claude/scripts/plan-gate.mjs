#!/usr/bin/env node
// pre-commit 게이트: docs/exec-plans/completed/ 로 커밋되는 plan의 Status 체크리스트 검사.
// 셋(API 구현/UI 구현/API 연동) 다 [x] 아니면 커밋 거부 + 사유 출력 + .claude/logs/gate.jsonl 기록.

import { execSync } from "node:child_process";
import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CLAUDE_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const LOG_DIR = join(CLAUDE_DIR, "logs");
const LOG_FILE = join(LOG_DIR, "gate.jsonl");
const COMPLETED = "docs/exec-plans/completed/";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function gitUser() {
  try { return sh("git config user.name"); } catch { return null; }
}

function logGate(rec) {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_FILE, JSON.stringify({ ...rec, created_at: new Date().toISOString(), user: gitUser() }) + "\n");
  } catch { /* noop */ }
}

// 스테이징된(=커밋될) 변경 목록. completed/ 아래 .md 만, 삭제 제외.
let entries = [];
try {
  const out = sh("git diff --cached --name-status");
  for (const line of out.split("\n").filter(Boolean)) {
    const parts = line.split("\t");
    const status = parts[0][0]; // A/M/R/D/...
    if (status === "D") continue;
    const path = parts[parts.length - 1]; // rename이면 새 경로
    if (path.startsWith(COMPLETED) && path.endsWith(".md")) entries.push(path);
  }
} catch (e) {
  console.error("plan-gate: git diff 실패 —", e.message);
  process.exit(1);
}

if (entries.length === 0) process.exit(0); // completed로 들어오는 plan 없음

// 스테이징된 내용 읽기 (working tree 아님 — 실제 커밋될 blob)
function stagedContent(path) {
  try { return sh(`git show :"${path}"`); } catch {
    try { return readFileSync(path, "utf8"); } catch { return ""; }
  }
}

// ## Status 섹션에서 미체크 항목 추출
function uncheckedItems(md) {
  const lines = md.split("\n");
  let inStatus = false;
  const unchecked = [];
  for (const line of lines) {
    if (/^##\s/.test(line)) inStatus = /^##\s+Status\b/i.test(line);
    if (!inStatus) continue;
    const m = line.match(/^\s*-\s*\[( |x|X)\]\s*(.+?)\s*$/);
    if (m && m[1] === " ") unchecked.push(m[2]);
  }
  return unchecked;
}

let blocked = false;
for (const path of entries) {
  const md = stagedContent(path);
  const unchecked = uncheckedItems(md);
  if (unchecked.length > 0) {
    blocked = true;
    console.error(`\n✗ 커밋 거부: ${path}`);
    console.error("  미완료 항목:");
    for (const u of unchecked) console.error(`   - [ ] ${u}`);
    console.error("  → 셋 다 [x] 여야 completed/ 이동 가능. /review로 검증 후 체크하고 다시 커밋.\n");
    logGate({ event: "blocked", file: path, unchecked });
  } else {
    logGate({ event: "passed", file: path });
  }
}

process.exit(blocked ? 1 : 0);
