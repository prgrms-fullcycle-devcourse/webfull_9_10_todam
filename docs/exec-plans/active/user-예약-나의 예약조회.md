# Feature Plan: 나의 예약 목록 조회 (user / reservation)

## Summary

- Goal: 인증된 User가 본인의 예약 목록을 상태별 필터 + 커서 기반 무한 스크롤로 조회. 각 항목에 서버 계산 `displayState`(상태 문구) 포함, 빈 상태 화면 처리, 예약 상세로 이동.
- Owner: (BE 미정 / FE: yundlab 착수 가능 — 디자인 확보)
- Date: 2026-06-01 (갱신: Figma 카드/배지/빈상태 토큰 반영)

## Context

<!-- 정본은 메인이 붙여넣은 Notion DB 발췌. apispec.md는 로컬 미러. -->

- 요구사항명세서(고정): docs/requirements.md (`예약 reservation` 섹션, 특히 `1. displayState 계산 규칙`, `2. 예약 상태`)
- 기능명세: "나의 예약 목록 조회" (Notion 기능명세 DB — 메인이 정본 발췌 제공)
- API명세: GET /reservations/me (Notion API명세 DB — 메인이 정본 발췌 제공)
- 로컬 미러: docs/api/apispec.md L5138~5242 (`## /reservations/me`)
- Relevant design docs: Figma 노드 `8505:15761` (리스트), `8505:15771` (빈 상태). 카드 컴포넌트 `ReservationCardItem` (key `e77c824697affa9471b2432e23befb87682191f9`) + 배지 컴포넌트 `status=Default` (key `de3a3fad902ab01e8792a7fead06e590c732b07b`). 토큰 상세는 아래 "Design tokens" 섹션.
- 접근주체/가드: `User` 이상 (`@UseGuards(AuthGuard)`). 본인(`userId`) 예약만 조회. 삭제/권한없음 예약 제외.

### Drift 점검 (Notion 정본 ↔ apispec.md 미러)

- **Drift 없음.** docs/api/apispec.md L5138~5242의 query params / 200 응답 data 스키마 / displayState 구조 / nextCursor·hasMore / 401·500 에러가 메인이 붙여넣은 Notion 정본과 완전 일치한다.
- 미러가 향후 Notion과 갈라지면 이 plan의 API Contract 스냅샷(정본 기준)을 우선한다.

## API Contract (스냅샷)

<!-- 정본(Notion) 기준 고정. BE/FE/reviewer가 바인딩하는 SSOT. -->

### 데이터모델 (apps/api/prisma/schema.prisma 스냅샷)

`Reservation` (model `reservations`):

| 필드 | 타입 | 비고 |
|---|---|---|
| id | String @id uuid | 응답 `id` 및 cursor 기준 |
| userId | String? uuid | null은 source=PARTNER_MANUAL(비회원 현장)만. /me 조회는 `userId = 인증사용자`로 필터 |
| programId | String uuid | → Program |
| storeId | String uuid | → Store (응답 `storeName`) |
| programTimeSlotId | String uuid | → ProgramTimeSlot |
| programSnapshotId | String uuid | → ProgramSnapshot (가격/정원/리드타임 스냅샷) |
| scheduledAt | DateTime tz | 응답 `scheduledAt` |
| reserverName | String | 예약자명 (응답 미노출) |
| reserverPhone | String | (응답 미노출) |
| participantCount | Int @default(1) | 응답 `participantCount` |
| deliveryMethod | ReservationDeliveryMethod | DELIVERY \| PICKUP |
| status | ReservationStatus @default(PENDING) | 응답 `status` + displayState 산출 입력 |
| requestMemo / internalMemo | String? | (응답 미노출) |
| source | ReservationSource | CUSTOMER \| PARTNER_MANUAL |
| canceledBy / cancelReason / canceledAt | String?/String?/DateTime? | 취소 메타 |
| createdAt | DateTime @default(now()) | 응답 `createdAt` + 최신순 정렬 기준(후술) |
| updatedAt | DateTime @updatedAt | |

