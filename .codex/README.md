# Codex Workflows

This folder mirrors the project workflows in `.claude/` for Codex.

## Layout

- `agents/`: role instructions for Codex subagents.
- `scripts/logger.mjs`: insert Codex work logs into Supabase using `.codex/.env` or `.claude/.env`.
- `scripts/subagent-log.mjs`: small wrapper for logging Codex subagent requests/results.
- `.agents/plugins/marketplace.json`: marketplace manifest when `.codex` is registered as the marketplace root.
- Codex-discovered workflow skills live in `.codex/plugins/todam-workflows/skills/`.

## Logging

Use:

```bash
node .codex/scripts/logger.mjs --event UserPromptSubmit --content "request"
node .codex/scripts/logger.mjs --event Stop --content "result"
node .codex/scripts/subagent-log.mjs --agent planner --status requested --content "feature name"
node .codex/scripts/subagent-log.mjs --agent planner --status completed --content "plan created"
```

Codex logs are inserted into the same Supabase `ai_logs` table as Claude, with `metadata.tool = "codex"`. Local `.claude/logs/ai_logs.jsonl` append is only a fallback/audit copy for the existing scrum scripts. Set `CODEX_WRITE_OWN_LOGS=1` to also try writing `.codex/logs/ai_logs.jsonl`.

Use `--strict` when a test must fail on Supabase insert failure:

```bash
node .codex/scripts/logger.mjs --event UserPromptSubmit --content "request" --strict
node .codex/scripts/subagent-log.mjs --agent planner --status requested --content "feature name" --strict
```

## Command Names

Use these plugin skill names in Codex:

- `skill-plan` instead of Claude `/plan`
- `skill-impl` instead of Claude `/impl`
- `skill-review` instead of Claude `/review`
- `skill-complete` instead of Claude `/complete`
- `skill-summary-daily` instead of Claude `/summary-daily`
- `skill-commit` instead of Claude `/commit`
- `skill-issue` instead of Claude `/issue`
- `skill-pr` instead of Claude `/pr`
