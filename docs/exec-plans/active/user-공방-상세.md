# Feature Plan: user-공방-상세 (공방 자세히보기 / 퍼블릭 공방 상세)

## Summary

- Goal: Guest·User가 공방 슬러그(`slug`)로 퍼블릭 공방 상세 페이지를 조회한다. 대표 이미지 캐러셀, 기본 정보(공방명/소개/평점/리뷰수/위치), 편의 정보(주차/반려동물), 운영 클래스 목록, 리뷰 미리보기(최대 3건), 지도, 공유, 찜 상태를 노출한다.
- 기능명 `user-공방-상세`의 `user`는 **실행주체**를 의미. 기능명세 DB에는 동일 도메인에 두 기능이 있어 구분 필요:
  - **`공방 자세히보기`** (실행주체 guest·user, 연관화면 "공방 상세") → **본 plan 대상**.
  - `공방 상세 조회` (실행주체 partner, 파트너센터 "공방 관리") → 별개 기능, 본 plan 범위 아님.
- 메인 엔드포인트 `GET /stores/{slug}`는 **아직 BE 미구현**(controller에 `@Get('stores/:slug')` 없음). 목록(`GET /stores`)은 머지 완료.
- **핵심 경계 이슈**: API명세상 `GET /stores/{slug}` 응답이 기능명세가 요구하는 화면 데이터를 충족하지 못한다(이미지목록·평점·리뷰수·운영시간·위치좌표·찜상태·클래스목록 누락). 화면은 별도 엔드포인트(프로그램 목록/리뷰 목록/찜)와 조합하거나 상세 응답을 확장해야 한다 → **Open decisions 참조, 사람 결정 필요.**
- Owner: TBD
- Date: 2026-06-04

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

<!-- 요구사항=docs/requirements.md. 기능/API명세=Notion DB에서 notion-fetch.mjs --find로 select. -->

- 요구사항명세서(고정): `docs/requirements.md`
  - `store` 도메인 §4 공방 조회 — `/stores/[slug]` 접근 규칙: **PUBLISHED만 노출, 그 외 404**. 역할 무관 동일 고객 뷰. 본인 공방 Partner는 동일 화면 + 예약 버튼 비활성. 수정·검수는 파트너센터에서만.
  - `class` 도메인 — `ACTIVE` 클래스만 퍼블릭 노출.
  - `review` 도메인 §5 — 공방 퍼블릭 페이지에 리뷰 목록·전체 리뷰 수·평균 별점 노출, 최신순/별점순 정렬, 페이지네이션.
  - 접근 주체 — Guest·User 모두 조회 가능(비인증 허용). 찜은 인증 필요.
- 기능명세: **`공방 자세히보기`** (기능명세 DB select 완료 — FE 작업 必)
  - 실행주체: guest, user / 도메인: store / 우선순위: 상 / 연관화면: 공방 상세
  - 동작: 기본정보(공방명·소개·평점·리뷰수·위치) / 이미지 목록(캐러셀) / 운영정보(주차·반려동물) / 운영 클래스(가격·소요시간) / 리뷰(최대 3건, 정렬 우선순위 있음) / 지도 위치 표시 / 공유 / 찜 상태
  - 예외: 삭제·비공개 공방 조회 불가, 클래스 없으면 빈 상태, 네트워크 오류
  - 비고: 이미지 캐러셀, 클래스 상태에 따라 예약 가능 여부 상이, 클래스 선택→예약 연결, **리뷰 최대 3건**, 리뷰 노출 우선순위 = ①이미지 포함 ②본문 포함 ③최신순