연관:
- `program  Program` — 응답 `programTitle` ← `Program.title`
- `store    Store` — 응답 `storeName` ← `Store.name`
- `programTimeSlot ProgramTimeSlot` — 슬롯 시각
- `programSnapshot ProgramSnapshot`
- `user     User?` (relation "ReservationUser")
- `artwork  Artwork?` — `displayState`가 IN_PROGRESS 구간에서 `Artwork.status` 참조 (요구사항 displayState 계산 규칙). **/me 응답 스키마에는 artwork 필드 자체는 없으나 displayState 계산에 필요 → include 필요**
- `delivery Delivery?` — 작품 수령(배송/픽업) 메타. 기능명세의 "작품 수령 방식 표시(배송중/픽업대기/픽업완료)"는 `Reservation.status`(SHIPPED/DELIVERED/PICKUP_READY/PICKUP_DONE) + `deliveryMethod`로 표현됨 → displayState로 흡수. **단, /me 응답 data 항목에는 deliveryMethod 필드가 없음 → Open decision 참고**

`enum ReservationStatus` (정본 8개):
`PENDING`, `CONFIRMED`, `CANCELED`, `IN_PROGRESS`, `SHIPPED`, `DELIVERED`, `PICKUP_READY`, `PICKUP_DONE`
(packages/shared/src/enums/reservation-status.ts 와 일치 확인됨)

`enum ReservationDeliveryMethod`: `DELIVERY`, `PICKUP`
`enum ReservationSource`: `CUSTOMER`, `PARTNER_MANUAL`
`enum ArtworkStatus` (displayState 보조): `RESERVED`, `VISITED`, `DRYING`, `BISQUE_FIRING`, `GLAZING`, `GLAZE_FIRING`, `COMPLETED`, `CANCELED`

연관 모델 핵심: `Store.name`, `Program.title`. `Artwork.status`(IN_PROGRESS 구간 문구용).

### 엔드포인트

`GET /reservations/me` — 인증 사용자(Authorization: Bearer {accessToken}) 본인 예약 목록.

Query Parameters:
- `status` (선택): `ReservationStatus` 필터 (예 `IN_PROGRESS`)
- `cursor` (선택): 이전 응답 `nextCursor`. 첫 요청 시 생략
- `limit` (선택, 기본값 **10**): 한 번에 가져올 항목 수
  - 주의: packages/shared `DEFAULT_PAGE_SIZE=20`과 다름. 이 엔드포인트 기본값은 정본대로 **10** (Open decision: 공통 상수 사용 여부)

응답 200 OK — 공통 봉투 `{ statusCode, timestamp, path, message, data, error }`:
```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:40:00.000Z",
  "path": "/reservations/me",
  "message": "예약 목록이 성공적으로 조회되었습니다.",
  "data": {
    "reservations": [
      {
        "id": "res-uuid-001",
        "storeName": "토담 공방",
        "programTitle": "물레 체험 기초반",
        "scheduledAt": "2026-06-01T10:00:00.000Z",
        "participantCount": 2,
        "status": "IN_PROGRESS",
        "displayState": {
          "label": "제작 중",
          "description": "작품이 단단해지도록 정성껏 말리고 있어요.",
          "subLabel": "건조"
        },
        "createdAt": "2026-05-25T19:35:00.000Z"
      }
    ],
    "nextCursor": "res-uuid-002",
    "hasMore": true
  },
  "error": null
}
```

`reservations[]` 항목 스키마(고정):
- `id: string(uuid)`
- `storeName: string`
- `programTitle: string`
- `scheduledAt: string(ISO8601)`
- `participantCount: number`
- `status: ReservationStatus`
- `displayState: { label: string; description: string; subLabel: string | null }`
- `createdAt: string(ISO8601)`

페이지네이션:
- `nextCursor: string | null` — 다음 페이지 시작 기준이 되는 예약 id (마지막 항목 기준). 더 없으면 null
- `hasMore: boolean`

에러:
- `401 UNAUTHORIZED` — message "인증이 필요합니다.", error "UNAUTHORIZED"
- `500 INTERNAL_SERVER_ERROR` — message "예약 목록 조회 중 서버 오류가 발생했습니다.", error "INTERNAL_SERVER_ERROR"

### displayState 계산 규칙 (docs/requirements.md `예약 1.` 기준)

서버가 `Reservation.status`(+ IN_PROGRESS면 `Artwork.status`)로 **파생** 계산. FE는 그대로 렌더링.
- 우선순위 1: `Reservation.status != IN_PROGRESS` → Reservation 상태 테이블 문구 사용
- 우선순위 2: `Reservation.status == IN_PROGRESS` → `Artwork.status` 기준 작품 상태 테이블 문구 사용
- `subLabel`은 IN_PROGRESS 구간에서만 존재, 그 외 구간은 `null`

**알려진 매핑 (정본 예시):**
- `IN_PROGRESS` + `Artwork.status = DRYING` → `{ label: "제작 중", description: "작품이 단단해지도록 정성껏 말리고 있어요.", subLabel: "건조" }`

