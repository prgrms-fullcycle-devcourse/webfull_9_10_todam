# Branch Strategy

## Base Branch

- 기본 통합 브랜치는 `dev`이다.
- 새로운 작업은 `dev` 최신 상태를 기준으로 시작한다.

## Working Branch

- 작업 브랜치는 작업 유형을 prefix로 사용한다.
- 기능 개발 브랜치는 `feature/`를 사용한다. (커밋 타입은 `feat`이지만 브랜치 prefix는 `feature`)
- 그 외 작업은 커밋 타입과 동일한 prefix(`fix`, `docs`, `refactor`, `chore` 등)를 사용한다.
- 브랜치명은 `prefix/작업명` 형식으로 작성한다.
- 브랜치명은 작업 내용을 식별할 수 있게 짧고 명확하게 작성한다.
- 긴급 수정은 `hotfix/작업명` 형식을 사용한다.

예시:

```text
feature/create-reservation-api
fix/reservation-slug-collision
docs/branch-conventions
hotfix/auth-token-expiry
```

## Workflow

1. `dev` 브랜치로 이동한다.
2. `dev` 최신 상태를 기준으로 작업 브랜치를 생성한다.
3. 작업 브랜치에서 구현과 커밋을 진행한다.
4. 작업 완료 후 원격 브랜치를 생성하며 push 한다.
5. GitHub에서 `dev` 대상으로 PR을 생성한다.
6. 리뷰와 승인 후 `dev`에 merge 한다.

예시:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/create-reservation-api
git add .
git commit -m "feat: 예약 생성 API 구현"
git push -u origin feature/create-reservation-api
```
