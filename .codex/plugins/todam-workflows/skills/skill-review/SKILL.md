---
name: skill-review
description: Run when the user asks for skill-review, /review, or to check Todam implementation drift against an active execution plan.
---

# Skill Review

Review implementation against the active plan and API Contract.

## Workflow

1. Parse arguments as `<feature>`.
2. Confirm `docs/exec-plans/active/<feature>.md` exists.
3. Log the request:
   `node .codex/scripts/logger.mjs --event UserPromptSubmit --content "skill-review <arguments>"`
4. Read `.codex/agents/reviewer.md`.
5. Use a Codex subagent when available for the review pass, and log requested/completed with `.codex/scripts/subagent-log.mjs`.
6. If subagents are unavailable, review inline.
7. Compare `git diff` and relevant files against `API Contract (스냅샷)`.
8. Report drift and phase verdicts. Only check plan Status when API 구현, UI 구현, API 연동 are all ✅ and drift is zero.
9. Log the final result:
   `node .codex/scripts/logger.mjs --event Stop --content "<result summary>"`

## Output

Findings first, then phase verdicts, then `skill-complete` eligibility.
