---
description: 컨벤션·템플릿 기반으로 PR 생성 (dev 대상)
argument-hint: [이슈번호]
---

`docs/conventions/pull-request.md`, `docs/conventions/branch.md`, `.github/PULL_REQUEST_TEMPLATE.md`를 읽고 그 규칙대로 PR을 만든다.

1. 현재 브랜치 확인. `dev`/기본 브랜치면 중단하고 작업 브랜치(`feature/...` 등 branch.md prefix) 생성 안내.
2. 미push면 `git push -u origin <branch>`.
3. diff·커밋 로그·테스트 결과 기준으로 본문 작성:
   - 제목: `[type] #이슈번호 제목` (인자 `$ARGUMENTS`에 이슈번호 있으면 사용)
   - 본문: PR 템플릿 섹션(관련 이슈/작업 내용/스크린샷·테스트/리뷰 포인트/체크리스트) 채움. 구현 사실만, 확인한 테스트만.
4. **본문 초안을 사용자에게 보여주고 승인받은 뒤** `gh pr create --base dev`로 생성.

체크리스트는 사실대로 표시. 추측 금지.