**미정 매핑 → Open decisions.** Reservation 상태 7종(PENDING/CONFIRMED/CANCELED/SHIPPED/DELIVERED/PICKUP_READY/PICKUP_DONE)별 label/description, IN_PROGRESS의 나머지 Artwork 상태(RESERVED/VISITED/BISQUE_FIRING/GLAZING/GLAZE_FIRING/COMPLETED)별 label/description/subLabel 전체 문구 테이블이 명세에 없음. 추측 금지.

### 커서 페이지네이션 방식 (고정)

- 정렬: 최신순. cursor 기준은 예약 `id`(정본 응답의 nextCursor가 `res-uuid-002` = id). createdAt 동률 시 안정성을 위한 정렬 키 보정은 Open decision.
- cursor 없으면 최신부터, 있으면 그 이후.
- `status` 필터 적용 후 `limit + 1`개 조회 → 마지막 1개 존재 여부로 `hasMore` 판정.
- 응답에 `limit`개 반환, `nextCursor = limit번째 항목의 id`(hasMore=true일 때), 아니면 null.

## Design tokens (Figma 8505:15761 list / 8505:15771 empty — 2026-06-01)

전부 Pretendard. 색상은 Figma raw hex; DESIGN.md 토큰과 매핑 시 확인.

### 컨테이너
- Frame: `360 x 752`, padding `(top 0, right 16, bottom 64, left 16)`
- 리스트 내부 `Frame 1321318846`: width 328, padding `(8 0 8 0)`, 카드 간 gap **10**, vertical

### Card (`ReservationCardItem`, key `e77c824697affa9471b2432e23befb87682191f9`)
- 328 x 142 (status message 있을 때) / 98 (없을 때)
- bg `#FFFFFF`, border `#E2E4E7` 1px, radius **16**, padding **16**, vertical gap **12**, items align MIN
- **행 1** (HORIZONTAL, SPACE_BETWEEN):
  - 좌: date(SemiBold 16/20 `#191E25`) + day(Regular 16/20 `#7D838D`), gap 4 (예 `"4.18"` + `"토"`)
  - 우: Badge (아래 표 참고)
- **행 2** (VERTICAL, gap 4):
  - className: Pretendard SemiBold 14/18 `#191E25` (예 `"머그컵 만들기"`) — = `programTitle`
  - meta line(HORIZONTAL, gap 0): Pretendard Regular 12/16 `#7D838D` — `"{category}・{storeName}・{hh:mm}"`
- **행 3** (옵션, status message): bg `#F1F2F4`, radius **8**, h **32**, padding `(0 12 0 12)`, items CENTER
  - text: Pretendard SemiBold 12/16 `#434A54`
  - visibility: `DELIVERED`/`PICKUP_DONE` 등 종료 상태에서 숨김 (Figma 4번째 카드 `visible:false`)

### Badge (`status=Default`, key `de3a3fad902ab01e8792a7fead06e590c732b07b`)
- pill radius **999**, padding `(0 8 0 8)`, items CENTER, gap 4
- icon 12x12 + text Pretendard Medium 10/15

| Reservation status | label | bg | fg(text+icon) | icon | status message 표시 |
|---|---|---|---|---|---|
| `PENDING` | 예약신청 | `#D8EDD9` | `#0D2A14` | `clock` | 있음 (예: "작가님이 예약 내용을 확인하고 있어요.") |
| `IN_PROGRESS` | 제작중 | `#CCDFF6` | `#0A3A63` | `3d` | 있음 (= displayState.description, subLabel은 Artwork.status 따라) |
| `SHIPPED` | 배송중 | `#F3E7C8` | `#6B4C07` | `delivery` | 있음 (예: "소중한 작품을 꼼꼼히 포장해서 보냈어요.") |
| `DELIVERED` (또는 `PICKUP_DONE`) | 작품 도착 | `#F1F2F4` | `#434A54` | `box` | **숨김** |

미정 상태(`CONFIRMED`, `CANCELED`, `PICKUP_READY`, `PICKUP_DONE` 단독) badge 토큰은 디자인 추가 대기 — Open decision 5 참조. FE는 fallback default 배지로 임시 렌더 후 디자인 확정 시 매핑 추가.

