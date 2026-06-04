# Feature Plan: 백엔드 전체 API 계층 구조 리팩토링

## Summary

- Goal: 현재 `apps/api`에 구현된 전체 API(`auth`, `store`, `program`, `timeslot`, `health`)를 대상으로 use-case 비대화, Prisma 직접 접근 중복, DTO/mapper 혼재를 줄이고 `ARCHITECTURE.md`의 Controller / Service / Domain / Repository 책임 경계를 실제 코드에 반영한다.
- Owner: TBD
- Date: 2026-06-04

## Status

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

Note: 본 plan은 신규 기능이 아니라 BE 전체 리팩토링 계획이다. 완료 판단은 기존 API behavior 보존, 테스트 추가, typecheck/test 통과, route/contract drift 없음 기준으로 한다. UI 구현/API 연동은 N/A이나 gate 형식 유지를 위해 체크리스트는 보존한다.

## Context

- 요구사항명세서(고정): `ARCHITECTURE.md`
  - Module Shape: Controller / Service / Domain / Repository 책임 분리.
  - Decision Policy: 상태 전이는 Controller/Repository에서 수행하지 않음. 도메인 규칙은 특정 앱에 중복 구현하지 않음.
  - Access Model: Partner API는 capability 검증 후 대상 공방 소유권을 별도 검증.
  - Event Policy: 같은 트랜잭션에서 함께 성공해야 하는 작업은 API service/use-case에서 동기 처리하고, 외부 API/알림/이미지 후처리는 worker/event로 분리.
- 실행계획 규칙: `docs/exec-plans/README.md`
- 현재 구현된 API controller:
  - `apps/api/src/modules/auth/presentation/controllers/auth.controller.ts`
  - `apps/api/src/modules/health/health.controller.ts`
  - `apps/api/src/modules/store/presentation/controllers/store.controller.ts`
  - `apps/api/src/modules/program/presentation/controllers/program.controller.ts`
  - `apps/api/src/modules/timeslot/presentation/controllers/timeslot.controller.ts`
- 현재 구현된 use-case 축:
  - `auth`: email code, signup/login/logout/refresh, reset password, OAuth.
  - `store`: public store list/detail/reviews/programs, partner store/onboarding/edit/images/favorite.
  - `program`: partner/public program CRUD-ish flows, status, ordering, images.
  - `timeslot`: slot generation/list/status, reservation restrictions, reservation counts.
- 기술부채 관찰:
  - 이미 `domain/`, `infrastructure/persistence/`, `application/mappers/` 폴더가 있으나 상당수 구현이 `application/use-cases/`와 `presentation/dto/`에 집중되어 있다.
  - use-case가 Prisma repository, domain policy, transaction orchestration, response mapper 역할을 동시에 수행한다.
  - `@todam/shared` contract schema가 API 런타임/테스트 검증에 거의 사용되지 않아 DTO와 zod contract drift 위험이 있다.
  - 테스트는 일부 use-case 중심으로 얇고, 대규모 리팩토링 안전망이 부족하다.
- 기능명세: N/A. 기술부채/구조 개선 plan.
- API명세: N/A. 신규 API 없음. 기존 API contract 보존.
- Open decisions:
  1. 1차 PR 범위: 전체 리팩토링 중 baseline/test + 공통 구조만 할지, 특정 도메인까지 실제 이전할지 결정 필요.
  2. Repository interface를 `domain/repositories`에 먼저 정의할지, 구현체를 먼저 분리한 뒤 interface를 도입할지 결정 필요.
  3. `@todam/shared` zod contract를 API에서 직접 import 가능하게 설정을 정리할지, 우선 테스트에서만 contract 검증을 사용할지 결정 필요.
  4. Controller 분리를 이번 리팩토링 범위에 포함할지, use-case/service/repository 분리 후 후속 PR로 나눌지 결정 필요.
  5. 인코딩이 깨진 한글 주석/Swagger 문구 정리를 별도 문서/PR로 분리할지 결정 필요.

## API Contract (스냅샷)

