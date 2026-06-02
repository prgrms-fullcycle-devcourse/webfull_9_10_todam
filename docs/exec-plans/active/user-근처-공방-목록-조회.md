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

- [ ] API 구현
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
- Open decisions:
  1. **(Contract gap) — 결정됨(2026-06-02): (a) `/stores` 응답에 카드 필드 추가.** UI 카드가 렌더하는 항목을 응답 `data.stores[]`에 추가한다. 메인 목록 1회 호출로 카드 전체 렌더.
     - `thumbnailUrl: string | null` — 대표 이미지
     - `rating: number | null` — 별점. **리뷰 0건이면 `null`** (FE는 미표시)
     - `reviewCount: number` — 리뷰 수. 없으면 `0`
     - `region: string` — 행정동명(예: `성수동`). **카카오 `coord2regioncode`를 공방 등록/주소수정 시점에 1회 호출해 컬럼에 저장**, 목록 조회는 저장값만 반환(조회당 외부 API 호출 0). 사용자 현재위치 라벨은 FE가 본인 좌표로 카카오 1회 호출.
     - `distance: number` — 사용자 좌표 기준 거리, **미터(정수)**. FE가 km로 포맷.
     - `representativeClass: { name: string, price: number } | null` — 대표 클래스명·가격(KRW 정수)
     - `isOperating: boolean` — 현재 공방 운영시간 내 여부. `false` 면 카드 썸네일에 **"준비 중"** 뱃지. (※ 운영시간 데이터 의존 — Risks 참조)
  2. **(거리/반경) — 결정됨(2026-06-02): 반경 제한 없음, distance 응답 포함.** `radius` 파라미터를 두지 않고 거리순 정렬 + 무한스크롤로 전체를 페이징한다. `distance`(미터)는 응답에 포함(#1).
  3. **(페이지네이션) — 결정됨(2026-06-02): 무한스크롤 적용.** 메인 목록은 무한스크롤로 페이징한다. 이에 따라 `GET /stores`에 페이지네이션 파라미터/응답 메타가 추가되어야 함(아래 Contract 스냅샷 반영). cursor 기반 vs offset(page/limit) 기반 중 **offset(page/limit) 기준**으로 잠정 확정하되, 정렬이 거리순이므로 페이지 경계 안정성(동일 거리 tie-break)은 BE에서 `id` 보조정렬로 보장. → **BE는 API명세 갱신 후 구현.**
  4. **(위치 권한 거부 폴백) — 결정됨(2026-06-02): 기본 위치 = 성수동.** 권한 거부/획득 실패 시 FE가 성수동 기준 좌표(`lat=37.5446`, `lng=127.0560`)를 채워서 `GET /stores`를 호출한다(BE는 lat/lng를 항상 좌표로만 처리, 기본값 로직은 FE 보유). 향후 기준점 변경 가능성 대비 상수로 분리.

## API Contract (스냅샷)

<!-- API명세 DB(GET /stores?lat=&lng=&keyword=)를 그대로 고정. Notion 원본이 바뀌면 재plan. -->

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
| `region` | string | 행정동명(예: `성수동`). 카카오 coord2regioncode 등록시 저장 |
| `thumbnailUrl` | string \| null | 카드 대표 이미지 |
| `rating` | number \| null | 별점. 리뷰 0건이면 `null` |
| `reviewCount` | number | 리뷰 수. 없으면 `0` |
| `distance` | number | 사용자 좌표 기준 거리, **미터(정수)**. FE가 km 포맷 |
| `representativeClass` | object \| null | `{ name: string, price: number(KRW) }`. 대표 클래스 |
| `isOperating` | boolean | 현재 운영시간 내 여부. `false`→"준비 중" 뱃지 |
| `publishedAt` | string (ISO) | 공개 시각 |
| `createdAt` | string (ISO) | 생성 시각 |

> UI(검수 완료) 카드 기준으로 `thumbnailUrl`/`rating`/`reviewCount`/`region`/`distance`/`representativeClass`/`isOperating` 를 응답에 포함하기로 확정(Open decisions #1). **API명세 DB 원본에는 아직 없으므로 BE 구현 전 API명세 갱신 필요.**

### 엔드포인트

#### `GET /stores?lat=&lng=&keyword=` — 공방 목록 탐색 (위치/키워드)

- 인증: 불필요 (Guest·User 공통 공개 조회)
- Headers: `Accept: application/json`
- Query Parameters (전부 선택):
  - `lat`: 검색 중심 위도 (예: `37.5665`) — 권한 거부 시 FE가 성수동 기본값 `37.5446` 전송 (Open decisions #4)
  - `lng`: 검색 중심 경도 (예: `126.9780`) — 권한 거부 시 FE가 성수동 기본값 `127.0560` 전송 (Open decisions #4)
  - `keyword`: 공방 이름(`name`) 또는 주소(`address`) 부분일치(LIKE) 검색어
  - `page`: 페이지 번호 (1부터, 기본 `1`) — 무한스크롤 (Open decisions #3, **API명세 갱신 필요**)
  - `limit`: 페이지당 항목 수 (기본 `20`) — 무한스크롤 (Open decisions #3, **API명세 갱신 필요**)
- 시스템 처리:
  - 파라미터 형식 검증
  - `status = 'PUBLISHED'` 공방만 필터
  - `keyword` 있으면 `name` 또는 `address` LIKE 필터
  - `lat`/`lng` 기준 좌표↔공방 좌표 거리 연산 → `distance`(미터) 산출, 거리순 정렬 (동일 거리는 `id` 보조정렬로 페이지 경계 안정화)
  - **반경(radius) 제한 없음** — 전체를 거리순 정렬 후 무한스크롤로 페이징 (Open decisions #2)
  - `rating`/`reviewCount`(리뷰 집계), `representativeClass`(대표 클래스), `isOperating`(운영시간 대비 현재시각) 산출
  - `page`/`limit` 로 offset 페이징
- 응답 `200 OK`:

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
        "slug": "todam-jeonju",
        "name": "토담 전주 한옥마을점",
        "description": "한옥의 고즈넉함 속에서 즐기는 도자기 물레 체험 공방입니다.",
        "phone": "063-123-4567",
        "address": "전북 전주시 완산구 교동 한옥마을길 12",
        "status": "PUBLISHED",
        "convenienceInfo": { "parking": true, "pet": false, "wifi": true },
        "autoConfirm": false,
        "region": "성수동",
        "thumbnailUrl": "https://cdn.todam.example/stores/todam-jeonju/thumb.jpg",
        "rating": 4.9,
        "reviewCount": 253,
        "distance": 1400,
        "representativeClass": { "name": "머그컵 만들기", "price": 45000 },
        "isOperating": true,
        "publishedAt": "2026-05-25T10:00:00.000Z",
        "createdAt": "2026-05-24T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 137,
      "hasNext": true
    }
  },
  "error": null
}
```

> 주의: `data.pagination` 은 무한스크롤 결정(Open decisions #3)에 따라 plan에서 추가한 contract이며, **API명세 DB 원본에는 아직 없음**. BE 구현 전 API명세 갱신으로 확정 필요.

- 응답 `400 Bad Request` (`INVALID_QUERY_PARAMETERS`): 위도/경도가 숫자 형식이 아닌 경우 — `data: null`
- 응답 `500 Internal Server Error` (`INTERNAL_SERVER_ERROR`): 서버 내부 오류 — `data: null`

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
3. **FE — 데이터 계층**: `GET /stores` 호출 클라이언트 + 응답 타입(Store, Pagination) 정의. 위치 권한(Geolocation) 획득 → 성공 시 lat/lng 전달, 거부/실패 시 **성수동 기본 좌표(`37.5446`, `127.0560`) 상수로 폴백**(#4). 무한스크롤: `page` 증가 + `hasNext` 기반 다음 페이지 fetch(#3).
4. **FE — UI**: 메인 공방 목록 섹션 + 공방 카드 컴포넌트(DESIGN.md 준수). 로딩/빈상태/에러 상태 + **무한스크롤(IntersectionObserver 등)**. 카드 클릭 → `/stores/[slug]`.
5. **연동**: MSW mock → 실 API 전환 검증. 권한 허용/거부 두 경로 모두 확인.

## Out (단계별 완료물)

- API: <!-- GET /stores 엔드포인트, 파일 -->
- UI: <!-- 메인 공방 목록 섹션, 공방 카드 컴포넌트 -->
- 연동: <!-- 실 GET /stores 바인딩, 권한 허용/거부 경로 검증 결과 -->

## Risks

- **운영시간 데이터 의존 (높음)**: `isOperating`("준비 중")은 공방 운영시간 데이터가 있어야 계산 가능. 현재 Store 모델에 운영시간 필드가 없으면 선행/병행으로 운영시간 스키마가 필요(이 기능 범위 밖일 수 있음). 미비 시 `isOperating` 산출 불가 → BE 확인 필요.
- **카카오 coord2regioncode 의존**: `region`은 공방 등록/주소수정 시 카카오 API로 채워야 함. 기존 공방 데이터에 `region` 백필(backfill) 필요. 외부 API 장애/쿼터 고려.
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
- 2026-06-02: Open decision #3 → **무한스크롤 적용** 확정. `page`/`limit` query + `data.pagination{page,limit,total,hasNext}` 응답 메타를 contract에 추가(API명세 DB 갱신 필요). offset 페이징, 거리 동률은 `id` 보조정렬.
- 2026-06-02: Open decision #4 → **위치 권한 거부 시 기본 위치 = 성수동** 확정. FE가 `lat=37.5446`, `lng=127.0560` 을 채워 호출. 기본 좌표는 FE 상수로 분리.
- 2026-06-02: **Source of truth = 검수 완료된 UI 화면**으로 합의. 메인 "근처 공방" 카드 디자인 기준으로 #1·#2 확정.
- 2026-06-02: Open decision #1 → **(a) `/stores` 응답에 카드 필드 추가** 확정. `thumbnailUrl, rating(리뷰0=null), reviewCount, region, distance(미터), representativeClass{name,price}, isOperating` 추가. `isOperating`은 운영시간 기준 현재 운영여부(="준비 중" 반대).
- 2026-06-02: Open decision #2 → **반경 제한 없음 + distance(미터) 응답 포함** 확정. radius 파라미터 미도입, 거리순 정렬 + 무한스크롤.
- 2026-06-02: `region`은 **카카오 `coord2regioncode`를 공방 등록/주소수정 시점에 호출해 컬럼 저장**하는 방식으로 확정(조회당 외부호출 0). 사용자 위치 라벨만 FE가 카카오 1회 호출.

## Outcome

- Status: Open decisions #1~#4 전부 확정(UI 기준). API명세 DB 갱신 + 팀(BE) approve 대기.
- Follow-up: API명세 갱신 후 implementer로 인계. `isOperating` 위한 운영시간 데이터 존재여부 BE 확인 필요.
