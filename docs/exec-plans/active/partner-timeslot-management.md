# Feature Plan: Partner Timeslot Management

## Summary

- Goal: 파트너가 **공방의** 예약 타임슬롯을 (1) 영업시간 기반으로 서버 자동 생성하고, (2) 날짜/상태로 목록 조회하며, (3) 개별 슬롯을 막기(CLOSED)/취소(CANCELED)/재오픈(OPEN)하고, (4) **클래스(프로그램)별로 신규 예약을 막기/해제**하는 파트너용 타임슬롯·예약 막기 관리 기능.
- 핵심: 타임슬롯을 **프로그램별이 아닌 공방별**로 운영한다(2026-06-04 사용자 확정). 같은 공방-슬롯에 여러 프로그램 예약이 붙을 수 있고, 정원은 공방 단위 합산 한도(`Store.maxCapacityPerSlot`)로 관리한다. 막기는 두 단위로 제공: **슬롯 전체 막기(CLOSED)** 와 **클래스별 막기(ReservationRestriction — 슬롯×프로그램 단위)**.
- **범위 한정(2026-06-04 사용자 확정, 정정)**: 본 문서 범위 = **타임슬롯 생성 + (막기 지원용 최소) 조회 + 슬롯 막기(CLOSED)/취소(CANCELED)/재오픈(OPEN) + 클래스별 예약 막기/해제(ReservationRestriction)**. 제외 대상은 **예약 자체 CRUD**(수동 예약 등록·개별 예약 취소·상태 전이)와 **현황 화면**(월별 캘린더·일별 예약 목록)이며 이는 **별도 예약 관리 문서** 소관. 조회는 막기 UI 지원에 꼭 필요한 것(슬롯별/프로그램별 확정건수·제한 상태)만 포함.
- Owner: taesong
- Date: 2026-06-04 (정정 갱신 — 클래스별 예약 막기 복원, 조회는 막기 지원용 최소)

## Status

- [ ] DB 마이그레이션 (ProgramTimeSlot → StoreTimeSlot, Reservation FK 변경, ReservationRestriction 신설)
- [ ] API: 타임슬롯 자동 생성 (POST `.../time-slots/generate`)
- [ ] API: 타임슬롯 목록 조회 (GET `.../time-slots`, confirmedReservationCount·제한상태 포함)
- [ ] API: 타임슬롯 상태 변경 (PATCH `.../time-slots/{id}/status`)
- [ ] API: 클래스별 예약 막기 적용 (POST `.../reservation-restrictions`)
- [ ] API: 클래스별 예약 막기 해제 (DELETE `.../reservation-restrictions`)
- [ ] API: 프로그램별 확정건수 조회 (GET `.../programs/reservation-counts`)
- [ ] FE: 타임슬롯 생성/목록/슬롯 막기·취소·재오픈 + 클래스별 막기/해제 UI (DESIGN.md 준수)
- [ ] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md
  - `reservation` 도메인 §3 예약 생성(슬롯 유효성·잔여 정원) — 본 문서는 슬롯 데이터모델·정원 필드만 정의(예약 생성 로직은 예약 관리 문서 소관).
  - 접근 주체/가드: `@UseGuards(AuthGuard, PartnerGuard)` (Partner.status === APPROVED) + 공방 소유권 검증.
  - ※ requirements.md는 여전히 "프로그램 정원 / BlockedSlot" 문구 → 재동기화 필요(Risks).
- 기능명세 (기능명세 DB, 2026-06-04):
  - (별도 "타임슬롯 생성" 기능명세 없음 — 생성 동작은 생성 API로 구성. 영업시간·interval 기반 자동 생성.)
- 조사로 확인된 사실 (전환 근거):
  - 예약(reservation) 모듈은 전부 빈 폴더 — 예약 생성/정원검증 로직 미구현.
  - `ProgramTimeSlot`은 `apps/api/prisma/schema.prisma:256-274`에 스키마만 존재. 이를 참조하는 TS 코드 0개 → 지금 교체 비용 최소.
  - 정원은 이미 공방 단위(DEC-5). `Store.maxCapacityPerSlot`(schema:142) 주석: "슬롯당 최대 예약 정원(공방 단위 — 클래스 공통, 같은 슬롯 합산 한도)" → 같은 시각 모든 프로그램 예약 합산 한도가 이미 의도. **(배경 컨텍스트. 정원 합산 검증/예약 생성 불변식은 예약 관리 문서 소관.)**
