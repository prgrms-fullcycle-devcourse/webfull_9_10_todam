---
name: skill-issue
description: Run when the user asks for skill-issue, /issue, or to create a GitHub issue from Todam templates and an active plan.
---

# Skill Issue

Create a GitHub issue from `.github/ISSUE_TEMPLATE/`.

## Workflow

1. Parse arguments as `<feature description> [feature|bugfix|refactore|deploy]`; default type is `feature`.
2. Read `.github/ISSUE_TEMPLATE/<type>.yml`.
3. If an active plan exists at `docs/exec-plans/active/<feature>.md`, derive tasks from that plan.
4. Draft the issue title, body, and labels from the template. Do not inflate tasks beyond the spec/plan.
5. Show the draft and wait for approval.
6. After approval, run `gh issue create`.

## Completion Response

Respond briefly after execution:

- `성공: <생성한 이슈 URL>`
- `실패: <실패한 workflow 단계와 이유>`

Success/failure is based on issue workflow completion, not Supabase insert success.