### Empty state (`8505:15771`)
- Container: `360 x 752`, padding `(0 16 64 16)`
- 본문 frame: width 168, gap 10, vertical center
- text: `"아직 예약 내역이 없습니다."` — Pretendard SemiBold 16/20 `#191E25`
- 공용 컴포넌트 `apps/web/src/shared/ui/EmptyState.tsx` 사용 (PR #45로 머지됨, 동일 시각 패턴 가정)

### displayState.description 정본 샘플 (BE 매퍼 입력)
- `PENDING` → "작가님이 예약 내용을 확인하고 있어요."
- `IN_PROGRESS` + `Artwork.status = DRYING` → label "제작 중", description "작품이 단단해지도록 정성껏 말리고 있어요.", subLabel "건조"
- `IN_PROGRESS` + (유약 substate) → "매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요." (subLabel은 아직 확정 표기 없음 — Open decision 1 잔여)
- `SHIPPED` → "소중한 작품을 꼼꼼히 포장해서 보냈어요."
- `DELIVERED` → 메시지 없음 (UI 숨김)

## Scope

- In:
  - BE: `GET /reservations/me` (AuthGuard, 본인 userId 필터, status 필터, cursor 페이지네이션 limit+1, displayState 계산, 공통 봉투 응답, 401/500)
  - shared: 응답 타입 + zod 스키마(reservations item, displayState, 커서 페이지네이션 공통 타입), `limit` 기본값 상수
  - FE: `apps/web/src/app/(user)/my/reservations/page.tsx` 예약 목록 화면 — 카드 리스트, 상태/displayState 메시지, 무한 스크롤(cursor), 빈 상태 화면, 예약 상세(`/my/reservations/[id]`)로 이동
- Out:
  - 예약 상세 조회 API/화면 (`GET /reservations/{id}`는 별도 기능)
  - 예약 생성/취소/리뷰 등 다른 reservation 엔드포인트
  - 파트너용 예약 목록(`/partner/...`)
  - 작품 제작 단계 상세
  - BlockedSlot 관련 로직

## Plan

1. (shared) `packages/shared`에 예약 목록 응답 contract 추가: `ReservationListItem`, `DisplayState`, 커서 페이지네이션 공통 타입(`CursorPage<T>` = `{ items/reservations, nextCursor, hasMore }`) + zod 스키마, `/me` limit 기본값(10) 상수. ReservationStatus enum 재사용.
2. (BE) reservation 모듈 스캐폴드(현재 `apps/api/src/`에 소스 없음 — 신규). controller `GET /reservations/me` + AuthGuard, query DTO(status/cursor/limit), service: 본인 userId 필터 + status + cursor(limit+1) 조회, Prisma include(store.name, program.title, artwork.status), displayState 계산기, 공통 봉투/예외 필터로 401·500.
3. (BE) displayState 매퍼 구현 — **단, 전체 문구 테이블이 Open decision 해소된 후 확정**. 미해소 구간은 임시 처리 금지(부정확 데이터 방지) → 결정 대기.
4. (FE) `page.tsx` 구현: API 연동 훅(react-query infinite + cursor), 예약 카드(storeName/programTitle/scheduledAt/participantCount/status/displayState), 무한 스크롤, 빈 상태 화면, 상세 이동, 네트워크 오류 처리. UI: DESIGN.md 준수.
5. 연동 검증: 인증 토큰 흐름, status 필터, 커서 페이징, 빈 목록, 401(미로그인) 동작 확인.

## Status

<!-- 게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능. 구현 전이므로 전부 미체크. -->

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

## Out (단계별 완료물)

- API: <!-- 구현된 엔드포인트, 파일 -->
- UI: <!-- 구현된 화면, 컴포넌트 -->
- 연동: <!-- 연결 지점, 검증 결과 -->

## Risks

- displayState 전체 문구 테이블 중 **4 status는 디자인으로 label/배지 확정**, 나머지 4 status + Artwork 전체 substate description/subLabel 미정 → BE 매퍼 부분 확정. 임의 작성 시 고객 노출 문구 오류 위험 (Open decisions 1).
- `/me` limit 기본값(10) vs `packages/shared` `DEFAULT_PAGE_SIZE`(20) 불일치 → 공통 상수 오용 위험.
- 정본 응답 data 항목에 `deliveryMethod`/`displayState 외 수령 메타`가 없어, 기능명세의 "작품 수령 방식(배송중/픽업대기/픽업완료) 표시"를 displayState만으로 충분히 표현 가능한지 미확정(Open decisions 3).
- `apps/api`에 NestJS 소스가 아직 없음 → reservation 모듈이 첫 모듈일 수 있어 공통 봉투/AuthGuard/예외 필터 인프라 선행 필요 여부 확인.

## Validation

- Tests: BE service 단위(본인 필터/ status 필터/ cursor limit+1/ hasMore·nextCursor 산출/ displayState 분기), controller 401. shared zod 스키마 파싱 테스트.
- Manual checks: 로그인 후 예약 탭 진입 시 목록·정렬·무한스크롤·빈 상태, status 필터, 미로그인 401.
- Observability: 서버 500 로깅(예약 목록 조회 실패).

## Decision Log

- 2026-06-01: apispec.md 미러(L5138~5242)와 Notion 정본 일치 확인 — drift 없음. 정본 기준으로 Contract 고정.
- 2026-06-01: ReservationStatus enum 정본 8값 = prisma schema = packages/shared enum 일치 확인.
- 2026-06-01 (갱신): Figma 노드 `8505:15761`(리스트) / `8505:15771`(빈 상태) 토큰 추출 — 카드 컨테이너 + Badge 4 status(PENDING/IN_PROGRESS/SHIPPED/DELIVERED) + 빈 상태 카피 확정. Open decision 5 해소, Open decision 1은 부분 해소(잔여 4 status + Artwork substate 문구).

## Outcome

- Status: planned (BE 미착수 / FE 착수 가능)
- Follow-up: **FE는 즉시 `/impl fe` 가능** (mock + 고정 contract + 디자인 토큰). BE는 reservation 모듈 신규 + displayState 매퍼(잔여 매핑 결정 후 완성). 연동은 BE 라이브 후.

---

## Open decisions (사람 결정 필요 — 추측 금지)

1. **displayState 전체 문구 테이블.** 2026-06-01 Figma 반영으로 4건은 디자인에서 확정. **나머지가 BE 매퍼 구현 블로커**:
   - ✅ 확정(label만 + status message): `PENDING`("예약신청"), `IN_PROGRESS`("제작중"), `SHIPPED`("배송중"), `DELIVERED`/`PICKUP_DONE`("작품 도착") — 위 Design tokens 표 참조. description은 일부 정본 샘플로 확정, 나머지는 미정.
   - ❓ 미정: `CONFIRMED`, `CANCELED`, `PICKUP_READY` 의 label/배지 색·아이콘 — 디자인 추가 대기. (`PICKUP_DONE` 단독 표기가 `DELIVERED`와 다른지도 확인 필요)
   - ❓ description/subLabel 전체 문구: Reservation 상태별 status message 정본 텍스트(현재 PENDING·SHIPPED·IN_PROGRESS 일부만 샘플 확보), IN_PROGRESS 구간 Artwork 상태별(`RESERVED`/`VISITED`/`DRYING`/`BISQUE_FIRING`/`GLAZING`/`GLAZE_FIRING`/`COMPLETED`) label·description·subLabel 전체 문구 테이블 — 미정.
   - BE는 미정 구간 진입 전까지 임시 문구 금지(부정확 데이터 방지). FE는 확정된 4건 + fallback default 배지로 진행 가능.
2. **cursor 정렬 안정성.** nextCursor가 예약 `id`(정본 `res-uuid-002`)인데 "최신순 정렬" 기준이 `createdAt`인지 `id`인지, createdAt 동률 시 tie-break 키. id가 uuid라 시간순 정렬 키로 부적합할 수 있음.
3. **수령 방식 표시 데이터.** 기능명세는 "배송중/픽업대기/픽업완료" 표시를 요구하나 /me 응답 항목에 `deliveryMethod`/배송 메타 필드가 없음. displayState로 충분한지, 아니면 응답에 `deliveryMethod` 추가가 필요한지(= contract 변경) 결정 필요.
4. **limit 기본값/상한.** `/me` 기본 10 (정본). `packages/shared` `DEFAULT_PAGE_SIZE=20`/`MAX_PAGE_SIZE=100`와 충돌 — `/me` 전용 상수로 둘지, limit 상한을 둘지 결정.
5. ~~**UI 작업 시작 조건(DESIGN.md).**~~ → **해소(2026-06-01)**: Figma 노드 `8505:15761`/`8505:15771`로 카드 컨테이너 토큰(radius·padding·gap·typography), 빈 상태 카피, **4개 상태**(PENDING/IN_PROGRESS/SHIPPED/DELIVERED) 배지 토큰 확보. FE 착수 가능. **잔여**: 나머지 4 status(CONFIRMED/CANCELED/PICKUP_READY/PICKUP_DONE 단독) 배지 디자인 — 추가 디자인 대기.
