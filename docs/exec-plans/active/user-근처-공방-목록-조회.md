# Feature Plan: user-근처-공방-목록-조회 (근처 공방 목록 조회)

## Summary

- Goal: 메인 화면 진입 시 사용자 현재 위치(위도/경도) 기반으로 공개(PUBLISHED) 공방 목록을 거리순으로 조회·표시한다. 위치 권한 거부 시 기본 지역 기준으로 폴백한다.
- Owner: TBD
- Date: 2026-06-02

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
- API 구현: 실 BE(apps/api) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: 실 API 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크.
-->

- [x] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md — `store` 도메인(공방 조회, `/stores/[slug]` 접근 규칙: PUBLISHED만 노출), 접근 주체(Guest·User)
- 기능명세: 근처 공방 목록 조회 (기능명세 DB select 완료)
  - 실행주체: guest, user / 도메인: store / 우선순위: 상 / 연관화면: 메인
  - 선행조건: 위치 정보 접근 권한 허용
  - 트리거: 메인 화면 진입 / 새로고침
  - 동작: 현재 위치 조회 → 주변 공방 목록 조회 → 썸네일·이름·위치·평점·리뷰수·거리·대표 클래스/가격 표시
  - 예외: 위치 권한 거부 시 기본 지역 기준 조회 / 결과 없으면 빈 상태 / 비공개·삭제 공방 제외 / 네트워크 오류
  - 비고: 거리순 정렬 기본, 공방 상세로 이동 가능
- API명세: `GET /stores?lat=&lng=&keyword=` ("공방 목록 탐색 (위치/키워드)") — API명세 DB select 완료
- Relevant design docs: DESIGN.md (공방 카드 컴포넌트). UI: DESIGN.md 준수.
- Source of truth: **UI 화면(검수 완료)**. 아래 결정은 메인 화면 "근처 공방" 카드 디자인을 기준으로 확정함.
- Open decisions: 모두 확정 — 상세는 아래 Decision Log 참조. Notion API명세 원본 2026-06-09 재동기화로 카드 필드·커서 페이지네이션·반경 제한 없음 전부 공식 반영 확인.

## API Contract (스냅샷)

<!-- API명세 DB(GET /stores?lat=&lng=&keyword=) 2026-06-09 재동기화. Notion 원본이 바뀌면 재plan. -->

### 데이터모델 — Store (응답 항목)

| 필드 | 타입 | 비고 |
|------|------|------|
| `id` | string (uuid) | 공방 ID |
| `partnerId` | string (uuid) | 소유 파트너 ID |
| `slug` | string | 상세 진입 경로 `/stores/[slug]` 키 |
| `name` | string | 공방명 |
| `description` | string | 공방 소개 |
| `phone` | string | 대표 연락처 |
| `address` | string | 도로명 주소 |
| `status` | string | 항상 `PUBLISHED`만 반환 |
| `convenienceInfo` | object | `{ parking: boolean, pet: boolean, wifi: boolean }` |
| `autoConfirm` | boolean | 자동 예약 확정 여부 |
| `region` | object | `{ sido, sigungu, dong }` (예: `{"서울","성동구","성수동"}`). 카카오 coord2regioncode를 공방 등록·주소수정 시 1회 호출해 Store 컬럼에 저장 — 조회 시 외부 호출 없음. 근처 카드=`dong`, 검색 카드=전체 문자열. |
| `thumbnailUrl` | string \| null | 공방 대표 이미지(StoreImage, isThumbnail). 없으면 `null` |
| `rating` | number \| null | `Review.rating` 평균(`isVisible=true`). 리뷰 0건이면 `null` |
| `reviewCount` | number | 리뷰 수(`isVisible=true`). 없으면 `0` |
| `distance` | number | 사용자 좌표 기준 거리, **미터(정수)**. `Store.latitude/longitude` 기준. FE가 km 포맷 |
| `representativeClass` | object \| null | `{ name: string, price: number(KRW), hasMore: boolean }`. 노출 가능 Program 중 **최저가** 1개. `hasMore`=노출 클래스 2개↑ → FE "~" 표시. 0개면 `null` |
| `matchedClass` | object \| null | `{ name, price }`. `keyword`가 해당 공방의 ACTIVE Program명에 매칭될 때만 non-null(다건이면 최저가). FE는 있으면 이걸, 없으면 `representativeClass` 렌더 |
| `isOperating` | boolean | 현재 운영시간 내 여부(`StoreOperatingHour` 요일·openTime·closeTime·break 기준, KST). `false` → 카드 "준비 중" 뱃지 |
| `publishedAt` | string (ISO) | 공개 시각 |
| `createdAt` | string (ISO) | 생성 시각 |

