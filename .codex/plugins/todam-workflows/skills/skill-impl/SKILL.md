---
name: skill-impl
description: Run when the user asks for skill-impl, /impl, /impl <feature> be, /impl <feature> fe, or to implement a Todam active execution plan.
---

# Skill Impl

Implement one active plan in `be` or `fe` mode.

## Workflow

1. Parse arguments as `<feature> <be|fe>`.
2. Confirm `docs/exec-plans/active/<feature>.md` exists. If not, stop and say `plan이 먼저 필요하다(skill-plan)`.
3. Log the request:
   `node .codex/scripts/logger.mjs --event UserPromptSubmit --content "skill-impl <arguments>"`
4. Read `.codex/agents/implementer.md`.
5. Use Codex subagents when available:
   - Prefer a `worker` subagent for bounded implementation.
   - Give it ownership of the relevant files/modules.
   - Tell it other edits may exist and it must not revert them.
   - Log requested/completed with `.codex/scripts/subagent-log.mjs`.
6. If subagents are unavailable, implement inline with the same rules.
7. Bind implementation strictly to the plan's `API Contract (스냅샷)`.
8. Update the plan's `## Status` and `## Out` only for work actually completed.
9. Log the final result:
   `node .codex/scripts/logger.mjs --event Stop --content "<result summary>"`

Stop for human input if the contract is insufficient or contradictory.
