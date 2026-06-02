---
name: skill-summary-daily
description: Run when the user asks for skill-summary-daily, /summary-daily, or to create a Todam Daily Scrum summary from AI logs.
---

# Skill Summary Daily

Create a KST Daily Scrum summary from `ai_logs`.

## Workflow

1. Log the request:
   `node .codex/scripts/logger.mjs --event UserPromptSubmit --content "skill-summary-daily <arguments>"`
2. Fetch logs:
   `node .claude/scripts/scrum-fetch.mjs <YYYY-MM-DD optional>`
3. Read `.claude/context/features.md`.
4. Reconstruct work from `metadata.session_id`, `created_at`, `metadata.branch`, and `content`.
5. Follow the output JSON and writing rules in `.claude/commands/summary-daily.md`.
6. Write the summary with:
   `node .claude/scripts/scrum-write.mjs < /tmp/scrum.json`
7. Report the Notion URL.
8. Log the final result:
   `node .codex/scripts/logger.mjs --event Stop --content "<Notion URL or result>"`