### 엔드포인트

#### `GET /stores?lat=&lng=&keyword=` — 공방 목록 탐색 (위치/키워드)

- **인증**: 불필요 (Guest·User 공통 공개 조회)
- **Headers**: `Accept: application/json`
- **Query Parameters** (전부 선택):
  - `lat`: 검색 중심 위도 (예: `37.5665`) — 권한 거부 시 FE가 성수동 기본값 `37.5446` 전송
  - `lng`: 검색 중심 경도 (예: `126.9780`) — 권한 거부 시 FE가 성수동 기본값 `127.0560` 전송
  - `keyword`: 공방 이름(`name`)·주소(`address`) + **ACTIVE Program.title** 부분일치(LIKE) 검색어
  - `cursor`: 다음 페이지 커서 (opaque, 첫 페이지는 미전송) — 커서 기반 무한스크롤
  - `limit`: 페이지당 항목 수 (기본 `20`)
- **시스템 처리**:
  - 파라미터 형식(lat/lng 숫자 여부) 검증
  - `status = 'PUBLISHED'` 공방만 필터
  - `keyword` 있으면 `name`/`address` + ACTIVE `Program.title` LIKE 필터(programs Left Join). 프로그램명 매칭 시 해당 공방 `matchedClass`(매칭 프로그램 중 최저가) 산출
  - `lat`/`lng` 기준 Haversine 거리 연산 → `distance`(미터) 산출, 거리순 정렬. 동일 거리는 `id` 보조 정렬(페이지 경계 안정화)
  - **반경 제한 없음** — 전체를 거리순 정렬 후 cursor 기반 무한스크롤로 페이징
  - `rating`/`reviewCount` 집계, `representativeClass`(최저가+hasMore), `isOperating`(KST), `region`(저장된 컬럼 반환) 산출
  - **커서 기반 페이징**: cursor 디코드 → 해당 지점 이후 limit개 조회, `nextCursor`/`hasNext` 산출. lat/lng 있을 때 커서 payload `{ distance, id }`, 없을 때 `{ id }`(또는 `{ publishedAt, id }`). 후속 요청에 최초 lat/lng 고정 필수

- **응답 `200 OK`**:

```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T17:50:00.123Z",
  "path": "/stores",
  "message": "공방 목록이 성공적으로 탐색되었습니다.",
  "data": {
    "stores": [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
        "slug": "plus-doja",
        "name": "플러스 도자기",
        "description": "성수동 감성을 담은 도자기 공방입니다.",
        "phone": "02-1234-5678",
        "address": "서울특별시 성동구 성수이로 12길 34",
        "status": "PUBLISHED",
        "convenienceInfo": { "parking": true, "pet": false, "wifi": true },
        "autoConfirm": false,
        "region": { "sido": "서울", "sigungu": "성동구", "dong": "성수동" },
        "thumbnailUrl": "https://cdn.todam.example/stores/plus-doja/thumb.jpg",
        "rating": 4.9,
        "reviewCount": 253,
        "distance": 1200,
        "representativeClass": { "name": "머그컵 만들기", "price": 30000, "hasMore": true },
        "matchedClass": { "name": "성수동 감성 빈티지 볼 그릇", "price": 45000 },
        "isOperating": true,
        "publishedAt": "2026-05-25T10:00:00.000Z",
        "createdAt": "2026-05-24T12:00:00.000Z"
      }
    ],
    "pageInfo": {
      "nextCursor": "eyJkaXN0YW5jZSI6MTIwMCwiaWQiOiJhMWIyYzNkNCJ9",
      "hasNext": true
    }
  },
  "error": null
}
// matchedClass는 위치 기반 단순 조회(keyword 없음/공방·지역 매칭) 시 null.
// nextCursor는 마지막 페이지에서 null.
```