- API명세 (API명세 DB select 완료 — BE 작업 必):
  - `GET /stores/{slug}` — 공방 상세 조회 (퍼블릭) — **메인**
  - `GET /stores/{slug}/programs` — 프로그램 목록 (퍼블릭) — 운영 클래스 목록
  - `GET /stores/{slug}/reviews` — 공방 리뷰 목록 — 전체보기 (상세 미리보기는 Open decision #2)
  - `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭) — 클래스 자세히보기(별도 기능, 링크만)
  - `GET /programs/{programId}/available-slots` — 예약 가능 시간 (예약 플로우, 본 plan Out)
  - `POST /stores/{storeId}/favorite` — 찜 토글 (별도 기능, 상세는 `isFavorite` 노출만 — Open decision #3)
- Relevant design docs: `./DESIGN.md` (공방 상세 화면/캐러셀/카드 토큰). UI: DESIGN.md 준수.
- 관련 plan:
  - `user-stores-keyword.md`, `user-근처-공방-목록-조회.md` — `GET /stores`(목록). 본 상세와 **응답 경계** 정리 필요(아래 Decision Log + 별도 보고).
  - `유저 마이 - 찜한 공방 목록 조회, 공방 찜 등록_해제.md` — 찜 토글 본체.
  - 공방/클래스 리뷰 전체보기, 클래스 상세 — 각각 별도 기능(본 plan에서 링크만).

## Decisions (확정, 2026-06-04 · UI 기준)

> UI(검수 완료) 상세 화면을 source of truth로 #1~#3 확정. Contract의 확장 필드 `(PROPOSED)` 표기 제거.

1. **상세 응답 구성 — 결정 A(compose) 확정.** `GET /stores/{slug}`(코어)에 `images[]`, `rating`, `reviewCount`, `location{lat,lng}`, `isFavorite`를 **추가**하고, 운영 클래스·리뷰는 별도 호출로 조합: `GET /stores/{slug}/programs` + `GET /stores/{slug}/reviews?limit=3`. (임베드 B 아님 — 리뷰 페이징과 안 맞음.)
   - **상세엔 불필요 확정**: `isOperating`(UI "운영 클래스 준비 중"은 ACTIVE 클래스 0개 빈상태이지 운영시간 아님), `operatingHours`(상세 화면 미노출), `region` 객체(위치 섹션은 `address` 문자열 + 지도좌표로 충분).
2. **리뷰 미리보기 — 최신순 확정.** 상세 미리보기 = `GET /stores/{slug}/reviews?limit=3&sort=latest`. "이미지·본문 우선" 정렬은 도입하지 않음(`sort` enum `latest`/`rating_high` 유지). 더보기 페이지에서 `latest`/`rating_high` 토글.
3. **찜 상태 — `isFavorite` 추가 확정.** `GET /stores/{slug}` 응답에 `isFavorite: boolean` 포함(인증 시 실제값, 비인증 `false`). 하트 버튼 초기상태용.

### 남은 참고 (결정 불필요/저우선)

4. **식별자 불일치 — `slug` vs `storeId`.** 상세/프로그램/리뷰는 `slug` 기반, 찜은 `storeId`(UUID) 기반. 상세 응답이 `id`(storeId)를 주므로 FE는 찜 토글에 `store.id` 사용 가능 → 정합. (확인용 기록, 결정 불필요.)

5. **`autoConfirm` 노출 적절성.** 상세 응답에 `autoConfirm`이 있으나 퍼블릭 화면 용도 불명확. 예약 플로우용이면 유지, 아니면 제거. (저우선)

## API Contract (스냅샷)

> Notion API명세 원문을 그대로 고정. **확장 가설 필드는 `(PROPOSED)`** — Open decision 확정 전 구현 금지.
> 공통 envelope: `{ statusCode, timestamp, path, message, data, error }`.

### A. `GET /stores/{slug}` — 공방 상세 조회 (퍼블릭) **[메인]**

- 인증: 불필요 (Guest·User 공통). 단 `isFavorite`는 토큰 있으면 실제값(PROPOSED).
- Path: `slug` (공방 슬러그)
- Query: 없음
- 시스템 처리: `slug`로 store 조회 → `status === 'PUBLISHED'` 검증(DRAFT/PENDING/SUSPENDED는 **404 STORE_NOT_FOUND**) → 상세 데이터 반환.

**현행 명세 `data.store` (확정):**

| 필드 | 타입 | 비고 |
|------|------|------|
| `id` | string (UUID) | storeId. 찜 토글 path에 사용 |
| `partnerId` | string (UUID) | |
| `slug` | string | |
| `name` | string | 공방명 |
| `description` | string | 공방 소개 |
| `phone` | string | 대표 연락처 |
| `address` | string | 도로명 주소 |
| `status` | string | `PUBLISHED` (그 외는 404) |
| `convenienceInfo` | `{ parking: bool, pet: bool, wifi: bool }` | 편의정보 |
| `autoConfirm` | boolean | (Open decision #5) |
| `publishedAt` | string (ISO) | |

**확정 추가 필드 (결정 A · 2026-06-04):**

| 필드 | 타입 | 비고 |
|------|------|------|
| `images` | `{ imageUrl, thumbnailUrl }[]` | 대표 이미지 캐러셀(`StoreImage`, `sortOrder` 순). 1장 이상 |
| `rating` | `number \| null` | 리뷰 0건이면 null (`isVisible=true` 평균, 목록과 동일 규칙) |
| `reviewCount` | number | `isVisible=true` 리뷰 수 |
| `location` | `{ lat: number, lng: number }` | 지도 표시(`Store.latitude/longitude`) |
| `isFavorite` | `boolean` | 인증 시 실제값(찜 여부), 비인증 `false` |

> 상세엔 `region` 객체·`operatingHours`·`isOperating` **미포함**(Decisions #1). 위치 섹션은 `address` 문자열 + `location` 좌표로 렌더.

- `200 OK`:
```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T17:55:00.123Z",
  "path": "/stores/todam-jeonju",
  "message": "공방 상세 정보가 성공적으로 조회되었습니다.",
  "data": {
    "store": {
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
      "images": [
        { "imageUrl": "https://cdn.todam.example/stores/todam-jeonju/1.jpg", "thumbnailUrl": "https://cdn.todam.example/stores/todam-jeonju/1-thumb.jpg" }
      ],
      "rating": 4.9,
      "reviewCount": 248,
      "location": { "lat": 37.5446, "lng": 127.0560 },
      "isFavorite": false
    }
  },
  "error": null
}
```
- `404 STORE_NOT_FOUND` — 존재하지 않거나 비공개/정지 공방. `data: null`.
- `500 INTERNAL_SERVER_ERROR` — `data: null`.

### B. `GET /stores/{slug}/programs` — 프로그램 목록 (퍼블릭) — 운영 클래스

- 인증: 불필요. Path: `slug`. Query: 없음(페이징 없음, 단일 배열).
- 시스템 처리: `slug`로 PUBLISHED 공방 조회(아니면 404 STORE_NOT_FOUND) → `status='ACTIVE'` 프로그램만 → `sortOrder`, `id` 오름차순.
- `200 OK` `data.programs[]`:

| 필드 | 타입 |
|------|------|
| `id` | string (UUID) |
| `title` | string | 클래스명 (예: 머그컵 만들기) |
| `difficulty` | `BASIC`\|`INTERMEDIATE`\|`ADVANCED` | UI 라벨 기본/중급/심화 (`Program.difficulty`) |
| `description` | string (한 줄 설명) |
| `price` | number (원) |
| `durationMinutes` | number | UI "2시간" |
| `leadTimeDays` | number | UI "평균 28일" |
| `deliverable` | boolean |
| `thumbnailUrl` | string \| null | `Program`엔 컬럼 없음 → `ProgramImage`(UPLOADED 최상단)에서 파생, 이미지 없으면 `null` |
| `status` | `ACTIVE` |
| `sortOrder` | number |

> UI 카드 표기 = `title` / `difficulty`·`durationMinutes`·`leadTimeDays` / `price`. 헤더에 ACTIVE 개수("3개"), 0개면 "준비 중" 빈상태.

- `404 STORE_NOT_FOUND` / `500 INTERNAL_SERVER_ERROR`.
- 빈 목록 → `programs: []` 200 (FE empty UI).

### C. `GET /stores/{slug}/reviews` — 공방 리뷰 목록 (전체보기 + 상세 미리보기 후보)

- 인증: 불필요. Path: `slug`.
- **커서 기반**(전체보기 무한스크롤과 공유 — `user-공방-리뷰-전체보기` 동기화). Query: `cursor`(선택, 첫 페이지 미전송), `limit`(기본 10), `sort`(`latest`|`rating_high`, 기본 `latest`).
  - **상세 미리보기(확정 #2):** `?limit=3&sort=latest`(cursor 없이 첫 페이지)로 최신 3건. 정렬 토글·요약 헤더 없음.
- 시스템 처리: `slug`로 PUBLISHED 공방 조회 → `is_visible=true` 리뷰 `sort` 정렬 → `cursor` 이후 `limit`개 → `nextCursor`/`hasNext` 산출.
- `200 OK` `data`:

| 필드 | 타입 | 비고 |
|------|------|------|
| `reviews[]` | object[] | `id, nickname(마스킹), rating, content, photos[{imageUrl, thumbnailUrl}], programTitle, createdAt` |
| `pageInfo` | `{ nextCursor: string\|null, hasNext: boolean }` | 커서 기반. `totalCount`/`averageRating` 미포함(상세 평점은 코어 응답 제공) |

- `404 STORE_NOT_FOUND` / `500 INTERNAL_SERVER_ERROR`.
- 각 리뷰 `programTitle`(예약→프로그램명)이 클래스 태그로 노출. `photos.imageUrl`=확대보기 원본, `thumbnailUrl`=목록 썸네일.

### D. (참조) `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭)

