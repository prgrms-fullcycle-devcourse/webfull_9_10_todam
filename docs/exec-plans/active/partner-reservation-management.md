# Feature Plan: Partner Reservation Management (파트너 예약관리)

## Summary

- Goal: 파트너가 공방의 예약을 관리하는 기능 전체. 3개 하위 범위로 구성 — (1) **월간 조회**: 월별 캘린더 예약 현황(예약있음/예약불가/신규제한 마커), (2) **예약 상세 조회**: 예약 건 단위 상세 정보 및 액션(확정·거절·취소·체험완료), (3) **예약 생성**: 파트너 수동 예약 등록(워크인·전화).
- **예약 제한(ReservationRestriction)은 본 문서 범위 아님** — 타임슬롯 관리 #161 소관으로 일원화. FE: #170(예약 제한 화면), 자동생성 연동: #169. SSOT는 `partner-timeslot-management.md`. 본 문서 월간 조회 캘린더의 `hasRestriction` 마커만 그 데이터를 읽음.
- 핵심: 타임슬롯은 공방 단위(`StoreTimeSlot`)로 운영. 예약 제한은 슬롯 row FK 없이 `(storeId, startAt, programId)` 절대 시각 매칭. BE API(타임슬롯 생성·조회·막기·ReservationRestriction POST/DELETE·프로그램별 확정건수)는 `partner-timeslot-management.md`에서 완료. 본 문서는 **예약 자체 CRUD + 월별/일별 현황 화면 FE** 담당.
- Owner: nogglee (FE) / taesong (BE)
- Date: 2026-06-04
- Issues: #171(부모) — #172 월간 조회 / #173 예약 상세 / #174 예약 생성. (예약 제한은 #161/#170/#169)

---

## Status

