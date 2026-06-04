# Feature Plan: slug 중복확인 API (slug-availability)

## Summary

- Goal: 공방 등록·수정 양쪽 입력 중 실시간(debounce) slug 사전 중복확인용 GET 엔드포인트를 실 BE(`apps/api`)에 추가한다. 현재 FE 2곳이 의존하는 MSW mock을 실 API로 대체할 수 있는 contract를 확정한다.
- Owner: BE (cross-cutting 지원 API)
- Date: 2026-06-03

## Status

<!--
- API 구현: 실 BE(apps/api) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 기존 UI(등록 BusinessStep slug input, 수정 InfoEditSection) 이미 존재 → 신규 UI 없음. 연동만 남음 → 해당 없음 처리(체크 유지 가능).
- API 연동: 실 API 요청/응답이 contract 스키마로 연결. MSW mock 바인딩 상태는 미체크.
-->

- [x] API 구현 — `GET /stores/slug-availability` (apps/api) 신설 + shared `SLUG_REGEX`/`slugSchema` 4~40·하이픈만 정렬
- [x] UI 구현 — 기존 UI 존재(BusinessStep slug input, InfoEditSection). 신규 UI 없음 → N/A
- [ ] API 연동 — FE 2곳 mock→실 API 전환 + mock/경로 `/stores/slug-availability` 통일 (별도 후속 plan으로 Out, 아래 Scope 참조)

## Context

- 요구사항명세서(고정): docs/requirements.md — `공방 store > 2. 파트너 신청` slug 규칙(영문 소문자·숫자·하이픈, 4~40자, unique / 미입력 시 nanoid 자동 생성), `시스템 처리 1. slug 중복 검증`.
- 기능명세: **별도 항목 없음**(파생 지원 API). 기능명세 DB select 결과 "slug" 매칭 없음 — 등록(`첫 공방 등록`/`공방 추가 등록`)·수정(`공방 정보 수정`) 기능명세의 slug 동작에서 도출. (Decision Log DEC-1)
- API명세: **API명세 DB 미등록**. `slug-availability` URI 매칭 없음. 기존 등록/수정 API 패턴 + shared contract에서 추론. (Decision Log DEC-1)
- Relevant code:
  - BE 컨트롤러: `apps/api/src/modules/store/presentation/controllers/store.controller.ts` (slug-availability 라우트 없음. apps/api는 global prefix 없음 — 루트 경로).
  - shared contract: `packages/shared/src/contracts/store-registration.ts` `slugAvailabilityResultSchema`(이미 존재: `{ slug, available }`), `slugSchema`(fields.ts), `SLUG_REGEX`(constants/regex.ts).
  - FE 등록: `apps/web/src/features/store/registration/api.ts` `checkSlug()`, `ui/BusinessStep`/`StoreInfoStep`, `model/store.ts`.
  - FE 수정: `apps/web/src/features/store/edit/ui/InfoEditSection.tsx`, `model/store.ts` `slugDuplicated`.
  - mock: `apps/web/src/mocks/handlers.ts:107` `GET */api/v1/partner/stores/slug-availability`.
- Open decisions: **모두 해소(Resolved 2026-06-03)**. OD-1~4 BOSS 결정 → 아래 Decision Log 참조. 추측 없음, 확정값 반영 완료.

## API Contract (스냅샷)

> API명세 DB 미등록 → 추론 contract. shared `slugAvailabilityResultSchema`(기존)와 일치하도록 고정.

- 데이터모델: 신규 엔티티 없음. 기존 `Store.slug`(unique) 컬럼 조회만 수행.
- 응답 envelope: 전역 인터셉터 표준 `{ statusCode, timestamp, path, message, data, error }`. `data`는 `slugAvailabilityResultSchema`.

- slug 규칙 (확정 — OD-1): **4~40자, `^[a-z0-9-]{4,40}$` (영문 소문자·숫자·하이픈 `-`만, 언더스코어 `_` 불가).** GET 사전검증·`POST /stores`·`PATCH /partner/stores/{storeId}` 전부 동일 `slugSchema`/`SLUG_REGEX` 단일 출처.

