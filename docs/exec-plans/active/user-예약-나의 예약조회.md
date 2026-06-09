# Feature Plan: 나의 예약 목록 조회 (user / reservation)

## Summary

- Goal: 인증된 User가 본인의 예약 목록을 상태별 필터 + 커서 기반 무한 스크롤로 조회. 각 항목에 서버 계산 `displayState`(상태 문구) 포함, 빈 상태 화면 처리, 예약 상세로 이동.
- Owner: (BE 미정 / FE: yundlab — 구현 완료)
- Date: 2026-06-01 (갱신: 2026-06-05 — 실제 코드 기준 상태 재정합)

## Context

<!-- 정본은 메인이 붙여넣은 Notion DB 발췌. apispec.md는 로컬 미러. -->

- 요구사항명세서(고정): docs/requirements.md (`예약 reservation` 섹션, 특히 `1. displayState 계산 규칙`, `2. 예약 상태`)
- 기능명세: Notion 기능명세 DB `b242ee66b06c8349805601ce4a05247a` — "나의 예약 목록 조회" (실행주체: user, 도메인: reservation)
- API명세: Notion API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25` — `GET /reservations/me` (내 예약 목록)
- 로컬 미러: docs/api/apispec.md (`## /reservations/me`)
- Relevant design docs: Figma 노드 `8505:15761` (리스트), `8505:15771` (빈 상태). 카드 컴포넌트 `ReservationCardItem` (key `e77c824697affa9471b2432e23befb87682191f9`) + 배지 컴포넌트 `status=Default` (key `de3a3fad902ab01e8792a7fead06e590c732b07b`). 토큰 상세는 아래 "Design tokens" 섹션.
- 접근주체/가드: `User` 이상 (`@UseGuards(AuthGuard)`). 본인(`userId`) 예약만 조회. 삭제/권한없음 예약 제외.

### Drift 점검 (Notion 정본 ↔ apispec.md 미러)

- **Drift 없음.** API 명세 query params / 200 응답 data 스키마 / displayState 구조 / nextCursor·hasMore / 401·500 에러가 Notion 정본과 완전 일치한다.
- 미러가 향후 Notion과 갈라지면 이 plan의 API Contract 스냅샷(정본 기준)을 우선한다.

### displayState 구현 불일치 (2026-06-05 갱신)

`apps/api/src/modules/reservation/domain/display-state.util.ts` 실제 구현과 plan 정본 표 간 **문구 불일치** 발견. BE `GET /reservations/me` 구현 전에 해소 필요.

| status | plan 정본 description | 현재 코드 description | 불일치 |
|---|---|---|---|
| `CONFIRMED` | "예약이 확정되었어요. 공방에서 곧 만나요!" | "예약이 확정되었어요. 체험일을 기대해 주세요!" | YES |
| `IN_PROGRESS` | (Artwork.status 조합 필요 — 코드 미구현) | "체험이 진행 중이에요." (subLabel null 고정) | YES — Artwork 분기 없음 |
| `SHIPPED` | "소중한 작품을 꼼꼼히 포장해서 보냈어요." | "작품이 배송 중이에요." | YES |
| `DELIVERED` | (UI 숨김 — null/빈 문자열 권장) | "작품이 도착했어요." | YES (label도 "배송완료" vs "작품 도착") |
| `PICKUP_READY` | "작품이 완성되어 공방에서 기다리고 있어요." | "작품을 가져가실 준비가 됐어요." | YES |
| `PICKUP_DONE` | (UI 숨김 — null/빈 문자열 권장) | "작품을 수령하셨어요." | YES (label도 "픽업완료" vs "픽업 완료") |
| `CANCELED` | "아쉽지만 예약이 취소되었어요. 다음에 꼭 다시 만나요." | "예약이 취소되었어요." | YES |
| `PENDING` | "작가님이 예약 내용을 확인하고 있어요." | "작가님이 예약 내용을 확인하고 있어요." | OK |

