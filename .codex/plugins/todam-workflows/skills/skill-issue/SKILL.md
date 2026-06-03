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
4. Draft the issue title and body from the template. Title follows the template `title` prefix (e.g. `[Feature] 제목`). Do not inflate tasks beyond the spec/plan.
5. **Labels**: pick one or more from the fixed list below that match the actual work. Do not be bound to the template default label; choose by real task content. Never invent labels outside this list.

   - `⚙ Setting` — 개발 환경 세팅
   - `✨ Feature` — 기능 개발
   - `🎨 Html&css` — 마크업 & 스타일링
   - `🐞 BugFix` — Something isn't working
   - `💻 CrossBrowsing` — 브라우저 호환성
   - `📃 Docs` — 문서 작성 및 수정
   - `📬 API` — 서버 API 통신
   - `🔨 Refactor` — 코드 리팩토링
   - `🙋‍♂️ Question` — Further information is requested
   - `🥰 Accessibility` — 웹접근성 관련
   - `✅ Test` — test 관련(storybook, jest...)
   - `🌏 Deploy` — 배포 관련

6. **Assignee**: infer from the plan `Owner` (BE/FE etc.) and git user (`git config user.name`) / recent commit author. If uncertain, assign the git user and state the inference basis in the draft for confirmation.
7. Show the draft (title, body, labels, assignee) and wait for approval.
8. After approval, run `gh issue create` with `--label` and `--assignee` flags.

## Completion Response

Respond briefly after execution:

- `성공: <생성한 이슈 URL>`
- `실패: <실패한 workflow 단계와 이유>`

Success/failure is based on issue workflow completion, not Supabase insert success.