- 생성 소스 필드 (`apps/api/prisma/schema.prisma`):
  - `StoreOperatingHour`(163-174): `dayOfWeek`/`openTime`/`closeTime`/`breakStart?`/`breakEnd?`(db.Time).
  - `Store.reservationIntervalMinutes`(141): 슬롯 분할 간격(분) **= 슬롯 길이**.
  - `Store.maxCapacityPerSlot`(142): 공방 단위 슬롯 정원(합산 한도).
  - `Program.durationMinutes`(211): 슬롯 길이 산정에 **사용 안 함**(사용자 확정).
- Relevant design docs: UI 작업 시 DESIGN.md "작업 시작 조건"(슬롯 카드/생성 폼 variant·size별 토큰·상태별 토큰) 확보 필요. UI: DESIGN.md 준수.

## Open decisions

- **확정(2026-06-04)**:
  1. 타임슬롯을 **공방별(StoreTimeSlot)**로 전환. `Reservation` FK는 `storeTimeSlotId`, `Reservation.programId` 유지.
  2. 슬롯 길이 = `Store.reservationIntervalMinutes` (back-to-back, `endAt = startAt + interval`). `Program.durationMinutes` 무시.
  3. 정원 = `Store.maxCapacityPerSlot`, 같은 공방-슬롯의 **모든 프로그램** 예약 participantCount 합산 한도(배경 — 예약 관리 문서 소관).
  4. **휴무일 표현 = 요일 운영시간 기반 정기휴무.** 운영일은 `StoreOperatingHour`에 요일 단위로 등록되며, 거기 없는 요일은 슬롯 생성에서 제외(정기휴무). **`store_closed_days` 테이블 신설하지 않음.** 특정 날짜 임시휴무는 그날 슬롯을 CANCELED 처리로 대응.
  5. **과거 날짜 정책 = 과거 슬롯 스킵.** 생성 범위 내 과거 시각(now 이전) 슬롯은 생성 스킵. `startDate`가 과거여도 에러 아님 — 과거 슬롯만 스킵, 미래 슬롯은 정상 생성.
  6. **`StoreTimeSlotStatus` enum = `OPEN` / `CLOSED` / `CANCELED`.** 슬롯 전체 막기는 본 문서 소관(`PATCH .../time-slots/{id}/status`). `OPEN` = 슬롯 활성(예약 가능)·재오픈, `CLOSED` = 슬롯 전체 막기(신규 예약 차단, 기존 확정/대기 예약 유지), `CANCELED` = 슬롯 자체 취소(운영 안 함).
  7. **클래스별 예약 막기(ReservationRestriction)는 본 문서에 포함**(직전 제거를 정정). 슬롯×프로그램 단위로 신규 예약을 차단(기존 확정/대기 예약 유지). 제외 대상은 **예약 등록/개별 예약 취소 등 예약 CRUD**.
  8. **신규 예약 차단 규칙(불변식)** = `slot.status == CLOSED` **OR** `(slot, program) ReservationRestriction 존재` **OR** `slot.status == CANCELED`. (실제 예약 생성 거부 로직 자체는 예약 관리 문서 소관 — 본 문서는 차단 규칙·데이터만 정의.)
- **남은 결정 필요(비블로커)**:
  - D-OVERLAP. **CLOSED(슬롯 전체) vs ReservationRestriction(클래스별) 역할 중첩.** 권장: **병행 유지** — 슬롯 전체 막기는 `CLOSED`(단축 수단), 클래스별 막기는 `ReservationRestriction`. restriction으로 일원화(슬롯 전체 = 모든 프로그램 restriction 일괄 생성)할지 사람 결정 필요. 디자인 플로우("종일/시간대 선택 → 클래스 선택 → 막기")는 restriction POST에 매핑되며, CLOSED는 슬롯을 통째로 막는 단축 액션으로 공존.
  - D-DELETE-UX. **클래스별 막기 해제(DELETE reservation-restrictions)의 요청 형태** 미확정. (a) `{ date, timeSlotIds?[], programIds[] }` 조건 매칭 삭제 vs (b) 개별 `restrictionId[]` 삭제 vs 둘 다 지원. 디자인의 "막기 해제" 화면 확인 후 확정. 데이터모델/멱등 생성은 영향 없음(해제 요청 스키마만 결정).
  - D-DATE-UI. **날짜 선택 UI = 단순 date picker 전제.** 디자인의 월별 캘린더 마커(예약있음/예약불가/신규제한 현황)는 **예약 관리 문서** 소관. 본 문서 막기 플로우는 date picker + (종일|시간대 선택) + 클래스 선택만 가정.
  - D-UI. **DESIGN.md "작업 시작 조건" 미확보 컴포넌트**: 타임슬롯 카드(OPEN/CLOSED/CANCELED 상태 variant), 생성 날짜 범위 입력 폼, 슬롯 막기/취소/재오픈 액션, **클래스별 막기 플로우**(date picker · 종일/시간대 토글 · 클래스 선택 리스트의 '확정 예약 N건' 표시 · 막기/해제 버튼). variant enum/size별 토큰/상태별 토큰이 DESIGN.md에 없으면 FE 착수 전 확보 필요. UI: DESIGN.md 준수.