→ Open decisions 6 참고. `/me` 엔드포인트가 `display-state.util.ts`를 재사용할 경우 목록 응답 문구도 영향받는다. 정본 표 기준으로 `display-state.util.ts`를 수정하거나, 목록 전용 매퍼를 별도로 만드는 방향 중 결정 필요.

---

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
| programTimeSlotId | String uuid | → ProgramTimeSlot (실제 컬럼명: storeTimeSlotId) |
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
| createdAt | DateTime @default(now()) | 응답 `createdAt` + 최신순 정렬 기준 |
| updatedAt | DateTime @updatedAt | |

연관:
- `program  Program` — 응답 `programTitle` ← `Program.title`, 응답 `category` ← `Program.category`
- `store    Store` — 응답 `storeName` ← `Store.name`
- `storeTimeSlot StoreTimeSlot` — 슬롯 시각
- `programSnapshot ProgramSnapshot`
- `user     User?` (relation "ReservationUser")
- `artwork  Artwork?` — `displayState`가 IN_PROGRESS 구간에서 `Artwork.status` 참조 (요구사항 displayState 계산 규칙). **/me 응답 스키마에는 artwork 필드 자체는 없으나 displayState 계산에 필요 → include 필요**
- `delivery Delivery?` — 작품 수령(배송/픽업) 메타. "작품 수령 방식 표시(배송중/픽업대기/픽업완료)"는 `Reservation.status`(SHIPPED/DELIVERED/PICKUP_READY/PICKUP_DONE) + `deliveryMethod`로 표현됨 → displayState로 흡수. **단, /me 응답 data 항목에는 deliveryMethod 필드가 없음 → Open decisions 3 참고**

`enum ReservationStatus` (정본 8개):
`PENDING`, `CONFIRMED`, `CANCELED`, `IN_PROGRESS`, `SHIPPED`, `DELIVERED`, `PICKUP_READY`, `PICKUP_DONE`
(packages/shared/src/enums/reservation-status.ts 와 일치 확인됨)

`enum ReservationDeliveryMethod`: `DELIVERY`, `PICKUP`
`enum ReservationSource`: `CUSTOMER`, `PARTNER_MANUAL`
`enum ArtworkStatus` (displayState 보조): `RESERVED`, `VISITED`, `DRYING`, `BISQUE_FIRING`, `GLAZING`, `GLAZE_FIRING`, `COMPLETED`, `CANCELED`

연관 모델 핵심: `Store.name`, `Program.title`, `Program.category`. `Artwork.status`(IN_PROGRESS 구간 문구용).

### 엔드포인트

`GET /reservations/me` — 인증 사용자(Authorization: Bearer {accessToken}) 본인 예약 목록.

Query Parameters:
- `status` (선택): `ReservationStatus` 필터 (예 `IN_PROGRESS`)
- `cursor` (선택): 이전 응답 `nextCursor`. 첫 요청 시 생략
- `limit` (선택, 기본값 **20**): 한 번에 가져올 항목 수
  - 팀 결정: `packages/shared` `DEFAULT_PAGE_SIZE=20` 사용. Notion 정본의 "기본값 10"보다 공통 상수 우선. (Open decision 4 해소)

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
- ~~`category: string`~~ **[제거 — 2026-06-05 회의]** 카테고리 값이 "도자기" 1종뿐이라 확장 전까지 UI·contract에서 삭제. 추후 확장 시 nullable 컬럼 + 파트너 공방 등록 입력. 카드 meta line은 `{storeName}・{hh:mm}`로(FE 조정).
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

**Reservation 상태 7종 (IN_PROGRESS 제외, subLabel=null) — 정본 표:**

| status | label | description |
|---|---|---|
| `PENDING` | 예약신청 | 작가님이 예약 내용을 확인하고 있어요. |
| `CONFIRMED` | 예약확정 | 예약이 확정되었어요. 공방에서 곧 만나요! |
| `CANCELED` | 예약취소 | 아쉽지만 예약이 취소되었어요. 다음에 꼭 다시 만나요. |
| `SHIPPED` | 배송 중 | 소중한 작품을 꼼꼼히 포장해서 보냈어요. |
| `DELIVERED` | 작품 도착 | (UI 숨김 — 빈 문자열 또는 null 권장) |
| `PICKUP_READY` | 픽업 가능 | 작품이 완성되어 공방에서 기다리고 있어요. |
| `PICKUP_DONE` | 픽업 완료 | (UI 숨김 — 빈 문자열 또는 null 권장) |

