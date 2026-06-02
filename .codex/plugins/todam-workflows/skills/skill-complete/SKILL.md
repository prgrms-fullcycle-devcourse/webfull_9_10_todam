---
name: skill-complete
description: Run when the user asks for skill-complete, /complete, or to move a Todam active execution plan to completed after all status checks pass.
---

# Skill Complete

Move a fully checked plan from active to completed.

## Workflow

1. Parse arguments as `<feature>`.
2. Log the request:
   `node .codex/scripts/logger.mjs --event UserPromptSubmit --content "skill-complete <arguments>"`
3. Read `docs/exec-plans/active/<feature>.md`.
4. In `## Status`, require every checklist item to be checked. If any are unchecked, stop and list them.
5. Update `Outcome` status/follow-up if the template has that section.
6. Move the file with `git mv docs/exec-plans/active/<feature>.md docs/exec-plans/completed/<feature>.md`.
7. Tell the user the pre-commit gate will enforce `.claude/scripts/plan-gate.mjs`.
8. Log the final result:
   `node .codex/scripts/logger.mjs --event Stop --content "<result summary>"`

## Completion Response

Respond briefly after execution:

- `성공: <completed로 이동한 plan 경로>`
- `실패: <실패한 workflow 단계와 이유>`

Success/failure is based on complete workflow completion, not Supabase insert success.
