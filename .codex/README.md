# Codex Workflows

This folder mirrors the project workflows in `.claude/` for Codex.

## Layout

- `agents/`: role instructions for Codex subagents.
- `.agents/plugins/marketplace.json`: marketplace manifest when `.codex` is registered as the marketplace root.
- Codex-discovered workflow skills live in `.codex/plugins/todam-workflows/skills/`.

## Logging

<!-- **Skills do NOT call a logger inline.** Inline `node .codex/scripts/logger.mjs ...` calls triggered a Codex sandbox approval on every run (the content changes each time, so prefix allowlists never matched). They are removed.

Instead, a background poller collects logs from Codex session transcripts with no approval prompt:

- `.claude/scripts/logger-codex.mjs` polls `~/.codex/sessions/**/*.jsonl` and inserts into the same Supabase `ai_logs` table as Claude, with `metadata.tool = "codex"`.
- It maps `user_message` → UserPromptSubmit/Subagent, `task_complete` → Stop, `function_call` names → `metadata.tools_used`, and `session_meta.agent_role` → `agent`.
- Install once per machine (macOS launchd / Windows Task Scheduler): `bash .claude/scripts/install-codex-logger.sh` or `powershell -ExecutionPolicy Bypass -File .claude\scripts\install-codex-logger.ps1`.

Logging is never the success criterion for a skill. A skill succeeds or fails based on whether the requested workflow itself completed. The poller records the session afterward regardless. -->

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

## Completion Responses

After a `skill-*` workflow finishes, respond briefly:

- Success: `성공: <완료한 작업>`
- Failure: `실패: <실패한 workflow 단계와 이유>`

Do not use Supabase insert success/failure as the skill success/failure criterion.