- 데이터모델: 변경 없음.
- 엔드포인트: 신규/삭제/URI 변경 없음.
- Contract 원칙:
  - 모든 기존 route path, HTTP method, guard 조합, status code, error code, response envelope/body shape를 보존한다.
  - 리팩토링 중 API behavior를 바꾸고 싶은 항목이 발견되면 이 plan에서 처리하지 않고 별도 feature/bugfix plan으로 분리한다.
- 보존해야 할 현재 구현 API:
  - Health
    - `GET /health`
  - Auth
    - `POST /auth/send-code`
    - `POST /auth/verify-code`
    - `POST /auth/signup`
    - `POST /auth/login`
    - `POST /auth/logout`
    - `POST /auth/refresh`
    - `POST /auth/reset-password/request`
    - `POST /auth/reset-password`
    - `POST /auth/oauth/kakao`
    - `POST /auth/oauth/google`
  - Store
    - `GET /stores`
    - `GET /stores/search/autocomplete`
    - `GET /stores/slug-availability`
    - `GET /stores/:slug`
    - `GET /stores/:slug/programs`
    - `GET /stores/:slug/reviews`
    - `GET /partner/stores`
    - `GET /partner/onboarding`
    - `GET /partner/stores/:storeId`
    - `PATCH /partner/stores/:storeId`
    - `PATCH /partner/stores/:storeId/business-document`
    - `POST /stores`
    - `POST /partner/business-documents/images`
    - `POST /partner/stores/:storeId/images`
    - `PATCH /partner/stores/:storeId/images/:imageId/confirm`
    - `DELETE /partner/stores/:storeId/images/:imageId`
    - `POST /partner/stores/:storeId/submit`
    - `POST /stores/:storeId/favorite`
  - Program
    - `POST /partner/stores/:storeId/programs`
    - `GET /partner/stores/:storeId/programs`
    - `PATCH /partner/stores/:storeId/programs/order`
    - `GET /partner/stores/:storeId/programs/:programId`
    - `GET /stores/:slug/programs/:programId`
    - `PATCH /partner/stores/:storeId/programs/:programId`
    - `POST /partner/stores/:storeId/programs/:programId/images`
    - `PATCH /partner/stores/:storeId/programs/:programId/status`
    - `PATCH /partner/stores/:storeId/programs/:programId/images/:imageId/confirm`
    - `DELETE /partner/stores/:storeId/programs/:programId/images/:imageId`
  - Timeslot
    - `POST /partner/stores/:storeId/time-slots/generate`
    - `GET /partner/stores/:storeId/time-slots`
    - `PATCH /partner/stores/:storeId/time-slots/:timeSlotId/status`
    - `POST /partner/stores/:storeId/reservation-restrictions`
    - `DELETE /partner/stores/:storeId/reservation-restrictions`
    - `GET /partner/stores/:storeId/programs/reservation-counts`

Behavior preservation rules:

- Auth: token issue/refresh/logout semantics, cookie/header behavior, Redis/email-code TTL/cooldown behavior, OAuth user upsert behavior를 유지한다.
- Store: public/private visibility, OptionalAuth favorite behavior, slug availability, cursor/ordering, distance sorting, matchedClass/representativeClass, image pending/confirm/delete behavior를 유지한다.
- Program: partner ownership, public ACTIVE-only visibility, status transition rules, reorder semantics, image pending/confirm/delete behavior를 유지한다.
- Timeslot: KST date interpretation, break exclusion, past-slot skipping, duplicate skipping, reservation restriction semantics, reservation count aggregation을 유지한다.
- Health: route와 응답을 유지한다.

## Target Architecture

각 구현 모듈은 아래 책임 경계를 지향한다.

```text
modules/<domain>/
  presentation/
    controllers/     # HTTP route, guards, params/body/query, response decorators
    dto/             # request validation + Swagger docs only
  application/
    use-cases/       # orchestration: auth/access check -> domain policy -> repository -> mapper
    services/        # app-level coordination, cross-use-case reusable services
    mappers/         # persistence/application result -> API response DTO/contract
  domain/
    entities/        # domain shape, state objects if useful
    services/        # pure business policies, state transition rules, calculations
    value-objects/   # dates, time ranges, region, cursor payloads when domain-owned
    repositories/    # repository ports/interfaces where they add value
  infrastructure/
    persistence/     # Prisma repository implementations and DB-specific selects
```