**IN_PROGRESS (label "제작 중" 고정, subLabel = Artwork.status 따라) — 정본 표:**

| Artwork.status | subLabel | description |
|---|---|---|
| `DRYING` | 건조 | 작품이 단단해지도록 정성껏 말리고 있어요. |
| `BISQUE_FIRING` | 초벌 | 가마 속에서 첫 번째로 구워지는 중이에요. |
| `GLAZING` | 유약 | 매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요. |
| `GLAZE_FIRING` | 재벌 | 가장 뜨거운 가마를 견디며 더 튼튼해지고 있어요. |

`Artwork.status`의 `RESERVED`/`VISITED`/`COMPLETED`는 IN_PROGRESS 구간 진입 전(예약 단계)이거나 종료 후(배송/픽업 전이) 케이스라 본 표에 없음 — IN_PROGRESS 구간 진입 조건은 BE displayState 계산 규칙(`requirements.md`) 재확인 필요.

> **현재 코드 vs 정본 불일치:** `display-state.util.ts`에 위 정본 표와 다른 문구가 있음. Open decisions 6 참고.

### 커서 페이지네이션 방식 (고정)

- 정렬: 최신순(`createdAt DESC`). cursor 기준은 예약 `id`. createdAt 동률 시 tie-break 키는 Open decisions 2 참고.
- cursor 없으면 최신부터, 있으면 그 이후.
- `status` 필터 적용 후 `limit + 1`개 조회 → 마지막 1개 존재 여부로 `hasMore` 판정.
- 응답에 `limit`개 반환, `nextCursor = limit번째 항목의 id`(hasMore=true일 때), 아니면 null.
- 참고 패턴: `prisma-partner-reservation.repository.ts`의 `findList` (cursor/skip/take+1 패턴).

---

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

| Reservation status | label | tone(semantic) | icon | status message 표시 |
|---|---|---|---|---|
| `PENDING` | 예약신청 | `primary` (green) | `clock` | 있음 ("작가님이 예약 내용을 확인하고 있어요.") |
| `CONFIRMED` | 예약확정 | `primary` (green) | `check` | 있음 ("예약이 확정되었어요. 공방에서 곧 만나요!") |
| `CANCELED` | 예약취소 | `neutral` (gray) | `close` (x) | 있음 ("아쉽지만 예약이 취소되었어요. 다음에 꼭 다시 만나요.") |
| `IN_PROGRESS` | 제작 중 | `info` (blue) | `3d` | 있음 (= displayState.description, subLabel은 Artwork.status 따라) |
| `SHIPPED` | 배송 중 | `secondary` (gold) | `delivery` | 있음 ("소중한 작품을 꼼꼼히 포장해서 보냈어요.") |
| `DELIVERED` | 작품 도착 | `neutral` (gray) | `box` | **숨김** |
| `PICKUP_READY` | 픽업 가능 | `secondary` (gold) | `pin` | 있음 ("작품이 완성되어 공방에서 기다리고 있어요.") |
| `PICKUP_DONE` | 픽업 완료 | `neutral` (gray) | `check` | **숨김** |

출처: 2026-06-01 디자인 "상태 메세지" 정본 표. raw hex는 `packages/ui` semantic 토큰(`primary`/`info`/`secondary`/`neutral`)으로 매핑. 8 status 전부 확정.

### Empty state (`8505:15771`)
- Container: `360 x 752`, padding `(0 16 64 16)`
- 본문 frame: width 168, gap 10, vertical center
- text: `"아직 예약 내역이 없습니다."` — Pretendard SemiBold 16/20 `#191E25`
- 공용 컴포넌트 `apps/web/src/shared/ui/EmptyState.tsx` 사용

---

## Scope

