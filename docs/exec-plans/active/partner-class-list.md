# Feature Plan: 나의 클래스 목록 조회

## Summary

- Goal: 파트너가 현재 선택한 공방의 클래스(프로그램) 목록을 조회하고, 게시 상태·순서를 확인할 수 있는 파트너 설정 화면을 구현한다.
- Owner:
- Date: 2026-06-01

## Status

- [x] API 구현
- [x] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md
- 기능명세: "나의 클래스 목록 조회" (기능명세 DB `b242ee66b06c8349805601ce4a05247a`)
- API명세: `/partner/stores/{storeId}/programs` (API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`)
- Relevant design docs: DESIGN.md (작업 시작 전 확인 필요)
- Open decisions:
  1. ~~파트너 전용 클래스 목록 GET 엔드포인트 미확인~~ → **확정: 파트너 전용 `GET /partner/stores/{storeId}/programs` 신규 추가**
  2. ~~클래스 순서 변경 엔드포인트 미확인~~ → **확정(2026-06-04): `PATCH /partner/stores/{storeId}/programs/order`, body `{ programs: [{ id, sortOrder }] }`, 응답=재정렬 목록.**
  3. ~~DRAFT 상태 노출 여부~~ → **확정: DRAFT 상태 생략. ACTIVE / INACTIVE만 반환.**
  4. ~~UI 컴포넌트 규격~~ → **확정: FE 구현 시 DESIGN.md 확인하며 진행. 현재 블로커 아님.**

## Scope

- In:
  - 파트너 설정 화면 내 "클래스 관리" 메뉴 진입 시 클래스 목록 조회
  - 클래스별 표시 정보: 클래스명, 대표 이미지, 소요 시간, 가격, 게시 상태(게시중/비공개)
  - 예약 가능 여부 표시
  - 클래스 순서 표시 (노출 순서 기준 정렬)
  - 클래스 순서 변경 기능
  - 클래스 상세 화면 이동 링크
  - 클래스 등록 화면 이동 버튼
  - 빈 상태 화면 (클래스 없을 때)
  - 네트워크 오류 에러 상태 처리
- Out:
  - 클래스 등록 / 수정 구현 (별도 기능)
  - 클래스 상태 변경(게시/비공개 토글) 실행 — 목록 조회 범위에 한함, 상태 변경 자체는 별도 기능
  - 관리자 또는 고객 화면의 클래스 목록 (`/stores/{slug}/programs`)
  - 파트너 관리 대시보드 이외의 진입 경로

## Plan

1. **Open decisions 해소** — API Contract #1(파트너 GET), #2(순서 변경 엔드포인트), #3(DRAFT 노출), #4(UI 규격) 확인 후 Contract 스냅샷 확정.
2. **BE — `GET /partner/stores/{storeId}/programs` 구현** — Guard(`AuthGuard`, `PartnerGuard`), 공방 소유 권한 검증, DRAFT/ACTIVE/INACTIVE 포함 목록 반환, `sortOrder` 기준 정렬.
3. **BE — `PATCH /partner/stores/{storeId}/programs/order` 구현** — 프로그램 ID 배열과 sortOrder를 받아 일괄 갱신. 트랜잭션 처리.
4. **FE — MSW mock handler 추가** — `GET /partner/stores/:storeId/programs`, `PATCH .../order` mock 데이터 작성.
5. **FE — 클래스 목록 컴포넌트 구현** — 카드 UI (클래스명, 썸네일, 소요시간, 가격, 상태 배지), DESIGN.md 토큰 준수.
6. **FE — 클래스 관리 페이지 구현** — 목록 렌더링, 빈 상태 화면, 에러 상태, 클래스 등록 버튼, 클래스 상세 이동 링크.
7. **FE — 순서 변경 UI 구현** — 드래그 앤 드롭 또는 버튼 방식으로 순서 변경, 변경 후 `PATCH .../order` 호출.
8. **FE — 실 API 연동** — MSW mock → 실 BE 엔드포인트 전환, 응답 스키마 검증.

## Out (단계별 완료물)

- API: `GET /partner/stores/{storeId}/programs` (수정/확장 완료). `PATCH .../order`는 Open decision #2 미확정으로 범위 제외(미구현).
  - 변경 파일:
    - `packages/shared/src/contracts/store-programs.ts` — `partnerProgramListItemSchema` 7필드 재정합.
    - `apps/api/src/modules/store/application/use-cases/list-partner-store-programs.use-case.ts` — prisma select(difficulty·leadTimeDays 추가, images 조인·createdAt 제거)·map 7필드.
    - `apps/api/src/modules/store/presentation/dto/list-partner-store-programs.dto.ts` — Swagger DTO 7필드 동기화.
  - 최종 응답 항목 필드(7): `id, title, price, durationMinutes, difficulty(BASIC|INTERMEDIATE|ADVANCED), leadTimeDays, status(DRAFT|ACTIVE|INACTIVE 전체)`.
  - orderBy(`sortOrder asc, createdAt desc`)·소유권 403(FORBIDDEN)·404(STORE_NOT_FOUND)·Guard 유지.
- API: `PATCH /partner/stores/{storeId}/programs/order` (신규, Open decision #2 해소·구현 완료).
  - 신규 파일:
    - `apps/api/src/modules/store/application/use-cases/reorder-partner-store-programs.use-case.ts` — 소유권 검증·id 집합 정확 일치 검증·`$transaction` 일괄 sortOrder 갱신·재정렬 목록 재조회.
    - `apps/api/src/modules/store/presentation/dto/reorder-partner-store-programs.dto.ts` — 요청 DTO(`programs: [{ id: uuid, sortOrder: int }]`, `@ArrayNotEmpty`·`@ValidateNested`·`@Type`·`@IsUUID`·`@IsInt`).
  - 변경 파일:
    - `packages/shared/src/contracts/store-programs.ts` — `partnerProgramReorderItemSchema`·`partnerProgramReorderRequestSchema`(zod) 추가. 200 응답은 `partnerProgramListResultSchema` 재사용.
    - `apps/api/src/modules/store/store.module.ts` — `ReorderPartnerStoreProgramsUseCase` provider 등록.
    - `apps/api/src/modules/store/presentation/controllers/store.controller.ts` — `@Patch('partner/stores/:storeId/programs/order')` 라우트 추가(GET 과 동일 Guard·envelope·응답 DTO 7필드).
  - 요청 바디: `{ programs: [{ id, sortOrder }] }`(non-empty). 응답 200: GET 과 동일 envelope·7필드 재정렬 전체 목록.
  - 검증: id 집합이 공방 전체 program 집합과 정확 불일치(누락·중복·타 공방) → 400 `INVALID_PROGRAM_ORDER`. 소유권 → 403 `FORBIDDEN`. 공방 미존재 → 404 `STORE_NOT_FOUND`. sortOrder 갱신은 `$transaction` all-or-nothing.
- 리팩토링(2026-06-04, 모듈 경계 정리): GET 목록·PATCH 순서 변경 2개 엔드포인트를 store 모듈 → program 모듈로 이전. URL·Guard·응답 7필드·400/403/404 의미 변화 없음(코드 위치만 이동).
  - 이동 파일: use-case 2개(`list-partner-store-programs.use-case.ts`, `reorder-partner-store-programs.use-case.ts`) `store/application/use-cases/` → `program/application/use-cases/`. DTO 2개(`list-partner-store-programs.dto.ts`, `reorder-partner-store-programs.dto.ts`) `store/presentation/dto/` → `program/presentation/dto/`.
  - 라우트: `GET partner/stores/:storeId/programs`·`PATCH partner/stores/:storeId/programs/order`를 `ProgramController`로 이전(`StoreController`에서 제거). URL 동일.
  - 모듈: program.module provider 2개 추가, store.module provider 2개 제거.
  - 검증: `apps/api` `tsc --noEmit` 통과, store 모듈 잔존 참조 0.
- UI: 클래스 관리 페이지, 클래스 카드 컴포넌트, 빈 상태 화면
- 연동: 실 API 요청/응답 contract 스키마 검증 결과 (미착수)

## Risks

- 파트너 전용 GET 엔드포인트 명세 부재 — BE와 FE 간 응답 스키마가 퍼블릭 API와 달라질 수 있음. Open decision #1 해소 전 FE 구현 착수 금지.
- 순서 변경 API 미명세 — 클라이언트 측 낙관적 업데이트(optimistic update) 설계와 충돌 가능성 있음. Contract 확정 전 UX 설계 보류.
- DRAFT 상태 노출 여부 미결 — DRAFT 클래스를 목록에 포함할 경우 상태 배지 처리 로직 추가 필요.

## Validation

- Tests:
  - BE: `GET /partner/stores/{storeId}/programs` 권한 검증 (타 파트너 공방 접근 시 403 반환)
  - BE: `PATCH .../order` 트랜잭션 정상 처리
  - FE: 빈 상태 / 에러 상태 렌더링
  - FE: 순서 변경 후 목록 재정렬 반영
- Manual checks:
  - 파트너 A가 파트너 B의 공방 storeId로 목록 요청 시 403 반환 확인
  - 클래스 없는 공방 진입 시 빈 상태 화면 노출 확인
  - 순서 변경 후 퍼블릭 화면(`/stores/{slug}/programs`)에 `sortOrder` 반영 확인
- Observability: API 응답 시간, 순서 변경 트랜잭션 실패 로그

## Decision Log

- 2026-06-01: `GET /partner/stores/{storeId}/programs` 및 순서 변경 엔드포인트가 API 명세 DB에 미등재. Open decisions로 분류, 사람 결정 대기.
- 2026-06-01: 퍼블릭 `GET /stores/{slug}/programs`는 ACTIVE만 반환하므로 파트너 관리 목적으로는 사용 불가. 파트너 전용 엔드포인트 별도 설계 필요.
- 2026-06-01: Decision #1 확정 — 파트너 전용 GET 신규 추가. Decision #3 확정 — DRAFT 생략, ACTIVE/INACTIVE만. Decision #4 확정 — FE 구현 시 DESIGN.md 확인으로 처리.
- 2026-06-04: 구현 착수 중 contract↔코드 모순 발견·재정의. (1) GET 엔드포인트는 이미 Store 모듈에 구현 존재 → 신규가 아니라 **수정/확장**. (2) `capacity` 컬럼은 마이그레이션 `20260602160000_drop_capacity...`로 삭제됨 → contract에서 **제거**. (3) Decision #3 **번복**: DRAFT **포함**(파트너 본인 관리 화면, 퍼블릭 아님). (4) 응답 필드 재확정 — 피그마/FE 실사용 기준 `id,title,price,durationMinutes,difficulty,leadTimeDays,status` 7개. `thumbnailUrl`(목록 미사용)·`sortOrder`·`createdAt` 제거, `difficulty`·`leadTimeDays` 추가. FE는 mock `level`(string)을 `difficulty`(enum)+`getDifficultyLabel`로 전환 필요(별도 FE 작업).

## Outcome

- Status: 계획 완료. Open decision #2(순서 변경 엔드포인트 BE 확정) 1개 잔존.
- Follow-up: BE에서 순서 변경 엔드포인트 확정 후 Contract 업데이트 → BE → FE 순서로 구현 진행

## API Contract (스냅샷)

### 데이터모델

**Program (목록 항목)**
```
id              string  (UUID)
title           string  클래스명
price           number  가격(원)
durationMinutes number  소요시간(분)
difficulty      enum    BASIC | INTERMEDIATE | ADVANCED  난이도
leadTimeDays    number  작품 수령까지 평균 제작일
status          enum    DRAFT | ACTIVE | INACTIVE  (파트너센터: 전체 노출)
```
> 갱신(2026-06-04): 실제 코드/피그마 정합. `capacity`(컬럼 삭제됨)·`thumbnailUrl`·`sortOrder`·`createdAt` 제거. `difficulty`·`leadTimeDays` 추가. DRAFT 포함(파트너 본인 관리 화면).

**deliveryOption enum** — `DELIVERY` | `PICKUP` | `CUSTOMER_SELECT`

---

### 엔드포인트

#### `GET /partner/stores/{storeId}/programs` — 파트너 클래스 목록 조회
> 확정(2026-06-04). 기존 구현 존재 → **수정/확장**. status enum 전체(DRAFT/ACTIVE/INACTIVE) 노출(파트너 본인 관리 화면). `sortOrder asc` 정렬은 유지하되 응답 필드로는 내리지 않음.
- Guard: `AuthGuard`, `PartnerGuard`
- Path: `storeId` (UUID)
- Response `200`:
```json
{
  "statusCode": 200,
  "data": {
    "programs": [
      {
        "id": "prog-uuid-001",
        "title": "물레 체험 기초반",
        "price": 45000,
        "durationMinutes": 120,
        "difficulty": "BASIC",
        "leadTimeDays": 30,
        "status": "ACTIVE"
      }
    ]
  },
  "error": null
}
```
- Response `403`: 공방 소유 권한 없음 (`FORBIDDEN`)
- Response `404`: 공방 없음 (`STORE_NOT_FOUND`)

---

#### [참고] `GET /stores/{slug}/programs` — 프로그램 목록 (퍼블릭)
> 현재 명세 DB에 존재하는 목록 조회 엔드포인트. ACTIVE 상태만 반환하며, 파트너 관리 화면 목적과 다름.
- Path: `slug` (공방 슬러그)
- Response `200`:
```json
{
  "statusCode": 200,
  "data": {
    "programs": [
      {
        "id": "prog-uuid-001",
        "title": "물레 체험 기초반",
        "description": "처음 도자기를 접하는 분들을 위한 물레 체험입니다.",
        "price": 45000,
        "durationMinutes": 120,
        "capacity": 6,
        "leadTimeDays": 30,
        "deliveryOption": "CUSTOMER_SELECT",
        "thumbnailUrl": "https://cdn.todam.app/programs/prog-uuid-001/thumb.jpg",
        "status": "ACTIVE",
        "sortOrder": 1
      }
    ]
  },
  "error": null
}
```
- Response `404`: 공방 없음 (`STORE_NOT_FOUND`)

---

#### `PATCH /partner/stores/{storeId}/programs/order` — 클래스 순서 변경
> 확정(2026-06-04). Open decision #2 해소. body = `{ programs: [{ id, sortOrder }] }`. 응답은 재정렬된 전체 목록(GET 과 동일 7필드).
- Guard: `AuthGuard`, `PartnerGuard`
- Path: `storeId` (UUID)
- Request body:
```json
{
  "programs": [
    { "id": "prog-uuid-001", "sortOrder": 1 },
    { "id": "prog-uuid-002", "sortOrder": 2 }
  ]
}
```
- 검증: `programs[].id` 집합이 해당 공방의 전체 program 집합과 **정확히 일치**해야 함(누락·중복·타 공방 ID 섞임 → `400 INVALID_PROGRAM_ORDER`).
- 트랜잭션: `sortOrder` 일괄 갱신, 실패 시 전체 rollback.
- Response `200`: 재정렬된 전체 목록 (GET 과 동일 envelope·항목 스키마)
```json
{
  "statusCode": 200,
  "data": {
    "programs": [
      {
        "id": "prog-uuid-001",
        "title": "물레 체험 기초반",
        "price": 45000,
        "durationMinutes": 120,
        "difficulty": "BASIC",
        "leadTimeDays": 30,
        "status": "ACTIVE"
      }
    ]
  },
  "error": null
}
```
- Response `400`: 잘못된 순서 목록 (`INVALID_PROGRAM_ORDER`)
- Response `403`: 공방 소유 권한 없음 (`FORBIDDEN`)
- Response `404`: 공방 없음 (`STORE_NOT_FOUND`)

---

#### [기존 확인] `PATCH /partner/stores/{storeId}/programs/{programId}/status` — 프로그램 상태 변경
> API 명세 DB 확인 완료.
- Guard: `AuthGuard`, `PartnerGuard`
- Path: `storeId`, `programId` (UUID)
- Request body:
```json
{ "status": "ACTIVE" }
```
- 유효 전이: `DRAFT` → `ACTIVE`, `ACTIVE` → `INACTIVE`, `INACTIVE` → `ACTIVE`
- Response `200`:
```json
{
  "statusCode": 200,
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "status": "ACTIVE",
      "updatedAt": "2026-05-25T19:10:00.000Z"
    }
  },
  "error": null
}
```
- Response `400`: 유효하지 않은 상태 전이 (`INVALID_STATUS_TRANSITION`)