Layer rules:

- Controller must not contain business decisions.
- Repository must not perform state transition or authorization decisions.
- Use-case may coordinate transactions, but heavy mapping/calculation should move to mapper/domain service.
- Domain service must be Prisma-free where possible.
- Shared zod contract should be used at least in tests for response shape drift detection.

## Scope

- In:
  - 현재 구현된 전체 API(`auth`, `store`, `program`, `timeslot`, `health`)의 계층 책임 재정렬.
  - 각 도메인의 repository/persistence 분리.
  - 각 도메인의 mapper 분리.
  - 공통 access/ownership 검증 service 도입.
  - auth token/email/OAuth 흐름의 infrastructure/application/domain 책임 정리.
  - store/program image upload/confirm/delete 공통화.
  - timeslot 날짜/시간/제한 정책의 순수 domain service 분리.
  - 현재 API 전체에 대한 baseline route/contract/test 안전망 추가.
  - `@todam/shared` contract 검증 경로 검토 및 가능한 범위에서 테스트 적용.
- Out:
  - 신규 기능/API 추가.
  - DB schema/migration 변경.
  - response contract 변경.
  - FE 코드 수정.
  - worker 도입 또는 비동기 이벤트 전환.
  - 미구현 scaffold 모듈(`reservation`, `review`, `artwork`, `admin`, `partner`, `user`, `notification`)의 신규 구현.
  - 깨진 한글 주석/Swagger 문구 대량 정리. 필요 시 별도 docs/refactor issue로 분리.

## Plan

1. Baseline inventory 작성
   - 현재 controller route 목록을 추출해 plan Validation에 고정한다.
   - 현재 use-case 목록과 Prisma 접근 위치를 모듈별로 정리한다.
   - `pnpm --filter @todam/api typecheck`
   - `pnpm --filter @todam/api test`

2. 리팩토링 안전망 추가
   - controller route snapshot 또는 e2e-level smoke test를 추가한다.
   - shared contract가 존재하는 response는 mapper/use-case 단위에서 `safeParse` 검증 테스트를 추가한다.
   - auth/store/program/timeslot에서 최소 1개 이상 핵심 behavior characterization test를 추가한다.

3. 공통 application service 정리
   - `StoreAccessService` 또는 `OwnershipService`를 도입해 공방 소유권 검증을 재사용한다.
   - program/timeslot/store의 partner ownership 검증을 공통화하되, API별 error code/status는 보존한다.
   - token/email/S3처럼 외부 의존이 있는 service는 application/infrastructure 경계를 명확히 한다.

4. Auth 모듈 리팩토링
   - `auth/infrastructure/email`과 Redis/token persistence 의존을 명확히 분리한다.
   - signup/login/refresh/logout/reset/OAuth use-case에서 중복 user/token mapping을 mapper/service로 분리한다.
   - 인증코드 정책(TTL, cooldown, purpose별 key)을 domain/application policy로 추출한다.

5. Store 모듈 리팩토링
   - `store/infrastructure/persistence/prisma-store.repository.ts`를 도입한다.
   - public list/detail/reviews/programs와 partner store/edit/image/favorite 조회를 repository 메서드로 감싼다.
   - `store/application/mappers/*`로 response mapping을 분리한다.
   - 영업중 계산, 거리/대표 클래스/matchedClass 정책, slug 정책을 domain service/value-object로 분리한다.

6. Program 모듈 리팩토링
   - `program/infrastructure/persistence/prisma-program.repository.ts`를 도입한다.
   - partner/public program 조회, status transition, reorder, image flow를 repository + domain service + mapper로 분리한다.
   - status transition rule은 use-case 내부 조건문이 아니라 domain service에 둔다.

7. Timeslot 모듈 리팩토링
   - `timeslot/domain/services/time-slot-generation-policy.ts`를 도입해 slot 후보 계산을 순수 함수화한다.
   - reservation restriction range 해석과 count aggregation mapping을 service/mapper로 분리한다.
   - DB transaction과 persistence detail은 use-case/repository에 남긴다.

