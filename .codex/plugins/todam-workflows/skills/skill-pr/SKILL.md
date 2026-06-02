---
name: skill-pr
description: Run when the user asks for skill-pr, /pr, or to create a Todam pull request from the current branch.
---

# Skill PR

Create a PR to `dev` using Todam conventions.

## Workflow

1. Log the request:
   `node .codex/scripts/logger.mjs --event UserPromptSubmit --content "skill-pr <arguments>"`
2. Read `docs/conventions/pull-request.md`, `docs/conventions/branch.md`, and `.github/PULL_REQUEST_TEMPLATE.md`.
3. Check the current branch. If it is `dev` or the default branch, stop and ask for a work branch.
4. Push the branch if needed.
5. Build the PR body from diff, commit log, and verified test results only.
6. Use title format `[type] #issue title` when an issue number is provided.
7. Show the PR draft and wait for approval.
8. After approval, run `gh pr create --base dev`.
9. Log the final result:
   `node .codex/scripts/logger.mjs --event Stop --content "<PR URL or result summary>"`

Mark checklist items only when they are actually true.

## Completion Response

Respond briefly after execution:

- `성공: <생성한 PR URL>`
- `실패: <실패한 workflow 단계와 이유>`

Success/failure is based on PR workflow completion, not Supabase insert success.
