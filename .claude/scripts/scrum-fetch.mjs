#!/usr/bin/env node
// ai_logs를 Supabase에서 읽어 stdout으로 출력. service_role 사용.
// 사용: node scrum-fetch.mjs [YYYY-MM-DD]   (인자 없으면 어제 KST — 아침 스크럼 기준)

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const CLAUDE_DIR = dirname(dirname(fileURLToPath(import.meta.url))); // .claude
const ENV_FILE = join(CLAUDE_DIR, ".env");

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

const env = { ...loadEnv(ENV_FILE), ...process.env };
const URL = (env.SUPABASE_URL || "").replace(/\/$/, "");
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 누락 (.env 확인)");
  process.exit(1);
}

// KST 기준 날짜 범위 → UTC ISO
const arg = process.argv[2];
let startUtc, endUtc, dateLabel;
if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) {
  startUtc = new Date(`${arg}T00:00:00+09:00`).toISOString();
  endUtc = new Date(`${arg}T23:59:59.999+09:00`).toISOString();
  dateLabel = arg;
} else {
  // 인자 없으면 어제(KST) 하루 전체 — 아침 스크럼 기준
  const KST = 9 * 60 * 60 * 1000;
  const nowKst = new Date(Date.now() + KST);
  const yest = new Date(Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth(), nowKst.getUTCDate() - 1));
  const y = yest.getUTCFullYear(), m = yest.getUTCMonth(), d = yest.getUTCDate();
  startUtc = new Date(Date.UTC(y, m, d) - KST).toISOString();
  endUtc = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - KST).toISOString();
  dateLabel = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const q = `${URL}/rest/v1/ai_logs?created_at=gte.${startUtc}&created_at=lte.${endUtc}&order=created_at.asc`;
let body;
try {
  body = execSync(
    `curl -s "${q}" -H "apikey: ${KEY}" -H "Authorization: Bearer ${KEY}"`,
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
} catch (e) {
  console.error("fetch 실패:", e.message);
  process.exit(1);
}

let logs;
try { logs = JSON.parse(body); } catch { console.error("응답 파싱 실패:", body.slice(0, 200)); process.exit(1); }
if (!Array.isArray(logs)) { console.error("예상 못한 응답:", JSON.stringify(logs).slice(0, 200)); process.exit(1); }

console.log(JSON.stringify({ date: dateLabel, count: logs.length, logs }, null, 2));
