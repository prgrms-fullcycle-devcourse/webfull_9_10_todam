---
name: skill-plan
description: Run when the user asks for skill-plan, /plan, or to create a Todam execution plan from requirements, feature specs, and API contracts.
---

# Skill Plan

Create one feature execution plan for `todam`.

## Workflow

1. Log the request:
   `node .codex/scripts/logger.mjs --event UserPromptSubmit --content "skill-plan <arguments>"`
2. Read `.codex/agents/planner.md`.
3. Use Codex subagents when available:
   - Search/load the multi-agent tool if needed.
   - Spawn one `explorer` or default subagent with the planner instructions and the feature arguments.
   - Log before spawn:
     `node .codex/scripts/subagent-log.mjs --agent planner --status requested --content "<arguments>"`
   - Log after completion:
     `node .codex/scripts/subagent-log.mjs --agent planner --status completed --content "<result summary>"`
4. If subagents are unavailable, run the same planner workflow inline and still write the start/stop logs.
5. The plan must snapshot the API Contract in `docs/exec-plans/active/<feature>.md`.
6. Do not invent models, fields, endpoints, or status values. Put unclear contract points in `Open decisions`.
7. Log the final result:
   `node .codex/scripts/logger.mjs --event Stop --content "<result summary>"`

## Output

Return the plan path, inferred API list, and contract decisions that need human approval.

## Completion Response

Respond briefly after execution:

- `성공: <생성한 plan 경로>`
- `실패: <실패한 workflow 단계와 이유>`

Success/failure is based on plan workflow completion, not Supabase insert success.
