# Feature Plan: 파트너 예약 제한

## Summary

- Goal: 파트너가 특정 날짜(종일 또는 특정 시간대)의 신규 예약을 클래스 단위로 차단. 이미 확정된 예약은 유지.
- Owner: nogglee
- Date: 2026-06-08

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
각 항목 체크 기준:
- API 구현: 실 BE(`apps/api`) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: **실 API** 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크(연동 아님).
-->

- [x] API 구현 — BE 이미 구현됨 (`apps/api/src/modules/timeslot/presentation/controllers/timeslot.controller.ts`)
- [x] UI 구현
- [x] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md — `reservation` 도메인, `Partner` 접근 주체, `AuthGuard + PartnerGuard`
- 기능명세: Notion DB select 생략 (사용자가 화면 플로우를 직접 제공)
- API명세: `packages/shared/src/contracts/timeslot.ts` 가 SSOT — Notion API명세 DB와 동기화된 상태로 간주
- Relevant design docs: Figma 시안 (바텀시트 라디오, 체크박스 목록, 안내박스, 하단 버튼 패턴)
- Open decisions (확정 2026-06-08):
  - **[확정] 라우트 구조**: 단일 `restrict/page.tsx` + step 클라이언트 상태(`scope`→`timeslots`→`programs`). date/scope/timeRanges 전부 한 클라이언트 컴포넌트 상태로 보존. 캘린더에서 `?date=YYYY-MM-DD`로 진입. 세그먼트 분리 안 함.
  - **[확정] 뒤로가기/바텀시트**: 진입 시 step=scope 에서 범위 선택 바텀시트 노출. 시간대 화면에서 뒤로 → step=scope 로 되돌리며 바텀시트 재오픈(클라이언트 상태 전환, router.back 불필요). 클래스 화면 뒤로 → 시간대(또는 종일이면 scope).
  - **[확정] 완료 토스트**: `useToast` 패턴 사용. 캘린더 복귀 후 토스트 — sessionStorage 또는 router query 중 기존 패턴 따름(구현 시 확인).

## API Contract (스냅샷)

> SSOT: `packages/shared/src/contracts/timeslot.ts`. BE 컨트롤러: `apps/api/src/modules/timeslot/presentation/controllers/timeslot.controller.ts`.

### 데이터모델

#### TimeSlotItem
```
slotId: string
startAt: string           // ISO 8601 UTC (e.g. '2026-06-10T10:00:00.000Z')
endAt: string
reservedCount: number     // 예약된 인원
remainingCount: number    // 잔여 정원
status: 'OPEN' | 'CLOSED' | 'CANCELED'
confirmedReservationCount: number   // 확정 예약 건수 (UI 캡션용)
isRestricted: boolean
restrictedProgramIds: string[]
createdAt: string
```

#### ProgramReservationCountItem
```
programId: string
programName: string
confirmedReservationCount: number
```

#### ReservationRestrictionTimeRange
```
startAt: string   // ISO 8601 with offset (e.g. '2026-06-10T10:00:00+09:00')
endAt: string
```

### 엔드포인트

#### `GET /partner/stores/:storeId/time-slots`
- 가드: `AuthGuard`, `PartnerGuard`
- Query: `listTimeSlotsQuerySchema`
  ```
  date?: 'YYYY-MM-DD'       // 시간대 선택 화면에서 이 파라미터 사용
  startDate?: 'YYYY-MM-DD'
  endDate?: 'YYYY-MM-DD'
  status?: 'OPEN' | 'CLOSED' | 'CANCELED'
  ```
- Response: `listTimeSlotsResultSchema`
  ```
  { slots: TimeSlotItem[] }
  ```
- 용도: 시간대 선택 화면에서 해당 날짜의 타임슬롯 목록 + 확정 예약 건수 조회

#### `GET /partner/stores/:storeId/programs/reservation-counts`
- 가드: `AuthGuard`, `PartnerGuard`
- Query: `programReservationCountsQuerySchema`
  ```
  date: 'YYYY-MM-DD'              // 필수
  timeSlotIds?: string            // 콤마 구분 슬롯 id 목록. 미지정 시 date 전체 슬롯.
  ```
