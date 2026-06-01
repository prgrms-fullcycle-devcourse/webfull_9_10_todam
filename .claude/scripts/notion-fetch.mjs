#!/usr/bin/env node
// Notion 페이지/DB를 마크다운으로 출력. planner가 명세 읽을 때 사용.
// WebFetch는 Notion SPA를 못 읽어서 API로 가져온다. integration이 해당 페이지에 연결돼 있어야 함.
//
// 사용:
//   node notion-fetch.mjs <url|id>                  # page→본문 / DB→row 목록
//   node notion-fetch.mjs <db-url|id> --find "<검색어>"  # DB에서 title 매칭되는 row의 속성+본문 출력

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const env = { ...loadEnv(ENV_FILE), ...process.env };
const TOKEN = env.NOTION_TOKEN;
if (!TOKEN) { console.error("NOTION_TOKEN 누락"); process.exit(1); }

const argv = process.argv.slice(2);
const findIdx = argv.indexOf("--find");
const findQuery = findIdx !== -1 ? argv[findIdx + 1] : null;
const skipVal = findIdx >= 0 ? findIdx + 1 : -2;
const target = argv.find((a, i) => i !== findIdx && i !== skipVal && !a.startsWith("--"));
if (!target) { console.error("사용: node notion-fetch.mjs <url|id> [--find \"검색어\"]"); process.exit(1); }

const hex = (target.match(/[0-9a-fA-F]{32}/) || [])[0];
if (!hex) { console.error("id를 찾을 수 없음:", target); process.exit(1); }
const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;

const H = { Authorization: `Bearer ${TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };

async function api(path, opts = {}) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, { headers: H, ...opts });
  return { status: res.status, body: await res.json() };
}

function rich(arr) {
  return (arr || []).map((t) => {
    let s = t.plain_text ?? "";
    const a = t.annotations || {};
    if (a.code) s = `\`${s}\``;
    if (a.bold) s = `**${s}**`;
    if (a.italic) s = `*${s}*`;
    if (t.href) s = `[${s}](${t.href})`;
    return s;
  }).join("");
}

// 속성 값 → 문자열
function propVal(p) {
  switch (p.type) {
    case "title": return p.title.map((x) => x.plain_text).join("");
    case "rich_text": return rich(p.rich_text);
    case "select": return p.select?.name ?? "";
    case "status": return p.status?.name ?? "";
    case "multi_select": return p.multi_select.map((s) => s.name).join(", ");
    case "number": return p.number ?? "";
    case "checkbox": return p.checkbox ? "✓" : "✗";
    case "url": return p.url ?? "";
    case "email": return p.email ?? "";
    case "phone_number": return p.phone_number ?? "";
    case "date": return p.date ? `${p.date.start}${p.date.end ? "~" + p.date.end : ""}` : "";
    case "people": return p.people.map((u) => u.name || u.id).join(", ");
    case "relation": return p.relation.map((r) => r.id).join(", ");
    case "formula": return p.formula?.string ?? p.formula?.number ?? "";
    default: return `(${p.type})`;
  }
}

function titleOf(props) {
  const t = Object.values(props || {}).find((v) => v.type === "title");
  return t?.title?.map((x) => x.plain_text).join("") || "(무제)";
}