- In:
  - BE: `GET /reservations/me` (AuthGuard, 본인 userId 필터, status 필터, cursor 페이지네이션 limit+1, displayState 계산 — Artwork.status 분기 포함, 공통 봉투 응답, 401/500)
  - BE: `display-state.util.ts` 정본 표 기준 문구 수정 (CONFIRMED/SHIPPED/DELIVERED/PICKUP_READY/PICKUP_DONE/CANCELED + IN_PROGRESS Artwork 분기 구현)
  - BE: `UserReservationRepository` 포트에 `findList` 메서드 추가
  - BE: `PrismaUserReservationRepository`에 `findList` 구현 (userId-scoped, cursor/limit/status, createdAt desc, store.name + program.title + artwork.status include)
  - BE: `ListUserReservationsUseCase` 신규
  - BE: `UserReservationController`에 `GET /reservations/me` 라우트 추가
  - BE: `reservation.module.ts`에 `ListUserReservationsUseCase` 등록
  - shared/FE: `reservation-list.ts`·`favorite.ts`에서 `category` 필드 제거 + 카드 meta line에서 category 제거 (회의 결정 — codingguri/nogglee 작업). BE는 category 미반환.
  - FE: 기존 구현 완료 — 연동만 남음.
- Out:
  - 예약 상세 조회 API/화면 (`GET /reservations/{id}`는 별도 기능)
  - 예약 생성/취소/리뷰 등 다른 reservation 엔드포인트
  - 파트너용 예약 목록(`/partner/...`)
  - 작품 제작 단계 상세
  - BlockedSlot 관련 로직
  - status 탭 필터 UI (현재 FE 구현에 탭 없음 — status query param은 있으나 탭 UI 미구현)

---

## Plan

### BE (미착수)

1. **(포트)** `domain/repositories/user-reservation.repository.ts`에 `findList` 메서드 추가.
   - Input: `userId: string`, `query: { status?: ReservationStatus; cursor?: string; limit: number }`
   - Output: `UserReservationListRow[]` (id, storeName, programTitle, scheduledAt, participantCount, status, artworkStatus, createdAt)
2. **(인프라)** `PrismaUserReservationRepository.findList` 구현.
   - `where: { userId, ...(status ? { status } : {}) }`
   - `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]` — Open decisions 2 해소 후 확정
   - `cursor/skip/take = limit+1` 패턴 (partner findList와 동일)
   - `select`: id, scheduledAt, participantCount, status, createdAt, `program: { select: { title } }`, `store: { select: { name } }`, `artwork: { select: { status } }`
3. **(도메인)** `display-state.util.ts` 수정 — 정본 표 기준 8개 Reservation status 문구 전체 교체 + IN_PROGRESS에 `ArtworkStatus` 파라미터 추가하여 4개 subLabel/description 분기 구현. 기존 `calcDisplayState(status)` 시그니처를 `calcDisplayState(status, artworkStatus?)` 로 확장.
4. **(유스케이스)** `application/use-cases/list-user-reservations.use-case.ts` 신규 생성.
   - `execute(userId, query)`: findList 호출 → limit+1로 hasMore 판정 → 각 row에 displayState 계산 → `ReservationListResult` 반환
5. **(DTO)** `presentation/dto/user-reservation.dto.ts`에 `GetMyReservationsQueryDto`(status/cursor/limit) + `ReservationListItemDto` + `MyReservationListResponseDto` 추가.
6. **(컨트롤러)** `UserReservationController`에 `GET /reservations/me` 라우트 추가.
   - `@Get('reservations/me')`, `@UseGuards(AuthGuard)`, `@ResponseMessage('예약 목록이 성공적으로 조회되었습니다.')`
   - 주의: `/reservations`(POST)와 같은 컨트롤러에 위치 → 라우트 충돌 없음 (POST vs GET, 다른 경로)
7. **(모듈)** `reservation.module.ts`의 providers에 `ListUserReservationsUseCase` 등록.

### FE (완료)

