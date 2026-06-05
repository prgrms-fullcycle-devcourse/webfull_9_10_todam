# Feature Plan: user-예약-신청

## Summary

- Goal: 인증된 User가 클래스 상세 페이지에서 예약 가능 슬롯을 조회하고 예약을 생성한다.
- Owner:
- Date: 2026-06-05 (최초 2026-06-02, 2026-06-05 코드 컨텍스트 기준 갱신)

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
각 항목 체크 기준:
- API 구현: 실 BE(`apps/api`) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: **실 API** 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크(연동 아님).
-->

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): `docs/requirements.md` — `# 예약 reservation` 섹션 3절(예약 생성), 슬롯 유효성 검사, displayState 계산 규칙
- 기능명세: Notion DB `b242ee66b06c8349805601ce4a05247a` — "예약 신청" (실행주체: user, 종료 상태: PENDING)
- API명세:
  - `GET /programs/{programId}/available-slots` (Notion id: `9bc2ee66-b06c-83d7-92ef-814b4234171f`)
  - `POST /reservations` (Notion id: `a2f2ee66-b06c-82dd-919c-8137a3d1d098`)
- 기존 코드 컨텍스트:
  - `apps/api/prisma/schema.prisma` — `Reservation`, `StoreTimeSlot`, `ReservationRestriction`, `Delivery`, `Store.maxCapacityPerSlot`
  - `apps/api/src/modules/reservation/` — DDD 구조, 파트너 예약 생성 참고 대상
  - `apps/api/src/modules/reservation/infrastructure/persistence/prisma-partner-reservation.repository.ts` — `createManual` 트랜잭션 패턴
- Relevant design docs: DESIGN.md — UI 규칙 확보 여부 확인 필요. plan에 "UI: DESIGN.md 준수" 명시.

## Open Decisions (2026-06-05 예약 화면 + 코드 확인으로 전부 해소)

> 예약하기 플로우 화면(인원 → 날짜/시간 → 예약자정보 → 완료)을 source of truth로 확정.

1. **[해소] 초기 status = PENDING**: 완료 화면 "작가님이 예약을 확인하면 바로 알려드릴게요" → 기본 `PENDING`. `Store.autoConfirm`(스키마 존재, 기본 `false`) `true` 공방만 즉시 `CONFIRMED` 전이 + Artwork/QR 생성. 기본 공방은 PENDING(Artwork 미생성 — 파트너 confirm 시 기존 `confirm()`이 생성).

2. **[해소] 배송 정보 = deliveryMethod만**: 예약 2/2 화면은 수령 방법(택배로 받기/직접 가져가기 2택 = `deliveryMethod`)만 받고 **주소 입력란이 없음**. → `POST /reservations`는 `deliveryMethod`만 받는다. 배송 주소(`Delivery` 3필드)는 별도 `PATCH /reservations/{id}/delivery`(본 plan Out). Notion 단일 문자열 `shippingAddress` 폐기.

3. **[해소] 동시성 = 조건부 원자 증가**: 트랜잭션 내 `updateMany(where: { id, status: OPEN, reservedCount ≤ maxCapacity - participantCount }, data: { reservedCount: increment })`. 영향 0건이면 `INSUFFICIENT_CAPACITY`. 사전 read로 사유(만석/막힘/제한) 구분 후, 조건부 update를 race guard로 사용. (SELECT FOR UPDATE보다 가벼움)

4. **[해소] programSnapshot**: `createManual`과 동일 — 매 예약마다 신규 생성(programId, price, leadTimeDays).

5. **[해소] 자기거래 차단**: use-case 레이어에서 `Store.partner.userId === userId` → `SELF_RESERVATION_NOT_ALLOWED(403)`.

6. **[해소] 예약자 정보 저장 = FE**: "내 정보 불러오기"(프로필 prefill) + "입력한 정보 기억하기"(로컬스토리지). BE 별도 저장 없음(Reservation의 reserverName/Phone에만 저장).

7. **[해소] ReservationRestriction**: 슬롯 유효성 검증에 포함 — `(storeId, slot.startAt, programId)` 존재 시 `SLOT_BLOCKED(409)`.