## API Contract (스냅샷)

> SSOT. 응답은 공통 envelope(`statusCode/timestamp/path/message/data/error`)를 따른다.

### 데이터모델 — `StoreTimeSlot` (공방별, ProgramTimeSlot 대체)

```prisma
model StoreTimeSlot {
  id            String              @id @default(uuid()) @db.Uuid
  storeId       String              @map("store_id") @db.Uuid
  startAt       DateTime            @map("start_at") @db.Timestamptz(6)
  endAt         DateTime            @map("end_at") @db.Timestamptz(6)
  reservedCount Int                 @default(0) @map("reserved_count")
  status        StoreTimeSlotStatus @default(OPEN)
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  store         Store               @relation(fields: [storeId], references: [id])
  reservations  Reservation[]

  @@unique([storeId, startAt])
  @@index([status])
  @@map("store_time_slots")
}

enum StoreTimeSlotStatus {
  OPEN
  CLOSED
  CANCELED
}
```

- 기존 `ProgramTimeSlot` 대비 변경: **`programId` 제거**, `@@unique([programId, startAt])` → `@@unique([storeId, startAt])`, enum `ProgramTimeSlotStatus` → `StoreTimeSlotStatus`(`OPEN`/`CLOSED`/`CANCELED`), `@@index([storeId])`는 unique로 커버.
- status:
  - `OPEN`: 슬롯 활성(예약 가능). 재오픈 시 이 상태로 전환.
  - `CLOSED`: **타임슬롯 막기 = 슬롯 단위 신규 예약 차단.** 기존 확정(CONFIRMED)/대기(PENDING) 예약은 취소되지 않고 유지된다(설정 완료 시점부터 신규 예약만 불가). 예약 존재 여부와 무관하게 전환 허용(409 없음). 예약 생성 로직이 `status=CLOSED` 슬롯을 거부하는 방식으로 신규 차단(예약 생성은 예약 관리 문서 소관이나, "CLOSED면 신규 차단" 규칙은 본 문서에 명시).
  - `CANCELED`: 슬롯 자체 취소(운영 안 함). 유효 예약(PENDING/CONFIRMED) 존재 시 전환 불가(409).
  - (※ **클래스별 막기**는 본 enum이 아닌 별도 `ReservationRestriction` 모델 소관 — 본 enum은 슬롯 전체 단위 막기만. 둘은 본 문서에 모두 포함, 역할은 D-OVERLAP 참조.)
- `reservedCount` / `remainingCount`(= `Store.maxCapacityPerSlot − reservedCount`, DB 컬럼 아닌 가공값)는 슬롯 필드로 유지한다. **슬롯 점유 "현황 화면"(일/월 집계 캘린더·목록)은 예약 관리 문서 소관**이며, 본 문서 조회 API는 막기 UI 지원에 필요한 슬롯 필드 + 슬롯별 확정건수 + 제한 상태만 반환한다.

### 데이터모델 — `ReservationRestriction` (클래스별 예약 막기)

```prisma
model ReservationRestriction {
  id              String        @id @default(uuid()) @db.Uuid
  storeId         String        @map("store_id") @db.Uuid
  storeTimeSlotId String        @map("store_time_slot_id") @db.Uuid
  programId       String        @map("program_id") @db.Uuid
  createdBy       String?       @map("created_by") @db.Uuid
  createdAt       DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  store           Store         @relation(fields: [storeId], references: [id])
  storeTimeSlot   StoreTimeSlot @relation(fields: [storeTimeSlotId], references: [id])
  program         Program       @relation(fields: [programId], references: [id])

  @@unique([storeTimeSlotId, programId])
  @@index([storeId])
  @@map("reservation_restrictions")
}
```

- 레코드 존재 = **해당 슬롯의 해당 프로그램 신규 예약 차단**. 기존 확정(CONFIRMED)/대기(PENDING) 예약은 유지(취소되지 않음).
- `@@unique([storeTimeSlotId, programId])` → 막기 적용은 **멱등**(이미 있으면 스킵). 막기 해제는 레코드 삭제.
- 관계 추가: `StoreTimeSlot.restrictions ReservationRestriction[]`, `Store.reservationRestrictions ReservationRestriction[]`, `Program.reservationRestrictions ReservationRestriction[]`.
- "모든 클래스 막기" = 해당 슬롯의 모든 프로그램에 대해 레코드 생성. "종일 막기" = 그 날짜 모든 슬롯 × 선택 프로그램.

