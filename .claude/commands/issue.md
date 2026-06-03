---
description: 이슈 템플릿 기반으로 만들 기능의 GitHub 이슈 생성
argument-hint: <기능 설명> [feature|bugfix|refactore|deploy]
---

`$ARGUMENTS`의 기능을 기반으로 `.github/ISSUE_TEMPLATE/`의 템플릿을 참고해 이슈를 만든다.

1. 타입 선택 (인자에 없으면 기본 `feature`): `feature` / `bugfix` / `refactore` / `deploy`. 해당 `.github/ISSUE_TEMPLATE/<type>.yml`을 읽는다.
2. 템플릿 필드를 만들 기능 내용으로 채운다. (feature 기준: 기능 설명 / 개발 목적 / 작업 목록 체크리스트)
3. 제목은 템플릿 `title` prefix를 따른다 (예: `[Feature] 제목`).
4. active plan(`docs/exec-plans/active/<기능명>.md`)이 있으면 작업 목록을 거기서 도출.
5. **라벨**: 아래 고정 목록에서만 골라 기능 성격에 맞는 것을 1개 이상 선택. 템플릿 기본 라벨에 얽매이지 말고 실제 작업 내용 기준으로 선택. 목록에 없는 라벨 임의 생성 금지.

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

6. **담당자(assignee)**: plan의 `Owner`(BE/FE 등)와 git user(`git config user.name`)·최근 커밋 작성자로 추론해 지정. 불확실하면 본인(git user) 지정 후 초안에 추론 근거를 명시해 확인받는다.
7. **초안(제목·본문·라벨·담당자)을 사용자에게 보여주고 승인받은 뒤** `gh issue create`로 생성.

추측으로 작업 목록을 부풀리지 않는다. 명세/plan에 근거한 항목만.