- Response: `programReservationCountsResultSchema`
  ```
  { programs: ProgramReservationCountItem[] }
  ```
- 용도: 클래스 선택 화면에서 클래스별 확정 예약 건수 조회. 시간대 선택 경로면 선택한 슬롯 id 전달.

#### `POST /partner/stores/:storeId/reservation-restrictions`
- 가드: `AuthGuard`, `PartnerGuard`
- Body: `createReservationRestrictionsRequestSchema`
  ```
  date: 'YYYY-MM-DD'                         // 필수
  scope: 'ALL_DAY' | 'TIME_SLOTS'            // 필수
  timeRanges?: ReservationRestrictionTimeRange[]   // scope=TIME_SLOTS 일 때 필수
  programIds: string[]                        // uuid[], min 1
  ```
- Response: HTTP 201. 응답 메시지: "클래스별 예약 막기가 적용되었습니다."
- 용도: 예약 제한 생성 최종 제출

#### `DELETE /partner/stores/:storeId/reservation-restrictions` (참고, 이번 범위 외)
- Body: `deleteReservationRestrictionsRequestSchema` — date/timeRanges/programIds/restrictionIds 모두 optional 조건 매칭

## Scope

- In:
  - 범위 선택 바텀시트 (종일 / 시간대 선택 라디오 + "다음" 버튼)
  - 예약 제한 시간대 선택 화면 (`restrict/time-slots` 또는 step 구조)
  - 예약 제한 클래스 선택 화면 (`restrict/programs` 또는 step 구조)
  - `POST reservation-restrictions` 제출 + 성공 후 캘린더 복귀 + 토스트
  - entity api/query에 `createReservationRestrictions` 추가 (기존 timeslots/programs api 함수는 이미 존재)
- Out:
  - 예약 제한 해제(DELETE) 기능
  - 캘린더에서 제한 날짜 시각화 (별도 기능)
  - BE API 구현 (이미 완료)

## Plan

1. **라우트 구조 확정 + 스캐폴딩**
   - `apps/web/src/app/partner/reservations/restrict/` 하위에 `time-slots/page.tsx`, `programs/page.tsx` 생성 (각 page는 Client 컴포넌트 import만)
   - 또는 단일 `restrict/page.tsx` + `step` URL param 방식 — Open decision 해소 후 진행
   - 각 page는 `useCurrentStoreId()` + searchParams(date, selectedSlotIds) 수신

2. **바텀시트 컴포넌트 — 범위 선택**
   - 위치: `apps/web/src/features/reservation/restriction/ui/RestrictionScopeBottomSheet.tsx`
   - 라디오 2종: "종일" / "시간대 선택"
   - "다음" 버튼: 선택 시 활성화
   - 종일 선택 → `/partner/reservations/restrict/programs?date=YYYY-MM-DD&scope=ALL_DAY`
   - 시간대 선택 → `/partner/reservations/restrict/time-slots?date=YYYY-MM-DD`
   - 진입점: `ReservationCalendarView` 날짜 선택 + "예약 제한" 액션 연결

3. **시간대 선택 화면**
   - 위치: `apps/web/src/features/reservation/restriction/ui/RestrictionTimeSlotsClient.tsx`
   - 데이터: `usePartnerTimeSlotsByDate(storeId, date)` — 기존 query 재사용
   - "모든 시간대 선택" 전체 토글 체크박스
   - 개별 슬롯 체크박스 항목 — `startAt~endAt` 시간 포맷 + `confirmedReservationCount > 0`이면 "확정 예약 N건" 캡션
   - 노란 안내박스: "이미 확정된 예약은 취소되지 않고 유지돼요..."
   - 하단 "제한 시간 선택 완료" 버튼: 1개 이상 선택 시 활성화 → `restrict/programs?date=...&timeSlotIds=...&scope=TIME_SLOTS`