### Reservation 변경 (엔티티 rename에 수반)

- `programTimeSlotId` (FK → program_time_slots) → **`storeTimeSlotId`** (FK → store_time_slots)로 변경.
- `Reservation.programId` **유지** — 어느 프로그램 예약인지 식별. 한 공방-슬롯에 여러 프로그램 예약이 붙을 수 있음.
- 관계: `programTimeSlot ProgramTimeSlot` → `storeTimeSlot StoreTimeSlot`로 교체.
- ※ FK rename은 StoreTimeSlot 엔티티 rename에 수반되므로 본 문서 마이그레이션에 포함한다. **단, 예약 생성/검증 로직 자체는 out of scope(예약 관리 문서)**.

### 엔드포인트

> 모든 경로에서 `programId` 제거 — 공방 단위.

#### 1) `POST /partner/stores/{storeId}/time-slots/generate` — 타임슬롯 서버 자동 생성
- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- req body (날짜 범위만):
  ```json
  { "startDate": "2026-06-01", "endDate": "2026-06-07" }
  ```
  - 단일 날짜 생성 시 `startDate == endDate`.
  - 시간/간격/정원은 **요청에서 받지 않음** — 전부 공방 설정 자동 조회.
  - 검증: 날짜 형식, `startDate <= endDate`. **`startDate`가 과거여도 에러 아님** — 과거 슬롯만 스킵.
- 생성 로직 — 범위 내 각 날짜에 대해:
  1. 해당 요일의 `StoreOperatingHour`(openTime/closeTime/breakStart?/breakEnd?) 조회. **요일 운영시간 미설정이면 그 날짜 스킵(= 정기휴무).**
  2. `[openTime, closeTime)` 구간을 `Store.reservationIntervalMinutes` 간격으로 분할. **슬롯 길이 = interval (back-to-back)**: 각 슬롯 `endAt = startAt + interval`. `endAt <= closeTime`인 슬롯만 생성.
  3. `breakStart~breakEnd` 구간과 겹치는 슬롯은 제외.
  4. **과거 시각 스킵: `startAt <= now`인 슬롯은 생성하지 않음.** skippedCount에 합산.
  5. 각 슬롯 `status=OPEN`, `reservedCount=0` 생성.
- 멱등성: `@@unique([storeId, startAt])` 활용 — 이미 존재하는 startAt은 스킵. 트랜잭션 처리.
- res `201`:
  ```json
  {
    "data": {
      "createdCount": 18,
      "skippedCount": 2,
      "createdSlots": [
        { "slotId": "...", "startAt": "...", "endAt": "...", "status": "OPEN", "reservedCount": 0 }
      ]
    }
  }
  ```
- errors: `400 INVALID_DATE_RANGE`, `401 UNAUTHORIZED`, `403 FORBIDDEN`(소유권), `404 RESOURCE_NOT_FOUND`(store), `409 OPERATING_HOURS_NOT_SET`(범위 내 전 요일 운영시간 미설정), `422 INTERVAL_NOT_CONFIGURED`(reservationIntervalMinutes null), `500 INTERNAL_SERVER_ERROR`
- 비고: 정기휴무는 운영시간 미설정 요일로 자동 처리. 특정 날짜 임시휴무는 슬롯 CANCELED로 대응 — 별도 휴무 데이터/테이블 없음.

#### 2) `GET /partner/stores/{storeId}/time-slots` — 타임슬롯 목록 조회
- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- query: `date`(YYYY-MM-DD, opt — 단일 날짜 필터), `startDate`(opt), `endDate`(opt), `status`(opt — `OPEN`|`CLOSED`|`CANCELED`). 막기 플로우는 보통 `date` 단일 필터로 그 날짜 슬롯을 조회.
- res `200`: `data.slots[]` (startAt 오름차순):
  ```json
  {
    "slotId": "...", "startAt": "...", "endAt": "...",
    "reservedCount": 2, "remainingCount": 4, "status": "OPEN",
    "confirmedReservationCount": 2,
    "isRestricted": true,
    "restrictedProgramIds": ["prog-uuid-1", "prog-uuid-2"],
    "createdAt": "..."
  }
  ```
  - `remainingCount = Store.maxCapacityPerSlot − reservedCount`.
  - `confirmedReservationCount`: 해당 슬롯의 `status=CONFIRMED` 예약 수 (막기 UI의 '확정 예약 N건' 표시용 — 복원).
  - `restrictedProgramIds`: 해당 슬롯에 ReservationRestriction이 걸린 프로그램 id 목록. `isRestricted = restrictedProgramIds.length > 0`. (막기 상태 표시용 — 복원.)