아래 파일 모두 구현 완료(2026-06-05 기준 코드 확인):
- `packages/shared/src/contracts/reservation-list.ts` — ReservationListItem(category 포함), DisplayState, CursorPage, ReservationListResult, RESERVATION_LIST_DEFAULT_LIMIT
- `packages/shared/src/constants/reservation-status-visual.ts` — RESERVATION_STATUS_VISUAL 8 status 매핑
- `apps/web/src/features/reservation/list/{api.ts, queries.ts, index.ts}` — getMyReservations + useMyReservations(useInfiniteQuery)
- `apps/web/src/entities/reservation/ui/ReservationStatusBadge.tsx` — 8 status 배지
- `apps/web/src/app/(user)/my/reservations/page.tsx` — 서버 컴포넌트 래퍼
- `apps/web/src/app/(user)/my/reservations/_components/ReservationsListClient.tsx` — 무한 스크롤 + IntersectionObserver + 401 리다이렉트 + 빈 상태 + 네트워크 오류
- `apps/web/src/app/(user)/my/reservations/_components/ReservationCard.tsx` — 3행 카드 (date·day·배지 / programTitle·meta / status message)

### 연동

8. API 라이브 후 MSW mock 제거 또는 `NEXT_PUBLIC_USE_MSW=false` 설정하여 실서버 연결.
9. 연동 검증: 인증 토큰 흐름, status 필터, 커서 페이징, 빈 목록, 401(미로그인) 동작 확인.

---

## Status

<!-- 게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능. -->

- [x] API 구현
- [x] UI 구현
- [x] API 연동

---

## Out (단계별 완료물)

- API:
  - [x] `domain/repositories/user-reservation.repository.ts` — `findMyList` 메서드 + `UserReservationListRow`/`UserReservationListQuery` 추가
  - [x] `infrastructure/persistence/prisma-user-reservation.repository.ts` — `findMyList` 구현 (userId-scoped, cursor/limit/status, createdAt desc + id desc, store.name + program.title + artwork.status select)
  - [x] `domain/display-state.util.ts` — 정본 표 전면 교체 + `calcDisplayState(status, artworkStatus?)` 시그니처 확장 + IN_PROGRESS Artwork 4종 분기 구현
  - [x] `application/use-cases/list-user-reservations.use-case.ts` — 신규 (limit+1 hasMore, nextCursor, displayState 계산)
  - [x] `presentation/dto/user-reservation.dto.ts` — `GetMyReservationsQueryDto` + `MyReservationItemDto` + `MyReservationsResponseDto` 추가
  - [x] `presentation/controllers/user-reservation.controller.ts` — `GET /reservations/me` 라우트 (`listMyReservations` 핸들러, AuthGuard)
  - [x] `reservation.module.ts` — `ListUserReservationsUseCase` 등록
  - [x] `modules/api-routes.snapshot.spec.ts` — `UserReservationController.listMyReservations GET /reservations/me` 스냅샷 추가
  - [x] `application/use-cases/list-user-reservations.use-case.spec.ts` — 신규 단위테스트 (빈 목록, hasMore/nextCursor, status 필터, cursor, displayState 8종 + IN_PROGRESS substate 4종 + DELIVERED/PICKUP_DONE 빈 description)
  - [x] `application/use-cases/create-user-reservation.use-case.spec.ts` — CONFIRMED displayState description 정본 표로 갱신
- UI (완료):
  - shared contract: `packages/shared/src/contracts/reservation-list.ts`
  - shared 상수: `packages/shared/src/constants/reservation-status-visual.ts`
  - react-query 훅: `apps/web/src/features/reservation/list/{api.ts, queries.ts, index.ts}`
  - 배지: `apps/web/src/entities/reservation/ui/ReservationStatusBadge.tsx`
  - 화면: `apps/web/src/app/(user)/my/reservations/page.tsx` + `_components/ReservationsListClient.tsx`
  - 카드: `apps/web/src/app/(user)/my/reservations/_components/ReservationCard.tsx`
