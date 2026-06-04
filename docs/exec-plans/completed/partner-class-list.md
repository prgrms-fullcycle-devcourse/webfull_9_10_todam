# Feature Plan: 나의 클래스 목록 조회

## Summary

- Goal: 파트너가 현재 선택한 공방의 클래스(프로그램) 목록을 조회하고, 게시 상태·노출 순서를 확인할 수 있는 파트너 설정 화면을 구현한다.
- Owner:
- Date: 2026-06-01

## Status

- [x] API 구현
- [x] UI 구현
- [x] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md
- 기능명세: "나의 클래스 목록 조회" (기능명세 DB `b242ee66b06c8349805601ce4a05247a`)
- API명세: `/partner/stores/{storeId}/programs` (API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`)
- Relevant design docs: DESIGN.md (작업 시작 전 확인 필요)
- Open decisions:
  1. ~~파트너 전용 클래스 목록 GET 엔드포인트 미확인~~ → **확정: 파트너 전용 `GET /partner/stores/{storeId}/programs` 신규 추가**
  2. ~~DRAFT 상태 노출 여부~~ → **확정: DRAFT 상태 생략. ACTIVE / INACTIVE만 반환.**
  3. ~~UI 컴포넌트 규격~~ → **확정: FE 구현 시 DESIGN.md 확인하며 진행. 현재 블로커 아님.**
  4. **[BE 후속] 목록 응답 서브텍스트 필드 누락** — 디자인 서브텍스트 `난이도・소요시간・평균제작일`(예: `기본・2시간・평균 28일`) 표기 필요하나, 현 `GET /partner/stores/{storeId}/programs` 응답은 `durationMinutes`만 반환. `difficulty`(ProgramDifficulty), `leadTimeDays`(Int) 필드 미반환 → FE 서브텍스트에 소요시간만 노출됨. **BE 동시 작업 중이라 충돌 우려로 보류**, BE 측 list DTO/use-case에 두 필드 추가 후 shared `partnerProgramListItemSchema`·FE `buildProgramMetaItems` 연동 예정. (prisma Program 모델엔 `difficulty`·`leadTimeDays` 이미 존재 — 조회·매핑만 추가하면 됨. FE는 `getDifficultyLabel`(entities/program) 보유.)

> **분리**: 클래스 순서 변경(`PATCH .../order`, 순서 변경 UI/드래그앤드롭)은 본 기능(목록 조회) 범위에서 제외하고 별도 기능 문서로 작성한다. 본 문서의 "순서"는 노출 순서 **표시(정렬)**에 한한다.

## Scope

- In:
  - 파트너 설정 화면 내 "클래스 관리" 메뉴 진입 시 클래스 목록 조회
  - 클래스별 표시 정보: 클래스명, 대표 이미지, 소요 시간, 가격, 게시 상태(게시중/비공개)
  - 예약 가능 여부 표시
  - 클래스 노출 순서 표시 (BE `sortOrder` 기준 정렬)
  - 클래스 상세 화면 이동 링크
  - 클래스 등록 화면 이동 버튼
  - 빈 상태 화면 (클래스 없을 때)
  - 네트워크 오류 에러 상태 처리
- Out:
  - **클래스 순서 변경 기능 (별도 기능 문서)**
  - 클래스 등록 / 수정 구현 (별도 기능)
  - 클래스 상태 변경(게시/비공개 토글) 실행 — 목록 조회 범위에 한함, 상태 변경 자체는 별도 기능
  - 관리자 또는 고객 화면의 클래스 목록 (`/stores/{slug}/programs`)
  - 파트너 관리 대시보드 이외의 진입 경로

## Plan

1. **Open decisions 해소** — API Contract #1(파트너 GET), #2(DRAFT 노출), #3(UI 규격) 확인 후 Contract 스냅샷 확정.
2. **BE — `GET /partner/stores/{storeId}/programs` 구현** — Guard(`AuthGuard`, `PartnerGuard`), 공방 소유 권한 검증, DRAFT/ACTIVE/INACTIVE 포함 목록 반환, `sortOrder` 기준 정렬.
3. **FE — 클래스 목록 컴포넌트 구현** — 카드 UI (클래스명, 썸네일, 소요시간, 가격, 상태 배지), DESIGN.md 토큰 준수.
4. **FE — 클래스 관리 페이지 구현** — 목록 렌더링, 빈 상태 화면, 에러 상태, 클래스 등록 버튼, 클래스 상세 이동 링크.
5. **FE — 실 API 연동** — MSW mock → 실 BE 엔드포인트 전환, 응답 스키마 검증.

## Out (단계별 완료물)

- API: `GET /partner/stores/{storeId}/programs`
- UI: 클래스 관리 페이지, 클래스 카드 컴포넌트, 빈 상태 화면
- 연동: 실 API 요청/응답 contract 스키마 검증 결과

### 연동 산출물 (2026-06-04, fe)

- 전환: `GET /partner/stores/:storeId/programs` MSW mock → 실 BE 연동.
  - `apps/web/src/features/program/list/api.ts` — BASE를 `/api/v1/partner`(MSW mock) → `/partner`(실 BE 루트 경로)로 변경. BE는 global prefix 없음 → MSW(`*/api/v1`)가 미가로챔 → 실 BE 통과. store 도메인과 동일 컨벤션.
  - `apps/web/src/app/partner/classes/page.tsx` — storeId를 `useSearchParams().get('storeId')`로 수신(이전 하드코딩 시드 storeId 제거). 진입점(공방 상세)이 `?storeId=` 쿼리로 전달. DRAFT 클라 필터, BE 선정렬 사용으로 클라 `.sort` 제거.
- Contract drift reconcile (FE 측):
  1. `sortOrder` — BE 응답 미포함(서버가 `orderBy [sortOrder asc, createdAt desc]` 선정렬해 반환). shared `partnerProgramListItemSchema.sortOrder`를 `z.number().optional()`로 완화. page.tsx의 클라이언트 `.sort` 제거.
  2. `thumbnailUrl` — BE nullable(대표 이미지 없으면 null). shared `z.string()` → `z.string().nullable()`.
  3. `createdAt` — shared/BE 양쪽 존재(ISO string). 정합, 변경 없음.
- 정리: partner-store 도메인 실 BE 연동 완료에 따라 `apps/web/src/mocks/handlers.ts`의 공방 상세/수정/사업자/이미지 mock 핸들러 6개 및 `db.ts` 관련 dead 헬퍼 제거. (slug-availability mock은 실 BE 미존재로 유지.)
- 검증: `@todam/shared` build(tsc --noEmit) 통과, `apps/web` tsc --noEmit 통과, lint/prettier(pre-commit) 통과.

## Risks

- 파트너 전용 GET 엔드포인트 명세 부재 — BE와 FE 간 응답 스키마가 퍼블릭 API와 달라질 수 있음. Open decision #1 해소 전 FE 구현 착수 금지.
- DRAFT 상태 노출 여부 미결 — DRAFT 클래스를 목록에 포함할 경우 상태 배지 처리 로직 추가 필요. (→ DRAFT 생략으로 확정.)

## Validation

- Tests:
  - BE: `GET /partner/stores/{storeId}/programs` 권한 검증 (타 파트너 공방 접근 시 403 반환)
  - FE: 빈 상태 / 에러 상태 렌더링
- Manual checks:
  - 파트너 A가 파트너 B의 공방 storeId로 목록 요청 시 403 반환 확인
  - 클래스 없는 공방 진입 시 빈 상태 화면 노출 확인
- Observability: API 응답 시간

## Decision Log

- 2026-06-01: `GET /partner/stores/{storeId}/programs`가 API 명세 DB에 미등재. Open decisions로 분류, 사람 결정 대기.
- 2026-06-01: 퍼블릭 `GET /stores/{slug}/programs`는 ACTIVE만 반환하므로 파트너 관리 목적으로는 사용 불가. 파트너 전용 엔드포인트 별도 설계 필요.
- 2026-06-01: Decision #1 확정 — 파트너 전용 GET 신규 추가. DRAFT 생략, ACTIVE/INACTIVE만. UI는 DESIGN.md 확인으로 처리.
- 2026-06-04: 클래스 순서 변경(`PATCH .../order`)을 본 문서 범위에서 제외, 별도 기능 문서로 분리.

## Outcome

- Status: 목록 조회 기능(API/UI/연동) 완료.
- Follow-up:
  - [별도 문서] 클래스 순서 변경 기능 (`PATCH .../order` + 순서 변경 UI).
  - [BE 후속] 목록 응답에 `difficulty`·`leadTimeDays` 추가 → 서브텍스트 `난이도・소요시간・평균제작일` 완성 (Open decision #4).

## API Contract (스냅샷)

### 데이터모델

**Program (목록 항목)** — 실 BE 응답 기준
```
id              string  (UUID)
title           string  클래스명
status          enum    ACTIVE | INACTIVE  (DRAFT 생략)
thumbnailUrl    string | null  대표 썸네일 URL (없으면 null)
price           number  가격(원)
durationMinutes number  소요시간(분)
createdAt       string  생성 일시 (ISO8601)
```
> 정렬: BE가 `sortOrder asc`(동순위 `createdAt desc`)로 선정렬해 반환. `sortOrder` 자체는 응답 필드에 미포함.

---

### 엔드포인트

#### `GET /partner/stores/{storeId}/programs` — 파트너 클래스 목록 조회
> 확정. ACTIVE / INACTIVE만 반환. DRAFT 생략. BE global prefix 없음 → 실 경로는 `/partner/stores/{storeId}/programs`.
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
        "status": "ACTIVE",
        "thumbnailUrl": "https://cdn.todam.app/programs/prog-uuid-001/thumb.jpg",
        "price": 45000,
        "durationMinutes": 120,
        "createdAt": "2026-05-19T09:00:00.000Z"
      }
    ]
  },
  "error": null
}
```
- Response `403`: 공방 소유 권한 없음
- Response `404`: 공방 없음 (`STORE_NOT_FOUND`)

---

#### [참고] `GET /stores/{slug}/programs` — 프로그램 목록 (퍼블릭)
> 현재 명세 DB에 존재하는 목록 조회 엔드포인트. ACTIVE 상태만 반환하며, 파트너 관리 화면 목적과 다름.
- Path: `slug` (공방 슬러그)
- Response `404`: 공방 없음 (`STORE_NOT_FOUND`)

---

#### [기존 확인] `PATCH /partner/stores/{storeId}/programs/{programId}/status` — 프로그램 상태 변경
> API 명세 DB 확인 완료. (본 기능 범위 밖 — 참고용.)
- Guard: `AuthGuard`, `PartnerGuard`
- Path: `storeId`, `programId` (UUID)
- Request body: `{ "status": "ACTIVE" }`
- 유효 전이: `DRAFT` → `ACTIVE`, `ACTIVE` → `INACTIVE`, `INACTIVE` → `ACTIVE`
- Response `400`: 유효하지 않은 상태 전이 (`INVALID_STATUS_TRANSITION`)