4. **클래스 선택 화면**
   - 위치: `apps/web/src/features/reservation/restriction/ui/RestrictionProgramsClient.tsx`
   - 데이터: `usePartnerProgramReservationCounts(storeId, date, timeSlotIds)` — 기존 query 재사용
     - scope=ALL_DAY면 `timeSlotIds` 빈 배열 전달 (date 전체 슬롯으로 조회)
   - scope=TIME_SLOTS일 때만 상단 "선택한 시간대 N구간" 요약 아코디언 표시
   - "모든 클래스 선택" 전체 토글 체크박스
   - 개별 클래스 체크박스 + `confirmedReservationCount > 0`이면 "확정 예약 N건" 캡션
   - 하단 "예약 제한 적용하기" 버튼: 1개 이상 선택 시 활성화 → `useCreateReservationRestrictionsMutation` 호출

5. **API 함수 + mutation hook 추가**
   - `apps/web/src/entities/reservation/api.ts`에 `createReservationRestrictions(storeId, body)` 추가
   - `apps/web/src/entities/reservation/queries.ts`에 `useCreateReservationRestrictionsMutation(storeId)` 추가
   - `onSuccess`: `queryClient.invalidateQueries({ queryKey: PARTNER_CALENDAR_KEY })` + 토스트 표시 + 캘린더 복귀

6. **토스트 + 복귀**
   - 성공 시 `router.push('/partner/reservations')` + toast `"'M월 D일'에 예약 제한이 적용되었어요"`
   - 토스트 전달 방식: `useToast()` 훅 직접 호출 (페이지 이동 전 호출, 기존 manual-create 패턴 참고)

7. **shared contracts export 확인**
   - `packages/shared/src/contracts/timeslot.ts`의 `createReservationRestrictionsRequestSchema`, `CreateReservationRestrictionsRequest` 타입이 `@todam/shared` public export에 포함되어 있는지 확인. 미포함이면 `packages/shared/src/index.ts`에 추가.

## Out (단계별 완료물)

- API: 이미 구현됨 — `timeslot.controller.ts` 내 `GET time-slots`, `GET programs/reservation-counts`, `POST reservation-restrictions`
- UI (구현 완료, reviewer 검증 대기):
  - `apps/web/src/features/reservation/restriction/ui/RestrictionScopeBottomSheet.tsx` — 바텀시트 범위 선택 (종일/시간대, RadioInput, 다음 버튼 disabled 처리)
  - `apps/web/src/features/reservation/restriction/ui/RestrictionTimeSlotsClient.tsx` — 시간대 선택 (CheckboxInput 전체/개별, confirmedReservationCount 캡션, toKSTOffsetISO 변환)
  - `apps/web/src/features/reservation/restriction/ui/RestrictionProgramsClient.tsx` — 클래스 선택 (CheckboxInput 전체/개별, 시간대 요약 아코디언, POST mutation 호출, 토스트+복귀)
  - `apps/web/src/features/reservation/restriction/ui/RestrictionPageClient.tsx` — step 상태 머신 (scope→timeslots→programs, 바텀시트 open/close)
  - `apps/web/src/features/reservation/restriction/index.ts` — feature 공개 export
  - `apps/web/src/app/partner/reservations/restrict/page.tsx` — 라우트 page (client, useSearchParams date 수신)
- 연동 (구현 완료, reviewer 검증 대기):
  - `apps/web/src/entities/reservation/api.ts` — `createPartnerReservationRestrictions` 추가
  - `apps/web/src/entities/reservation/queries.ts` — `useCreatePartnerReservationRestrictionsMutation` 추가, `usePartnerProgramReservationCounts` `allowEmpty` 파라미터 추가 (ALL_DAY 경로 enabled 처리)
  - `apps/web/src/features/reservation/list/ui/ReservationCalendarView.tsx` — "예약 제한" 버튼 클릭 시 `?date=` 쿼리 포함 링크로 수정
