# Feature Plan: 유저 - 클래스 상세

## Summary

- Goal: Guest 및 인증 User가 공방의 특정 클래스 상세 정보를 조회하고, 리뷰 수/가격/운영 정보/체험 안내를 확인한 뒤 예약 플로우로 진입할 수 있게 한다.
- Owner:
- Date: 2026-06-08

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
각 항목 체크 기준:
- API 구현: 실 BE(`apps/api`) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: **실 API** 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크(연동 아님).
-->

- [ ] API 구현
- [x] UI 구현
- [ ] API 연동

## Context

<!-- 요구사항=docs/requirements.md. 기능/API명세=Notion DB에서 notion-fetch.mjs --find로 select. -->

- 요구사항명세서(고정): docs/requirements.md
  - `# 클래스 class`: 클래스는 공방의 체험 상품이며 `ACTIVE`일 때 예약 가능/퍼블릭 노출.
  - `# 예약 reservation`: 예약 생성 조건은 클래스 `ACTIVE`, 공방 `PUBLISHED`, 자기거래 차단.
  - `# 리뷰 review`: 클래스 상세에 해당 클래스 리뷰 수/평균 별점/목록 노출 가능.
- 기능명세: `클래스 자세히보기` (기능명세 DB `b242ee66b06c8349805601ce4a05247a`)
- API명세: API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`
  - `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭)
  - `GET /stores/{slug}/programs/{programId}/reviews` — 프로그램 리뷰 목록
  - `GET /programs/{programId}/available-slots` — 예약 가능 시간 조회 (고객용 달력)
- Relevant design docs:
  - Figma JSON attachment: `/Users/a2485/.codex/attachments/4469fc36-65e4-41cc-a988-020662f5967f/pasted-text.txt`
  - Frame: `클래스 상세`, 360x930, background `#FBF8F3`
- Open decisions:
  - [Q1·해소 2026-06-08] `capacity`를 상세 API contract에 포함한다. 값은 `Store.maxCapacityPerSlot` 기반이며 nullable 가능.
  - [Q2·해소 2026-06-08] `difficulty`, `childFriendly`를 상세 API contract에 포함한다.
  - [Q3·해소 2026-06-08] `storeName`은 상세 API에 포함하지 않고 진입 source/query로 전달한다. 미전달 시 UI fallback은 `흙과 사람`.
  - [Q4·해소 2026-06-08] 현재 route `/classes/{programId}?store={slug}`를 유지한다.
  - [Q5·해소 2026-06-08] 상세 화면에서 `available-slots`는 조회하지 않는다. 예약 신청 화면에서 슬롯 조회한다.
  - [Q6·해소 2026-06-08] 리뷰 수는 리뷰 목록 API `totalCount`를 병렬 호출해 표시한다.

## API Contract (스냅샷)

<!-- planner가 Notion API명세를 읽어 여기에 고정. BE/FE/reviewer가 바인딩하는 SSOT.
     Notion 원본이 바뀌면 재plan → 이 섹션 diff로 추적. -->

### 데이터모델

**ProgramDetail — Notion API명세 snapshot**

```ts
type ProgramDetail = {
  id: string;
  storeId: string;
  title: string;
  description: string | null;
  materials: string | null;
  caution: string | null;
  price: number;
  durationMinutes: number;
  capacity?: number | null;
  leadTimeDays: number;
  difficulty?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  childFriendly: boolean;
  deliverable: boolean;
  status: 'ACTIVE';
  images: Array<{
    imageUrl: string;
    thumbnailUrl: string | null;
  }>;
};
```

**ReviewListResult — Notion API명세 snapshot**

```ts
type ProgramReview = {
  id: string;
  userId: string;
  nickname: string;
  rating: number;
  content: string;
  photos: Array<{
    thumbnailUrl: string;
  }>;
  createdAt: string;
};

type ProgramReviewListResult = {
  totalCount: number;
  averageRating: number;
  reviews: ProgramReview[];
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
  };
};
```