- errors: `400 INVALID_DATE_FORMAT`, `403 FORBIDDEN`, `404 RESOURCE_NOT_FOUND`, `500 INTERNAL_SERVER_ERROR`

#### 3) `PATCH /partner/stores/{storeId}/time-slots/{timeSlotId}/status` — 타임슬롯 상태 변경 (막기/취소/재오픈)
- **슬롯 단위 막기/해제/취소를 담당하는 엔드포인트.** (클래스별 선택 막기는 예약 관리 문서의 `ReservationRestriction` 소관 — 본 엔드포인트는 슬롯 전체 단위.)
- 가드: AuthGuard + PartnerGuard + 공방 소유권. 슬롯이 해당 공방 소속인지 검증.
- req body: `{ "status": "OPEN" | "CLOSED" | "CANCELED" }`.
  - `CLOSED`(막기): 슬롯 단위 신규 예약 차단. **기존 예약(PENDING|CONFIRMED)은 유지되므로 예약 존재 여부와 무관하게 전환 허용(409 없음).** 신규 차단은 예약 생성 로직이 `status=CLOSED` 슬롯을 거부하는 방식(예약 생성은 예약 관리 문서 소관).
  - `CANCELED`(취소): 해당 슬롯 참조 유효 예약(`PENDING|CONFIRMED`) 1건 이상이면 `409 ACTIVE_RESERVATIONS_EXIST`. (이 가드는 예약 데이터를 참조하지만 슬롯 작업이므로 본 문서에 유지.)
  - `OPEN`(재오픈): `CLOSED`/`CANCELED` → `OPEN` 복귀.
- res `200`: `data = { slotId, status, updatedAt }`
- errors: `400 INVALID_SLOT_STATUS`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 SLOT_NOT_FOUND`, `409 ACTIVE_RESERVATIONS_EXIST`(CANCELED 전환 시만), `500 INTERNAL_SERVER_ERROR`

#### 4) `POST /partner/stores/{storeId}/reservation-restrictions` — 클래스별 예약 막기 적용
- **클래스(프로그램)별 신규 예약 막기.** (슬롯 × 프로그램 단위 멱등 생성.) 디자인 플로우: 날짜 선택 → (종일|시간대 선택) → 클래스 선택 → 막기 적용.
- 가드: AuthGuard + PartnerGuard + 공방 소유권. 대상 슬롯/프로그램이 해당 공방 소속인지 검증.
- req body:
  ```json
  { "date": "2026-06-10", "scope": "TIME_SLOTS", "timeSlotIds": ["slot-1","slot-2"], "programIds": ["prog-1","prog-2"] }
  ```
  - `scope: "ALL_DAY" | "TIME_SLOTS"`. `ALL_DAY`면 `date`의 모든 슬롯 대상(`timeSlotIds` 무시). `TIME_SLOTS`면 `timeSlotIds[]` 필수.
  - `programIds[]` 필수. "모든 클래스" 선택은 클라이언트가 그 슬롯의 전체 프로그램 id를 채워 보냄(또는 BE가 전체로 확장 — D-OVERLAP 시 확정).
  - 생성 대상 = (선택 슬롯 집합) × (선택 프로그램 집합). `@@unique([storeTimeSlotId, programId])`로 **멱등**(이미 있으면 스킵).
- res `201`:
  ```json
  { "data": { "appliedCount": 4, "restrictions": [ { "id":"...", "storeTimeSlotId":"...", "programId":"..." } ] } }
  ```
  - `appliedCount` = 신규 생성된 레코드 수(이미 존재해 스킵된 건 제외).
- errors: `400 INVALID_RESTRICTION_REQUEST`(date/scope/timeSlotIds/programIds 불일치), `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 RESOURCE_NOT_FOUND`(슬롯/프로그램), `500 INTERNAL_SERVER_ERROR`

#### 5) `DELETE /partner/stores/{storeId}/reservation-restrictions` — 클래스별 예약 막기 해제
- **클래스별 막기 해제 = ReservationRestriction 레코드 삭제.** 요청 형태는 **D-DELETE-UX(Open decision)** — 디자인 확인 후 확정. 잠정안:
  - body 조건 매칭: `{ date, timeSlotIds?[], programIds[] }` 또는
  - 개별 id: `{ restrictionIds: ["..."] }`.
- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- res `200`: `data = { removedCount }`.
- errors: `400 INVALID_RESTRICTION_REQUEST`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 RESOURCE_NOT_FOUND`, `500 INTERNAL_SERVER_ERROR`

