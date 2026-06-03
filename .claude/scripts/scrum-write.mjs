#!/usr/bin/env node
// 스크럼 요약 JSON(stdin)을 Notion Daily Scrum DB에 작성.
// 토큰은 .env에서만 읽음 → 컨텍스트에 노출 안 됨.
// stdin JSON:
//   {
//     date: "YYYY-MM-DD",
//     summary: "초압축 한 줄",          // Summary 컬럼
//     features: ["reservation",...],     // Features multi-select
//     body_markdown: "## 요약\n- ..."    // 페이지 본문 (상세 요약/결정/이슈)
//   }

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

// 인라인 **bold** 파싱 → rich_text 배열 (각 ≤2000자)
function parseInline(text) {
  const s = String(text || "");
  if (!s) return [];
  const out = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push({ type: "text", text: { content: s.slice(last, m.index) } });
    out.push({ type: "text", text: { content: m[1] }, annotations: { bold: true } });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ type: "text", text: { content: s.slice(last) } });
  // 2000자 제한 분할
  return out.flatMap((rt) => {
    const c = rt.text.content;
    if (c.length <= 1900) return [rt];
    const parts = [];
    for (let i = 0; i < c.length; i += 1900) parts.push({ ...rt, text: { content: c.slice(i, i + 1900) } });
    return parts;
  });
}

// 마크다운(서브셋) → Notion 블록. 지원: # ## ### / - * 불릿 / 1. 넘버 / 일반 문단.
function mdToBlocks(md) {
  const blocks = [];
  for (const raw of String(md || "").split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    let m;
    if ((m = line.match(/^###\s+(.*)/))) blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: parseInline(m[1]) } });
    else if ((m = line.match(/^##\s+(.*)/))) blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: parseInline(m[1]) } });
    else if ((m = line.match(/^#\s+(.*)/))) blocks.push({ object: "block", type: "heading_1", heading_1: { rich_text: parseInline(m[1]) } });
    else if ((m = line.match(/^\s*[-*]\s+(.*)/))) blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: parseInline(m[1]) } });
    else if ((m = line.match(/^\s*\d+\.\s+(.*)/))) blocks.push({ object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: parseInline(m[1]) } });
    else blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: parseInline(line) } });
  }
  return blocks.slice(0, 100); // 페이지 생성당 children 100개 제한
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

const features = Array.isArray(data.features) ? data.features : [];
const payload = {
  parent: { database_id: DBID },
  properties: {
    Name: { title: parseInline(`${data.date} Daily Scrum`) },
    Date: { date: { start: data.date } },
    Summary: { rich_text: parseInline(data.summary) },
    Features: { multi_select: features.map((f) => ({ name: String(f) })) },
  },
  children: mdToBlocks(data.body_markdown),
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