**AvailableSlotsResult — Notion API명세 snapshot**

```ts
type AvailableSlot = {
  slotId: string;
  startAt: string;
  endAt: string;
  reservedCount: number;
  remainingCount: number;
  status: 'OPEN' | 'CLOSED';
};

type AvailableSlotsResult = {
  slots: AvailableSlot[];
};
```

### 엔드포인트

- `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭)
  - Auth: 없음
  - Path: `slug: string`, `programId: string`
  - 처리: `slug`로 `PUBLISHED` 공방 조회, `programId`로 `ACTIVE` 프로그램 조회, 이미지/준비물/유의사항/택배 가능 여부 포함 반환
  - 200: `{ program: ProgramDetail }`
  - 404: `PROGRAM_NOT_FOUND`, message `프로그램을 찾을 수 없습니다.`
  - 500: `INTERNAL_SERVER_ERROR`

- `GET /stores/{slug}/programs/{programId}/reviews` — 프로그램 리뷰 목록
  - Auth: 없음
  - Path: `slug: string`, `programId: string`
  - Query: `page?: number = 1`, `limit?: number = 10`, `sort?: 'latest' | 'rating_high' = 'latest'`
  - 처리: 프로그램 리뷰 목록 조회, 페이지네이션, 전체 리뷰 수 및 평균 별점 반환
  - 200: `ProgramReviewListResult`
  - 404: `PROGRAM_NOT_FOUND`, message `프로그램을 찾을 수 없습니다.`
  - 500: `INTERNAL_SERVER_ERROR`

- `GET /programs/{programId}/available-slots` — 예약 가능 시간 조회 (고객용 달력)
  - Auth: `Authorization: Bearer {accessToken}` 필요
  - Path: `programId: string`
  - Query: `year: number`, `month: number`
  - 처리: 인증 토큰 검증, `ACTIVE` 프로그램 조회, 공방 운영시간/휴게시간/예약 시간 간격 기반 월별 슬롯 목록 생성, 예약 수와 `program_time_slots.status = 'CLOSED'` 반영
  - 200: `{ slots: AvailableSlot[] }`
  - 404: `PROGRAM_NOT_FOUND`
  - 500: `INTERNAL_SERVER_ERROR`

## Scope

- In:
  - 사용자 클래스 상세 화면 구현
  - 프로그램 상세 API 클라이언트 및 query 연결
  - 리뷰 summary 표시를 위한 리뷰 목록 API 클라이언트 및 query 연결
  - 예약 CTA → 예약 신청 화면 연결
  - 로딩/빈 이미지/404/네트워크 오류 상태
  - MSW mock 정합
  - 공유계약이 Notion API명세와 다르면 승인된 결정만 반영
- Out:
  - 예약 신청 화면 구현
  - 클래스 리뷰 전체보기 화면 구현
  - 파트너 클래스 상세/수정/게시 상태 변경
  - 리뷰 작성/수정/삭제
  - 리뷰 이미지 원본 라이트박스
  - 결제

## Plan

1. 계약 정리
   - Notion API명세와 현재 BE/shared 계약 차이 확인.
   - Q1~Q6 중 승인된 항목만 `packages/shared` 계약에 반영.

2. API/Mock 준비
   - `GET /stores/{slug}/programs/{programId}` web client/query 추가.
   - `GET /stores/{slug}/programs/{programId}/reviews` web client/query 추가.
   - MSW handler 응답을 승인된 contract와 맞춤.

3. 라우팅 결정 반영
   - 승인된 route shape에 따라 상세 페이지 위치와 링크 source 정리.
   - API에 필요한 `slug`와 헤더에 필요한 공방명 전달 방식 확정.

4. 상세 UI 구현
   - Figma: header, image area, tag row, title/review count, description, info table, info callout, fixed bottom CTA.
   - 기존 UI 토큰과 `@todam/ui` 컴포넌트 사용.
   - 텍스트 overflow/모바일 360px 기준 레이아웃 검증.

5. CTA/상태 처리
   - Guest: 예약 CTA 클릭 시 로그인 유도 또는 예약 화면에서 로그인 처리.
   - User: 예약 신청 화면으로 이동.
   - API 404/500 및 이미지 없음/리뷰 없음 상태 처리.

6. 검증
   - Typecheck/lint.
   - MSW 또는 dev API로 수동 렌더 확인.
   - 360px 모바일 viewport에서 Figma 주요 spacing/텍스트/CTA 확인.

## Out (단계별 완료물)

- API:
  - 현재 plan 범위에서 신규 BE 구현은 Q1/Q2/Q3/Q6 승인 여부에 따름.
  - 승인된 contract drift가 있으면 `apps/api` DTO/reader 및 `packages/shared` contract 갱신.
- UI:
  - `apps/web/src/app/(user)/classes/[id]/page.tsx` — 사용자 클래스 상세 화면.
  - `apps/web/src/features/program/detail/ui/ClassInfoTable.tsx` — 정원 행 추가.
  - `apps/web/src/entities/program/api.ts`, `queries.ts` — 상세/리뷰 query 추가.
  - `apps/web/src/mocks/handlers.ts`, `db.ts` — 상세/리뷰 mock 정합.
- 연동:
  - 상세 API + 리뷰 API query 호출부 연결.
  - 예약 CTA가 예약 신청 route로 필요한 `title`, `price`, `deliverable` 또는 상세 데이터 source를 전달.

## Risks

- API명세와 현재 코드가 다름: 현재 코드에는 `capacity`, `difficulty`, `childFriendly`, available slot `isAvailable/CANCELED` 흔적이 있으나 Notion snapshot과 불일치.
- 현재 route `/classes/{programId}`만으로는 `slug`를 알 수 없어 API 호출 불가.
- 리뷰 count를 위해 리뷰 목록 API를 호출하면 상세 화면 초기 요청이 2개가 됨.
- 이미지 remote URL이 Next image 설정과 맞지 않을 수 있어 `<img>` 사용 또는 image config 필요.

## Validation

- Tests:
  - `pnpm --filter @todam/web typecheck`
  - `pnpm --filter @todam/web lint`
  - 계약 변경 시 `pnpm --filter @todam/shared typecheck`
- Manual checks:
  - Guest가 상세 화면 진입 시 클래스 정보와 리뷰 수 표시.
  - 이미지 없음 fallback 표시.
  - 비공개/삭제 클래스 404 상태.
  - 예약 CTA가 올바른 예약 신청 route로 이동.
  - 360px viewport에서 bottom CTA와 본문 겹침 없음.
- Observability:
  - 404/500 상세 조회 실패 로그 확인.

## Decision Log

- 2026-06-08: 사용자 요청 `/plan 유저 - 클래스 상세`에 따라 기존 active plan을 재작성.
- 2026-06-08: 기능명세 DB 정확 매칭은 `클래스 자세히보기`(실행주체 guest, user)로 확인.
- 2026-06-08: 파트너 기능명세 `클래스 상세 조회`는 별도 범위로 제외.
- 2026-06-08: API명세는 URI 단독 검색으로 조회. METHOD 포함 검색은 notion-fetch에서 매칭 실패.
- 2026-06-08: Notion API명세 snapshot 기준으로 plan 작성, 화면 요구와 contract 차이는 Open decisions에 보류.
- 2026-06-08: 사용자 승인으로 Q1~Q6 결정. FE 구현 완료. 리뷰 API BE 구현 여부 미확인으로 `API 연동`은 미체크.

## Outcome

- Status: planning
- Follow-up:
  - 리뷰 API BE 구현 확인 후 `API 구현`/`API 연동` 체크.
