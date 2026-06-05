---
name: skill-impl
description: Run when the user asks for skill-impl, /impl, /impl <feature> be, /impl <feature> fe, or to implement a Todam active execution plan.
---

# Skill Impl

Implement one active plan in `be` or `fe` mode.

## Workflow

1. Parse arguments as `<feature> <be|fe>`.
2. Confirm `docs/exec-plans/active/<feature>.md` exists. If not, stop and say `plan이 먼저 필요하다(skill-plan)`.
3. Read `.codex/agents/implementer.md`.
4. Use Codex subagents when available:
   - Prefer a `worker` subagent for bounded implementation.
   - Give it ownership of the relevant files/modules.
   - Tell it other edits may exist and it must not revert them.
5. If subagents are unavailable, implement inline with the same rules.
6. Bind implementation strictly to the plan's `API Contract (스냅샷)`.
7. Update the plan's `## Status` and `## Out` only for work actually completed.

Stop for human input if the contract is insufficient or contradictory.

## Completion Response

Respond briefly after execution:

- `성공: <구현 완료 범위>`
- `실패: <실패한 workflow 단계와 이유>`

Success/failure is based on implementation workflow completion, not Supabase insert success.