## API Contract (스냅샷)

<!-- Notion API명세(2026-06-05 기준)를 읽어 여기에 고정. BE/FE/reviewer가 바인딩하는 SSOT.
     Notion 원본이 바뀌면 재plan → 이 섹션 diff로 추적.
     주의: shippingAddress 스키마는 Open Decision 2번 해결 전까지 미확정. -->

### 데이터 모델

#### StoreTimeSlot (슬롯 — DB 실제 구조)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 슬롯 식별자 |
| storeId | UUID | 공방 ID |
| startAt | Timestamptz | 슬롯 시작 일시 |
| endAt | Timestamptz | 슬롯 종료 일시 |
| reservedCount | Int | 기 예약 누적 인원 |
| status | `OPEN` \| `CLOSED` \| `CANCELED` | 슬롯 상태 |

> `capacity`는 `StoreTimeSlot`에 없음. `Store.maxCapacityPerSlot`에서 가져와야 함.
> `remainingCount = Store.maxCapacityPerSlot - StoreTimeSlot.reservedCount`

#### Reservation (DB 실제 구조 — 핵심 필드)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | 예약 식별자 |
| userId | UUID? | 예약자 (CUSTOMER=필수, PARTNER_MANUAL=null) |
| programId | UUID | 프로그램 ID |
| storeId | UUID | 공방 ID |
| storeTimeSlotId | UUID | 슬롯 ID |
| programSnapshotId | UUID | 예약 시점 프로그램 스냅샷 ID |
| scheduledAt | Timestamptz | 체험 일시 (= slot.startAt) |
| reserverName | string | 예약자명 (2~20자) |
| reserverPhone | string | 연락처 |
| participantCount | Int | 참가 인원 |
| deliveryMethod | `DELIVERY` \| `PICKUP` | 수령 방법 |
| status | `PENDING` \| `CONFIRMED` \| `IN_PROGRESS` \| `SHIPPED` \| `DELIVERED` \| `PICKUP_READY` \| `PICKUP_DONE` \| `CANCELED` | 예약 상태 |
| requestMemo | string? | 예약 메모 |
| source | `CUSTOMER` \| `PARTNER_MANUAL` | 예약 생성 주체 |

#### Delivery (DB 실제 구조 — 구조화 배송 정보)

| 필드 | 타입 | 설명 |
|------|------|------|
| reservationId | UUID | 예약 ID |
| recipientName | string? | 수령인 |
| recipientPhone | string? | 수령인 연락처 |
| postalCode | string? | 우편번호 |
| shippingAddress | string? | 기본주소 (도로명/지번) |
| addressDetail | string? | 상세주소 (동·호수 등) |

> Open Decision 2번 해결 전까지 `POST /reservations` Request Body의 배송 정보 필드는 미확정.

---

### 엔드포인트

#### 1. `GET /programs/{programId}/available-slots`

예약 가능 시간 조회 (고객용 달력)

**Guard:** `AuthGuard` (인증된 User)

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| programId | string (UUID) | 필수 | 프로그램 ID |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| year | number | 필수 | 조회 연도 (예: 2026) |
| month | number | 필수 | 조회 월 (예: 6) |

**Request Headers**

```
Authorization: Bearer {accessToken}
Accept: application/json
```

**시스템 처리**
- 인증 토큰 검증
- `programId`로 `ACTIVE` 상태 프로그램 조회
- 공방 운영시간·휴게시간·`reservationIntervalMinutes` 기반으로 해당 월 슬롯 목록 생성
- `Store.maxCapacityPerSlot - StoreTimeSlot.reservedCount`로 잔여 정원 계산
- `StoreTimeSlot.status = 'CLOSED'` 슬롯 및 `ReservationRestriction` 존재 슬롯 CLOSED 처리
- 슬롯 유효성: `slot_start + program.durationMinutes ≤ break_start OR slot_start ≥ break_end`

**Response 200 OK**

