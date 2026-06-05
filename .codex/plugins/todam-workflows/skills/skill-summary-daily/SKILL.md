---
name: skill-summary-daily
description: Run when the user asks for skill-summary-daily, /summary-daily, or to create a Todam Daily Scrum summary from AI logs.
---

# Skill Summary Daily

Create a KST Daily Scrum summary from `ai_logs`.

## Workflow

1. Fetch logs:
   `node .claude/scripts/scrum-fetch.mjs <YYYY-MM-DD optional>`
2. Read `.claude/context/features.md`.
3. Reconstruct work from `metadata.session_id`, `created_at`, `metadata.branch`, and `content`.
4. Follow the output JSON and writing rules in `.claude/commands/summary-daily.md`.
5. Write the summary with:
   `node .claude/scripts/scrum-write.mjs < /tmp/scrum.json`
6. Report the Notion URL.

## Completion Response

Respond briefly after execution:

- `성공: <작성한 Notion URL>`
- `실패: <실패한 workflow 단계와 이유>`

Success/failure is based on summary workflow completion, not Supabase insert success.