#### 6) `GET /partner/stores/{storeId}/programs/reservation-counts` — 프로그램별 확정건수 조회 (막기 지원)
- **막기 플로우 "예약 제한 클래스 선택" 화면의 클래스별 '확정 예약 N건' 표시용.** 선택 슬롯 범위 기준 프로그램별 CONFIRMED 예약 수 반환.
- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- query: `date`(YYYY-MM-DD), `timeSlotIds`(opt — 콤마구분 또는 반복 파라미터; 미지정 시 `date` 전체 슬롯).
- res `200`:
  ```json
  { "data": { "programs": [ { "programId":"prog-1", "programName":"...", "confirmedReservationCount": 3 } ] } }
  ```
- errors: `400 INVALID_DATE_FORMAT`, `403 FORBIDDEN`, `404 RESOURCE_NOT_FOUND`, `500 INTERNAL_SERVER_ERROR`
- 비고: 월별 캘린더·일별 예약 목록 등 **현황 화면 조회는 본 문서 OUT**(예약 관리 문서). 본 엔드포인트는 막기 대상 선택 지원에 한정.

## Scope

- In:
  - DB 마이그레이션: `ProgramTimeSlot` → `StoreTimeSlot`(공방별, programId 제거, unique `[storeId, startAt]`, enum `OPEN`/`CLOSED`/`CANCELED`), `Reservation.programTimeSlotId` → `storeTimeSlotId` FK 변경(엔티티 rename에 수반), **`ReservationRestriction` 신설**(unique `[storeTimeSlotId, programId]`). (예약 데이터 없어 안전)
  - 타임슬롯 **서버 자동 생성**(날짜 범위 입력 → 공방 영업시간·interval 기반 분할, 정기휴무/break/과거/멱등 스킵).
  - 타임슬롯 목록 조회(date/날짜범위/상태 필터, reservedCount·remainingCount·status + **막기 지원 필드** confirmedReservationCount·isRestricted·restrictedProgramIds).
  - **슬롯 전체 막기**(CLOSED — 신규 예약 차단·기존 예약 유지)·취소(CANCELED, 유효 예약 시 409 가드)·재오픈(OPEN) 상태 전환.
  - **클래스별 예약 막기/해제**(`POST/DELETE .../reservation-restrictions`) — 슬롯×프로그램 단위 멱등 생성/삭제.
  - **막기 지원 조회(최소)**: 프로그램별 확정건수(`GET .../programs/reservation-counts`).
  - **신규 예약 차단 규칙·차단 데이터 정의**(`CLOSED OR restriction OR CANCELED`). (예약 생성 거부 로직 자체는 OUT.)
  - FE: 타임슬롯 생성/목록/슬롯 막기·취소·재오픈 + 클래스별 막기/해제 UI (DESIGN.md 준수).
- Out (별도 **예약 관리 문서**에서 다룸):
  - **예약 자체 CRUD** — 수동 예약 등록(생성), 개별 예약 취소, 예약 상태 전이(확정/거절/체험완료).
  - **현황 화면** — 월별 캘린더 현황(마커: 예약있음/예약불가/신규제한), 일별 예약 목록 현황 카드 — `GET .../reservations/calendar`, `GET .../reservations?date=`.
  - 예약 생성 시 정원 합산·슬롯 유효성·제한 검증 **로직 자체**(본 문서는 차단 규칙/데이터만 정의, 실제 예약 거부 로직은 예약 관리 문서).
  - 슬롯 점유 "현황 화면"(일/월 집계 표시 캘린더). 날짜 선택 UI는 단순 date picker 전제(월별 캘린더 마커 현황 제외 — D-DATE-UI).
  - BlockedSlot 엔티티/`blocked-slots` 엔드포인트(미사용 확정 — `ReservationRestriction`로 대체).

## Plan