- 엔드포인트:
  - **`GET /stores/slug-availability`** (확정 path — OD-2/OD-3)
    - Guards: `AuthGuard` 만 (확정 — OD-3. `POST /stores` 가드 정책과 동일. 첫 등록 USER도 통과해야 하므로 PartnerGuard 미적용.)
    - Query:
      - `slug: string` (필수) — `slugSchema` 검증(`^[a-z0-9-]{4,40}$`). 형식 불일치/누락 시 `400 BAD_REQUEST`(`error: "BAD_REQUEST"`).
      - `excludeStoreId?: string` (선택, 확정 — OD-4) — 수정 화면 자기 자신 slug 제외용. 지정 시 해당 store의 현재 slug와 같으면 `available: true`. 소유권 검증 필수(`store.partner.userId === currentUser.id`).
    - res `200 OK` `data` (`slugAvailabilityResultSchema`):
      ```json
      { "slug": "my-workshop", "available": true }
      ```
      - `available: boolean` — 해당 slug를 가진 다른 Store가 없으면 `true`. (`excludeStoreId`가 본인 store면 본인 slug는 충돌로 보지 않음.)
    - 에러:
      - `400 BAD_REQUEST` — slug 형식 위반(4~40·하이픈만 불충족) / slug 쿼리 누락. envelope `error: "BAD_REQUEST"`.
      - `401 UNAUTHORIZED` — 토큰 없음/만료.
      - `404 NOT_FOUND` — `excludeStoreId` 지정했으나 해당 store 없음 또는 본인 소유 아님.
  - 참고(기존, 변경 없음): 제출 시점 최종 중복검증은 `POST /stores` 의 `409 SLUG_CONFLICT`, `PATCH /partner/stores/{storeId}`의 `STORE_SLUG_DUPLICATED`. 본 GET은 **사전확인 전용**이며 최종 검증을 대체하지 않는다.

## Scope

- In:
  - `apps/api` `GET /stores/slug-availability` 엔드포인트 구현 (`@UseGuards(AuthGuard)`, controller route + use-case + repository slug 조회 + DTO).
  - `slug` 형식 검증(slugSchema 정렬값 4~40·하이픈만), `excludeStoreId` 처리(본인 store 제외 + 소유권 검증).
  - **shared contract 정렬(동반 변경, In)**: `SLUG_REGEX`를 `^[a-z0-9-]{4,40}$`로, `slugSchema` 길이/문자/메시지를 4~40·하이픈만으로 변경(OD-1). 현재 `^[a-z0-9_-]{3,30}$` → 변경. 등록·수정 contract 동시 영향 → 동반 처리.
  - 응답이 shared `slugAvailabilityResultSchema`와 일치하는지 보장.
- Out (후속/연동 단계):
  - **FE 2곳 mock→실 API 전환**: 등록 `BusinessStep`/`registration/api.ts checkSlug`, 수정 `InfoEditSection`/`edit/model/store.ts`. → 별도 연동 plan(또는 본 plan의 후속 Status 항목)에서 처리.
  - **경로 통일(연동 단계)**: mock handler(`handlers.ts:107` `/partner/stores/slug-availability`)와 FE `api.ts`를 모두 `/stores/slug-availability`로 정렬. mock handler 제거/경로변경은 연동 단계에서.
  - 등록·수정 UI 검증 문구(BusinessStep / InfoEditSection)를 4~40·하이픈만 문구로 정렬 — shared 변경에 따라 자동 반영되나 하드코딩 문구 있으면 연동 단계 점검.
  - slug 자동 생성(nanoid) 로직은 `POST /stores`/`PATCH` 책임 — 본 plan Out.

## Plan

1. **OD 확정 완료(2026-06-03)** — OD-1~4 BOSS 결정 반영. 구현 착수 가능.
2. shared `SLUG_REGEX = /^[a-z0-9-]{4,40}$/`, `slugSchema` 길이·문자·메시지를 4~40·하이픈만으로 변경(OD-1). 등록·수정 contract 동시 영향 확인.
3. `apps/api` store 모듈에 `GetSlugAvailabilityUseCase` + repository slug 존재 조회 추가.
4. `store.controller.ts`에 `GET /stores/slug-availability` route 추가 (`@UseGuards(AuthGuard)`, query DTO, `@ResponseMessage`).
5. query DTO(`SlugAvailabilityQueryDto`): `slug`(slugSchema 4~40·하이픈만), `excludeStoreId?`. `excludeStoreId` 지정 시 소유권 검증(`store.partner.userId === currentUser.id`, 미존재/타인이면 404) + 본인 slug 제외.
6. 응답이 `slugAvailabilityResultSchema` 일치하도록 매핑. Swagger 데코.
7. 검증: slug 미존재→available:true, 타 store 점유→false, excludeStoreId=본인+동일 slug→true, excludeStoreId 타인/미존재→404.

## Out (단계별 완료물)