```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:55:00.000Z",
  "path": "/programs/prog-uuid-001/available-slots",
  "message": "예약 가능 시간 목록이 성공적으로 조회되었습니다.",
  "data": {
    "slots": [
      {
        "slotId": "slot-uuid-001",
        "startAt": "2026-06-01T10:00:00.000Z",
        "endAt": "2026-06-01T12:00:00.000Z",
        "reservedCount": 2,
        "remainingCount": 2,
        "status": "OPEN",
        "isAvailable": true
      },
      {
        "slotId": "slot-uuid-002",
        "startAt": "2026-06-01T14:00:00.000Z",
        "endAt": "2026-06-01T16:00:00.000Z",
        "reservedCount": 4,
        "remainingCount": 0,
        "status": "OPEN",
        "isAvailable": false
      }
    ]
  },
  "error": null
}
```

> 이미 구현·머지된 응답(PR #188)과 정합: `capacity` 없음, `status`는 `OPEN|CLOSED|CANCELED`, `isAvailable`(= OPEN && 이 프로그램 제한 없음 && remainingCount>0) 포함. FE는 `isAvailable`로 슬롯 회색 처리(예약 화면의 비활성 시간). `remainingCount = maxCapacityPerSlot - reservedCount`.

**Error Responses**

| 코드 | error | 조건 |
|------|-------|------|
| 404 | `PROGRAM_NOT_FOUND` | 프로그램 없음 또는 ACTIVE 아님 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 오류 |

---

#### 2. `POST /reservations`

예약 생성 (고객)

**Guard:** `AuthGuard` (인증된 User)

**Request Headers**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
Accept: application/json
```

**Request Body**

```json
{
  "programId": "prog-uuid-001",
  "slotId": "slot-uuid-001",
  "reserverName": "김토담",
  "reserverPhone": "010-1234-5678",
  "participantCount": 2,
  "deliveryMethod": "DELIVERY",
  "requestMemo": "왼손잡이라 주의 부탁드립니다."
}
```

> 배송 주소는 본 엔드포인트에서 받지 않는다(예약 화면 2/2에 주소 입력란 없음 — `deliveryMethod`만). 주소는 별도 `PATCH /reservations/{id}/delivery`(본 plan Out). Open Decision 2 해소.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| programId | string (UUID) | 필수 | 프로그램 ID |
| slotId | string (UUID) | 필수 | 선택한 슬롯 ID (StoreTimeSlot.id) |
| reserverName | string (2~20자) | 필수 | 예약자명 |
| reserverPhone | string | 필수 | 연락처 (휴대전화 형식) |
| participantCount | number (1 이상) | 필수 | 참가 인원 (≤ remainingCount) |
| deliveryMethod | `"DELIVERY"` \| `"PICKUP"` | 조건부 | Program.deliverable=true면 택배/직접 선택, false면 PICKUP 고정 |
| requestMemo | string | 선택 | 예약 메모 |

**시스템 처리 (DB 기준 정합)**
1. 인증 토큰으로 userId 식별
2. `programId`로 `ACTIVE` 프로그램 조회 (storeId 확보)
3. 공방 `PUBLISHED` 상태 검증
4. `slotId`(StoreTimeSlot)로 슬롯 조회 — `storeId` 일치 확인
5. `StoreTimeSlot.status = OPEN` 검증
6. `ReservationRestriction`(storeId + startAt + programId) 존재 시 `SLOT_BLOCKED(409)`
7. 자기거래 차단: `Store.partner.userId === token.userId` → `SELF_RESERVATION_NOT_ALLOWED(403)`
8. 잔여 정원 검증: `maxCapacityPerSlot - reservedCount >= participantCount` (동시성 안전 처리 — Open Decision 3번)
9. `ProgramSnapshot` 생성 (programId, price, leadTimeDays)
10. `Reservation` 생성 (`status=PENDING`, `source=CUSTOMER`, `userId=token.userId`)
11. `StoreTimeSlot.reservedCount += participantCount` (8번과 합쳐 조건부 원자 update로 동시성 안전 — Open Decision 3 해소)
12. 배송 주소는 생성 시 받지 않음(`Delivery` row 생성은 본 plan 범위 밖, 별도 PATCH)
13. `Store.autoConfirm=true`이면 즉시 `CONFIRMED` 전이 → `Artwork` 생성 + `QrToken` 발급. 기본(false)은 `PENDING`(Artwork 미생성)
14. 알림 큐 등록 (고객 접수 알림, 파트너 신규 예약 알림)

**Response 201 Created**

```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T19:35:00.000Z",
  "path": "/reservations",
  "message": "예약이 성공적으로 접수되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-001",
      "programId": "prog-uuid-001",
      "slotId": "slot-uuid-001",
      "reserverName": "김토담",
      "participantCount": 2,
      "status": "PENDING",
      "displayState": {
        "label": "예약신청",
        "description": "작가님이 예약 내용을 확인하고 있어요.",
        "subLabel": null
      },
      "createdAt": "2026-05-25T19:35:00.000Z"
    }
  },
  "error": null
}
```

> `auto_confirm=true` 공방은 `status: "CONFIRMED"`, `displayState.label: "예약확정"` 반환.

**Error Responses**

| 코드 | error | 조건 |
|------|-------|------|
| 400 | `INSUFFICIENT_CAPACITY` | 잔여 정원 부족 |
| 401 | `UNAUTHORIZED` | 미인증 |
| 403 | `SELF_RESERVATION_NOT_ALLOWED` | 본인 공방 예약 시도 |
| 403 | `FORBIDDEN` | 기타 권한 없음 |
| 404 | `PROGRAM_NOT_FOUND` | 프로그램 없음 또는 비활성 |
| 409 | `SLOT_BLOCKED` | ReservationRestriction 존재 (차단된 시간대) |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 오류 |

---

## Scope

- In:
  - `GET /programs/{programId}/available-slots` API 구현 (BE) — 이미 머지된 슬롯 조회 기능과 통합
  - `POST /reservations` API 구현 (BE): 유저 예약 생성 use-case + 라우트 추가 (reservation 모듈 내)
    - 정원 동시성 안전 차감
    - `ProgramSnapshot` 생성
    - `auto_confirm` 분기 (PENDING → CONFIRMED + Artwork + QR)
    - `ReservationRestriction` 확인
    - 자기거래 차단
    - 알림 큐 등록
  - 예약 신청 화면 UI 구현 (FE): 슬롯 달력/목록, 예약자 정보 입력 폼, 수령 방법 선택, 금액 계산 표시
  - 예약 완료 화면 UI 구현 (FE): 완료 안내 + 내 예약 이동 (PENDING/CONFIRMED 분기 문구)
  - API 연동 (FE): 슬롯 조회 → 선택 → 예약 생성 전체 플로우
  - 비인증 접근 시 로그인 팝업 유도 (FE)

- Out:
  - 결제 처리 (MVP 미포함)
  - 파트너 수동 예약 — 이미 `POST /partner/stores/{storeId}/reservations`로 별도 구현됨
  - 예약 취소 — 별도 기능
  - 알림 발송 상세 구현 — notification 도메인 위임
  - 배송지 수정 `PATCH /reservations/{reservationId}/delivery` — 별도 기능
  - `GET /programs/{programId}/available-slots` 신규 구현 — #164/#180 PR에서 이미 머지됨. 본 plan에서는 **검증·연동 대상**으로만 다룸

## Plan

### BE

1. `reservation.module.ts`에 유저 예약 생성 관련 providers 등록 준비
   - `UserReservationController` (신규)
   - `CreateUserReservationUseCase` (신규)

2. `CreateUserReservationUseCase` 구현 (`create-partner-reservation.use-case.ts` 패턴 참고)
   - 파라미터: `userId: string`, `dto: CreateUserReservationDto`
   - 검증 순서: 프로그램 ACTIVE → 공방 PUBLISHED → 슬롯 OPEN → ReservationRestriction 없음 → 자기거래 아님 → 잔여 정원 충족
   - 트랜잭션: ProgramSnapshot 생성 → Reservation 생성(source=CUSTOMER) → reservedCount increment (동시성 안전) → auto_confirm 분기
   - auto_confirm=true: CONFIRMED 전이 + Artwork 생성 + QrToken 발급

3. `UserReservationRepository` (포트) 및 Prisma 구현체 작성
   - `createCustomer(userId, dto)` 메서드
   - `findSlotForReservation(slotId, storeId)` — 슬롯 + Store.maxCapacityPerSlot 조인 조회
   - `checkReservationRestriction(storeId, startAt, programId)` — ReservationRestriction 존재 확인
   - `checkSelfReservation(storeId, userId)` — Store.partner.userId 조회

4. `CreateUserReservationDto` 작성
   - `programId`, `slotId`, `reserverName`, `reserverPhone`, `participantCount` 필수
   - `deliveryMethod` 조건부
   - 배송 정보 필드 — Open Decision 2번 해결 후 확정

5. `UserReservationController` 라우트 등록
   - `POST /reservations` — `@UseGuards(AuthGuard)`
   - `displayState` 계산 로직 적용 (요구사항 1절 기준)

6. `GET /programs/{programId}/available-slots` 기존 구현 검토
   - 이미 머지된 구현이 `Store.maxCapacityPerSlot`, `ReservationRestriction`을 올바르게 반영하는지 확인
   - API 명세 응답(capacity 미포함) 준수 여부 확인

### FE

7. MSW mock 핸들러 추가
   - `GET /programs/:programId/available-slots` mock (이미 존재할 수 있음 — 확인 필요)
   - `POST /reservations` mock (성공 PENDING / 성공 CONFIRMED / `INSUFFICIENT_CAPACITY` / `SLOT_BLOCKED` / `SELF_RESERVATION_NOT_ALLOWED`)

8. 예약 신청 UI 구현 (DESIGN.md 준수)
   - 슬롯 달력/목록 컴포넌트: 월별 이동, 날짜 선택, 해당 날짜 시간 슬롯 표시 (`OPEN`/`CLOSED` 구분, CLOSED는 선택 불가)
   - 참가 인원 입력 (1 이상, `remainingCount` 이내 제한)
   - 예약자 정보 입력 폼: 이름(2~20자), 연락처(휴대전화 형식), 저장 여부 설정(클라이언트 로컬스토리지)
   - 수령 방법 선택 UI: `Program.deliverable` 값에 따라 고정(PICKUP) 또는 선택(DELIVERY/PICKUP) 분기
   - 예약 금액 계산 표시: `price × participantCount`
   - 배송지 입력 UI — Open Decision 2번 해결 후 구현
   - 비인증 접근 시 로그인 팝업 유도

9. 예약 완료 화면 구현
   - 성공 응답의 `displayState.label` / `displayState.description` 표시
   - `status=PENDING` vs `status=CONFIRMED` 분기 안내 문구
   - 내 예약 목록 이동 버튼

10. API 연동 (실 API)
    - `GET /programs/{programId}/available-slots` 연동 — 달력 월 변경 시 재조회
    - `POST /reservations` 연동 — 제출 시 에러 핸들링 (INSUFFICIENT_CAPACITY, SLOT_BLOCKED, SELF_RESERVATION_NOT_ALLOWED)

## Risks

| 위험 | 영향 | 대응 |
|------|------|------|
| 슬롯 조회~예약 생성 사이 만석 | 예약 실패 | BE: SELECT FOR UPDATE 또는 원자적 check-increment (Open Decision 3번) |
| `shippingAddress` 스키마 불일치 | BE-FE contract 깨짐 | Open Decision 2번 합의 전 배송 필드 구현 금지 |
| `available-slots` 기존 구현과 중복 | 모듈 충돌 | 기존 #164/#180 구현 먼저 검토 후 통합 |
| `capacity` 필드 위치(Store vs Slot) | 응답 계산 오류 | `Store.maxCapacityPerSlot`에서 가져와야 함 명시 |
| auto_confirm FE 처리 누락 | 완료 화면 상태 오표시 | FE에서 `status` 값으로 분기 처리 필수 |

## Validation

- Tests:
  - `GET /programs/{programId}/available-slots`: 슬롯 계산 단위 테스트 (휴게시간 겹침, 정원 초과, CLOSED, ReservationRestriction)
  - `POST /reservations`: 정원 초과 / 자기거래 / ReservationRestriction / auto_confirm / 동시성 케이스별 통합 테스트
  - FE: 인원 선택 → 잔여 정원 초과 시 제출 불가, SLOT_BLOCKED 에러 메시지 노출
- Manual checks:
  - [ ] CLOSED 슬롯 선택 불가 확인
  - [ ] 정원 초과 시 `INSUFFICIENT_CAPACITY` 에러 메시지 표시 확인
  - [ ] auto_confirm 공방 예약 완료 시 `CONFIRMED` 상태 화면 표시 확인
  - [ ] 비인증 접근 시 로그인 팝업 노출 확인
  - [ ] 본인 공방 예약 시도 시 `SELF_RESERVATION_NOT_ALLOWED` 처리 확인
  - [ ] ReservationRestriction 존재 슬롯 예약 시도 시 `SLOT_BLOCKED` 처리 확인
- Observability:
  - 예약 생성 실패 로그 (에러 코드 포함)
  - 정원 차감 동시성 충돌 발생 빈도 모니터링

## Decision Log

- 2026-06-02: 최초 plan 작성.
- 2026-06-05: 코드 컨텍스트(#164/#180/#187 PR 머지) 기준 갱신.
  - `shippingAddress` 단일 문자열 vs 구조화 — DB `Delivery` 모델이 `postalCode` + `shippingAddress` + `addressDetail` 3필드임을 확인. Notion API 명세와 불일치 존재. Open Decision 2번으로 격상 (구현 전 합의 필수).
  - `BlockedSlot` 명칭 → DB/코드에는 `ReservationRestriction` 으로 구현됨. plan 전체 수정.
  - `capacity` 필드는 `StoreTimeSlot`에 없고 `Store.maxCapacityPerSlot`에 있음. 계산 방식 명시.
  - 파트너 `createManual` 트랜잭션 패턴 확인: `$transaction` 내 ProgramSnapshot 생성 → Reservation 생성 → reservedCount increment → Artwork + QR 순서. 유저 예약도 동일 패턴 적용.
  - 동시성: `createManual`은 단순 increment 사용. 유저 예약은 정원 초과 방지 검증 추가 필요 → Open Decision 3번으로 격상.
  - 예약자 정보 저장 — 클라이언트 로컬스토리지 처리로 가정 유지.
  - `GET /programs/{programId}/available-slots`는 이미 머지된 구현. 본 plan에서는 검증·연동 대상으로만 다룸.

- 2026-06-05: **예약하기 플로우 화면 + 코드 확인으로 Open Decisions 1~7 전부 해소.**
  - status: 기본 PENDING(완료 화면 "작가 확인"), `Store.autoConfirm=true`만 CONFIRMED. `ReservationSource.CUSTOMER`.
  - 배송: 예약 화면 2/2에 주소 입력란 없음 → `POST /reservations`는 `deliveryMethod`만. shippingAddress 폐기. 주소는 별도 PATCH(Out).
  - 동시성: 조건부 원자 update(`updateMany` where 정원조건) → 0건 시 `INSUFFICIENT_CAPACITY`.
  - available-slots(엔드포인트1): 이미 머지(#188). 응답에 `isAvailable`/`CANCELED` 포함으로 정합. FE는 isAvailable로 회색 처리.
  - 구현 경로: `createManual`은 PARTNER_MANUAL·즉시확정·Artwork생성이라 직접 재사용 불가 → **신규 `CreateUserReservationUseCase` + `createCustomer` repo 메서드**(PENDING·Artwork 미생성·검증/조건부 increment). 파트너 `confirm()`이 Artwork 없으면 생성하므로 PENDING→confirm 흐름 정상 동작.

## Outcome

- Status: **Open Decisions 전부 해소, contract 확정. 구현 착수 가능.**
- Follow-up: `/issue` → 브랜치/plan 커밋/PR → `/impl be`.
