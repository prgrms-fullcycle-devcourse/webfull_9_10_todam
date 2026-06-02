# Feature Plan: user-stores-keyword (공방 검색)

## Summary

- Goal: 검색창에서 키워드(공방명·지역·클래스명)로 공방을 검색한다. 입력 중 자동완성(REGION/PROGRAM/STORE), 최근 검색어(localStorage) 저장·삭제, 검색 제출 시 결과(공방 카드)를 노출한다.
- **검색 결과는 전용 엔드포인트 없이 `GET /stores`(키워드 확장)로 통합한다.** `GET /stores/search`(통합 검색 결과 제출)는 **폐기**. 신규 서버 작업은 ① 자동완성 엔드포인트 + ② `GET /stores` keyword 확장(클래스명 매칭 + matchedClass).
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

- 요구사항명세서(고정): docs/requirements.md — `store` 도메인(공방 조회, `/stores/[slug]`는 PUBLISHED만), `class` 도메인(`ACTIVE`만 노출), 접근 주체(Guest·User 공개 조회)
- 기능명세: `공방 검색` (기능명세 DB select 완료. `user-stores-keyword` 정확 일치 없음 → 의미 일치 `공방 검색`으로 확정, Decision Log 참조)
  - 실행주체: guest, user / 도메인: store / 우선순위: 상 / 연관화면: 메인(찾기)
  - 동작: 최근 검색어 출력 → 검색어 입력 → 자동완성 → 지역·공방명·클래스명 검색 → 결과 목록 → 최근 검색어 저장(삭제 가능)
- **Source of truth: UI 화면(검수 완료)** — 검색 진입/자동완성/결과/빈상태 화면 기준으로 contract 확정.
- API명세(통합 후):
  - `GET /stores` (= `user-근처-공방-목록-조회` 본체): **검색 결과를 흡수** — keyword를 공방명·주소 + **클래스명**까지 확장, 응답에 `matchedClass` 추가. → **GET /stores contract 변경 필요.**
  - `GET /stores/search/autocomplete`: **유지** (단 `REGION` type + `subtitle` 필드 추가).
  - ~~`GET /stores/search`~~ : **폐기**(통합).
  - 최근 검색어: 서버 엔드포인트 없음 → **localStorage**.
- 관련 plan: `user-근처-공방-목록-조회.md` (`GET /stores` 본체. keyword 확장/matchedClass는 본 기능과 공유 — 양쪽 동기화 필요)

## Confirmed decisions (2026-06-02, UI 기준)

1. **통합**: `/stores/search` 폐기. 검색 결과 = `GET /stores?keyword=…&lat=&lng=&cursor=&limit=`.
2. **keyword 매칭 확장**: 공방명(`name`)·주소(`address`) + **ACTIVE 프로그램명(`Program.title`)**.
3. **카드 표시 클래스**: keyword가 프로그램명에 매칭되면 **`matchedClass`**(그 프로그램 `name`·`price`, "~" 없음), 매칭이 공방명/지역인 경우 기존 **`representativeClass`**(최저가, 다건이면 `hasMore`로 "~"). → `GET /stores` 응답에 `matchedClass: { name, price } | null` 추가(키워드-프로그램 매칭 시에만 non-null). FE: `matchedClass` 있으면 그것, 없으면 `representativeClass` 렌더.
4. **자동완성**: `type` = `REGION` | `PROGRAM` | `STORE`, 항목에 `text` + `subtitle`(REGION·STORE의 지역 표기).
5. **최근 검색어**: localStorage (최대 10건, 중복 제거·최신 맨 앞, 개별 `×`/`전체삭제`). 빈 상태 "최근 검색어가 없습니다."
6. **distance**: 검색에도 `lat`/`lng` 전달 → `distance` 포함, 거리순 정렬. 권한 거부 시 성수동 기본 좌표(`37.5446`, `127.0560`) 폴백(GET /stores와 동일).
7. **페이징**: 커서 기반(`cursor`/`limit` + `pageInfo{nextCursor, hasNext}`) — GET /stores와 동일.
8. **category 필터: 드롭**. `Program`에 category 컬럼 없음 + UI에 카테고리 필터 없음.
9. **정렬**: 거리순(UI 검색 결과 화면 = 1.2 → 2.3 → 16.4km 근거).

## Open decisions — 전부 확정(2026-06-02)

