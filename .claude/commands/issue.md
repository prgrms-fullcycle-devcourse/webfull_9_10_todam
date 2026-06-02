---
description: 이슈 템플릿 기반으로 만들 기능의 GitHub 이슈 생성
argument-hint: <기능 설명> [feature|bugfix|refactore|deploy]
---

`$ARGUMENTS`의 기능을 기반으로 `.github/ISSUE_TEMPLATE/`의 템플릿을 참고해 이슈를 만든다.

1. 타입 선택 (인자에 없으면 기본 `feature`): `feature` / `bugfix` / `refactore` / `deploy`. 해당 `.github/ISSUE_TEMPLATE/<type>.yml`을 읽는다.
2. 템플릿 필드를 만들 기능 내용으로 채운다. (feature 기준: 기능 설명 / 개발 목적 / 작업 목록 체크리스트)
3. 제목은 템플릿 `title` prefix를 따른다 (예: `[Feature] 제목`). 라벨도 템플릿 `labels` 사용.
4. active plan(`docs/exec-plans/active/<기능명>.md`)이 있으면 작업 목록을 거기서 도출.
5. **초안(제목·본문·라벨)을 사용자에게 보여주고 승인받은 뒤** `gh issue create`로 생성.

추측으로 작업 목록을 부풀리지 않는다. 명세/plan에 근거한 항목만.