// 블록 → 마크다운 (자식 재귀, 페이지네이션)
async function blocksToMd(blockId, depth = 0) {
  let md = "";
  let cursor;
  do {
    const q = `blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
    const { status, body } = await api(q);
    if (status !== 200) { console.error("blocks 실패", status, body.code, body.message); process.exit(1); }
    for (const b of body.results) {
      const pad = "  ".repeat(depth);
      const t = b.type;
      const rt = b[t]?.rich_text;
      if (t === "heading_1") md += `\n# ${rich(rt)}\n`;
      else if (t === "heading_2") md += `\n## ${rich(rt)}\n`;
      else if (t === "heading_3") md += `\n### ${rich(rt)}\n`;
      else if (t === "bulleted_list_item") md += `${pad}- ${rich(rt)}\n`;
      else if (t === "numbered_list_item") md += `${pad}1. ${rich(rt)}\n`;
      else if (t === "to_do") md += `${pad}- [${b.to_do.checked ? "x" : " "}] ${rich(rt)}\n`;
      else if (t === "quote") md += `> ${rich(rt)}\n`;
      else if (t === "code") md += `\n\`\`\`${b.code.language || ""}\n${rich(rt)}\n\`\`\`\n`;
      else if (t === "divider") md += `\n---\n`;
      else if (t === "callout") md += `> ${rich(rt)}\n`;
      else if (t === "toggle") md += `${pad}- ${rich(rt)}\n`;
      else if (t === "paragraph") md += `${rich(rt)}\n`;
      else if (rt) md += `${rich(rt)}\n`;
      if (b.has_children) md += await blocksToMd(b.id, depth + 1);
    }
    cursor = body.has_more ? body.next_cursor : null;
  } while (cursor);
  return md;
}

// row(page) 전체 출력: 제목 + 속성 + 본문
async function renderRow(page) {
  let out = `\n## ${titleOf(page.properties)}\n`;
  for (const [k, v] of Object.entries(page.properties)) {
    if (v.type === "title") continue;
    const val = propVal(v);
    if (val !== "" && val != null) out += `- **${k}**: ${val}\n`;
  }
  const body = await blocksToMd(page.id);
  if (body.trim()) out += `\n${body}`;
  return out;
}

async function queryAll(dbId) {
  const rows = [];
  let cursor;
  do {
    const { status, body } = await api(`databases/${dbId}/query`, {
      method: "POST",
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    if (status !== 200) { console.error("query 실패", status, body.code, body.message); process.exit(1); }
    rows.push(...body.results);
    cursor = body.has_more ? body.next_cursor : null;
  } while (cursor);
  return rows;
}

// --- 실행 ---
if (findQuery) {
  // DB에서 title 매칭 row 찾아 출력
  const db = await api(`databases/${id}`);
  if (db.status !== 200) { console.error("DB 접근 실패", db.status, db.body.code, "— --find는 DB에만."); process.exit(1); }
  const rows = await queryAll(id);
  const norm = (s) => s.toLowerCase().replace(/\s+/g, "");
  const q = norm(findQuery);
  const matches = rows.filter((r) => norm(titleOf(r.properties)).includes(q));
  if (matches.length === 0) {
    console.error(`"${findQuery}" 매칭 없음. 가능한 항목:`);
    rows.forEach((r) => console.error("  -", titleOf(r.properties)));
    process.exit(2);
  }
  for (const m of matches) console.log(await renderRow(m));
  if (matches.length > 1) console.error(`\n(${matches.length}건 매칭됨 — 더 정확한 검색어로 좁힐 수 있음)`);
  process.exit(0);
}

// 단일 대상: page면 본문, DB면 row 목록
const page = await api(`pages/${id}`);
if (page.status === 200) {
  console.log(`# ${titleOf(page.body.properties)}\n`);
  console.log(await blocksToMd(id));
  process.exit(0);
}
const db = await api(`databases/${id}`);
if (db.status === 200) {
  console.log(`# DB: ${db.body.title?.map((x) => x.plain_text).join("") || "(무제)"}\n`);
  const rows = await queryAll(id);
  rows.forEach((r) => console.log(`- ${titleOf(r.properties)}  (id: ${r.id})`));
  console.error(`\n(rows: ${rows.length}. 특정 항목은 --find "검색어"로 본문 fetch)`);
  process.exit(0);
}
console.error("접근 실패. page:", page.status, page.body.code, "| db:", db.status, db.body.code);
console.error("→ integration을 해당 페이지/DB에 연결했는지 확인.");
process.exit(1);