1. **(region 구조) — 결정됨: 구조화 저장(시/구/동).** Store에 카카오 coord2regioncode 기반 `region`을 구조화 저장. API는 `region: { sido, sigungu, dong }` 객체로 반환. 근처 카드는 `dong`("성수동"), 검색 카드·자동완성 subtitle은 `"{sido} {sigungu} {dong}"`("서울 성동구 성수동"), 검색 지역 필터는 `sigungu`(자치구) 기준. (시도명 약어 정규화 "서울특별시"→"서울"는 저장/표시 시 처리.) **→ 이미 머지된 `GET /stores`의 `region: string`을 객체로 변경 — `user-근처-공방-목록-조회.md`·Notion 동기화 필요.**
2. **(matchedClass 다건) — 결정됨: 매칭된 프로그램 중 최저가 1개.**
3. **(자동완성 REGION 소스/동작) — 결정됨.** 소스 = **PUBLISHED 공방이 실제 존재하는 지역의 distinct `dong`** 중 keyword 부분매칭(검색 시 결과 보장). `id` = 지역 식별자(`sigungu`+`dong` 조합 키 또는 dong slug). 탭 동작 = `GET /stores?keyword={dong}` 호출.
4. **(자동완성 건수) — 결정됨: STORE 5 + PROGRAM 5 + REGION 3.**

## API Contract (스냅샷)

### A. `GET /stores` — keyword 확장 (검색 결과 통합)

> 본체 계약은 `user-근처-공방-목록-조회.md` 참조. 본 기능으로 인한 **변경점만** 명시(해당 plan/Notion에 동기화 필요).

- **변경 1 — keyword 매칭 확장**: `keyword`가 있으면 `name`/`address` 외 **ACTIVE `Program.title`** 까지 매칭(programs join). 클래스명 매칭 공방도 결과에 포함.
- **변경 2 — 응답 항목에 `matchedClass` 추가**:

