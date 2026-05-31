#!/usr/bin/env node
// 스크럼 요약 JSON(stdin)을 Notion Daily Scrum DB에 페이지로 작성.
// 토큰은 .env에서만 읽음 → 컨텍스트에 노출 안 됨.
// stdin JSON: { date:"YYYY-MM-DD", summary, decisions, issues, contributors:[string] }

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const CLAUDE_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
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

// Notion rich_text는 텍스트 객체당 2000자 제한 → 청크 분할
function richText(str) {
  const s = String(str || "");
  if (!s) return [];
  const chunks = [];
  for (let i = 0; i < s.length; i += 1900) chunks.push(s.slice(i, i + 1900));
  return chunks.map((c) => ({ type: "text", text: { content: c } }));
}

async function readStdin() {
  let s = "";
  for await (const c of process.stdin) s += c;
  return s;
}

const env = { ...loadEnv(ENV_FILE), ...process.env };
const TOKEN = env.NOTION_TOKEN;
const DBID = env.NOTION_DATABASE_ID;
if (!TOKEN || !DBID) { console.error("NOTION_TOKEN / NOTION_DATABASE_ID 누락"); process.exit(1); }

const input = await readStdin();
let data;
try { data = JSON.parse(input); } catch { console.error("stdin JSON 파싱 실패"); process.exit(1); }
if (!data.date) { console.error("date 필수"); process.exit(1); }

const contributors = Array.isArray(data.contributors) ? data.contributors : [];
const payload = {
  parent: { database_id: DBID },
  properties: {
    Name: { title: richText(`${data.date} Daily Scrum`) },
    Date: { date: { start: data.date } },
    Summary: { rich_text: richText(data.summary) },
    Decisions: { rich_text: richText(data.decisions) },
    Issues: { rich_text: richText(data.issues) },
    Contributors: { multi_select: contributors.map((n) => ({ name: String(n) })) },
  },
};

let body;
try {
  body = execSync(
    `curl -s -X POST "https://api.notion.com/v1/pages" ` +
      `-H "Authorization: Bearer ${TOKEN}" -H "Notion-Version: 2022-06-28" ` +
      `-H "Content-Type: application/json" -d @-`,
    { input: JSON.stringify(payload), encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
} catch (e) {
  console.error("Notion 작성 실패:", e.message);
  process.exit(1);
}

let r;
try { r = JSON.parse(body); } catch { console.error("응답 파싱 실패:", body.slice(0, 300)); process.exit(1); }
if (r.object === "error") { console.error(`Notion ERROR ${r.status} ${r.code}: ${r.message}`); process.exit(1); }
console.log("작성됨:", r.url);