- **응답 `400 Bad Request`** (`INVALID_QUERY_PARAMETERS`): 위도/경도가 숫자 형식이 아닌 경우 — `data: null`
- **응답 `500 Internal Server Error`** (`INTERNAL_SERVER_ERROR`): 서버 내부 오류 — `data: null`

## Scope

- In:
  - `GET /stores` (lat/lng/keyword) 위치 기반 PUBLISHED 공방 목록 조회 API
  - 메인 화면 공방 목록 섹션: 위치 권한 요청 → 좌표로 호출 → 카드 리스트 렌더
  - 빈 상태(결과 0건), 에러 상태(네트워크/400/500) 처리
  - 카드 → 공방 상세(`/stores/[slug]`) 이동
- Out:
  - 공방 상세 조회(`/stores/{slug}`) — 별도 기능
  - 키워드 검색 전용 화면(`/stores/search`, autocomplete) — 별도 기능
  - 찜 등록/해제 — 별도 기능
  - 외부 지도 API 좌표 변환(공방 등록 시 처리), 실시간 지도 표시
  - 위치 기반 추천 정책 확장(비고의 향후 항목)

## Plan

1. **Contract 확정**: Open decisions #1~#4 모두 확정됨(UI 기준). 남은 작업은 **API명세 DB를 이 스냅샷대로 갱신**(카드 필드·pagination·radius 없음 반영)하는 것.
2. **BE**: `GET /stores` 구현 — 쿼리 검증, PUBLISHED 필터, keyword LIKE, lat/lng 거리순 정렬(+`distance` 미터 산출), `region`/`thumbnailUrl`/`rating`/`reviewCount`/`representativeClass`/`isOperating` 응답, offset 페이징. 응답 envelope 준수.
3. **FE — 데이터 계층**: `GET /stores` 호출 클라이언트 + 응답 타입(Store, Pagination) 정의. 위치 권한(Geolocation) 획득 → 성공 시 lat/lng 전달, 거부/실패 시 **성수동 기본 좌표(`37.5446`, `127.0560`) 상수로 폴백**(#4). 커서 기반 무한스크롤: 응답 `nextCursor`를 다음 요청 `cursor`로 전달, `hasNext`로 종료 판단. 후속 요청에 최초 `lat`/`lng` 동일 유지(#3).
4. **FE — UI**: 메인 공방 목록 섹션 + 공방 카드 컴포넌트(DESIGN.md 준수). 로딩/빈상태/에러 상태 + **무한스크롤(IntersectionObserver 등)**. 카드 클릭 → `/stores/[slug]`.
5. **연동**: MSW mock → 실 API 전환 검증. 권한 허용/거부 두 경로 모두 확인.

## Out (단계별 완료물)

- API: `GET /stores` (공방 목록 탐색 + 검색 통합) 구현 완료. 응답 envelope/카드필드/커서 페이징/거리순/keyword(name·address·ACTIVE Program.title)·matchedClass·isOperating(KST) 전부 contract 스냅샷 1:1.
  - 라우트/컨트롤러: `apps/api/src/modules/store/presentation/controllers/store.controller.ts` (`@Get('stores')`, 공개·무인증)
  - 유스케이스: `apps/api/src/modules/store/application/use-cases/list-stores.use-case.ts` (PUBLISHED 필터, Haversine 거리, 거리순/publishedAt순 분기, 집계 rating/reviewCount/representativeClass{hasMore}/matchedClass/thumbnail/region/isOperating)
  - 커서 코덱: `apps/api/src/modules/store/application/use-cases/store-cursor.ts` (base64url opaque, lat/lng 있으면 `{distance,id}` / 없으면 `{publishedAt,id}`)
  - 쿼리 DTO: `apps/api/src/modules/store/presentation/dto/list-stores.dto.ts` (lat/lng/keyword/cursor/limit 전부 선택, limit 기본 20)
  - 응답 DTO: `apps/api/src/modules/store/presentation/dto/list-stores-response.dto.ts` (`stores[]` + `pageInfo{nextCursor,hasNext}`, region 객체 `{sido,sigungu,dong}`)
  - 검증 파이프: `apps/api/src/modules/store/presentation/pipes/list-stores-query.pipe.ts` (lat/lng 형식 오류 → 400 `INVALID_QUERY_PARAMETERS`). 서버 내부 오류는 공통 필터가 500 `INTERNAL_SERVER_ERROR`.
  - 모듈 등록: `apps/api/src/modules/store/store.module.ts` (`ListStoresUseCase` provider 추가)
  - 스키마: `Store`에 `regionSido`/`regionSigungu`/`regionDong` 컬럼 추가 — `apps/api/prisma/schema.prisma` + 마이그레이션 `apps/api/prisma/migrations/20260602130000_add_store_region_columns/migration.sql`
  - 빌드/타입체크: `nest build`·`tsc --noEmit` 통과. 신규 파일 lint 클린.
  - **별도 작업(미완·골격만)**: 기존 데이터 region 백필 스크립트 `apps/api/prisma/scripts/backfill-store-region.ts` (카카오 coord2regioncode 호출부 TODO). 운영 작업으로 분리.
- UI: <!-- 메인 공방 목록 섹션, 공방 카드 컴포넌트 -->
- 연동: <!-- 실 GET /stores 바인딩, 권한 허용/거부 경로 검증 결과 -->

## Risks

- **검색 통합으로 인한 재변경(`user-stores-keyword`)**: `keyword`에 ACTIVE `Program.title` 매칭 추가 + 응답 `matchedClass` 추가 + `region` 객체화. programs join으로 쿼리 복잡도↑, 이미 머지된 본체 계약 변경이므로 Notion·구현 동기화 필수.
- **운영시간 데이터 = 확보됨**: `isOperating`("준비 중")은 `StoreOperatingHour`(요일·openTime·closeTime·breakStart/End) 기준으로 계산. 스키마 존재 확인 완료(별도 선행작업 불필요). 시간대(KST) 경계·휴게시간 처리만 주의.
- **신규 스키마 작업 — `Store`에 구조화 region 컬럼(`regionSido`/`regionSigungu`/`regionDong`) 추가 + 마이그레이션 + 기존 데이터 백필**(카카오 coord2regioncode 시·구·동). 외부 API 장애/쿼터 고려. 시도명 약어(서울특별시→서울)·depth 정리 규칙 확정 필요.
- **`representativeClass` 선정 기준**: 노출 가능 Program 중 최저가. "노출 가능"으로 볼 `Program.status` 값 확정 필요. 가격 표시 "~"는 `hasMore`로 FE에서 처리.
- **집계 비용**: `rating`/`reviewCount` 실시간 집계가 목록 N건마다 비싸지면 캐시/비정규화 컬럼 고려.
- Geolocation 권한 거부/타임아웃 처리 미흡 시 메인 진입 경험 저하(폴백 성수동).
- 거리 연산을 DB/앱 중 어디서 수행하는지에 따라 성능 차이(공간 인덱스 필요 여부). 반경 제한 없이 전체 정렬이므로 데이터 증가 시 인덱스·페이징 효율 중요.

## Validation

- Tests: `GET /stores` — lat/lng 거리순 정렬, keyword LIKE 필터, PUBLISHED-only 필터, 잘못된 lat/lng → 400 검증
- Manual checks: 위치 권한 허용/거부 경로, 빈 상태, 네트워크 오류 표시, 카드 → 상세 이동
- Observability: 조회 latency, 권한 거부 비율(폴백 호출 비율)

## Decision Log

- 2026-06-02: 기능명 `user-근처-공방-목록-조회` 는 기능명세 DB의 `근처 공방 목록 조회`(실행주체 guest·user, 도메인 store)로 매칭 확정. 정확 일치 항목은 없었고 후보 중 유일한 의미 일치 항목.
- 2026-06-02: 매핑 API = `GET /stores?lat=&lng=&keyword=` ("공방 목록 탐색 (위치/키워드)"). 별도 `/stores/search`, `/stores/search/autocomplete` 는 검색 전용 기능으로 Out 처리.
- 2026-06-02: Open decision #3 → **커서 기반 무한스크롤** 확정. `cursor`/`limit` query + `data.pageInfo{nextCursor, hasNext}` 응답 메타를 contract에 추가(API명세 DB 갱신 필요). 커서는 정렬키별 분기 인코딩 — **lat/lng 있으면 `{distance, id}`, 없으면 `{id}`(또는 `{publishedAt, id}`)**. 좌표 있을 때 후속 요청 `lat`/`lng` 고정. `total` 미제공. (※ 초기엔 offset page/limit로 검토했으나 커서 기반으로 변경)
- 2026-06-02: Open decision #4 → **위치 권한 거부 시 기본 위치 = 성수동** 확정. FE가 `lat=37.5446`, `lng=127.0560` 을 채워 호출. 기본 좌표는 FE 상수로 분리.
- 2026-06-02: **Source of truth = 검수 완료된 UI 화면**으로 합의. 메인 "근처 공방" 카드 디자인 기준으로 #1·#2 확정.
- 2026-06-02: Open decision #1 → **(a) `/stores` 응답에 카드 필드 추가** 확정. `thumbnailUrl, rating(리뷰0=null), reviewCount, region, distance(미터), representativeClass{name,price}, isOperating` 추가. `isOperating`은 운영시간 기준 현재 운영여부(="준비 중" 반대).
- 2026-06-02: Open decision #2 → **반경 제한 없음 + distance(미터) 응답 포함** 확정. radius 파라미터 미도입, 거리순 정렬 + 무한스크롤.
- 2026-06-02: `region`은 **카카오 `coord2regioncode`를 공방 등록/주소수정 시점에 호출해 컬럼 저장**하는 방식으로 확정(조회당 외부호출 0). 사용자 위치 라벨만 FE가 카카오 1회 호출. → **`Store.region` 컬럼 신규 추가 + 기존 데이터 백필** 필요.
- 2026-06-02: 스키마 직접 확인 — `StoreOperatingHour`(운영시간), `Review.rating/isVisible`(평점·리뷰수), `StoreImage.thumbnailUrl/isThumbnail`(썸네일), `Program.price/sortOrder/status`(클래스), `Store.latitude/longitude`(거리) 모두 존재. **신규 작업은 `Store.region` 컬럼뿐.** `isOperating` 운영시간 의존 리스크 해소.
- 2026-06-02: `representativeClass` → **최저가 Program**을 대표로 선정(동가 `sortOrder`→`id`). 응답에 `hasMore: boolean`(노출 클래스 2개↑) 추가 → FE가 가격 뒤 "~" 표시(예: `10,000~`). 0개면 `null`.
- 2026-06-02: **검색 통합(`user-stores-keyword`)에 따른 본체 계약 변경** — (1) `keyword`에 ACTIVE `Program.title` 매칭 추가, (2) 응답에 `matchedClass{name,price}|null`(키워드-프로그램 매칭 시, 다건 최저가) 추가, (3) `region`을 **구조화 객체 `{sido,sigungu,dong}`**로 변경(컬럼 `regionSido/Sigungu/Dong`). `/stores/search`는 폐기되어 본 엔드포인트로 흡수. 상세는 `user-stores-keyword.md` 참조.

## Outcome

- Status: 모든 결정 확정. Notion API명세 원본(2026-06-09)에 카드 필드(thumbnailUrl·rating·reviewCount·region·distance·representativeClass·matchedClass·isOperating)·커서 기반 페이지네이션·반경 제한 없음이 공식 반영됨을 확인. BE API 구현 완료. FE UI 구현 및 실 API 연동 대기.
- Follow-up: FE 구현자는 이 스냅샷 기준으로 타입·호출 클라이언트 작성. `user-stores-keyword.md`와 contract 동기 유지.
