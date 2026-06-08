#!/usr/bin/env node
// Codex 작업로그 수집기.
// 동작: Supabase ai_logs insert + .claude/logs/ai_logs.jsonl fallback append + optional .codex/logs mirror.
// .claude/hooks/logger.mjs와 같은 ai_logs 레코드 형태를 유지한다.

// import {
//   appendFileSync,
//   existsSync,
//   mkdirSync,
//   readFileSync,
// } from "node:fs";
// import { execSync, spawn, spawnSync } from "node:child_process";
// import { dirname, join, resolve } from "node:path";
// import { fileURLToPath } from "node:url";

// const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
// const CODEX_DIR = dirname(SCRIPT_DIR);
// const PROJECT_DIR = dirname(CODEX_DIR);
// const CODEX_LOG_DIR = join(CODEX_DIR, "logs");
// const CODEX_LOG_FILE = join(CODEX_LOG_DIR, "ai_logs.jsonl");
// const CLAUDE_LOG_DIR = join(PROJECT_DIR, ".claude", "logs");
// const CLAUDE_LOG_FILE = join(CLAUDE_LOG_DIR, "ai_logs.jsonl");

// function loadEnv(path) {
//   const out = {};
//   if (!existsSync(path)) return out;
//   for (const line of readFileSync(path, "utf8").split("\n")) {
//     const t = line.trim();
//     if (!t || t.startsWith("#")) continue;
//     const i = t.indexOf("=");
//     if (i === -1) continue;
//     out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
//   }
//   return out;
// }

// async function readStdin() {
//   let s = "";
//   for await (const c of process.stdin) s += c;
//   return s.trim();
// }

// function sh(cmd) {
//   try {
//     return execSync(cmd, {
//       cwd: PROJECT_DIR,
//       encoding: "utf8",
//       stdio: ["ignore", "pipe", "ignore"],
//       timeout: 1500,
//     }).trim();
//   } catch {
//     return null;
//   }
// }

// function parseArgs(argv) {
//   const out = {};
//   for (let i = 0; i < argv.length; i++) {
//     const arg = argv[i];
//     if (!arg.startsWith("--")) continue;
//     const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
//     const next = argv[i + 1];
//     if (!next || next.startsWith("--")) out[key] = true;
//     else {
//       out[key] = next;
//       i++;
//     }
//   }
//   return out;
// }

// function appendJsonl(path, record) {
//   mkdirSync(dirname(path), { recursive: true });
//   appendFileSync(path, JSON.stringify(record) + "\n");
// }

// function postSupabase({ url, key, record, sync, strict }) {
//   if (!url || !key || url.includes("YOUR_") || key.includes("YOUR_")) {
//     const message = "codex logger: Supabase credentials missing; set SUPABASE_URL and SUPABASE_ANON_KEY";
//     if (strict) {
//       console.error(message);
//       process.exitCode = 1;
//     }
//     return;
//   }

//   const curlArgs = [
//     "-sS",
//     "-X",
//     "POST",
//     `${url.replace(/\/$/, "")}/rest/v1/ai_logs`,
//     "-H",
//     `apikey: ${key}`,
//     "-H",
//     `Authorization: Bearer ${key}`,
//     "-H",
//     "Content-Type: application/json",
//     "-H",
//     "Prefer: return=minimal",
//     "--max-time",
//     "10",
//     "-w",
//     "\n%{http_code}",
//     "-d",
//     JSON.stringify(record),
//   ];

//   if (!sync) {
//     const child = spawn("curl", curlArgs, { detached: true, stdio: "ignore" });
//     child.unref();
//     return;
//   }

//   const result = spawnSync("curl", curlArgs, {
//     encoding: "utf8",
//     stdio: ["ignore", "pipe", "pipe"],
//   });
//   const stdout = result.stdout || "";
//   const parts = stdout.trim().split("\n");
//   const status = parts.at(-1) || "";
//   const ok = result.status === 0 && /^2\d\d$/.test(status);

//   if (!ok) {
//     const body = parts.slice(0, -1).join("\n");
//     const detail = body || result.stderr?.trim() || `curl exit ${result.status}`;
//     console.error(`codex logger: Supabase insert failed (${status || "no status"}): ${detail}`);
//     if (strict) process.exitCode = 1;
//   }
// }

// function parseMetadata(raw) {
//   if (!raw) return {};
//   try {
//     return JSON.parse(raw);
//   } catch {
//     return { note: raw };
//   }
// }

// async function main() {
//   const args = parseArgs(process.argv.slice(2));
//   const stdin = await readStdin();
//   const env = {
//     ...loadEnv(join(PROJECT_DIR, ".claude", ".env")),
//     ...loadEnv(join(CODEX_DIR, ".env")),
//     ...process.env,
//   };

//   const eventType = args.event || args.eventType || "Codex";
//   const content = args.content || stdin || null;
//   const branch = args.branch || env.BRANCH || sh("git branch --show-current");
//   const metadata = {
//     tool: "codex",
//     session_id: args.sessionId || env.CODEX_SESSION_ID || null,
//     branch: branch || null,
//     cwd: resolve(args.cwd || process.cwd()),
//     ...parseMetadata(args.metadataJson),
//   };

//   const record = {
//     project: env.PROJECT || "todam",
//     user_name: env.USER_NAME || sh("git config user.name"),
//     agent: args.agent || env.AGENT_ROLE || null,
//     event_type: eventType,
//     content,
//     metadata,
//     created_at: new Date().toISOString(),
//   };

//   const url = env.SUPABASE_URL;
//   const key = env.SUPABASE_ANON_KEY;
//   const sync = args.async !== true && env.CODEX_SUPABASE_ASYNC !== "1";
//   postSupabase({ url, key, record, sync, strict: args.strict === true });

//   const localLogFiles = [];
//   if (env.CODEX_DISABLE_LOCAL_LOGS !== "1") localLogFiles.push(CLAUDE_LOG_FILE);
//   if (env.CODEX_WRITE_OWN_LOGS === "1") localLogFiles.push(CODEX_LOG_FILE);

//   for (const path of localLogFiles) {
//     try {
//       appendJsonl(path, record);
//     } catch (error) {
//       // Local fallback must never hide Supabase behavior.
//       console.error(`codex logger: failed to append ${path}: ${error.message}`);
//     }
//   }
// }

// main().catch(() => process.exit(0));
