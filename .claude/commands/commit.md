---
description: 변경사항을 컨벤션에 맞춰 논리 단위로 분리 커밋
---

`docs/conventions/commit.md`를 읽고 그 규칙대로 커밋한다.

1. 변경 파일을 논리 단위로 그룹핑.
2. 각 그룹의 타입(`feat`/`fix`/`docs`/... commit.md의 Types) + **한글 한 문장** 메시지 결정. 상세는 커밋에 쓰지 않는다(PR 본문 몫).
3. 그룹별 요약(`파일 경로: 변경 이유`)을 사용자에게 먼저 보여주고, 그룹 수만큼 `git add <파일> && git commit` 체이닝해 실행.

현재 `dev`/기본 브랜치면 `docs/conventions/branch.md` 따라 작업 브랜치부터 만들지 물어본다.
