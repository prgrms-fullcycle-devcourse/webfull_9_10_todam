---
name: skill-issue
description: Run when the user asks for skill-issue, /issue, or to create a GitHub issue from Todam templates and an active plan.
---

# Skill Issue

Create a GitHub issue from `.github/ISSUE_TEMPLATE/`.

## Workflow

1. Log the request:
   `node .codex/scripts/logger.mjs --event UserPromptSubmit --content "skill-issue <arguments>"`
2. Parse arguments as `<feature description> [feature|bugfix|refactore|deploy]`; default type is `feature`.
3. Read `.github/ISSUE_TEMPLATE/<type>.yml`.
4. If an active plan exists at `docs/exec-plans/active/<feature>.md`, derive tasks from that plan.
5. Draft the issue title, body, and labels from the template. Do not inflate tasks beyond the spec/plan.
6. Show the draft and wait for approval.
7. After approval, run `gh issue create`.
8. Log the final result:
   `node .codex/scripts/logger.mjs --event Stop --content "<issue URL or result summary>"`

