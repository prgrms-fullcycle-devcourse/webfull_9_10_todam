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
- Open decisions:
  1. **(Contract gap — BE 결정 필요)** 기능명세는 카드에 **썸네일 이미지, 평점(rating), 리뷰 수(reviewCount), 사용자 위치 기준 거리(distance), 대표 클래스명·가격**을 요구한다. 그러나 현재 API명세 `GET /stores` 200 응답 `data.stores[]`에는 이 필드가 **없다**(id, partnerId, slug, name, description, phone, address, status, convenienceInfo, autoConfirm, publishedAt, createdAt만 존재). 아래 중 결정 필요:
     - (a) `/stores` 응답에 `thumbnailUrl`, `rating`, `reviewCount`, `distance`(미터/km), `representativeClass {name, price}` 필드를 추가한다. (권장 — 메인 목록 1회 호출로 카드 렌더 가능)
     - (b) 위 필드는 별도 엔드포인트/집계로 조달하고 카드에서 일부만 표시한다.
     - 결정 전까지 FE 카드의 평점/리뷰/거리/대표클래스 영역은 contract 미확정으로 구현 보류.
  2. **(거리/반경)** API명세에 반경(radius) 파라미터·거리 단위·정렬 보장이 명시되지 않음. `lat`/`lng` 주어지면 거리순 정렬은 명시되나, ① 반경 제한 값(km)과 ② 응답에 distance 포함 여부 확정 필요.
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
| `publishedAt` | string (ISO) | 공개 시각 |
| `createdAt` | string (ISO) | 생성 시각 |

> 주의: 기능명세가 요구하는 `thumbnailUrl` / `rating` / `reviewCount` / `distance` / `representativeClass` 는 현재 contract에 **미포함**. Open decisions #1 참조.

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
  - `lat`/`lng` 있으면 기준 좌표↔공방 좌표 거리 연산 후 거리순 정렬 (동일 거리는 `id` 보조정렬로 페이지 경계 안정화)
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

1. **Contract 확정 (선행)**: Open decisions #1~#4(카드 부가필드, 거리/반경, 페이지네이션, 권한거부 폴백)를 BE/디자인과 합의해 API명세 갱신 후 이 스냅샷 반영. 확정 전 카드 부가영역 구현 보류.
2. **BE**: `GET /stores` 구현 — 쿼리 검증, PUBLISHED 필터, keyword LIKE, lat/lng 거리순 정렬. 응답 envelope(statusCode/timestamp/path/message/data/error) 준수.
3. **FE — 데이터 계층**: `GET /stores` 호출 클라이언트 + 응답 타입(Store, Pagination) 정의. 위치 권한(Geolocation) 획득 → 성공 시 lat/lng 전달, 거부/실패 시 **성수동 기본 좌표(`37.5446`, `127.0560`) 상수로 폴백**(#4). 무한스크롤: `page` 증가 + `hasNext` 기반 다음 페이지 fetch(#3).
4. **FE — UI**: 메인 공방 목록 섹션 + 공방 카드 컴포넌트(DESIGN.md 준수). 로딩/빈상태/에러 상태 + **무한스크롤(IntersectionObserver 등)**. 카드 클릭 → `/stores/[slug]`.
5. **연동**: MSW mock → 실 API 전환 검증. 권한 허용/거부 두 경로 모두 확인.

## Out (단계별 완료물)

- API: <!-- GET /stores 엔드포인트, 파일 -->
- UI: <!-- 메인 공방 목록 섹션, 공방 카드 컴포넌트 -->
- 연동: <!-- 실 GET /stores 바인딩, 권한 허용/거부 경로 검증 결과 -->

## Risks

- **Contract gap (높음)**: 기능명세 카드 요구 필드와 API 응답 불일치. 미해결 시 FE 카드 일부 미구현 또는 추가 호출 발생.
- 페이지네이션 부재로 PUBLISHED 공방 수 증가 시 응답 비대화 가능.
- Geolocation 권한 거부/타임아웃 처리 미흡 시 메인 진입 경험 저하.
- 거리 연산을 DB/앱 중 어디서 수행하는지에 따라 성능 차이(공간 인덱스 필요 여부).

## Validation

- Tests: `GET /stores` — lat/lng 거리순 정렬, keyword LIKE 필터, PUBLISHED-only 필터, 잘못된 lat/lng → 400 검증
- Manual checks: 위치 권한 허용/거부 경로, 빈 상태, 네트워크 오류 표시, 카드 → 상세 이동
- Observability: 조회 latency, 권한 거부 비율(폴백 호출 비율)

## Decision Log

- 2026-06-02: 기능명 `user-근처-공방-목록-조회` 는 기능명세 DB의 `근처 공방 목록 조회`(실행주체 guest·user, 도메인 store)로 매칭 확정. 정확 일치 항목은 없었고 후보 중 유일한 의미 일치 항목.
- 2026-06-02: 매핑 API = `GET /stores?lat=&lng=&keyword=` ("공방 목록 탐색 (위치/키워드)"). 별도 `/stores/search`, `/stores/search/autocomplete` 는 검색 전용 기능으로 Out 처리.
- 2026-06-02: Open decision #3 → **무한스크롤 적용** 확정. `page`/`limit` query + `data.pagination{page,limit,total,hasNext}` 응답 메타를 contract에 추가(API명세 DB 갱신 필요). offset 페이징, 거리 동률은 `id` 보조정렬.
- 2026-06-02: Open decision #4 → **위치 권한 거부 시 기본 위치 = 성수동** 확정. FE가 `lat=37.5446`, `lng=127.0560` 을 채워 호출. 기본 좌표는 FE 상수로 분리.

## Outcome

- Status: 작성 완료, Open decisions(특히 #1 카드 필드) 사람 검토·승인 대기
- Follow-up: Contract 확정 후 implementer로 인계
