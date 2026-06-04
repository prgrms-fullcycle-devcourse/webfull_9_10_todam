# Feature Plan: user-공방-리뷰-전체보기

## Summary

- Goal: 공방 퍼블릭 상세에서 "리뷰 더보기" 진입 시 노출되는 **공방 리뷰 전체 목록 화면**(`/stores/[slug]/reviews`) 구현. **커서 기반 무한 스크롤** + 정렬 토글(최신순/별점순) + 빈 상태 + 이미지 확대보기.
- **확정(2026-06-04)**: 페이징 = **커서 무한스크롤**, **정렬 토글(`latest`/`rating_high`) 유지**(#120 FE 담당 판단 존중), **상단 요약(총 리뷰수·평균별점) 없음**(헤더는 `← {공방명} 리뷰`). 이미지 확대용 원본 `imageUrl` 응답 포함. 본 기능은 **#120**(공방 리뷰 전체보기)에 연결.
- Owner: FE
- Date: 2026-06-04

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
- API 구현: 실 BE(`apps/api`) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: **실 API** 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크(연동 아님).
-->

- [ ] API 구현  <!-- 본 기능에선 신규 BE 없음. GET /stores/{slug}/reviews(+Review 도메인) 는 #120(공방 리뷰 전체보기)이 BE 소유. 여기선 그 엔드포인트 동작에 의존만 함 → completed 게이트는 "#120에서 엔드포인트 구현됨" 확인으로 충족 -->
- [ ] UI 구현
- [ ] API 연동

## Context

<!-- 요구사항=docs/requirements.md. 기능/API명세=Notion DB에서 notion-fetch.mjs --find로 select. -->

- 요구사항명세서(고정): `docs/requirements.md` → `# 리뷰 review` › `## 5. 리뷰 조회` › "공방 퍼블릭 페이지" (전체 리뷰 수·평균 별점, 정렬 최신순/별점 높은순(기본 최신순), 페이지네이션). `## 1. 리뷰 엔티티`, `## 2. 리뷰 작성`(ReviewPhoto thumbnailUrl 240x240).
- 기능명세: `공방 리뷰 전체보기` (기능명세 DB `b242ee66b06c8349805601ce4a05247a`). 실행주체 guest·user / 도메인 review / 트리거 "공방 상세 화면 진입 후 리뷰 더보기 버튼 클릭". 동작: 작성자·평점·본문·이미지·작성일·대상 클래스 표시, 이미지 확대보기, 빈 상태. 비고: 공방 상세는 대표 리뷰 3개만, 전체보기 목록은 최신순 기본 정렬·클래스명 함께 표시.
- API명세: `GET /stores/{slug}/reviews` (API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`, "공방 리뷰 목록"). 아래 Contract 스냅샷 참조.
- 인접 plan(경계): `GET /stores/{slug}/reviews` BE·Review 도메인 owner = **#120(공방 리뷰 전체보기)**. **공방 상세(#118)** 는 동일 엔드포인트를 **리뷰 미리보기(`?limit=3&sort=latest`)** 로 소비만. 본 문서는 #120의 FE 화면 부분으로, 계약을 재정의하지 않고 **참조·정합**한다 (계약 SSOT = `packages/shared/src/contracts/store-reviews.ts`, #120 BE 구현 시 생성).
- Relevant design docs: `DESIGN.md` (작업 시작 조건). 코드 자산: `apps/web/src/entities/review/ui/Item.tsx`(전체 목록용 리뷰 카드: rating·userId·contents·images·tagLabel), `entities/review/ui/CardItem.tsx`(컴팩트형), `@todam/ui` `Rating`. 라우트 스텁: `apps/web/src/app/(user)/stores/[slug]/reviews/page.tsx`(현재 `<div>공방 리뷰</div>`).
- Open decisions: 아래 "Open decisions" 절 참조.

## API Contract (스냅샷)

> 정본 = Notion API명세 DB "공방 리뷰 목록". **공방 상세 plan과 동일 엔드포인트** — 본 plan에서 계약을 재정의하지 않는다. 공방 상세는 `?limit=3&sort=latest`(미리보기), 본 기능은 `?page=N&limit=10&sort=latest|rating_high`(전체 목록). 응답 스키마는 100% 동일.

### 응답 envelope (공통)

`{ statusCode, timestamp, path, message, data, error }`

### 데이터모델 (`data`)

```
data: {
  reviews: ReviewListItem[]
  pageInfo: { nextCursor: string | null, hasNext: boolean }   // 커서 기반. nextCursor=null이면 끝
}

ReviewListItem: {
  id: string                   // review UUID
  nickname: string             // 마스킹된 작성자명 (예: "use*****")
  rating: number               // 1~5 (UI는 5.0/3.0처럼 .0 표기)
  content: string              // 본문 (빈 문자열 가능 — 선택 입력)
  photos: { imageUrl: string, thumbnailUrl: string }[]   // 0~3장. thumbnailUrl=목록 썸네일, imageUrl=확대보기 원본
  programTitle: string         // 작성 대상 클래스명 (예약→프로그램 title)
  createdAt: string            // ISO 8601
}
```

> 확정(2026-06-04): `totalCount`/`averageRating` **미포함**(UI 요약 헤더 없음, 상세 평점은 코어 응답 제공). offset `pagination` → **커서 `pageInfo`**. `photos`에 확대용 `imageUrl` 추가.

### 엔드포인트

- `GET /stores/{slug}/reviews` — 공방 리뷰 목록 (Guest·User, 인증 불필요)
  - **Path**: `slug` (공방 슬러그)
  - **Query**: `cursor`(선택, 첫 페이지 미전송) · `limit`(기본 10) · `sort`(`latest` | `rating_high`, 기본 `latest`)
    - 본 기능 사용: `cursor`/`limit`, **`sort` 토글(`latest` 기본 / `rating_high`)**. sort 변경 시 cursor 초기화(새 무한쿼리)
    - 공방 상세 미리보기 사용: `limit=3&sort=latest`(첫 페이지만, 무한스크롤 아님) — 본 plan 범위 밖
  - **시스템 처리**: `slug`로 `PUBLISHED` 공방 조회(아니면 404) → `is_visible=true` 리뷰를 `sort` 정렬 → `cursor` 이후 `limit`개 → `nextCursor`(없으면 null)·`hasNext` 산출. 각 항목 작성자명 마스킹 + 사진(`imageUrl`/`thumbnailUrl`) + `programTitle` 포함. 커서는 정렬키(latest=`createdAt`,`id` / rating_high=`rating`,`createdAt`,`id`) 인코딩.
  - **200 OK** `data` = 위 데이터모델.
  - **404 Not Found** `error: "STORE_NOT_FOUND"`, `message: "공방을 찾을 수 없습니다.", data: null` — 미존재/비공개(PUBLISHED 외).
  - **500** `error: "INTERNAL_SERVER_ERROR"`, `data: null`.

  ```json
  // 200 OK 예시
  {
    "statusCode": 200,
    "timestamp": "2026-05-25T17:57:00.000Z",
    "path": "/stores/todam-studio/reviews",
    "message": "공방 리뷰 목록이 성공적으로 조회되었습니다.",
    "data": {
      "reviews": [
        {
          "id": "review-uuid-001",
          "nickname": "use*****",
          "rating": 5,
          "content": "물레 만지는 것은 처음인데도 사장님께서 친절하게 알려주셔서 ...",
          "photos": [
            { "imageUrl": "https://cdn.todam.example/reviews/review-uuid-001/1.jpg", "thumbnailUrl": "https://cdn.todam.example/reviews/review-uuid-001/1-thumb.jpg" }
          ],
          "programTitle": "머그컵 만들기",
          "createdAt": "2026-05-24T12:00:00.000Z"
        }
      ],
      "pageInfo": { "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTI0VDEyOjAwOjAwLjAwMFoiLCJpZCI6InJldmlldy11dWlkLTAwMSJ9", "hasNext": true }
    },
    "error": null
  }
  ```

## Scope

- In (본 기능 = FE 전체보기 화면):
  - `/stores/[slug]/reviews` 페이지 구현(`app/(user)/stores/[slug]/reviews/page.tsx`). 헤더 = `← {공방명} 리뷰`(뒤로가기 + 타이틀). route group은 Open decision(서브 화면이면 `(sub)`).
  - **요약 헤더 없음**(확정): totalCount·averageRating 미표시.
  - **정렬 토글 유지**(확정): `latest`(기본) ↔ `rating_high`. 변경 시 cursor 초기화 후 재조회.
  - **커서 기반 무한 스크롤**(확정): `pageInfo.nextCursor`/`hasNext` 기반 `useInfiniteQuery`(`getNextPageParam` = `hasNext ? nextCursor : undefined`). 스크롤 하단 도달 시 다음 cursor fetch.
  - 리뷰 카드 렌더: `entities/review`의 `Item`(또는 신규 store 전용 `StoreReviewItem`)로 nickname·rating·content·photos·programTitle(tagLabel) 표시. `Item`의 `userId`←`nickname`, `tagLabel`←`programTitle` 매핑.
  - **빈 상태**: `reviews.length === 0` → 빈 상태 화면.
  - **이미지 확대보기**: 썸네일 탭 시 확대 뷰(기존 오버레이 `AppModal`/`AppSheet` 또는 라이트박스 활용).
  - 에러 처리: 404(STORE_NOT_FOUND) → 공방 없음/접근 불가 화면. 500/네트워크 → 재시도 가능한 에러 상태(기능명세 "네트워크 오류 시 실패 가능").
  - shared 계약 **참조**: `packages/shared/src/contracts/store-reviews.ts`(공방 상세 plan owner)에서 export하는 `storeReviewListResultSchema`/`StoreReviewListItem` 타입을 그대로 import. 만약 본 기능 구현 시점에 해당 파일이 없으면 → 본 plan에서 **생성**하되 공방 상세 plan과 동일 스키마로 만들고 양 plan 모두에서 SSOT로 표기(중복 정의 금지). 생성 시 공방 상세 plan owner에게 통지.
  - api 함수 `getStoreReviews(slug, { page, limit, sort })` + react-query 훅(`useStoreReviews` 또는 `useStoreReviewsInfinite`) — 신규 `features/store/reviews/` (또는 `features/review/store-list/`). `apiFetch<StoreReviewListResult>('/stores/${slug}/reviews?...')`.

- Out (다른 plan 소유 / 본 기능 제외):
  - **`GET /stores/{slug}/reviews` BE 엔드포인트 + Review 도메인 구현** → **#120(공방 리뷰 전체보기)** BE 소유. 공방 상세(#118)는 미리보기로 소비만. 본 plan(이 문서)은 #120의 FE 화면 부분.
  - **공방 상세 화면의 리뷰 미리보기(대표 3개, `limit=3&sort=latest`)** → 공방 상세 plan 소유. 본 plan은 "리뷰 더보기" 버튼의 **목적지 화면**만 담당(버튼 자체는 공방 상세).
  - **클래스 상세의 프로그램 리뷰 목록**(`GET /stores/{slug}/programs/{programId}/reviews`) → 별도 기능. 응답 스키마는 유사하나 본 plan 범위 밖.
  - 리뷰 작성/수정/삭제(`POST/PUT/DELETE`) → 예약 도메인 plan들 소유.
  - 마스킹·`is_visible`·`averageRating` 계산 등 서버 로직 → BE(공방 상세 #118).

## Plan

1. shared 계약 정합: 공방 상세 plan의 `store-reviews.ts` 존재 확인. 있으면 import만, 없으면 동일 스키마로 생성(zod: `storeReviewPhotoSchema`, `storeReviewListItemSchema`, `storeReviewListResultSchema`, `StoreReviewSort = 'latest' | 'rating_high'`) + 공통 `DEFAULT_PAGE_SIZE` 또는 전용 상수. 양 plan SSOT 주석.
2. `features/store/reviews/api.ts`: `getStoreReviews(slug, params)` — `apiFetch<StoreReviewListResult>`, query 직렬화(`page/limit/sort`).
3. `features/store/reviews/queries.ts`: react-query 훅. 404/403/401 no-retry(기존 `retry` 패턴 재사용), `sort` 별 queryKey 분리. (무한스크롤 채택 시 `useInfiniteQuery`, `getNextPageParam` = currentPage<totalPages.)
4. 리뷰 카드: `entities/review`의 `Item` 재사용 검토 → 부족하면 `features/store/reviews/ui/StoreReviewItem.tsx`. nickname/rating/content/photos/programTitle/createdAt 매핑. (DESIGN 토큰 확보 후.)
5. 정렬 토글 UI(`SortTabs` 또는 세그먼트 컨트롤). 변경 시 page 리셋.
6. 헤더 요약(totalCount + averageRating), 리스트, 빈 상태, 에러/로딩 상태 조립 → `page.tsx`(server) + client 컴포넌트.
7. 이미지 확대보기(썸네일 → 라이트박스/오버레이). 원본 URL 발급 방식 확정 후 연결(Open decision).
8. MSW 핸들러(`mocks/handlers.ts`)에 `GET /stores/:slug/reviews` 추가(미리보기와 공유, sort/page 분기) → UI 단독 검증.
9. 실 API 연동: BE(#118) 엔드포인트 동작 확인 후 MSW 해제·연동 검증(정렬·페이지·404·빈 상태).
10. Storybook: 신규 UI 컴포넌트 등록(DESIGN.md 규칙).

## Out (단계별 완료물)

- API: <!-- 본 기능 신규 BE 없음. 의존 엔드포인트 GET /stores/{slug}/reviews 구현 위치(#118) 기록 -->
- UI: <!-- /stores/[slug]/reviews 페이지, 정렬 토글, 리뷰 카드, 빈 상태, 이미지 확대보기, 신규 컴포넌트/스토리 -->
- 연동: <!-- useStoreReviews 실 API 바인딩, 정렬·페이지·404·빈상태 검증 결과 -->

## Risks

- 동일 엔드포인트 계약을 두 plan(공방 상세·본 기능)이 공유 → 스키마 drift 위험. **반드시 `packages/shared` 단일 계약 import**, plan 간 중복 정의 금지.
- **커서 무한스크롤 확정** → 동일 엔드포인트의 공방 상세(#118) 계약(offset)과 어긋남. **두 plan/Notion 명세 동기화 필수**(미동기화 시 BE 구현이 한쪽만 맞음).
- 이미지 확대: `photos.imageUrl`(원본) 확정. 원본이 공개 URL인지(서명 불요) BE 확인.
- DESIGN.md에 리뷰 목록/카드 전용 토큰(헤더 요약, 정렬 토글, 카드 size/state) 미정의 → 코딩 전 확보 필요(작업 시작 조건).

## Validation

- Tests: 계약 스키마 zod parse(200 응답 fixture), `getStoreReviews` 쿼리 직렬화, 정렬 토글 시 page 리셋 동작, 404→에러 화면 분기.
- Manual checks: latest/rating_high 정렬 전환, 다음 페이지 로드, totalCount/averageRating 표시, 빈 상태(reviews=[]), 이미지 확대, 비공개/미존재 slug 404 화면.
- Observability: 404/500 에러 토스트·에러 바운더리 경로 확인.

## Decision Log

- 2026-06-04: **reviews BE 소유 = #120 확정.** 기존 이슈 #120(공방 리뷰 전체보기)이 Review 도메인 전체(엔티티·레포지토리·유스케이스·StoreReviewController)를 보유 → `GET /stores/{slug}/reviews` BE는 #120이 구현·관리, 공방 상세(#118)는 미리보기로 소비만. 본 문서 내 과거 "#118 소유" 표현은 모두 **#120 소유**로 정정. (중복 이슈 신규 생성 안 함 — #120 사용)
- 본 기능은 FE 전용(화면). BE 중복 구현하지 않음 — 코드베이스 상태(`(user)/stores/[slug]/page.tsx`·`reviews/page.tsx` 모두 스텁) 확인.
- API 계약(데이터모델/엔드포인트/에러)은 Notion "공방 리뷰 목록" 정본 기반. 공방 상세 미리보기와 응답 스키마 동일.
- 2026-06-04: **UI 기준 확정** — 커서 무한스크롤(`pageInfo{nextCursor,hasNext}`, offset `pagination` 폐기), **정렬 토글(`latest`/`rating_high`) 유지**(#120 FE 담당 판단), 요약 헤더 없음, `photos`에 확대용 `imageUrl` 추가, `totalCount`/`averageRating` 응답 제거. → 공방 상세(#118) reviews 계약도 커서·photos.imageUrl로 동기화(완료).

## UI 규칙

- UI: DESIGN.md 준수. 컬러는 semantic→primitive 토큰만, sizing/gap/padding/radius는 Tailwind 기본 스케일만(arbitrary value 금지). 상호작용 상태는 props 금지, native + Tailwind state variant.
- 작업 시작 조건(DESIGN.md): 아래 토큰이 확보되어야 코딩 시작 — 미확보 시 Open decision으로 질의.
  - 정렬 토글(세그먼트): variant/size enum, state(선택·hover) 토큰.
  - 리뷰 카드: size별 height/padding/gap/radius, 사진 썸네일 크기·radius(기존 `Item`은 128px·`CardItem`은 56px — 전체보기용 규격 확정 필요).
  - 헤더 요약(평균 별점·리뷰 수) 타이포·간격.

## Open decisions

1. ~~페이지네이션 방식~~ — **확정: 커서 기반 무한스크롤**(UI 기준). `pageInfo{nextCursor,hasNext}`.
2. ~~정렬 토글~~ — **확정: 유지(`latest`/`rating_high`)**. ~~요약 헤더~~ — **확정: 없음**.
3. ~~이미지 확대 원본~~ — **확정: `photos`에 `imageUrl`(원본) 추가**, 썸네일 탭 시 imageUrl로 확대.
4. route group: 전체보기 화면이 BottomNav 유지(`(user)`) vs 서브 화면(`(sub)` 헤더만). DESIGN.md상 BottomNav 직접 접근 불가 → **`(sub)` 후보**. (미확정 — 라우팅 결정)
5. `limit` 기본값: API명세 정본 10 vs 팀 공통 상수(`DEFAULT_PAGE_SIZE`=20). (미확정 — 무한스크롤 페이지 크기)
6. 리뷰 카드 컴포넌트: 기존 `entities/review/Item` 재사용 vs store 전용 신규(createdAt 슬롯 없음). 작성일 노출 위치 디자인 확인.
7. DESIGN.md에 리뷰 카드/이미지 그리드/클래스 태그 전용 토큰 미정의 → Figma 확인(작업 시작 조건).

## Outcome

- Status: planning (사람 검토·승인 대기)
- Follow-up: `packages/shared/src/contracts/store-reviews.ts`(커서 스키마) 계약을 **#120 BE 구현 시 생성**(SSOT), 본 FE plan·공방 상세 미리보기 모두 그것을 import. #120 본문이 offset/pagination 표기라 커서로 갱신 필요(코멘트로 안내).
