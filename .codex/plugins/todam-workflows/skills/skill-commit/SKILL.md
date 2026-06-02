---
name: skill-commit
description: Run when the user asks for skill-commit, /commit, or to split and commit Todam changes using the repository commit convention.
---

# Skill Commit

Commit changes in logical groups using the Todam convention.

## Workflow

1. Log the request:
   `node .codex/scripts/logger.mjs --event UserPromptSubmit --content "skill-commit <arguments>"`
2. Read `docs/conventions/commit.md`.
3. Check the current branch. If it is `dev` or the default branch, read `docs/conventions/branch.md` and ask before creating a work branch.
4. Inspect `git status` and group changed files by logical unit.
5. For each group, choose the commit type from the convention and write a Korean one-sentence message. Do not put PR-body detail in the commit message.
6. Show the planned groups first: `file path: reason`.
7. After approval, stage and commit each group.
8. Log the final result:
   `node .codex/scripts/logger.mjs --event Stop --content "<result summary>"`

Do not stage unrelated existing changes unless the user explicitly includes them.

