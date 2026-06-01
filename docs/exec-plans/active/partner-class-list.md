# Feature Plan: 나의 클래스 목록 조회

## Summary

- Goal: 파트너가 현재 선택한 공방의 클래스(프로그램) 목록을 조회하고, 게시 상태·순서를 확인할 수 있는 파트너 설정 화면을 구현한다.
- Owner:
- Date: 2026-06-01

## Status

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md
- 기능명세: "나의 클래스 목록 조회" (기능명세 DB `b242ee66b06c8349805601ce4a05247a`)
- API명세: `/partner/stores/{storeId}/programs` (API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`)
- Relevant design docs: DESIGN.md (작업 시작 전 확인 필요)
- Open decisions:
  1. ~~파트너 전용 클래스 목록 GET 엔드포인트 미확인~~ → **확정: 파트너 전용 `GET /partner/stores/{storeId}/programs` 신규 추가**
  2. **클래스 순서 변경 엔드포인트 미확인** — BE에서 엔드포인트 경로·req 스키마 확정 후 Contract 업데이트 필요.
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

- API: `GET /partner/stores/{storeId}/programs`, `PATCH /partner/stores/{storeId}/programs/order`
- UI: 클래스 관리 페이지, 클래스 카드 컴포넌트, 빈 상태 화면
- 연동: 실 API 요청/응답 contract 스키마 검증 결과

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
capacity        number  최대 정원
thumbnailUrl    string  대표 썸네일 URL
status          enum    ACTIVE | INACTIVE  (DRAFT 생략)
sortOrder       number  노출 순서
```

**deliveryOption enum** — `DELIVERY` | `PICKUP` | `CUSTOMER_SELECT`

---

### 엔드포인트

#### `GET /partner/stores/{storeId}/programs` — 파트너 클래스 목록 조회
> 확정. ACTIVE / INACTIVE만 반환. DRAFT 생략.
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
        "capacity": 6,
        "thumbnailUrl": "https://cdn.todam.app/programs/prog-uuid-001/thumb.jpg",
        "status": "ACTIVE",
        "sortOrder": 1
      }
    ]
  },
  "error": null
}
```
- Response `403`: 공방 소유 권한 없음
- Response `404`: 공방 없음

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

#### [미확인] `PATCH /partner/stores/{storeId}/programs/order` — 클래스 순서 변경
> API 명세 DB에 해당 항목 없음. Open decision #2 해소 후 스냅샷 확정.
- Guard: `AuthGuard`, `PartnerGuard`
- Request body (추정):
```json
{
  "programs": [
    { "id": "prog-uuid-001", "sortOrder": 1 },
    { "id": "prog-uuid-002", "sortOrder": 2 }
  ]
}
```
- Response `200`: 순서 변경 완료

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