- 핵심 결정:
  - UTC ISO → KST offset (`+09:00`) 변환은 `toKSTOffsetISO` 로컬 유틸 (getTime + 9h offset, shared 날짜 유틸에 KST offset 변환 없어서 직접 구현)
  - 확정 예약 캡션 색 `#1D5628` → `text-primary` 토큰 (deep-green-700과 동일)
  - `usePartnerProgramReservationCounts` `allowEmpty=true` 추가로 기존 호출부 영향 없이 ALL_DAY 경로 enabled
  - tsc --noEmit 통과, ESLint 통과

## Risks

- `timeRanges` 필드는 ISO 8601 offset 포함 문자열 — 클라이언트에서 `startAt`/`endAt`(UTC) → `+09:00` offset 변환 필요. `new Date(slot.startAt).toISOString()` 그대로 전송하면 contract 위반.
- `scope=ALL_DAY` 경로에서 `usePartnerProgramReservationCounts`에 빈 `timeSlotIds`를 전달하면 `enabled` 조건(`timeSlotIds.length > 0`)에 걸려 쿼리 비활성화됨 — 쿼리 enabled 조건을 scope별로 분기해야 함.
- 바텀시트 "뒤로가기" UX: 시간대 선택 화면에서 뒤로 가면 캘린더 + 바텀시트 재오픈이 필요한데, Next.js router.back()만으로는 바텀시트 상태 복원 안 됨 — 진입점 페이지(`page.tsx`)에서 바텀시트 오픈 상태를 URL searchParam(`?restrictSheet=open`)으로 관리하는 방안 검토 필요.

## Validation

- Tests: `RestrictionScopeBottomSheet` 라디오 선택 → 다음 버튼 활성화 단위 테스트; `RestrictionTimeSlotsClient` 전체 선택 토글 단위 테스트
- Manual checks:
  - 종일 경로: 바텀시트 → 클래스 선택 → 제출 → 캘린더 복귀 + 토스트 확인
  - 시간대 경로: 바텀시트 → 시간대 선택 → 클래스 선택 → 제출 → 캘린더 복귀 + 토스트 확인
  - 확정 예약 있는 슬롯/클래스에서 캡션 "확정 예약 N건" 노출 확인
  - `confirmedReservationCount = 0` 항목에서 캡션 미노출 확인
  - 아무것도 선택 안 한 상태에서 버튼 비활성화 확인
- Observability: POST 201 응답 확인, Network 탭에서 `timeRanges` offset 형식 검증

## Decision Log

- 2026-06-08: BE API 이미 구현되어 있으므로 이번 작업은 FE UI 구현 + API 연동만 진행.
- 2026-06-08: entity api/query(`getPartnerTimeSlotsByDate`, `getPartnerProgramReservationCounts`)는 이미 존재하므로 재사용. `createReservationRestrictions`만 신규 추가.
- 2026-06-08: feature 레이어 위치 `apps/web/src/features/reservation/restriction/ui/` — 메모리 규칙(app 라우트엔 page만, 컴포넌트는 features/ 하위) 준수.

## Outcome

- Status: 완료 (reviewer drift 0, 3단계 ✅ — 2026-06-08)
- 구현 산출물:
  - FE: `features/reservation/restriction/ui/` (PageClient step 머신 + 재진입 pre-fill 시드 + 해제, Scope/TimeSlots/Programs 3화면)
  - 연동: entity `createPartnerReservationRestrictions`/`deletePartnerReservationRestrictions` + mutation, `usePartnerProgramReservationCounts` allowEmpty
  - 클래스 목록 소스 = `usePartnerStorePrograms`(ACTIVE), reservation-counts 는 카운트 캡션 Map
  - `toKSTOffsetISO` shared 승격, 캘린더 "예약 제한" `?date=` 연결
- Follow-up:
  - 재진입 scope 추정: 전용 GET 제한 엔드포인트 없어 time-slots(restrictedProgramIds)로 복원, prefill 은 항상 TIME_SLOTS 흐름으로 단순화
  - 해제(DELETE) per-call onError 는 언마운트 후 미실행 가능 — 필요 시 mutation-level 처리 검토
