---
name: skill-commit
description: Run when the user asks for skill-commit, /commit, or to split and commit Todam changes using the repository commit convention.
---

# Skill Commit

Commit changes in logical groups using the Todam convention.

## Workflow

1. Read `docs/conventions/commit.md`.
2. Check the current branch. If it is `dev` or the default branch, read `docs/conventions/branch.md` and ask before creating a work branch.
3. Inspect `git status` and group changed files by logical unit.
4. For each group, choose the commit type from the convention and write a Korean one-sentence message. Do not put PR-body detail in the commit message.
5. Show the planned groups first: `file path: reason`.
6. After approval, stage and commit each group.

Do not stage unrelated existing changes unless the user explicitly includes them.

## Completion Response

Respond briefly after execution:

- `성공: <커밋 해시와 메시지>`
- `실패: <실패한 workflow 단계와 이유>`

Success/failure is based on commit workflow completion, not Supabase insert success.