> **예약 BE 전부 미구현** (2026-06-04 코드 확인). `apps/api/src/modules/reservation/`는 빈 스캐폴드(.gitkeep)뿐 — 컨트롤러·유스케이스 0개. "API명세 DB 확인/미등록" 표기는 **Notion 스펙 등록 여부**일 뿐 구현 상태 아님. 구현된 BE는 `timeslot` 모듈(#161)뿐.

### 범위 1: 월간 조회
- [ ] BE: `GET /partner/stores/{storeId}/reservations/calendar` — 월별 집계 API 구현 (Notion 스펙 미등록)
- [x] FE: 월별 캘린더 UI (예약있음/예약불가/신규제한 마커)
- [ ] API 연동: 캘린더 API 바인딩

### 범위 2: 예약 상세 조회
- [ ] BE: `GET /partner/reservations/{reservationId}` — 예약 상세 API (내부 메모 포함, 파트너 뷰) (Notion 스펙 미등록)
- [ ] FE: 예약 상세 UI (상태 메시지·액션 버튼 상태별 분기)
- [ ] API 연동

### 범위 3: 예약 생성 (파트너 수동 등록)
- [ ] BE: `POST /partner/stores/{storeId}/reservations` — 수동 예약 등록 API (Notion 스펙 O, 구현 X)
- [ ] FE: 수동 예약 등록 UI (시간대 선택 → 클래스 선택 → 예약 정보 입력 → 상태 선택)
- [ ] API 연동

### 범위 4: 예약 제한 — **본 문서 범위 아님 (이관됨)**
> #161 타임슬롯 관리로 일원화. BE 완료, FE는 #170(예약 제한 화면) / #169(자동생성 연동). SSOT: `partner-timeslot-management.md`.

### 공통 (예약 상태 액션) — BE 전부 미구현
- [ ] BE: `PATCH /partner/reservations/{reservationId}/confirm` — 예약 확정 (Notion 스펙 O, 구현 X)
- [ ] BE: `PATCH /partner/reservations/{reservationId}/reject` — 예약 거절 (Notion 스펙 X, 구현 X)
- [ ] BE: `PATCH /partner/reservations/{reservationId}/cancel` — 예약 취소 (파트너) (Notion 스펙 O, 구현 X)
- [ ] BE: `PATCH /partner/reservations/{reservationId}/complete` — 체험 완료 처리 (Notion 스펙 O, 구현 X)

---

## Context

- 요구사항명세서(고정): `docs/requirements.md`
  - `reservation` 도메인 §2 예약 상태·전이, §3 예약 생성, §4 파트너 수동 예약 등록, §5 예약 막기, §6 예약 취소, §7 체험 완료 처리
  - 접근 주체/가드: `@UseGuards(AuthGuard, PartnerGuard)` (Partner.status === APPROVED) + 공방 소유권 검증.
- 기능명세 (기능명세 DB, 2026-06-04):
  - `월별 예약 현황 조회` — 파트너, 달력 형태, 예약있음/불가/신규제한 마커
  - `일별 예약 현황 조회` — 파트너, 날짜 선택 기준 예약 목록, 카드별 상태 태그
  - `예약 상세 조회` (파트너) — 기본정보·상태메시지·액션버튼·내부메모·전화·문자·QR
  - `예약 등록` — 파트너 수동 등록, 시간대 선택 → 클래스 선택 → 정보 입력 → 상태 선택
  - `예약 확정` — PENDING → CONFIRMED, Artwork 자동생성 + QR 발급
  - `예약 제한 설정` — 종일/시간대 제한, 클래스 선택, 확정건수 표시
- API명세 (API명세 DB, 2026-06-04):
  - `POST /partner/stores/{storeId}/reservations` — 수동 예약 등록 (DB 확인)
  - `GET /partner/stores/{storeId}/reservations` — 공방 예약 목록 (DB 확인)
  - `PATCH /partner/reservations/{reservationId}/confirm` — 예약 확정 (DB 확인)
  - `PATCH /partner/reservations/{reservationId}/cancel` — 예약 취소 파트너 (DB 확인)
  - `PATCH /partner/reservations/{reservationId}/complete` — 체험 완료 (DB 확인)
  - `GET /partner/stores/{storeId}/time-slots` — 슬롯 목록+제한상태 (partner-timeslot-management 스냅샷)
  - `POST /partner/stores/{storeId}/reservation-restrictions` — 클래스별 막기 (partner-timeslot-management 스냅샷)
  - `DELETE /partner/stores/{storeId}/reservation-restrictions` — 막기 해제 (partner-timeslot-management 스냅샷)
  - `GET /partner/stores/{storeId}/programs/reservation-counts` — 프로그램별 확정건수 (partner-timeslot-management 스냅샷)
  - 미등록(신규 추가 필요): `GET /partner/reservations/{reservationId}` (상세 조회, 파트너 뷰), `GET /partner/stores/{storeId}/reservations/calendar` (월별 집계), `PATCH /partner/reservations/{reservationId}/reject` (거절)
- Relevant design docs: UI 작업 시 DESIGN.md "작업 시작 조건"(캘린더 마커 variant·상태 태그 토큰·예약 카드·액션 버튼 상태별 토큰) 확보 필요. UI: DESIGN.md 준수.
- 연관 plan: `docs/exec-plans/active/partner-timeslot-management.md` (타임슬롯 생성·조회·막기 BE 완료 문서 — API Contract 스냅샷의 슬롯 관련 엔드포인트는 해당 문서가 SSOT)

---

## Open Decisions

> **2026-06-04 플로우 시안 4종 수령** (월간 조회/상세 조회/예약 제한[#170 참고용]/수동 등록). UI·화면 흐름·액션 매트릭스 확정 → 아래 D-UI 2건 해소. API 응답 스키마(D-CALENDAR-API/D-RESERVATION-DETAIL-PARTNER/D-REJECT)는 여전히 Notion 등록·BE 합의 대기.

- **D-CALENDAR-API** (미해소): `GET /partner/stores/{storeId}/reservations/calendar` Notion 미등록. 시안상 마커 3종(날짜 하단 dot=예약있음, 범례 토글 `예약 불가`/`신규 예약 제한`) 확인 — 응답 필드(`hasReservation`/`isUnavailable`/`hasRestriction`/`reservationCount`)는 BE 합의 후 Notion 등록·스냅샷 갱신 필요.
- **D-RESERVATION-DETAIL-PARTNER** (UI 확정/API 미해소): 상세 시안으로 **필드·액션 매트릭스 확정**(예약번호·날짜·시간·인원·예약자·연락처·내부메모 + 상태별 availableActions). API 응답 스키마는 Notion 등록 대기.
- **D-REJECT** (UI 확정/API 미해소): 시안상 거절 = 확인 모달 → status 취소. **거절 사유 입력 UI 없음 → `rejectReason` 불필요** 잠정 결론. BE 확정 필요.
- **D-DETAIL-MASK**: 취소(CANCELED) 상세에서 예약자명/연락처 마스킹(`김**`, `010-****-0000`) 표시 — BE가 마스킹해 내려줄지 FE 마스킹할지 결정 필요.
- ~~**D-UI-CALENDAR-MARKER**~~ (해소): 월간 조회 시안으로 마커·범례 확정. DESIGN.md 토큰 매핑만 FE 착수 시.
- ~~**D-UI-RESERVATION-CARD**~~ (해소): 상세/월간 시안으로 상태 태그 4종(확정/대기/취소/체험완료) 확정.

---

## API Contract (스냅샷)

> SSOT. 응답은 공통 envelope(`statusCode/timestamp/path/message/data/error`)를 따른다.
> 타임슬롯·ReservationRestriction 관련 API는 `partner-timeslot-management.md`가 SSOT — 아래는 본 문서 고유 API만 스냅샷.

---

### 범위 1: 월간 조회

#### `GET /partner/stores/{storeId}/reservations/calendar` — 월별 예약 현황 집계

> **API명세 DB 미등록(D-CALENDAR-API).** 아래는 기능명세 + 요구사항에서 추론한 잠정 스키마. 확정 전 구현 착수 금지.

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- query: `year`(YYYY), `month`(1-12).
- res `200`:
  ```json
  {
    "data": {
      "year": 2026,
      "month": 6,
      "days": [
        {
          "date": "2026-06-01",
          "hasReservation": true,
          "isUnavailable": false,
          "hasRestriction": false,
          "reservationCount": 3
        }
      ]
    }
  }
  ```
  - `hasReservation`: 해당 날짜에 PENDING/CONFIRMED 예약 1건 이상.
  - `isUnavailable`: 해당 날짜 전체 슬롯이 CLOSED/CANCELED 또는 슬롯 없음.
  - `hasRestriction`: 해당 날짜에 ReservationRestriction 1건 이상.
- errors: `400 INVALID_DATE_PARAMS`, `403 FORBIDDEN`, `404 RESOURCE_NOT_FOUND`, `500 INTERNAL_SERVER_ERROR`

#### `GET /partner/stores/{storeId}/reservations` — 일별 예약 목록 (파트너)

> API명세 DB 확인. 스냅샷 기준일: 2026-06-04.

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- query: `date`(YYYY-MM-DD), `status`(opt), `programId`(opt), `cursor`(opt), `limit`(기본 20).
- res `200`:
  ```json
  {
    "data": {
      "reservations": [
        {
          "id": "res-uuid-001",
          "programTitle": "물레 체험 기초반",
          "scheduledAt": "2026-06-01T10:00:00.000Z",
          "reserverName": "김토담",
          "participantCount": 2,
          "status": "CONFIRMED",
          "source": "CUSTOMER",
          "createdAt": "2026-05-25T19:35:00.000Z"
        }
      ],
      "nextCursor": "res-uuid-002",
      "hasMore": true
    }
  }
  ```
- errors: `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`

---

### 범위 2: 예약 상세 조회

#### `GET /partner/reservations/{reservationId}` — 예약 상세 (파트너 뷰)

> **API명세 DB 미등록(D-RESERVATION-DETAIL-PARTNER).** 아래는 기능명세에서 추론한 잠정 스키마.

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- path: `reservationId` (예약 UUID).
- res `200`:
  ```json
  {
    "data": {
      "reservation": {
        "id": "res-uuid-001",
        "reservationNumber": "TODM-20260601-001",
        "programTitle": "물레 체험 기초반",
        "status": "CONFIRMED",
        "scheduledAt": "2026-06-01T10:00:00.000Z",
        "participantCount": 2,
        "reserverName": "김토담",
        "reserverPhone": "010-1234-5678",
        "internalMemo": "VIP 고객",
        "canceledAt": null,
        "cancelReason": null,
        "artworkId": "artwork-uuid-001",
        "availableActions": ["CANCEL", "COMPLETE"],
        "createdAt": "2026-05-25T19:35:00.000Z"
      }
    }
  }
  ```
  - `availableActions`: BE가 현재 status 기반으로 가능한 액션 목록을 계산해 반환 (`CONFIRM`, `REJECT`, `CANCEL`, `COMPLETE` 중 해당하는 것만).
- errors: `403 FORBIDDEN`, `404 RESERVATION_NOT_FOUND`, `500 INTERNAL_SERVER_ERROR`

#### `PATCH /partner/reservations/{reservationId}/confirm` — 예약 확정

> API명세 DB 확인. 스냅샷 기준일: 2026-06-04.

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- 조건: `status = PENDING`.
- req body: (없음 — path만)
- res `200`:
  ```json
  {
    "data": {
      "reservation": {
        "id": "res-uuid-001",
        "status": "CONFIRMED",
        "artworkId": "artwork-uuid-001",
        "updatedAt": "2026-05-25T20:05:00.000Z"
      }
    }
  }
  ```
- errors: `409 INVALID_RESERVATION_STATUS`(PENDING 아닌 경우), `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`

#### `PATCH /partner/reservations/{reservationId}/reject` — 예약 거절

> **API명세 DB 미등록(D-REJECT).** 잠정 스키마.

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- 조건: `status = PENDING`.
- req body: `{ "rejectReason": "공방 사정으로 인한 거절" }` (선택 여부 미확정)
- res `200`: `{ "data": { "reservation": { "id", "status": "CANCELED", "updatedAt" } } }`
- errors: `409 INVALID_RESERVATION_STATUS`, `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`

#### `PATCH /partner/reservations/{reservationId}/cancel` — 예약 취소 (파트너)

> API명세 DB 확인. 스냅샷 기준일: 2026-06-04.

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- 조건: `status = PENDING | CONFIRMED`. 파트너는 시간 제한 없음.
- req body: `{ "cancelReason": "공방 사정으로 인한 취소" }`
- res `200`:
  ```json
  {
    "data": {
      "reservation": {
        "id": "res-uuid-001",
        "status": "CANCELED",
        "canceledBy": "partner-user-uuid-001",
        "cancelReason": "공방 사정으로 인한 취소",
        "canceledAt": "2026-05-25T20:10:00.000Z"
      }
    }
  }
  ```
- errors: `409 INVALID_RESERVATION_STATUS`, `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`

#### `PATCH /partner/reservations/{reservationId}/complete` — 체험 완료 처리

> API명세 DB 확인. 스냅샷 기준일: 2026-06-04.

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- 조건: `status = CONFIRMED` + 현재 시각 >= 체험 예정일시.
- req body: (없음)
- res `200`:
  ```json
  {
    "data": {
      "reservation": {
        "id": "res-uuid-001",
        "status": "IN_PROGRESS",
        "artworkStatus": "VISITED",
        "updatedAt": "2026-05-25T20:15:00.000Z"
      }
    }
  }
  ```
- errors: `400 EXPERIENCE_NOT_STARTED`, `409 INVALID_RESERVATION_STATUS`, `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`

---

### 범위 3: 예약 생성 (파트너 수동 등록)

#### `POST /partner/stores/{storeId}/reservations` — 수동 예약 등록

> API명세 DB 확인. 스냅샷 기준일: 2026-06-04.

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- 특이사항: PENDING 단계 없이 `CONFIRMED` 또는 `IN_PROGRESS`로 직접 생성. 슬롯 CLOSED 검증 및 정원 초과 검증 생략. 과거 일자 슬롯 허용. `userId` null 허용(비회원 현장).
- req body:
  ```json
  {
    "programId": "prog-uuid-001",
    "slotId": "slot-uuid-001",
    "reserverName": "박현장",
    "reserverPhone": "010-9876-5432",
    "participantCount": 1,
    "deliveryMethod": "PICKUP",
    "initialStatus": "CONFIRMED",
    "internalMemo": "현장 방문 예약"
  }
  ```
  - `deliveryMethod`: 프로그램 `deliveryOption = CUSTOMER_SELECT`일 때만 필수. 그 외는 서버가 PICKUP 강제.
  - `initialStatus`: `CONFIRMED` | `IN_PROGRESS`.
  - `internalMemo`: 최대 200자, 선택.
- res `201`:
  ```json
  {
    "data": {
      "reservation": {
        "id": "res-uuid-002",
        "reserverName": "박현장",
        "status": "CONFIRMED",
        "source": "PARTNER_MANUAL",
        "artworkId": "artwork-uuid-002",
        "createdAt": "2026-05-25T20:00:00.000Z"
      }
    }
  }
  ```
- errors: `400 INVALID_REQUEST`, `403 FORBIDDEN`, `404 RESOURCE_NOT_FOUND`(프로그램/슬롯), `500 INTERNAL_SERVER_ERROR`

---

### 범위 4: 예약 제한 — **이관됨 (#161 / #170 / #169)**

> ReservationRestriction·슬롯 막기 관련 API(`GET time-slots`, `PATCH .../status`, `POST/DELETE reservation-restrictions`, `GET programs/reservation-counts`)는 `partner-timeslot-management.md`가 SSOT. 본 문서는 월간 조회 캘린더 `hasRestriction` 마커 계산에만 그 데이터를 참조함.

---

## Scope

### In
- **범위 1 (월간 조회)**
  - BE: `GET .../reservations/calendar` 월별 집계 API (날짜별 hasReservation/isUnavailable/hasRestriction 마커)
  - BE: `GET .../reservations` 일별 예약 목록 (이미 API명세 DB 확인 — 구현 여부 점검 필요)
  - FE: 월별 캘린더 화면(마커 표시·날짜 선택·월 이동) + 일별 예약 카드 목록
- **범위 2 (예약 상세 조회)**
  - BE: `GET /partner/reservations/{reservationId}` 상세 API (파트너 뷰 — DB 미등록, 구현 필요)
  - FE: 예약 상세 화면(기본정보·상태메시지·액션버튼·내부메모·전화·문자·QR)
- **범위 3 (예약 생성)**
  - BE: `POST .../reservations` 수동 예약 등록 (API명세 DB 확인 — 구현 상태 점검)
  - FE: 수동 예약 등록 플로우 (시간대 선택 → 클래스 선택 → 정보 입력 → 상태 선택)
- **공통 액션 BE**: confirm/cancel/complete (API명세 DB 확인), reject (DB 미등록 — 구현 필요)

### Out
- **타임슬롯 자체 생성/상태변경 + 예약 제한(ReservationRestriction) 전체**: `partner-timeslot-management.md`(#161) 소관. FE = #170(예약 제한 화면)/#169(자동생성 연동)
- 고객 예약 신청 플로우 (User 대상): 별도 `customer-reservation.md` 소관
- 월별 캘린더 마커 현황 중 슬롯 가용성 계산 로직 — 슬롯 OPEN/CLOSED 판단은 `partner-timeslot-management.md` 데이터 기반
- 예약 생성 시 정원 합산·슬롯 유효성·제한 검증 로직(서버 사이드): 파트너 수동 등록은 정원·CLOSED 검증 생략 정책 따름

---

## Plan

### 범위 1: 월간 조회

1. **BE**: `GET /partner/stores/{storeId}/reservations/calendar` API 구현.
   - query: `year`, `month`.
   - 해당 월 날짜별로 PENDING/CONFIRMED 예약 집계(`hasReservation`), 전체 슬롯 상태 집계(`isUnavailable`), ReservationRestriction 존재 여부(`hasRestriction`) 계산.
   - 가드: AuthGuard + PartnerGuard + 공방 소유권. 응답 envelope.
   - API명세 DB에 등록 필요(D-CALENDAR-API 해소 후).
2. **BE 점검**: `GET /partner/stores/{storeId}/reservations` 일별 예약 목록 — API명세 DB에 스키마 존재. 구현 여부 확인 및 `date` 필터 동작 검증.
3. **FE**: 월별 캘린더 컴포넌트 — `year/month` state, 월 이동(prev/next), 날짜별 마커(hasReservation·isUnavailable·hasRestriction), 날짜 선택 시 일별 예약 목록 로드.
4. **FE**: 일별 예약 카드 목록 — 예약 시간 오름차순, 상태 태그(확정/대기/취소/체험완료), 빈 상태 화면, 예약 재확인(수동 새로고침).
5. **API 연동**: 캘린더 API + 일별 목록 API 바인딩, 월 이동 시 데이터 재조회, 날짜 선택 시 목록 재조회.

### 범위 2: 예약 상세 조회

6. **BE**: `GET /partner/reservations/{reservationId}` 파트너 뷰 API 구현.
   - 기본 정보(예약번호·클래스명·status·일시·인원·예약자명·연락처) + 내부 메모 + `availableActions[]` + `canceledAt`/`cancelReason`(취소 예약 시).
   - D-RESERVATION-DETAIL-PARTNER 해소 후 API명세 DB 등록.
7. **BE**: `PATCH /partner/reservations/{reservationId}/reject` 거절 API 구현 (D-REJECT 해소 후).
8. **FE**: 예약 상세 화면 — 상태별 액션 매트릭스(시안 확정):
    - **대기(PENDING)**: 거절(확인 모달) / 확정. 상태 메시지 "대기 중인 예약이에요".
    - **확정(CONFIRMED)**: 전화걸기·문자·QR 조회 / 예약 취소(확인 모달) / 체험 완료하기.
    - **취소(CANCELED)**: read-only. 예약자명·연락처 마스킹(`김**`/`010-****-0000`), "취소되었어요" + 취소 시각.
    - **체험완료(IN_PROGRESS)**: 전화·문자·QR / 내부메모 저장하기(입력 후 활성화) / 작품 관리로 이동. "체험이 완료되었어요".
    - 공통: 내부메모(0/200), 메모 미저장 이탈 시 확인 모달, QR 화면(인쇄=PDF 다운로드).
9. **API 연동**: 상세 조회 + 액션 바인딩. confirm→작품관리 아이템 생성+확정알림, complete→cron 1h 자동완료·수령방법/주소 확인·리뷰알림 자동, 메모 저장 별도 API. 액션 완료 후 상태 갱신.

### 범위 3: 예약 생성

> FE 플로우 시안 확정(2026-06-04). 제목 "<공방명> 예약 등록하기", 풀스크린 4-step + 뒤로가기 단계 복귀.

10. **BE 구현**: `POST /partner/stores/{storeId}/reservations` 수동 등록 API (미구현 — Notion 스펙 O). `StoreTimeSlot` 기반.
    - ⚠️ Notion 스펙에 `programTimeSlotId`로 기재 → 타임슬롯 전환 후 `storeTimeSlotId`가 맞음. BE 확인 필수.
    - req: `slotId`(=storeTimeSlotId), `programId`, `reserverName`, `reserverPhone`, `participantCount`, `deliveryMethod`(택배=DELIVERY/직접수령=PICKUP), `internalMemo`(opt, ≤200), `initialStatus`(CONFIRMED|IN_PROGRESS).
11. **FE**: 수동 예약 등록 플로우 (풀스크린 4-step):
    - Step 1 **시간대 선택**: 날짜 `< >` 이동, 시간대 **단일 라디오** 선택(`GET .../time-slots?date=`), 시간대별 `확정 인원 N명` 표시. 1개 선택 시 "시간대 선택 완료" 활성화.
    - Step 2 **클래스 선택**: 해당 공방 ACTIVE 프로그램 **단일 라디오**, 클래스별 `확정 인원 N명`(`GET .../programs/reservation-counts`). 1개 선택 시 활성화.
    - Step 3 **예약자 정보**: 이름·연락처·인원수(− N +)·작품 수령방식(택배/직접수령 라디오)·내부메모(선택 0/200). 이름·연락처·인원수·수령방식 전부 입력 시 "입력 완료" 활성화.
    - Step 4 **예약 상태 선택 모달**: "예약 확정"(전화/현장 접수) / "체험 완료"(이미 체험 완료) 택1 → "등록하기" 활성화.
12. **API 연동**: 등록 POST → 성공 시 월간 조회로 이동 + 토스트 "'<날짜>'에 예약 등록이 완료되었어요". 캘린더/일별 목록 갱신.

### 범위 4: 예약 제한 — 이관됨

> #161 타임슬롯 관리로 일원화. 화면/연동은 #170(예약 제한 화면 FE) + #169(자동생성 연동). 상세 Plan은 `partner-timeslot-management.md` 참조.

---

## Out (단계별 완료물)

- BE (완료 — partner-timeslot-management.md에서):
  - `GET /partner/stores/:storeId/time-slots` (confirmedReservationCount·isRestricted·restrictedProgramIds 포함)
  - `GET /partner/stores/:storeId/programs/reservation-counts`
  - `POST /partner/stores/:storeId/reservation-restrictions`
  - `DELETE /partner/stores/:storeId/reservation-restrictions`
- BE (API명세 DB 확인, 구현 상태 점검):
  - `POST /partner/stores/:storeId/reservations`
  - `GET /partner/stores/:storeId/reservations`
  - `PATCH /partner/reservations/:reservationId/confirm`
  - `PATCH /partner/reservations/:reservationId/cancel`
  - `PATCH /partner/reservations/:reservationId/complete`
- BE (미구현 — 신규):
  - `GET /partner/stores/:storeId/reservations/calendar`
  - `GET /partner/reservations/:reservationId`
  - `PATCH /partner/reservations/:reservationId/reject`
- UI (범위 1 퍼블리싱 완료 — mock 연동):
  - `apps/web/src/features/reservation/calendar/ui/MonthCalendar.tsx` — 월 그리드(date-fns), 요일 헤더(일=danger/토=info), YearMonthPicker 드롭다운, 범례 체크박스 2종(예약 불가/신규 예약 제한, 필터 dim 처리)
  - `apps/web/src/features/reservation/calendar/ui/ReservationListCard.tsx` — 예약 카드 1건. 시각(HH:mm)/프로그램명/예약자(N명 표기)/상태 Tag. 상태→라벨: CONFIRMED=확정(success-subtle), PENDING=대기(warning-subtle), CANCELED=취소(muted), COMPLETED=체험완료(muted), REJECTED=거절(danger-subtle).
  - `apps/web/src/features/reservation/calendar/ui/ReservationCalendarView.tsx` — 컨테이너. MonthCalendar + 일별 헤더(날짜·건수·신규예약 버튼) + 예약 목록/빈상태 + 예약 제한 버튼(미래만 활성, 과거=disabled+"미래 날짜만 예약을 제한할 수 있어요").
  - `apps/web/src/app/partner/reservations/page.tsx` — page. useSearchParams storeId guard(없으면 toast+replace) → ReservationCalendarView.
- CalendarItem state→데이터 매핑: isToday→'today', isUnavailable||hasRestriction→'partiallyBlocked', 슬롯 없음(정기휴무, API 연동 시)→'holiday' 주석 처리, 그 외→'available'. hasReservation=true이면 dot.
- mock shape: CalendarData.days[] + getMockReservationsByDate(YYYY-MM-DD) — mock은 2026-06 고정, API 연동 시 fetch로 교체.
- date-fns 도입: startOfMonth/endOfMonth/eachDayOfInterval/getDay/isToday/format/isBefore/startOfDay/ko locale.
- 예약 제한 버튼 노출 규칙: 미래 날짜만 활성, 과거=disabled+안내문, 휴무일=hidden(API 연동 시 holiday CalendarItem state와 연계).
- navigate stub: 카드 클릭→`/partner/reservations/{id}`, 신규 예약→`/partner/reservations/new?storeId=`, 예약 제한→`/partner/reservations/restrict?storeId=`.
- 연동: <!-- API 연동(범위 1 API 연동 태스크) 완료 후 기록 -->

---

## Risks

- **API명세 DB 미반영**: `reservations/calendar`, `/partner/reservations/{reservationId}`, `/partner/reservations/{reservationId}/reject` 미등록 → Open decision 해소 후 등록·본 스냅샷 갱신 필요.
- **수동 예약 등록 API의 slotId 참조 불일치**: API명세 DB에 `programTimeSlotId`(`program_time_slots`)로 기재되어 있으나, partner-timeslot-management.md 완료 이후 실제 FK는 `storeTimeSlotId`(`store_time_slots`)로 변경됨. BE 구현 시 반드시 확인.
- **D-UI 미확보**: DESIGN.md 캘린더 마커·예약 카드 상태 태그·액션 버튼 variant/토큰 미확보 → FE 착수 전 반드시 확보.
- **일별 예약 목록 API 커서 방식**: 무한 스크롤(cursor) 기반으로 스펙되어 있으나, 캘린더 날짜 선택 후 날짜별 전체 목록을 한 번에 보여주는 UX 패턴과 페이지네이션 방식 정합성 확인 필요.
- **예약 제한(#161)과의 경계**: 월간 조회 캘린더 `hasRestriction` 마커는 ReservationRestriction 데이터(#161 BE)를 읽어 표시. 제한 설정/해제 화면 자체는 #170 소관이라 본 문서 범위 밖.

---

## Validation

### 범위 1
- Tests: 캘린더 API — 날짜별 hasReservation/isUnavailable/hasRestriction 집계 정확성, 월 경계(말일·1일), 빈 월, 소유권 403.
- Tests: 일별 목록 — date 필터, status 필터, 커서 기반 페이지네이션, 소유권 403.
- Manual: 예약 있는 날 마커 ON, 슬롯 전체 CLOSED 날 isUnavailable ON, restriction 있는 날 hasRestriction ON.

### 범위 2
- Tests: 상세 조회 — availableActions 상태별 정확성(PENDING→[CONFIRM,REJECT,CANCEL], CONFIRMED→[CANCEL,COMPLETE]), 소유권 403, 삭제/없는 예약 404.
- Tests: confirm — PENDING만 허용, 확정 후 artworkId 포함 응답. cancel — PENDING/CONFIRMED 허용, 알림 발송. complete — CONFIRMED + 체험 예정일 이후만 허용.
- Manual: 각 액션 버튼 클릭 후 상태 갱신, 취소된 예약 canceledAt 표시.

### 범위 3
- Tests: 수동 등록 — 과거 일자 허용, CLOSED 슬롯 허용(정원 초과 허용), userId null 허용, initialStatus(CONFIRMED/IN_PROGRESS), deliveryMethod 강제 로직.
- Manual: 등록 완료 후 캘린더 마커 갱신, 일별 목록에 신규 예약 반영.

### 범위 4 — 이관됨 (#161/#170). Validation은 해당 이슈/문서 참조.

---

## Decision Log

- **예약관리 plan을 3개 범위로 구조화** — 월간 조회(캘린더+일별목록), 예약 상세 조회, 예약 생성(수동). 2026-06-04.
- **예약 제한(ReservationRestriction)은 #161 타임슬롯 관리로 일원화** — 클래스별 막기 FE가 #161 작업목록(슬롯 막기 UI)과 중복이라 본 문서에서 제외. FE = #170(예약 제한 화면)/#169(자동생성 연동). 2026-06-04.
- **타임슬롯 BE(생성·조회·막기·ReservationRestriction)는 partner-timeslot-management.md 완료 상태로 인계** — 본 문서는 예약 CRUD + 현황 화면 FE 담당. 2026-06-04.
- **수동 예약 등록 API slotId = storeTimeSlotId** — API명세 DB에는 구버전 `programTimeSlotId` 기재되어 있으나 타임슬롯 전환 이후 `storeTimeSlotId` 참조가 올바름. 구현 시 확인 필수. 2026-06-04.

---

## Outcome

- Status: plan 확정. **예약 BE 전부 미구현** (reservation 모듈 빈 스캐폴드). Notion 스펙도 3개(calendar/detail/reject) 미등록. 예약관리는 BE·FE 모두 신규 작업.
- 착수 가능 범위:
  - **즉시 착수 가능**: 범위 3 FE (BE API명세 확인됨), 범위 2 FE(confirm/cancel/complete 액션 부분)
  - **Open decision 해소 후 착수**: 범위 1 FE + 캘린더 API(D-CALENDAR-API), 범위 2 상세 조회 API(D-RESERVATION-DETAIL-PARTNER), 거절 API(D-REJECT)
- Follow-up:
  1. D-CALENDAR-API, D-RESERVATION-DETAIL-PARTNER, D-REJECT 확정 → API명세 DB 등록 → 본 스냅샷 갱신.
  2. D-UI-CALENDAR-MARKER, D-UI-RESERVATION-CARD — DESIGN.md 토큰 확보.
  3. 수동 등록 API의 slotId FK 참조 확인(`storeTimeSlotId` 맞는지 BE와 협의).