8. 이미지 업로드 공통화
   - store/program/business-document image flow에서 S3 key 생성, presigned URL, objectExists, delete behavior를 공통 service로 정리한다.
   - entity-specific response field와 error code는 mapper/caller에서 보존한다.

9. Controller 분리
   - `StoreController`: public store, partner store, store image, favorite 단위로 분리한다.
   - `ProgramController`: partner program, public program, program image 단위로 분리한다.
   - `AuthController`: 필요 시 email auth, session/token, OAuth controller로 분리한다.
   - route path와 decorator behavior는 snapshot test로 확인한다.

10. 마무리 검증과 drift review
   - 전체 API route diff 없음 확인.
   - 모든 추가/기존 테스트 통과.
   - active exec-plan contract와 error code/status drift 확인.
   - 리팩토링 후 폴더별 책임 위반 사례를 남은 tech debt로 정리한다.

## Out (단계별 완료물)

- API:
  - 기존 구현 API 전체 route/behavior 유지.
  - `auth`, `store`, `program`, `timeslot` repository/persistence 또는 infrastructure boundary 정리.
  - 각 도메인의 mapper/domain service/application service 도입.
  - 공통 ownership/image/token/email 관련 service 책임 정리.
- UI:
  - N/A.
- 연동:
  - 기존 FE 호출 변경 없음.
  - shared contract 또는 snapshot/characterization test로 응답 shape 보존 검증.

## Risks

- 전체 API 대상 리팩토링은 PR이 커질 수 있다. 실제 구현은 반드시 phase별 PR로 쪼갠다.
- repository interface를 모든 곳에 기계적으로 만들면 추상화가 과해질 수 있다. DB 접근 중복이 있거나 테스트 seam이 필요한 곳부터 도입한다.
- auth 리팩토링은 token/cookie/Redis behavior 회귀 위험이 높다. 가장 먼저 characterization test가 필요하다.
- store/program/timeslot은 서로 소유권 검증과 store/program 관계가 얽혀 있어 공통 service 도입 시 error code가 바뀔 수 있다.
- `@todam/shared` 직접 import 문제를 한 번에 풀면 tsconfig/build scope 변경으로 번질 수 있다.
- controller 분리는 route drift 위험이 높다. use-case/service/repository 분리 후 별도 phase로 진행하는 것이 안전하다.
- 깨진 한글 주석/Swagger 문구 정리를 함께 하면 review noise가 커진다.

## Validation

- Tests:
  - `pnpm --filter @todam/api typecheck`
  - `pnpm --filter @todam/api test`
  - route snapshot/smoke test.
  - auth: send/verify code, login/refresh/logout, OAuth user flow characterization.
  - store: list/detail/favorite/image behavior characterization.
  - program: ownership/status/reorder/image behavior characterization.
  - timeslot: slot generation/restriction/count behavior characterization.
  - shared contract `safeParse` tests where schemas already exist.
- Manual checks:
  - Swagger route path 변경 없음 확인.
  - active plan API Contract와 error code/status drift 확인.
  - FE 호출부 수정 없음 확인.
- Observability:
  - 기존 `Logger` 메시지 유지 또는 동등 정보 유지.
  - 리팩토링 후 로그 이벤트명/핵심 필드 변경 금지.

## Decision Log

- 2026-06-04: 최초 plan은 `store/program/timeslot` 대표 문제 구간 중심으로 작성됨.
- 2026-06-04: 사용자 요청에 따라 현재 구현된 API 전체(`auth`, `health`, `store`, `program`, `timeslot`) 리팩토링 기준으로 plan 재작성.
- 2026-06-04: 신규 API/DB 변경 없이 route/contract/behavior 보존을 리팩토링 contract로 고정.
- 2026-06-04: 실제 구현은 전체 일괄 변경이 아니라 baseline/test -> 공통 service -> domain별 phase -> controller 분리 순서로 나누는 것으로 권장.

## Outcome

- Status: planned (사람 검토·범위 승인 대기)
- Follow-up:
  1. Open decisions 1~5 승인.
  2. phase 1 범위 확정 후 `/impl be` 또는 `skill-impl be`로 착수.
  3. 착수 전 baseline route 목록과 typecheck/test 결과를 Validation에 기록.