1. **BE 마이그레이션**: `ProgramTimeSlot` → `StoreTimeSlot`(programId 제거, unique `[storeId, startAt]`, enum `StoreTimeSlotStatus = OPEN|CLOSED|CANCELED`). `Store.timeSlots` 관계 타입 교체. `Reservation` FK `programTimeSlotId`→`storeTimeSlotId` 및 관계 교체. `Program.timeSlots` 관계 제거. **`ReservationRestriction` 모델 신설**(unique `[storeTimeSlotId, programId]`, Store/StoreTimeSlot/Program 관계 추가). Prisma migrate. (참조 TS 코드 0개라 안전)
2. BE: 자동 생성 API (POST `.../time-slots/generate`). 운영시간·interval 조회 → 날짜별 분할(slot 길이=interval, break 제외, 운영시간 미설정 요일 스킵, 과거 시각 슬롯 스킵, unique 멱등, created/skipped 카운트). 트랜잭션.
3. BE: 목록 API (GET `.../time-slots`, date/날짜범위/상태 필터, reservedCount·remainingCount·status + confirmedReservationCount·isRestricted·restrictedProgramIds 가공).
4. BE: 슬롯 상태 변경 API (PATCH `.../time-slots/{id}/status`, CLOSED 막기는 예약 존재해도 허용·신규 차단, CANCELED 시 유효 예약 409 가드, OPEN 재오픈).
5. BE: 클래스별 막기 API (POST `.../reservation-restrictions` — 슬롯×프로그램 멱등 생성, ALL_DAY/TIME_SLOTS scope, appliedCount). 트랜잭션.
6. BE: 클래스별 막기 해제 API (DELETE `.../reservation-restrictions` — 조건/개별 id 삭제, removedCount). 요청 스키마는 D-DELETE-UX 확정 후.
7. BE: 프로그램별 확정건수 API (GET `.../programs/reservation-counts?date=&timeSlotIds=`).
8. (BE 차단 규칙 명시) 신규 예약 차단 불변식 = `CLOSED OR restriction OR CANCELED`를 본 문서에 정의 — 실제 거부 로직은 예약 관리 문서가 이 규칙을 구현.
9. FE: 타임슬롯 생성(날짜 범위) / 목록 / 슬롯 막기·취소·재오픈 + 클래스별 막기 플로우(date picker → 종일/시간대 → 클래스 선택('확정 N건' 표시) → 막기/해제) UI. DESIGN.md 준수.
10. API 연동: 엔드포인트 바인딩, envelope/에러코드 처리.

## Out (단계별 완료물)

- DB: <!-- 마이그레이션 파일, 적용 결과 -->
- API: <!-- 구현된 엔드포인트, 파일 -->
- UI: <!-- 구현된 화면, 컴포넌트 -->
- 연동: <!-- 연결 지점, 검증 결과 -->

## Risks

- requirements.md가 여전히 "프로그램 정원 / BlockedSlot / 슬롯 status 차단" 문구 → 재동기화 필요(공방별 슬롯·정원 반영).
- **API명세 DB 미반영(확인됨)**: API명세 DB에는 프로그램 경로 `GET .../programs/{programId}/time-slots`만 존재(공방 경로·restriction 필드 없음). `time-slots/generate`(POST), 상태 PATCH, **`reservation-restrictions`(POST/DELETE)**, **`programs/reservation-counts`(GET)** 는 API명세 DB에 **없음** → 승인 후 **API명세 DB 등록/수정 필요**. GET time-slots 응답에 confirmedReservationCount·restrictedProgramIds 필드 추가도 반영 필요.
- **CLOSED vs ReservationRestriction 역할 중첩(D-OVERLAP)** 미확정 — 권장 병행안 전제로 구현하되 일원화 결정 시 막기 적용/해제 로직 재조정 가능.
- StoreTimeSlot 전환이 **예약 생성/available-slots 등 미구현 기능(예약 관리 문서)의 설계 전제를 변경** → 해당 문서는 본 문서의 슬롯 모델·`storeTimeSlotId` FK를 전제로 정원/제한 검증을 구현.
- 자동 생성 시 `reservationIntervalMinutes`/운영시간 미설정 공방 호출 → 422/409 정책 의존.
- 특정 날짜 임시휴무/공휴일은 슬롯이 일단 생성됨 → 파트너가 슬롯 CANCELED로 차단. 자동 휴무 처리 없음 → 운영 가이드 필요.

## Validation

- Tests: 생성 멱등 스킵 / break 제외 / 운영시간 미설정 날짜 스킵 / 과거 시각 슬롯 스킵 / 슬롯 길이=interval / created·skipped 카운트.
- Tests: 상태 변경 — CLOSED 막기는 유효 예약 존재해도 전환 허용(409 없음), CANCELED 시 유효 예약 존재하면 409·없으면 전환, OPEN 재오픈, 소유권 403.
- Tests: 목록 remainingCount·confirmedReservationCount·restrictedProgramIds 계산, date/날짜범위/상태 필터, 소유권 403.
- Tests: 클래스별 막기 — TIME_SLOTS scope (선택 슬롯×프로그램) 멱등 생성·appliedCount, ALL_DAY scope (그 날짜 전체 슬롯) 확장, 중복 적용 시 스킵, 소유권 403, 타 공방 슬롯/프로그램 404.
- Tests: 클래스별 막기 해제 — 조건/개별 id 삭제·removedCount, 없는 레코드 해제 멱등.
- Tests: 프로그램별 확정건수 — 선택 슬롯 범위 기준 programId별 CONFIRMED 집계.
- Manual checks: 자동 생성 후 목록 반영, 슬롯 취소→재오픈 토글, CANCELED 가드, 막기 적용 후 목록 isRestricted/restrictedProgramIds 반영, 막기→해제 토글.
- Observability: 슬롯 생성(범위/created/skipped) 로그, 슬롯 상태 변경 로그, 클래스별 막기 적용/해제(appliedCount/removedCount) 로그.