| 필드 | 타입 | 비고 |
|------|------|------|
| `matchedClass` | `{ name: string, price: number } \| null` | keyword가 해당 공방의 프로그램명과 매칭될 때만 non-null. 다건이면 최저가(#2). FE는 있으면 이걸, 없으면 `representativeClass` 렌더 |

- 응답 카드 항목 예시(변경분 강조):

- **변경 3 — `region` 구조화**: 기존 `region: "성수동"`(string) → **`region: { sido, sigungu, dong }`** 객체. 근처 카드=`dong`, 검색 카드·자동완성 subtitle=`"{sido} {sigungu} {dong}"`. (`GET /stores` 본체 공통 변경)

```json
{
  "id": "store-uuid-001",
  "slug": "plus-doja",
  "name": "플러스 도자기",
  "region": { "sido": "서울", "sigungu": "성동구", "dong": "성수동" },
  "thumbnailUrl": "https://cdn.todam.example/stores/plus-doja/thumb.jpg",
  "rating": 4.9,
  "reviewCount": 253,
  "distance": 1200,
  "representativeClass": { "name": "머그컵 만들기", "price": 30000, "hasMore": true },
  "matchedClass": { "name": "성수동 감성 빈티지 볼 그릇", "price": 45000 },
  "isOperating": true
}
```

- `lat`/`lng`/`cursor`/`limit`, 나머지 카드 필드, `pageInfo`, 에러(400/500)는 `GET /stores` 본체 계약 그대로.
- 빈 결과(0건)는 `stores: []` 200 — FE "일치하는 항목이 없습니다." 노출.

### B. `GET /stores/search/autocomplete` — 자동완성 (유지 + 수정)

- 인증: 불필요 (Guest·User 공통)
- Headers: `Accept: application/json`
- Query Parameters:
  - `keyword`: 입력 중인 검색어 (**필수**, 공백 불가)
- 시스템 처리:
  - `keyword` 비공백 검증
  - **REGION**: PUBLISHED 공방이 존재하는 지역의 distinct `dong` 부분매칭 (**최대 3건**)
  - **STORE**: PUBLISHED 공방명 부분매칭 (**최대 5건**)
  - **PROGRAM**: ACTIVE 프로그램명 부분매칭 (**최대 5건**)
  - 통합 suggestion 규격으로 포맷
- 데이터모델 — `suggestions[]`:

| 필드 | 타입 | 비고 |
|------|------|------|
| `type` | string | `REGION` \| `PROGRAM` \| `STORE` |
| `id` | string | Store/Program ID. REGION은 지역 식별자(#3) |
| `text` | string | 표시 문구(동명/프로그램명/공방명) |
| `subtitle` | string \| null | REGION·STORE의 지역 표기(예: `서울 성동구 성수동`). PROGRAM은 `null` |

- 응답 `200 OK`:

```json
{
  "statusCode": 200,
  "timestamp": "2026-05-26T19:35:00.000Z",
  "path": "/stores/search/autocomplete",
  "message": "자동완성 목록 조회가 완료되었습니다.",
  "data": {
    "suggestions": [
      { "type": "REGION",  "id": "seongsu-dong", "text": "성수동", "subtitle": "서울 성동구 성수동" },
      { "type": "PROGRAM", "id": "prog-uuid-001", "text": "성수동 감성 머그컵", "subtitle": null },
      { "type": "STORE",   "id": "store-uuid-009", "text": "성수동 작은 공방", "subtitle": "서울 성동구 성수동" }
    ]
  },
  "error": null
}
```

- 응답 `400 Bad Request` (`KEYWORD_REQUIRED`): `keyword` 누락/공백 — `data: null`
- 응답 `500 Internal Server Error` (`INTERNAL_SERVER_ERROR`): 자동제안 쿼리 실패 — `data: null`

### C. 최근 검색어 — localStorage (서버 무관)

- 서버 엔드포인트 없음. 클라이언트 localStorage 저장.
- 정책: 최대 10건, 중복 제거(재검색 시 최신이 맨 앞), 초과 시 오래된 항목 제거, 개별/전체 삭제.

## Scope

- In:
  - `GET /stores` keyword 확장 연동: 검색 제출 → 공방 카드 결과(matchedClass 우선 렌더)
  - `GET /stores/search/autocomplete` 연동: 입력 debounce → REGION/PROGRAM/STORE 드롭다운(subtitle 포함)
  - 검색 화면 UI: 검색창, 자동완성 드롭다운, 결과 리스트(**공방 카드 컴포넌트 재사용**), 빈 결과("일치하는 항목이 없습니다"), 빈 최근검색("최근 검색어가 없습니다"), 에러
  - 최근 검색어: localStorage 저장/노출/개별·전체 삭제
  - 자동완성 항목 탭 → 검색 제출(REGION=지역검색 / PROGRAM=프로그램명 검색 / STORE=공방 검색 또는 상세), 결과 카드 → 공방 상세(`/stores/[slug]`)
- Out:
  - ~~`GET /stores/search`(결과 제출)~~ — **폐기**(통합)
  - `GET /stores` 본체 구현 — `user-근처-공방-목록-조회` 기능 (단 keyword 확장/matchedClass는 본 기능과 공유)
  - 공방 상세(`GET /stores/{slug}`)·프로그램 상세 — 별도 기능
  - 최근 검색어 서버 동기화 API
  - category 필터 (드롭)

## Plan

1. **Contract 확정 + Notion 갱신**: Open decisions(특히 #1 region 구조) 결정. Notion에서 (a) `GET /stores` 명세에 keyword 클래스 매칭 + `matchedClass` 추가, (b) autocomplete에 `REGION` type + `subtitle` 추가, (c) `GET /stores/search` 항목 **폐기** 표시. `user-근처-공방-목록-조회.md`에도 keyword 확장/matchedClass 동기화.
2. **BE**:
   - `GET /stores` keyword 확장 — `name`/`address` + ACTIVE `Program.title` 매칭(programs join), `matchedClass` 산출(다건 최저가).
   - `GET /stores/search/autocomplete` — `keyword` 필수(400 `KEYWORD_REQUIRED`), REGION/STORE/PROGRAM suggestion + `subtitle`.
3. **FE — 데이터 계층**: autocomplete 클라이언트(debounce) + `Suggestion` 타입. 검색은 `GET /stores` 클라이언트 재사용(keyword 전달). `matchedClass` 우선 렌더.
4. **FE — UI**: 검색 화면(검색창/자동완성 드롭다운/결과=공방 카드 재사용/빈상태/에러), 최근 검색어 localStorage(저장·노출·삭제). DESIGN.md 준수.
5. **연동**: MSW mock → 실 API. autocomplete 빈 keyword 차단, 빈 결과/에러 경로, 최근검색어 저장/삭제 확인.

## Out (단계별 완료물)

- API: <!-- GET /stores keyword 확장+matchedClass, GET /stores/search/autocomplete 엔드포인트, 파일 -->
- UI: <!-- 검색 화면, 자동완성 드롭다운, 결과(공방 카드 재사용), 최근 검색어 컴포넌트 -->
- 연동: <!-- 실 API 바인딩, debounce/빈검색 차단/빈결과/에러/최근검색 검증 -->

## Risks

- **region 구조 변경 동기화** — `region`을 구조화(시/구/동)로 확정 → 이미 머지된 `GET /stores`의 `region: string`을 객체로 변경해야 함. `user-근처-공방-목록-조회.md`·Notion·구현 동기화 누락 시 드리프트.
- **matchedClass 산출 복잡도** — `GET /stores` 쿼리에 programs join + 키워드-프로그램 매칭 분기 추가로 복잡도/비용↑. 공간(거리)·텍스트(LIKE) 동시 처리 성능 주의.
- **`GET /stores` 재변경** — 본체(머지됨)에 keyword 확장/matchedClass를 추가하므로 해당 기능 plan/Notion/구현과 동기화 필요(드리프트 위험).
- 자동완성 부분매칭(LIKE) 비용 — debounce·색인으로 부하 관리.
- `/stores/search` 폐기 — 기존 Notion 명세·참조 정리 필요.

## Validation

- Tests:
  - `GET /stores/search/autocomplete` — keyword 누락/공백 → 400 `KEYWORD_REQUIRED`, REGION/STORE/PROGRAM 규칙·건수, PUBLISHED/ACTIVE-only
  - `GET /stores` keyword — `name`/`address`/`Program.title` 매칭, `matchedClass` 정확성(매칭 시 non-null/다건 최저가), 빈 결과 200 `stores:[]`
- Manual checks: 자동완성 debounce·subtitle 표시·타입별 탭 동작, 빈 검색어 차단, 빈 결과/빈 최근검색 문구, 최근검색어 저장/개별·전체 삭제, 결과 카드→상세 이동
- Observability: 검색/자동완성 latency, 빈 결과 비율, 인기 키워드

## Decision Log

- 2026-06-02: 기능명 `user-stores-keyword` 정확 일치 없음 → 의미 일치 `공방 검색`(guest·user, store, 지역·공방명·클래스명 검색)으로 매칭 확정.
- 2026-06-02: **통합 확정 — `GET /stores/search`(결과 제출) 폐기.** 검색 결과를 `GET /stores` keyword 확장으로 흡수. 사유: UI 검색 결과 카드가 공방 카드와 동일·거리순 동일, category는 DB 컬럼 없음·UI 없음으로 불필요. 자동완성만 별도 엔드포인트 유지.
- 2026-06-02: keyword 매칭에 ACTIVE `Program.title` 포함, 카드에 `matchedClass` 추가(키워드-프로그램 매칭 시, 다건 최저가). 자동완성에 `REGION` type + `subtitle` 추가. category 드롭. 최근 검색어 localStorage(최대 10, dedup).
- 2026-06-02: region 표기 단위 → **구조화 저장(시/구/동) 확정.** API `region: {sido, sigungu, dong}`. 근처=dong, 검색/자동완성=풀표기, 검색 필터=sigungu. 이미 머지된 `GET /stores`의 `region: string`을 객체로 변경 → 동기화 필요.
- 2026-06-02: matchedClass 다건=최저가 1개, 자동완성 REGION 소스=공방 존재 지역 distinct dong(탭 시 `keyword={dong}`), 건수=STORE5+PROGRAM5+REGION3 확정. → Open decisions 전부 종료.

## Outcome

- Status: UI 기준 통합 설계 + Open decisions 전부 확정. 남은 일 = Notion 명세 갱신(`GET /stores` keyword 확장·matchedClass·region 객체화, autocomplete REGION/subtitle/건수, `/stores/search` 폐기) + `user-근처-공방-목록-조회.md` 동기화 → implementer 인계.
- Follow-up: `GET /stores`(머지됨) 계약 변경분(region 객체화·keyword 확장·matchedClass)을 `user-근처-공방-목록-조회.md`와 동기화.