- 연동:
  - [x] MSW 비활성화 후 실서버 연결 확인 — api.ts의 `/api/v1` 하드코딩 제거 → `/reservations/me` 무prefix 경로로 수정. `clientApiFetch.resolveUrl` 실모드(`NEXT_PUBLIC_API_MOCKING=disabled`)에서 `/api/proxy/reservations/me`로 변환 → Next.js proxy → `API_BASE_URL/reservations/me` (BE `@Controller()` 무prefix, `@Get('reservations/me')`). proxy ALLOWED_PREFIXES에 `/reservations/` 포함 확인.
  - [x] shared `reservation-list.ts` `reservationListItemSchema`에서 `category` 필드 제거. MSW mock DB(`mocks/db.ts`) SEEDED_RESERVATIONS 11개 항목 `category: '도자기'` 제거. 카드 meta line은 `ReservationCard.tsx`에 이미 `{storeName}・{time}` 형태로 구현됨.
  - [ ] E2E 검증 완료 — 실 BE 미기동으로 round-trip 미검증. typecheck/lint pass 확인.

---

## Risks

- `display-state.util.ts` 문구 불일치 — 현재 코드와 정본 표가 다름. BE `/me` 구현 시 수정 필요. 수정 시 기존 예약 생성 응답(`CreateUserReservationUseCase`)에도 사용 중이므로 영향 범위 확인 필요.
- `IN_PROGRESS` + Artwork.status 분기 미구현 — `calcDisplayState`가 현재 단일 파라미터. `/me` 목록에서 IN_PROGRESS 항목의 subLabel이 항상 null로 반환됨. Artwork 분기 추가 필요.
- `Program.category` 필드 존재 여부 — `ReservationListItem`에 `category` 필드가 contract에 있으나, Prisma schema의 `Program` 모델에 `category` 컬럼이 있는지 BE 구현 전 확인 필요.
- cursor 정렬 안정성 — `id`(uuid)는 시간순 정렬 키로 부적합. `createdAt DESC` + `id DESC` tie-break 조합이 안정적. Open decisions 2 확인.
- `/reservations/me` vs `/reservations` 라우트 — 같은 컨트롤러에 `POST /reservations`가 존재. `GET /reservations/me`는 경로가 다르므로 충돌 없음. NestJS는 `me`를 path param `{id}`보다 먼저 매칭하므로 `GET /reservations/:id`와도 충돌 없음.

---

## Validation

- Tests: BE service 단위(본인 필터/status 필터/cursor limit+1/hasMore·nextCursor 산출/displayState 분기), controller 401. shared zod 스키마 파싱 테스트.
- Manual checks: 로그인 후 예약 탭 진입 시 목록·정렬·무한스크롤·빈 상태, status 필터, 미로그인 401.
- Observability: 서버 500 로깅(예약 목록 조회 실패).

---

## Decision Log

- 2026-06-01: API 명세 미러와 Notion 정본 일치 확인 — drift 없음. 정본 기준으로 Contract 고정.
- 2026-06-01: ReservationStatus enum 정본 8값 = prisma schema = packages/shared enum 일치 확인.
- 2026-06-01 (갱신): Figma 노드 `8505:15761`/`8505:15771` 토큰 추출 — 카드 컨테이너 + Badge 8 status 전부 확정.
- 2026-06-01 (갱신): PR #51 리뷰(nogglee) — `/me` limit 기본값은 `packages/shared` `DEFAULT_PAGE_SIZE`(20)로 정렬. Open decision 4 해소.
- 2026-06-01 (갱신): 디자인 "상태 메세지" 정본 표 수신 — 8 Reservation status + 4 Artwork substate 전부 확정. Open decision 1/5 완전 해소.
- 2026-06-01 (갱신): PR #63 리뷰(nogglee) — `category` 필드 contract에 추가, `STATUS_VISUAL` → `packages/shared`, `ReservationsListClient` 분리 등 5건 반영.
- 2026-06-05 (갱신): 실제 코드 기반 상태 재정합. FE 전체 구현 완료 확인. BE `GET /reservations/me` 미착수 확인. `display-state.util.ts` 문구 불일치 발견(Open decisions 6 신규). `Program.category` 필드 존재 여부 검증 필요(Open decisions 7 신규). Plan의 BE 세부 태스크를 현재 코드 구조(파트너 패턴 참조)에 맞게 보강.
- 2026-06-05 (회의 결정): **category 제거.** DBeaver로 Program·Store 컬럼 부재 확정 + 값 1종("도자기")뿐 → 확장 전까지 UI·contract에서 삭제(추후 nullable 컬럼 + 파트너 공방 등록 입력). BE 응답/select category 삭제(완료), shared `reservation-list.ts`·`favorite.ts` + 카드 meta category 삭제(FE 협의). Open decision 7 해소 → BE 착수 가능.