- API: `GET /stores/slug-availability` (`@UseGuards(AuthGuard)`, query `slug` 필수 + `excludeStoreId?`). res `data` = `{ slug, available }` (shared `slugAvailabilityResultSchema` 일치). 검증: slug 미존재/본인 동일 slug→available:true, 타 store 점유→false, slug 누락·형식위반→400 `BAD_REQUEST`, excludeStoreId 미존재/타인→404 `NOT_FOUND`.
  - 파일:
    - `apps/api/src/modules/store/presentation/controllers/store.controller.ts` — 라우트 추가(정적 `stores/*` 그룹 내 배치, 동적 세그먼트 충돌 회피).
    - `apps/api/src/modules/store/application/use-cases/get-slug-availability.use-case.ts` — 신규 use-case(PrismaService 직접 사용 — 모듈 컨벤션). slug 형식검증 + excludeStoreId 소유권(`store.partner.userId === user.id`) + 점유 조회.
    - `apps/api/src/modules/store/presentation/dto/slug-availability.dto.ts` — `SlugAvailabilityQueryDto` / `SlugAvailabilityResponseDto`.
    - `apps/api/src/modules/store/store.module.ts` — provider 등록.
  - shared(동반 정렬, OD-1): `packages/shared/src/constants/regex.ts` `SLUG_REGEX = /^[a-z0-9-]{4,40}$/`, `packages/shared/src/contracts/fields.ts` `slugSchema` 메시지 4~40·하이픈만 — **이미 정합 상태였음(추가 변경 불필요), 확인 완료**.
- UI: 신규 없음 (기존 UI 재사용)
- 연동: <!-- 후속 단계 -->

## Risks

- **shared `SLUG_REGEX`/`slugSchema` 변경(3~30·`_`허용 → 4~40·하이픈만)이 등록·수정 양쪽 검증·UI 문구에 동시 영향.** 변경 누락 시 사전확인(GET)과 최종검증(POST/PATCH)이 엇갈려 "사전확인 통과했는데 제출 시 형식 거부" 발생. 반드시 단일 출처로 정렬(본 plan Scope In).
- 기존 저장된 slug 중 `_` 포함 또는 3자 길이 데이터가 있으면 새 규칙과 불일치 가능 — 마이그레이션/예외는 본 plan 범위 밖이나 연동 전 확인 권장.
- mock path(`/partner/stores/slug-availability`)와 FE api.ts(`/stores/slug-availability`)가 엇갈려 있음. 실 BE path를 `/stores/slug-availability`로 확정했으므로 연동 단계에서 mock·api.ts 둘 다 `/stores/slug-availability`로 정렬해야 깨지지 않음.
- `slug-availability`가 `:storeId` 같은 동적 세그먼트보다 라우트 우선순위에서 가려지지 않도록 정적 라우트 등록 순서 주의(`GET stores/:storeId` 등과 충돌 회피).

## Validation

- Tests: use-case 단위(미존재→true / 점유→false / excludeStoreId 본인 slug→true / 타인 store 점유 slug→false), controller e2e(guard, 400 형식위반).
- Manual checks: 등록·수정 화면에서 debounce 입력 시 실 응답 확인(연동 단계).
- Observability: 표준 응답 envelope 로깅.

## Decision Log

- **DEC-1**: slug-availability는 기능명세 DB·API명세 DB 모두 **미등록**. 등록/수정 기능명세 slug 동작 + 요구사항 `store > 시스템 처리 1. slug 중복 검증` + shared `slugAvailabilityResultSchema`(기존)에서 추론. 추론 contract를 본 스냅샷으로 고정.
- **OD-1 (slug 규칙) — RESOLVED 2026-06-03 (BOSS)**: **요구사항 기준으로 단일화 = 4~40자, 하이픈(`-`)만 허용, 언더스코어(`_`) 불가.** `SLUG_REGEX = /^[a-z0-9-]{4,40}$/`. shared `slugSchema`/`SLUG_REGEX`(현 `^[a-z0-9_-]{3,30}$`)를 변경하고 등록(BusinessStep)·수정(InfoEditSection) UI 검증 문구도 정렬(본 plan Scope In). `docs/requirements.md` slug 규칙을 정본으로 유지.
- **OD-2 (path) — RESOLVED 2026-06-03 (BOSS)**: **`GET /stores/slug-availability`** 로 확정(`/partner/*` 아님). mock(`/partner/stores/slug-availability`)·FE `api.ts`를 모두 `/stores/slug-availability`로 통일 — 연동 단계 항목.
- **OD-3 (guard) — RESOLVED 2026-06-03 (BOSS)**: **`AuthGuard` 만**(PartnerGuard 없음). 첫 등록 USER도 통과해야 하므로. `POST /stores` 가드 정책과 동일.
- **OD-4 (excludeStoreId) — RESOLVED 2026-06-03 (BOSS)**: **지원.** 쿼리 `excludeStoreId`로 자기 store 제외 + 소유권 검증(`store.partner.userId === currentUser.id`, 미존재/타인이면 404). 수정 화면에서 본인 현재 slug면 `available: true`.

## Outcome

- Status: ready — OD-1~4 BOSS 결정 완료(2026-06-03). contract 확정. 구현(implementer) 착수 가능.
- Follow-up: (1) BE `GET /stores/slug-availability` 구현 + shared SLUG 4~40·하이픈만 정렬(본 plan In), (2) FE 2곳 mock→실 API 전환 + 경로 `/stores/slug-availability` 통일 + UI 문구 정렬(후속 연동 plan, Out).