- 클래스 카드 탭 시 이동. 본 plan은 링크만. 응답 `data.program`: `id, storeId, title, description, materials, caution, price, durationMinutes, leadTimeDays, deliverable, status, images[{imageUrl,thumbnailUrl}]`. 404 `PROGRAM_NOT_FOUND`.

### E. (참조) `POST /stores/{storeId}/favorite` — 찜 토글

- 인증 필요(Bearer). Path: `storeId`(UUID = 상세 응답 `id`). 토글: 응답 `data: { storeId, isFavorite }`. 401 UNAUTHORIZED. 별도 기능 — 본 plan은 상세 화면의 찜 버튼에서 호출만.

### F. (참조, Out) `GET /programs/{programId}/available-slots` — 예약 가능 시간

- 예약 플로우. 본 plan Out.

## Scope

- In:
  - `GET /stores/{slug}` **BE 구현**(현재 미구현): slug 조회 + PUBLISHED 가드(404 STORE_NOT_FOUND) + 상세 응답. (확장 필드는 Open decision #1 확정 후.)
  - 공방 상세 FE 화면: 이미지 캐러셀, 기본정보(공방명/소개/평점/리뷰수/위치), 편의정보, 운영 클래스 목록(`GET .../programs` 연동), 리뷰 미리보기 3건(`GET .../reviews?limit=3` 연동), 지도, 공유, 찜 버튼, 빈상태(클래스 0건), 404/네트워크 에러. DESIGN.md 준수.
  - 클래스 카드 → 프로그램 상세/예약 화면 이동 라우팅(이동만).
  - 찜 버튼 → `POST /stores/{storeId}/favorite` 호출(상태 토글). 본체 로직은 찜 기능 plan 소유.
- Out:
  - `공방 상세 조회`(partner, 파트너센터) — 별개 기능.
  - `GET /stores/{slug}/programs/{programId}` 프로그램 상세 화면 — 별도 기능(클래스 상세 조회).
  - `GET /stores/{slug}/reviews` 전체보기 화면 — 별도 기능(공방 리뷰 전체보기).
  - `POST /stores/{storeId}/favorite` 본체 구현 — 찜 기능 plan.
  - `GET /programs/{programId}/available-slots`·예약 생성 — 예약 기능.
  - `GET /stores`(목록) — 머지됨.

## Plan

1. **Open decisions 확정 + Notion 갱신**: 특히 #1(상세 응답 확장 vs 조합), #2(리뷰 미리보기 정렬), #3(`isFavorite` 노출). 확정안으로 `GET /stores/{slug}` API명세(`images/rating/reviewCount/region/location/isFavorite` 등)를 Notion에 반영하고 본 Contract의 `(PROPOSED)` 제거.
2. **BE — `GET /stores/{slug}`**: store 모듈에 `@Get('stores/:slug')` 컨트롤러 + use-case(get-store-detail) + 응답 DTO 추가. PUBLISHED 외 404 STORE_NOT_FOUND. (목록 DTO의 `region`/`rating` 규칙 재사용해 정합 유지.) `programs`/`reviews`는 기존/별도 엔드포인트 재사용(결정 A) 또는 임베드(결정 B).
3. **FE — 데이터 계층**: 상세 클라이언트(`GET /stores/{slug}`) + 운영 클래스(`GET .../programs`) + 리뷰 미리보기(`GET .../reviews?limit=3`) 조합 훅. 타입 정의(Contract 스냅샷 기준).
4. **FE — UI**: 공방 상세 화면(이미지 캐러셀/기본정보/편의정보/클래스 목록/리뷰 미리보기/지도/공유/찜 버튼/빈상태/404·에러). DESIGN.md 준수(캐러셀·카드·평점 토큰).
5. **연동**: MSW mock → 실 API. PUBLISHED-only 404, 클래스 0건 빈상태, 비인증 찜 버튼 동작(401/로그인 유도), 클래스 탭 라우팅, 리뷰 우선순위 표시 검증.

## Out (단계별 완료물)

- API: 구현 완료 (2026-06-04, `feature/store-detail`). **범위 = 코어 2개 엔드포인트만.**
  - `GET /stores/:slug` (Contract A, 퍼블릭 + 선택 인증):
    - 컨트롤러: `apps/api/src/modules/store/presentation/controllers/store.controller.ts` `getStoreDetail()` (`stores/search/autocomplete` 정적 라우트 뒤에 등록해 슬러그 섀도잉 방지)
    - use-case: `apps/api/src/modules/store/application/use-cases/get-store-detail.use-case.ts` — slug 조회 → `status===PUBLISHED` 아니면(미존재·DRAFT·PENDING·REJECTED·SUSPENDED) 404 `STORE_NOT_FOUND`. 응답 필드: 기존(id, partnerId, slug, name, description, phone, address, status, convenienceInfo, autoConfirm, publishedAt) + `images[]`(StoreImage UPLOADED·sortOrder asc·`{imageUrl,thumbnailUrl}`), `rating`(isVisible=true 평균, 0건 null — list-stores 규칙 재사용), `reviewCount`(isVisible=true count), `location{lat,lng}`(latitude/longitude), `isFavorite`(인증 시 FavoriteStore userId+storeId 존재 여부, 비인증 false). `region`·`operatingHours`·`isOperating` 미포함(Decisions #1).
    - DTO: `apps/api/src/modules/store/presentation/dto/get-store-detail.dto.ts`
    - 선택 인증 가드 신규: `apps/api/src/common/guards/optional-auth.guard.ts` (`OptionalAuthGuard` — Bearer 있으면 req.user 채움, 없거나 검증 실패해도 throw 안 함)
  - `GET /stores/:slug/programs` (Contract B, 퍼블릭):
    - 컨트롤러: 동 controller `listStorePrograms()`
    - use-case: `apps/api/src/modules/store/application/use-cases/list-store-programs.use-case.ts` — PUBLISHED 공방 아니면 404 `STORE_NOT_FOUND`. `status=ACTIVE` 프로그램만, `sortOrder→id` asc. 필드: `id, title, difficulty, description, price, durationMinutes, leadTimeDays, deliverable, thumbnailUrl, status, sortOrder`. `thumbnailUrl`은 Program에 직접 필드가 없어 ProgramImage(UPLOADED·sortOrder asc 1건, thumbnailUrl→imageUrl 순)에서 파생, 이미지 없으면 null. 0건이면 `programs: []` 200.
    - DTO: `apps/api/src/modules/store/presentation/dto/list-store-programs.dto.ts`
  - 모듈 등록: `apps/api/src/modules/store/store.module.ts` (use-case 2개 + `OptionalAuthGuard` providers 추가). 공통 envelope/404·500 처리는 기존 인터셉터/필터 재사용.
  - 빌드(`nest build`)·`tsc --noEmit`·eslint 통과 확인.
  - **범위 밖**: `GET /stores/:slug/reviews`(리뷰)는 **#120(공방 리뷰 전체보기)이 BE 소유** — 본 작업에서 미구현. `POST /stores/{storeId}/favorite` 토글 본체도 별도 찜 기능 소유(상세의 `isFavorite` 조회만 본 작업 포함).
- UI: <!-- 공방 상세 화면, 캐러셀, 클래스 카드 목록, 리뷰 미리보기 -->
- 연동: <!-- 상세+programs+reviews 조합, 404/빈상태/찜/라우팅 검증 -->

## Risks

- **명세-화면 갭(가장 큼)**: `GET /stores/{slug}` 응답이 화면 요구를 못 채움(이미지·평점·리뷰수·좌표·찜·클래스·리뷰 누락). Open decision #1~3 확정 없이 구현하면 재작업. **확정 전 PROPOSED 필드 구현 금지.**
- **응답 경계 드리프트**: 목록(`GET /stores`)·상세 간 동일 개념(`region`, `rating`, `representativeClass` vs `programs`) 표현이 갈라질 수 있음. 목록 DTO 규칙(region 객체, rating null) 재사용 필수.
- **리뷰 미리보기 정렬 미지원**: "이미지·본문 우선" 정렬이 `/reviews` enum에 없음 → 임베드 또는 `sort=featured` 추가 필요(#2).
- **N+1/페이로드**: 결정 A(조합)는 요청 3회, 결정 B(임베드)는 페이로드↑. trade-off 결정 필요.
- **PUBLISHED 가드 누락 시 정보 노출**: DRAFT/PENDING/SUSPENDED가 404 아닌 200으로 새면 비공개 공방 노출 — 테스트 필수.

## Validation

- Tests:
  - `GET /stores/{slug}` — PUBLISHED 200 / DRAFT·PENDING·SUSPENDED·미존재 → 404 STORE_NOT_FOUND / 500 envelope
  - `GET /stores/{slug}/programs` — ACTIVE-only, sortOrder·id 정렬, 빈 목록 `programs:[]` 200, 비PUBLISHED 404
  - 리뷰 미리보기 limit=3, 정렬 우선순위(#2 확정 후)
- Manual checks: 이미지 캐러셀, 평점/리뷰수, 편의정보, 클래스 카드(가격·소요시간)·빈상태, 리뷰 3건·우선순위, 지도, 공유, 찜 버튼(비인증 시 로그인 유도), 클래스 탭 라우팅, 404 화면
- Observability: 상세 조회 latency, 404 비율, 클래스/리뷰 조합 요청 수

## Decision Log

- 2026-06-04: 기능명 `user-공방-상세` 정확 일치 없음. `user`=실행주체로 해석 → 기능명세 DB의 **`공방 자세히보기`**(guest·user, store, 연관화면 "공방 상세")로 매칭 확정. 동명 후보 `공방 상세 조회`는 **partner 전용(파트너센터)** 이므로 제외.
- 2026-06-04: 메인 API = `GET /stores/{slug}`(API명세 DB 확인). 화면 데이터 보강용으로 `GET /stores/{slug}/programs`(운영 클래스), `GET /stores/{slug}/reviews`(리뷰), `POST /stores/{storeId}/favorite`(찜) 동반 식별.
- 2026-06-04: **명세-화면 갭 발견** — `GET /stores/{slug}` 응답에 이미지목록·평점·리뷰수·좌표·찜·region객체·운영시간 부재. 추측 금지 → Open decisions #1~3로 사람 결정 대기. PROPOSED 필드는 미확정 표기.
- 2026-06-04: `GET /stores/{slug}` BE 미구현 확인(store.controller.ts에 `stores/:slug` 라우트 없음). 목록(`GET /stores`)은 머지됨. 상세 `rating` 규칙(`isVisible=true` 평균, 0건 null)은 목록 DTO 재사용.
- 2026-06-04: **UI 화면 기준 #1~#3 확정.** #1 compose(코어에 `images[]`/`rating`/`reviewCount`/`location`/`isFavorite` 추가 + `/programs`·`/reviews?limit=3` 조합), #2 미리보기 최신순, #3 `isFavorite` 추가. 상세엔 `region`객체·`operatingHours`·`isOperating` 미포함(UI "준비 중"=클래스0개 빈상태). 운영 클래스에 `difficulty` 추가(UI 기본/중급/심화).
- 2026-06-04: **`GET /stores/{slug}/reviews` 커서 기반으로 변경** — `user-공방-리뷰-전체보기`(전체보기 무한스크롤) UI 확정에 따라 offset(`page`/`pagination`) → 커서(`cursor`/`pageInfo{nextCursor,hasNext}`). `totalCount`/`averageRating` 제거(코어 평점 사용), `photos`에 확대용 `imageUrl` 추가. 상세 미리보기는 cursor 없이 `limit=3&sort=latest`. 두 plan·Notion 명세 동기.

## Outcome

- Status: **UI 기준 Decisions #1~3 확정.** Contract 고정(코어 확장 필드·programs difficulty·reviews 미리보기 정렬). 남은 일 = `GET /stores/{slug}`·`/programs`(difficulty)·`isFavorite` 등 Notion 명세 갱신 → implementer 인계.
- Follow-up: `GET /stores/{slug}` Notion 명세 갱신(`images`/`rating`/`reviewCount`/`location`/`isFavorite` + programs `difficulty`). `rating` 규칙은 목록 DTO와 동기.
