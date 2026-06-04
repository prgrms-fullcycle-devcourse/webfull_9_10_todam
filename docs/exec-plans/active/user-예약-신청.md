# Feature Plan: 예약 신청

## Summary

- Goal: 고객이 클래스 상세 페이지에서 예약 가능 슬롯을 조회하고 예약을 생성한다.
- Owner:
- Date: 2026-06-02

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

- 요구사항명세서(고정): docs/requirements.md — `# 예약 reservation` 섹션 (예약 생성, 슬롯 유효성 검사)
- 기능명세: `예약 신청` (기능명세 DB `b242ee66b06c8349805601ce4a05247a` —FE 작업 必)
- API명세:
  - `GET /programs/{programId}/available-slots` (예약 가능 시간 조회)
  - `POST /reservations` (예약 생성)
- Relevant design docs: DESIGN.md — UI 규칙 확보 여부 미확인. plan에 "UI: DESIGN.md 준수" 명시.
- Open decisions:
  1. `deliveryMethod`가 클래스의 `deliveryOption = CUSTOMER_SELECT`일 때만 고객이 선택하는데, 클래스 상세에서 이 값을 어떻게 넘겨받는지 (props? 별도 API 조회?) 확인 필요.
  2. `shippingAddress` 필드가 현재 단순 문자열로 되어 있으나 요구사항 명세(reservation 3절)에서는 배송지를 구조화된 형태(우편번호+기본주소+상세주소)로 수집하도록 나와 있음 — API Contract의 `shippingAddress` 단일 문자열이 최종 스키마인지 확인 필요.
  3. 예약자 정보 저장 여부(기능명세 "예약자 정보 저장 여부를 설정할 수 있다") 기능은 API 명세에 별도 필드가 없음 — 클라이언트 로컬 저장으로 처리하는지, 또는 BE 저장이 필요한지 확인 필요.
  4. `auto_confirm = true` 공방의 경우 응답 `status`가 `PENDING`이 아닌 `CONFIRMED`로 내려올 수 있음 — FE 완료 화면에서 이 분기를 어떻게 처리할지 확인 필요.

## API Contract (스냅샷)

<!-- planner가 Notion API명세를 읽어 여기에 고정. BE/FE/reviewer가 바인딩하는 SSOT.
     Notion 원본이 바뀌면 재plan → 이 섹션 diff로 추적. -->

### 데이터 모델

#### Slot (예약 가능 슬롯)

| 필드 | 타입 | 설명 |
|------|------|------|
| slotId | string (UUID) | 슬롯 식별자 |
| startAt | string (ISO8601) | 슬롯 시작 일시 |
| endAt | string (ISO8601) | 슬롯 종료 일시 |
| capacity | number | 총 정원 |
| reservedCount | number | 기 예약 인원 |
| remainingCount | number | 잔여 정원 |
| status | `"OPEN"` \| `"CLOSED"` | 예약 가능 여부 |

#### Reservation (생성 응답)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string (UUID) | 예약 식별자 |
| programId | string (UUID) | 프로그램 ID |
| slotId | string (UUID) | 선택한 슬롯 ID |
| reserverName | string | 예약자명 |
| participantCount | number | 참가 인원 |
| status | `"PENDING"` \| `"CONFIRMED"` | 예약 상태 (auto_confirm 공방은 CONFIRMED) |
| displayState | object | 고객 노출 상태 문구 |
| displayState.label | string | 상태 라벨 |
| displayState.description | string | 상태 설명 |
| displayState.subLabel | string \| null | 서브 라벨 (IN_PROGRESS 구간에서만 존재) |
| createdAt | string (ISO8601) | 생성 일시 |

---

### 엔드포인트

#### 1. `GET /programs/{programId}/available-slots`

예약 가능 시간 조회 (고객용 달력)