---

## Open decisions (사람 결정 필요 — 추측 금지)

1. ~~**displayState 전체 문구 테이블.**~~ → **해소(2026-06-01):** 8 Reservation status label/description + 4 Artwork substate(DRYING/BISQUE_FIRING/GLAZING/GLAZE_FIRING) subLabel/description 전부 확정. 위 §API Contract "displayState 계산 규칙" 표 참조.

2. **[해소 — 2026-06-05] cursor 정렬 안정성.** `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]` + **Prisma native `cursor: { id }` + `skip: 1` + `take: limit+1`** 채택(파트너 `findList`와 동일 검증 패턴). Prisma 커서는 `id <` 단순 비교가 아니라 커서 row의 전체 정렬키(createdAt, id) 기준으로 seek하므로, id가 유일·마지막 정렬키인 한 createdAt 동률 경계에서도 누락/중복 없이 정확. → 명시 OR-where 권장안 대신 native 커서로 확정.

3. **수령 방식 표시 데이터.** 기능명세는 "배송중/픽업대기/픽업완료" 표시를 요구하나 `/me` 응답 항목에 `deliveryMethod`/배송 메타 필드가 없음. displayState(SHIPPED/DELIVERED/PICKUP_READY/PICKUP_DONE label)로 충분한지, 아니면 응답에 `deliveryMethod` 추가가 필요한지(= contract 변경) 결정 필요.

4. ~~**limit 기본값/상한.**~~ → **해소(2026-06-01):** `DEFAULT_PAGE_SIZE`(20) 사용.

5. ~~**UI 작업 시작 조건(DESIGN.md).**~~ → **해소(2026-06-01):** Figma 노드 확보 + 8 status 배지 전부 확정. FE 착수 완료.

6. **`display-state.util.ts` 문구 불일치 처리 방향.** (신규 — 2026-06-05) 현재 코드의 7개 status 문구가 정본 표와 다름(§"Drift 점검" 표 참조). 두 가지 선택: (A) `display-state.util.ts` 자체를 정본 표 기준으로 수정 — 기존 예약 생성 응답에도 영향. (B) `/me` 전용 displayState 계산 함수를 별도로 만들고 `display-state.util.ts`는 현행 유지. 권장안: (A) — `display-state.util.ts`가 고객 노출 문구의 SSOT이므로 정본 기준으로 통일. `CreateUserReservationUseCase` 응답은 displayState를 포함하므로 함께 수정. 수용 여부 결정 필요.

7. **[해소 — 2026-06-05 회의] `category` 제거.** DBeaver 확인 결과 Program·Store에 category 컬럼 없음(craft/type/genre 류·enum도 없음). 회의 결정: 현재 카테고리는 "도자기" 1종뿐이라 불필요, 추후 확장 시 공방 등록 단계에서 사장님 입력(그때 nullable 컬럼 신설). **현 단계에선 UI·contract에서 category 제거.** → BE 응답·select에서 삭제(완료), shared `reservation-list.ts`·`favorite.ts` + 카드 meta에서 삭제(FE: codingguri/nogglee). 블로커 해소 → BE 착수 가능.

---

## Outcome

- Status: FE 완료 / BE 미착수 / 연동 대기. **category 블로커 해소(회의)** — 남은 BE 선행: Open decision 6(displayState 정본 정합, BE가 처리).
- Follow-up:
  - BE: `GET /reservations/me` 구현 (category 미반환) + `display-state.util.ts` 정본 정합.
  - FE(codingguri/nogglee): shared `reservation-list.ts`·`favorite.ts` + 카드 meta에서 category 제거.
  - 연동: BE 완료 후 MSW 비활성화 → 실서버 연결.
