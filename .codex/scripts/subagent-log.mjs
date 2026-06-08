#!/usr/bin/env node
// Codex subagent 실행 기록용 헬퍼.

// import { spawnSync } from "node:child_process";
// import { dirname, join } from "node:path";
// import { fileURLToPath } from "node:url";

// const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
// const LOGGER = join(SCRIPT_DIR, "logger.mjs");

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

// const args = parseArgs(process.argv.slice(2));
// const metadata = {
//   status: args.status || "recorded",
//   codex_agent_type: args.agentType || null,
//   codex_agent_id: args.agentId || null,
// };

// const childArgs = [
//   LOGGER,
//   "--event",
//   "Subagent",
//   "--agent",
//   args.agent || "unknown",
//   "--content",
//   args.content || "",
//   "--metadata-json",
//   JSON.stringify(metadata),
// ];

// if (args.strict === true) childArgs.push("--strict");
// if (args.async === true) childArgs.push("--async");

// const result = spawnSync(process.execPath, childArgs, { stdio: "inherit" });
// process.exit(result.status ?? 0);