**Guard:** `AuthGuard` (인증된 User 이상)

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
        "capacity": 6,
        "reservedCount": 2,
        "remainingCount": 4,
        "status": "OPEN"
      },
      {
        "slotId": "slot-uuid-002",
        "startAt": "2026-06-01T14:00:00.000Z",
        "endAt": "2026-06-01T16:00:00.000Z",
        "capacity": 6,
        "reservedCount": 6,
        "remainingCount": 0,
        "status": "CLOSED"
      }
    ]
  },
  "error": null
}
```

**Error Responses**

| 코드 | error | 조건 |
|------|-------|------|
| 404 | `PROGRAM_NOT_FOUND` | 프로그램 없음 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 오류 |

---

#### 2. `POST /reservations`

예약 생성 (고객)

**Guard:** `AuthGuard` (인증된 User 이상)

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
  "shippingAddress": "서울특별시 마포구 월드컵북로 12, 101호",
  "requestMemo": "왼손잡이라 주의 부탁드립니다."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| programId | string (UUID) | 필수 | 프로그램 ID |
| slotId | string (UUID) | 필수 | 선택한 슬롯 ID |
| reserverName | string (2~20자) | 필수 | 예약자명 |
| reserverPhone | string | 필수 | 연락처 (휴대전화 형식) |
| participantCount | number (1 이상) | 필수 | 참가 인원 |
| deliveryMethod | `"DELIVERY"` \| `"PICKUP"` | 조건부 필수 | 클래스 deliveryOption이 CUSTOMER_SELECT일 때만 필수 |
| shippingAddress | string | 조건부 | deliveryMethod=DELIVERY 선택 시 |
| requestMemo | string | 선택 | 예약 메모 |

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

**Error Responses**

| 코드 | error | 조건 |
|------|-------|------|
| 400 | `INSUFFICIENT_CAPACITY` | 잔여 정원 부족 |
| 403 | `SELF_RESERVATION_NOT_ALLOWED` | 본인 공방 예약 시도 |
| 409 | `SLOT_BLOCKED` | 차단된 시간대 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 오류 |

---

## Scope

- In:
  - `GET /programs/{programId}/available-slots` API 구현 (BE)
  - `POST /reservations` API 구현 (BE): 예약 생성, 정원 차감, auto_confirm 처리, Artwork 자동 생성, QR 발급
  - 예약 신청 화면 UI 구현 (FE): 슬롯 달력/목록, 예약자 정보 입력 폼, 수령 방법 선택, 금액 계산 표시
  - 예약 완료 화면 UI 구현 (FE): 완료 안내 + 내 예약 이동
  - API 연동 (FE): 슬롯 조회 → 선택 → 예약 생성 전체 플로우
  - 자기거래 차단 (BE)
  - 비인증 접근 시 로그인 팝업 유도 (FE)

- Out:
  - 결제 처리 (MVP 미포함)
  - 파트너 수동 예약 등록 (`POST /partner/stores/{storeId}/reservations`) — 별도 기능으로 분리
  - 예약 취소 — 별도 기능으로 분리
  - 알림 발송 상세 구현 — notification 도메인에서 처리
  - 배송지 상세 수정 (`PATCH /reservations/{reservationId}/delivery`) — 별도 기능으로 분리

## Plan

### BE

1. `GET /programs/{programId}/available-slots` 구현
   - `AuthGuard` 적용
   - `programId`로 `ACTIVE` 프로그램 조회
   - 공방 운영시간·휴게시간·예약 간격 기반으로 해당 월 슬롯 목록 계산
   - `program_time_slots`에서 `reserved_count`/`capacity`로 잔여 정원 계산
   - `status = CLOSED`인 슬롯 및 `BlockedSlot` 존재 슬롯 CLOSED 처리
   - 슬롯 유효성 검사: `slot_start + class.duration <= break_start OR slot_start >= break_end`

2. `POST /reservations` 구현
   - `AuthGuard` 적용
   - 프로그램·슬롯 상태 검증 (`ACTIVE`, `PUBLISHED`)
   - `BlockedSlot` 존재 여부 확인 → `SLOT_BLOCKED(409)` 반환
   - 자기거래 차단 검증 → `SELF_RESERVATION_NOT_ALLOWED(403)` 반환
   - 잔여 정원 동시성 안전 차감 (`reserved_count` SELECT FOR UPDATE 또는 낙관적 락)
   - `reservations` row 생성 (`status = PENDING`, `source = CUSTOMER`)
   - `deliveryMethod = DELIVERY`이면 `deliveries` row 생성, `shippingAddress` 저장
   - `auto_confirm = true` 공방이면 즉시 `CONFIRMED` 전이 → `artworks` row 자동 생성, QR 토큰 발급
   - notification 큐 등록 (고객 접수 알림, 파트너 신규 예약 알림)

### FE

3. MSW mock 핸들러 추가
   - `GET /programs/:programId/available-slots` mock
   - `POST /reservations` mock (성공 / `INSUFFICIENT_CAPACITY` / `SLOT_BLOCKED` / `SELF_RESERVATION_NOT_ALLOWED`)

4. 예약 신청 UI 구현 (DESIGN.md 준수)
   - 슬롯 달력/목록 컴포넌트: 월별 이동, 날짜 선택, 해당 날짜 시간 슬롯 표시 (`OPEN`/`CLOSED` 구분)
   - 참가 인원 입력 (1 이상, 잔여 정원 이내)
   - 예약자 정보 입력 폼: 이름(2~20자), 연락처(휴대전화 형식), 저장 여부 설정
   - 수령 방법 선택 UI: `deliveryOption`에 따라 고정 또는 선택 분기
   - 예약 금액 계산 표시: `price × participantCount`
   - 비인증 접근 시 로그인 팝업 유도

5. 예약 완료 화면 구현
   - 성공 응답의 `displayState.label/description` 표시
   - `auto_confirm` 공방 분기 안내 문구 (PENDING vs CONFIRMED)
   - 내 예약 목록 이동 버튼

6. API 연동 (실 API)
   - `GET /programs/{programId}/available-slots` 연동 — 달력 월 변경 시 재조회
   - `POST /reservations` 연동 — 제출 시 에러 핸들링 포함

## Out (단계별 완료물)

- API:
  - `GET /programs/{programId}/available-slots` 엔드포인트
  - `POST /reservations` 엔드포인트 (정원 차감 + auto_confirm 분기 + Artwork 생성 + QR 발급)
- UI:
  - 예약 신청 화면 (`/stores/[slug]/programs/[programId]/reserve` 또는 동등 경로)
  - 예약 완료 화면
- 연동:
  - 슬롯 조회 → 슬롯 선택 → 예약 생성 전체 플로우 실 API 연결

## Risks

- 슬롯 조회와 예약 생성 사이에 정원이 마감될 수 있음 → BE에서 동시성 안전 차감 필수 (락 또는 낙관적 재시도)
- `deliveryMethod` 조건부 필수 로직 — 클라이언트에서 `deliveryOption` 값을 정확히 전달받아야 함 (Open decision 1번)
- `shippingAddress` 스키마 불일치 가능성 (Open decision 2번) — 계약 확정 전 구현 금지

## Validation

- Tests:
  - `GET /programs/{programId}/available-slots`: 슬롯 계산 로직 단위 테스트 (휴게시간 겹침, 정원 초과, CLOSED 슬롯 필터링)
  - `POST /reservations`: 정원 초과 / 자기거래 / BlockedSlot / auto_confirm 케이스별 통합 테스트
  - FE: 인원 선택 → 잔여 정원 초과 시 제출 불가 처리 테스트
- Manual checks:
  - [ ] 슬롯 달력에서 CLOSED 슬롯 선택 불가 확인
  - [ ] 정원 초과 시 `INSUFFICIENT_CAPACITY` 에러 메시지 노출 확인
  - [ ] auto_confirm 공방에서 예약 완료 시 `CONFIRMED` 상태 화면 표시 확인
  - [ ] 비인증 사용자 접근 시 로그인 팝업 노출 확인
  - [ ] 본인 공방 예약 시도 시 `SELF_RESERVATION_NOT_ALLOWED` 처리 확인
- Observability:
  - 예약 생성 실패 로그 (에러 코드 포함)
  - 정원 차감 동시성 충돌 발생 빈도 모니터링

## Decision Log

- 2026-06-02: `shippingAddress` 단일 문자열 vs 구조화 객체 — Open decision으로 보류. BE/FE 양측 합의 후 Contract 확정 필요.
- 2026-06-02: 예약자 정보 저장 여부 — 클라이언트 로컬 스토리지 처리로 가정하되 확인 필요 (Open decision 3번).
- 2026-06-02: `deliveryMethod` 조건부 필수 — 클래스 상세 API가 `deliveryOption`을 내려주는지 확인 필요 (Open decision 1번).

## Outcome

- Status: plan 작성 완료, Open decisions 해결 후 구현 시작 가능
- Follow-up: Open decisions 1~4 사람 확인 후 contract 최종 확정 → implementer에게 인계
