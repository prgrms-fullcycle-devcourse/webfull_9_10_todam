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

- [x] API 구현 <!-- #120 BE = GET /stores/{slug}/reviews (커서 기반) 구현 완료 (store 모듈). 앞서의 "신규 BE 없음" 주석은 이 작업으로 정정됨 — 본 기능(#120)이 reviews 엔드포인트를 소유·구현. -->
- [x] UI 구현
- [x] API 연동

## Context

<!-- 요구사항=docs/requirements.md. 기능/API명세=Notion DB에서 notion-fetch.mjs --find로 select. -->

- 요구사항명세서(고정): `docs/requirements.md` → `# 리뷰 review` › `## 5. 리뷰 조회` › "공방 퍼블릭 페이지" (전체 리뷰 수·평균 별점, 정렬 최신순/별점 높은순(기본 최신순), 페이지네이션). `## 1. 리뷰 엔티티`, `## 2. 리뷰 작성`(ReviewPhoto thumbnailUrl 240x240).
- 기능명세: `공방 리뷰 전체보기` (기능명세 DB `b242ee66b06c8349805601ce4a05247a`). 실행주체 guest·user / 도메인 review / 트리거 "공방 상세 화면 진입 후 리뷰 더보기 버튼 클릭". 동작: 작성자·평점·본문·이미지·작성일·대상 클래스 표시, 이미지 확대보기, 빈 상태. 비고: 공방 상세는 대표 리뷰 3개만, 전체보기 목록은 최신순 기본 정렬·클래스명 함께 표시.
- API명세: `GET /stores/{slug}/reviews` (API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`, "공방 리뷰 목록"). 아래 Contract 스냅샷 참조.
- 인접 plan(경계): `GET /stores/{slug}/reviews` BE·Review 도메인 owner = **#120(공방 리뷰 전체보기)**. **공방 상세(#118)** 는 동일 엔드포인트를 **리뷰 미리보기(`?limit=3&sort=latest`)** 로 소비만. 본 문서는 #120의 FE 화면 부분으로, 계약을 재정의하지 않고 **참조·정합**한다 (query SSOT = `packages/shared/src/contracts/store-query.ts`, 응답 SSOT는 FE 구현 시 `store-reviews.ts`로 생성 필요).
- Figma 화면 스냅샷(2026-06-08 첨부): 섹션 `리뷰 리스트 조회`. 공방 진입 타이틀은 `{공방명} 리뷰`, 클래스 진입 타이틀은 `클래스 리뷰`. 공방 리뷰 목록에서는 클래스명 태그를 표시하고, 클래스 리뷰 목록에서는 클래스명 태그를 숨긴다. 리뷰 카드는 별점·마스킹 ID·본문·이미지(0~3장, 탭 시 확대)·최대 본문 500자, 빈 상태 문구는 `아직 등록된 리뷰가 없습니다.`
- Relevant design docs: `DESIGN.md` (작업 시작 조건). 코드 자산: `apps/web/src/entities/review/ui/Item.tsx`(전체 목록용 리뷰 카드: rating·userId·contents·images·tagLabel), `entities/review/ui/CardItem.tsx`(컴팩트형), `@todam/ui` `Rating`. 라우트 스텁: `apps/web/src/app/(user)/stores/[slug]/reviews/page.tsx`(현재 `<div>공방 리뷰</div>`).
- Open decisions: 아래 "Open decisions" 절 참조.

## API Contract (스냅샷)

> 정본 = Notion API명세 DB "공방 리뷰 목록" + 현재 BE 구현. **공방 상세 plan과 동일 엔드포인트** — 본 plan에서 계약을 재정의하지 않는다. 공방 상세는 `?limit=3&sort=latest`(미리보기), 본 기능은 `?cursor=...&limit=10&sort=latest|rating_high`(전체 목록 무한스크롤). 응답 스키마는 100% 동일.

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
  photos: { imageUrl: string }[]   // 0~3장. imageUrl=원본(목록·확대 공용, next/image 리사이즈)
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
                        {
                            "imageUrl": "https://cdn.todam.example/reviews/review-uuid-001/1.jpg"
                        }
                    ],
                    "programTitle": "머그컵 만들기",
                    "createdAt": "2026-05-24T12:00:00.000Z"
                }
            ],
            "pageInfo": {
                "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTI0VDEyOjAwOjAwLjAwMFoiLCJpZCI6InJldmlldy11dWlkLTAwMSJ9",
                "hasNext": true
            }
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
    - shared 계약 **참조**: 현재 query SSOT는 `packages/shared/src/contracts/store-query.ts`(`listStoreReviewsQuerySchema`, `StoreReviewSort`). 응답 SSOT(`storeReviewListResultSchema`/`StoreReviewListItem`)가 없으면 본 FE 구현에서 `packages/shared/src/contracts/store-reviews.ts`를 생성하되 BE DTO와 동일 스키마로 만들고 중복 정의 금지.
    - api 함수 `getStoreReviews(slug, { cursor, limit, sort })` + react-query 훅(`useStoreReviewsInfinite`) — 신규 `features/store/reviews/` (또는 `features/review/store-list/`). `apiFetch<StoreReviewListResult>('/stores/${slug}/reviews?...')`.

- Out (다른 plan 소유 / 본 기능 제외):
    - **`GET /stores/{slug}/reviews` BE 엔드포인트 + Review 도메인 구현** → **#120(공방 리뷰 전체보기)** BE 소유. 공방 상세(#118)는 미리보기로 소비만. 본 plan(이 문서)은 #120의 FE 화면 부분.
    - **공방 상세 화면의 리뷰 미리보기(대표 3개, `limit=3&sort=latest`)** → 공방 상세 plan 소유. 본 plan은 "리뷰 더보기" 버튼의 **목적지 화면**만 담당(버튼 자체는 공방 상세).
    - **클래스 상세의 프로그램 리뷰 목록**(`GET /stores/{slug}/programs/{programId}/reviews`) → 별도 기능. 응답 스키마는 유사하나 본 plan 범위 밖. 단, Figma가 같은 리뷰 목록 패턴을 공유하므로 공용 UI 컴포넌트는 `showProgramTag` 같은 옵션으로 공방/클래스 차이(클래스명 태그 표시 여부)를 처리할 수 있다.
    - 리뷰 작성/수정/삭제(`POST/PUT/DELETE`) → 예약 도메인 plan들 소유.
    - 마스킹·`is_visible`·정렬·커서 산출 등 서버 로직 → BE(#120).

## Plan

1. shared 계약 정합: `packages/shared/src/contracts/store-query.ts`의 `listStoreReviewsQuerySchema`/`StoreReviewSort`를 import. 응답 스키마 파일이 없으면 동일 스키마로 생성(zod: `storeReviewPhotoSchema`, `storeReviewListItemSchema`, `storeReviewListResultSchema`) + 전용 `STORE_REVIEWS_PAGE_SIZE = 10`.
2. `features/store/reviews/api.ts`: `getStoreReviews(slug, params)` — `apiFetch<StoreReviewListResult>`, query 직렬화(`cursor/limit/sort`).
3. `features/store/reviews/queries.ts`: react-query 훅. 404/403/401 no-retry(기존 `retry` 패턴 재사용), `sort` 별 queryKey 분리. `useInfiniteQuery`, `getNextPageParam` = `lastPage.pageInfo.hasNext ? lastPage.pageInfo.nextCursor : undefined`.
4. 리뷰 카드: `entities/review`의 `Item` 재사용 검토 → 부족하면 `features/store/reviews/ui/StoreReviewItem.tsx`. nickname/rating/content/photos(program thumbnailUrl + 원본 imageUrl)/programTitle(tagLabel)/createdAt 매핑. 공방 목록은 `programTitle` 태그 표시, 클래스 목록 패턴에서는 태그 숨김.
5. 정렬 토글 UI(`latest` 기본, `rating_high`). 변경 시 cursor 초기화.
6. 리스트, 빈 상태(`아직 등록된 리뷰가 없습니다.`), 에러/로딩 상태 조립 → `page.tsx`(server) + client 컴포넌트. **요약 헤더 없음**.
7. 이미지 확대보기(썸네일 → `imageUrl` 라이트박스/오버레이). 원본 URL은 BE 응답의 공개 URL 사용.
8. MSW 핸들러(`mocks/handlers.ts`)에 `GET /stores/:slug/reviews` 추가(미리보기와 공유, sort/cursor 분기) → UI 단독 검증.
9. 실 API 연동: BE(#120) 엔드포인트 동작 확인 후 MSW 해제·연동 검증(정렬·커서·404·빈 상태).
10. Storybook: 신규 UI 컴포넌트 등록(DESIGN.md 규칙).

## Out (단계별 완료물)

- API: `GET /stores/{slug}/reviews` (커서 기반, 공개) 구현 완료 — store 모듈에 추가.
    - 라우트/핸들러: `apps/api/src/modules/store/presentation/controllers/store.controller.ts` (`listStoreReviews`, `stores/:slug/programs` 뒤·정적 라우트와 충돌 없게 등록)
    - use-case: `apps/api/src/modules/store/application/use-cases/list-store-reviews.use-case.ts`
    - 커서 유틸: `apps/api/src/modules/store/application/use-cases/store-reviews-cursor.ts` (latest=`{createdAt,id}`, rating_high=`{rating,createdAt,id}`, base64url)
    - query DTO/pipe: `apps/api/src/modules/store/presentation/dto/list-store-reviews.dto.ts`, `.../pipes/list-store-reviews-query.pipe.ts` (cursor/limit/sort, sort enum=`latest|rating_high`, 기본 latest, limit 기본 10)
    - response DTO: `apps/api/src/modules/store/presentation/dto/list-store-reviews-response.dto.ts` (`reviews[]{id,nickname(마스킹),rating,content,photos[{imageUrl,thumbnailUrl}],programTitle,createdAt}` + `pageInfo{nextCursor,hasNext}`, totalCount/averageRating 미포함)
    - 모듈 등록: `apps/api/src/modules/store/store.module.ts`
    - 동작: PUBLISHED 공방 아니면 404 `STORE_NOT_FOUND` / `isVisible=true` 필터 / programTitle=Review→Reservation→Program.title / nickname 마스킹(앞 3글자 노출)
- UI: `/stores/[slug]/reviews` 페이지 구현 완료. `StoreReviewsClient`에서 헤더 타이틀(`{공방명} 리뷰`), 정렬 토글(`latest`/`rating_high`), 커서 무한스크롤, 빈 상태(`아직 등록된 리뷰가 없습니다.`), 리뷰 카드(별점·마스킹 ID·본문·이미지·클래스 태그), 이미지 확대 모달을 제공.
- 연동: `packages/shared/src/contracts/store-reviews.ts` 응답 스키마/타입 추가, `features/store/reviews/api.ts`의 `getStoreReviews(slug,{cursor,limit,sort})`와 `useStoreReviewsInfinite`를 실 API `GET /stores/{slug}/reviews`에 바인딩. MSW `GET /api/v1/stores/:slug`, `GET /api/v1/stores/:slug/reviews` mock 추가.

## Risks

- 동일 엔드포인트 계약을 두 plan(공방 상세·본 기능)이 공유 → 스키마 drift 위험. **반드시 `packages/shared` 단일 계약 import**, plan 간 중복 정의 금지.
- **커서 무한스크롤 확정** → 동일 엔드포인트의 공방 상세(#118) 계약(offset)과 어긋남. **두 plan/Notion 명세 동기화 필수**(미동기화 시 BE 구현이 한쪽만 맞음).
- 이미지 확대: `photos.imageUrl`(원본) 확정. 원본이 공개 URL인지(서명 불요) BE 확인.
- DESIGN.md에 리뷰 목록/카드 전용 토큰(정렬 토글, 카드 size/state, 이미지 그리드, 클래스 태그) 미정의 → 코딩 전 확보 필요(작업 시작 조건).

## Validation

- Tests: 계약 스키마 zod parse(200 응답 fixture), `getStoreReviews` 쿼리 직렬화(`cursor/limit/sort`), 정렬 토글 시 cursor 리셋 동작, 404→에러 화면 분기.
- Manual checks: latest/rating_high 정렬 전환, 다음 cursor 로드, 빈 상태(reviews=[]), 이미지 확대, 공방 목록 클래스명 태그 표시, 비공개/미존재 slug 404 화면.
- Observability: 404/500 에러 토스트·에러 바운더리 경로 확인.

## Decision Log

- 2026-06-04: **reviews BE 소유 = #120 확정.** 기존 이슈 #120(공방 리뷰 전체보기)이 Review 도메인 전체(엔티티·레포지토리·유스케이스·StoreReviewController)를 보유 → `GET /stores/{slug}/reviews` BE는 #120이 구현·관리, 공방 상세(#118)는 미리보기로 소비만. 본 문서 내 과거 "#118 소유" 표현은 모두 **#120 소유**로 정정. (중복 이슈 신규 생성 안 함 — #120 사용)
- 본 기능은 FE 전용(화면). BE 중복 구현하지 않음 — 코드베이스 상태(`(user)/stores/[slug]/page.tsx`·`reviews/page.tsx` 모두 스텁) 확인.
- API 계약(데이터모델/엔드포인트/에러)은 Notion "공방 리뷰 목록" 정본 기반. 공방 상세 미리보기와 응답 스키마 동일.
- 2026-06-04: **UI 기준 확정** — 커서 무한스크롤(`pageInfo{nextCursor,hasNext}`, offset `pagination` 폐기), **정렬 토글(`latest`/`rating_high`) 유지**(#120 FE 담당 판단), 요약 헤더 없음, `photos`에 확대용 `imageUrl` 추가, `totalCount`/`averageRating` 응답 제거. → 공방 상세(#118) reviews 계약도 커서·photos.imageUrl로 동기화(완료).
- 2026-06-08: 첨부 Figma `리뷰 리스트 조회` 반영. 공방 리뷰 목록은 `{공방명} 리뷰` 타이틀 + 클래스명 태그 표시, 클래스 리뷰 목록은 `클래스 리뷰` 타이틀 + 클래스명 태그 숨김. 본 plan은 `/stores/[slug]/reviews` 공방 목록만 구현 대상으로 유지.

## UI 규칙

- UI: DESIGN.md 준수. 컬러는 semantic→primitive 토큰만, sizing/gap/padding/radius는 Tailwind 기본 스케일만(arbitrary value 금지). 상호작용 상태는 props 금지, native + Tailwind state variant.
- 작업 시작 조건(DESIGN.md): 아래 토큰이 확보되어야 코딩 시작 — 미확보 시 Open decision으로 질의.
    - 정렬 토글(세그먼트): variant/size enum, state(선택·hover) 토큰.
    - 리뷰 카드: size별 height/padding/gap/radius, 사진 썸네일 크기·radius(기존 `Item`은 128px·`CardItem`은 56px — 전체보기용 규격 확정 필요).
    - 클래스 태그/이미지 그리드/빈 상태 타이포·간격.

## Open decisions

1. ~~페이지네이션 방식~~ — **확정: 커서 기반 무한스크롤**(UI 기준). `pageInfo{nextCursor,hasNext}`.
2. ~~정렬 토글~~ — **확정: 유지(`latest`/`rating_high`)**. ~~요약 헤더~~ — **확정: 없음**.
3. ~~이미지 확대 원본~~ — **확정: `photos`에 `imageUrl`(원본) 추가**, 썸네일 탭 시 imageUrl로 확대.
4. route group: 전체보기 화면이 BottomNav 유지(`(user)`) vs 서브 화면(`(sub)` 헤더만). DESIGN.md상 BottomNav 직접 접근 불가 → **`(sub)` 후보**. (미확정 — 라우팅 결정)
5. ~~`limit` 기본값~~ — **확정: 10**(BE Swagger example/query 기본, 기존 plan 확정값과 동일). FE 상수 `STORE_REVIEWS_PAGE_SIZE = 10`.
6. 리뷰 카드 컴포넌트: 기존 `entities/review/Item` 재사용 vs store 전용 신규(createdAt 슬롯 없음). 작성일 노출 위치 디자인 확인.
7. DESIGN.md에 리뷰 카드/이미지 그리드/클래스 태그 전용 토큰 미정의 → Figma 확인(작업 시작 조건).

## Outcome

- Status: FE implemented (review/merge 대기)
- Follow-up: `docs/api/apispec.md`가 아직 offset/pagination 표기를 포함하므로 커서 계약으로 동기화 필요.