## Decision Log

- **클래스별 예약 막기(ReservationRestriction) 이 문서에 포함 — 직전 제거를 정정. 제외 대상은 예약 등록/개별 취소 등 예약 CRUD. 조회는 막기 지원용 최소(확정건수)만, 월별/일별 현황은 예약 관리 문서.** — 사용자 확정 2026-06-04.
- **문서 범위 = 타임슬롯 생성 + (막기 지원용 최소) 조회 + 슬롯 막기/취소/재오픈 + 클래스별 막기/해제.** 예약 자체 CRUD(수동 등록·개별 취소·상태 전이)와 현황 화면(월별 캘린더·일별 목록)은 별도 예약 관리 문서로 분리 — 사용자 확정 2026-06-04.
- **슬롯 전체 막기(CLOSED) 유지 — 슬롯 단위 막기는 본 문서 소관(`PATCH .../time-slots/{id}/status`)으로 처리** — 사용자 확정 2026-06-04. `CLOSED`는 슬롯 전체 신규 예약 차단·기존 확정/대기 예약 유지를 의미하며 예약 존재해도 전환 허용(409 없음). **신규 예약 차단 불변식 = `CLOSED OR (slot,program) restriction OR CANCELED`** 를 본 문서에 정의(실제 거부 로직은 예약 관리 문서). CLOSED(슬롯 전체)와 ReservationRestriction(클래스별) 역할 중첩은 D-OVERLAP(병행 권장)로 표기.
- **타임슬롯을 프로그램별(ProgramTimeSlot)에서 공방별(StoreTimeSlot)로 전환, Reservation FK를 storeTimeSlotId로 변경** — 사용자 확정 2026-06-04. 예약 로직 미구현이라 교체 비용 최소.
- **슬롯 길이 = Store.reservationIntervalMinutes (back-to-back), Program.durationMinutes 무시** — 사용자 확정 2026-06-04.
- **정원 = Store.maxCapacityPerSlot, 같은 공방-슬롯의 전체 프로그램 예약 합산 한도(배경 컨텍스트)** — DEC-5 및 사용자 확정 일치. 합산 검증은 예약 관리 문서 소관.
- 타임슬롯 생성을 서버 자동생성(공방 영업시간+interval 기반, 날짜 범위만 입력)으로 — 사용자 확정 2026-06-04. 클라이언트 slots 배열 POST 폐기.
- **휴무일 표현 = 요일 운영시간 기반 정기휴무** — 사용자 확정 2026-06-04. 미설정 요일은 슬롯 생성 제외. `store_closed_days` 테이블 신설 안 함. 특정 날짜 임시휴무는 슬롯 CANCELED로 대응.
- **과거 날짜 정책 = 과거 슬롯 스킵** — 사용자 확정 2026-06-04. `startAt <= now` 슬롯 스킵, `startDate`가 과거여도 에러 아님.
- 네이밍 `program` 사용(`class` 아님) — 백엔드 결정.

## Outcome

- Status: ready (구조·블로커 없음, BE 마이그레이션 + 생성/조회/상태변경 + 클래스별 막기/해제 + 확정건수 API 즉시 착수 가능).
- 남은 Open decisions: **D-OVERLAP**(CLOSED vs restriction 역할 — 병행 권장), **D-DELETE-UX**(막기 해제 요청 스키마 — 디자인 확인), **D-DATE-UI**(날짜 선택 = 단순 date picker 전제), **D-UI**(DESIGN.md "작업 시작 조건" 확보). 모두 비블로커 — BE는 D-DELETE-UX(해제 스키마)만 확정 후 Plan 6 착수 권장, 나머지는 비의존.
- Follow-up: (1) 마이그레이션(Plan 1, ReservationRestriction 포함) 우선 적용. (2) 승인 후 API명세 DB에 `time-slots/generate`·`time-slots`(공방 경로, restriction 필드)·상태 PATCH·`reservation-restrictions`(POST/DELETE)·`programs/reservation-counts` 등록/수정. (3) requirements.md 재동기화. (4) 예약 등록/취소·상태전이·월별 캘린더·일별 현황은 별도 예약 관리 문서로 작성(사용자 예정).
