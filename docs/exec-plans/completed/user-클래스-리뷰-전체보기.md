# Feature Plan: 클래스 리뷰 전체보기

## Summary

- Goal: 클래스 상세 화면에서 해당 클래스에 연결된 전체 리뷰 목록을 조회한다. 리뷰 평점 평균·총 건수, 작성자 닉네임, 별점, 본문, 이미지 썸네일, 작성일을 표시하고 페이지네이션·정렬 전환을 지원한다.
- Owner:
- Date: 2026-06-02

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
각 항목 체크 기준:
- API 구현: 실 BE(`apps/api`) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: **실 API** 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크(연동 아님).
-->

- [x] API 구현
- [x] UI 구현
- [x] API 연동

> API 구현: 2026-06-13 `GET /stores/{slug}/programs/{programId}/reviews` BE 구현 완료(drift 0, reviewer 통과, jest 282). 잔여 = FE 실연동(mock→실 BE) → `API 연동`은 FE turn. (3항목 모두 [x] 전까지 completed/ 미이동.)

## Reconcile (2026-06-13, pre-reconcile) — batch 3: 클래스 리뷰 목록 (BE GET)

FE UI **완료**(Status UI [x]). 잔여 = **BE 1개**: `GET /stores/{slug}/programs/{programId}/reviews`. **공개(Guest 허용, 인증 불필요).** FE 가 이미 계약에 바인딩했으므로 BE 는 그 계약에 정확히 맞춘다(이 블록 = implementer 바인딩 SSOT).

**코드 검증(2026-06-13)**:
- **BE 미구현**(클래스 리뷰 라우트 없음). 공방 목록 `GET /stores/{slug}/reviews` 는 별개로 이미 존재(store 모듈, cursor 기반) — **shape 다름, 미러 아님.**
- **FE 바인딩 계약 = `packages/shared/src/contracts/program-edit.ts`** (store-reviews.ts 아님!): `entities/program/api.ts:46 getProgramReviews` → `ProgramReviewListResult`, query `{ page?, limit?, sort? }`(`ProgramReviewSort='latest'|'rating_high'`), MSW `handlers.ts:200`. **shared 무변경.**
  - `programReviewSchema = { id, userId, nickname, rating(1~5), content(string), photos: [{ thumbnailUrl }], createdAt(ISO) }`
  - `programReviewListResultSchema = { totalCount, averageRating(0~5), reviews[], pagination: { currentPage, totalPages, limit } }`
  - `programReviewSortSchema = ['latest','rating_high']`
  - 404 = `PROGRAM_NOT_FOUND`("프로그램을 찾을 수 없습니다.") — `ProgramEditErrorCode` 재사용(FE mock 동일).
- **관계 경로**: `Reservation{ programId, storeId }` → Review 는 `reservationId` 로 연결. `Program{ id, storeId }`, `Store{ slug(unique) }`. → 필터 = `review.reservation.programId = programId` + 프로그램이 slug 공방 소속.
- **#278(remove-thumbnailurl, dev 머지)**: `programReviewPhotoSchema = { imageUrl }`(thumbnailUrl 제거), `ReviewPhoto` 모델도 `imageUrl`만. → 응답 photos = `{ imageUrl }`(폴백 불필요).

**결정 (2026-06-13)**:
- **page 기반 pagination** 확정(FE 계약 — cursor 아님). `page`(기본 1), `limit`(기본 10), offset=`(page-1)*limit`, `totalPages = ceil(totalCount/limit)`(0건이면 0).
- **sort**: `latest` → `createdAt DESC`, `rating_high` → `rating DESC, createdAt DESC`. 기본 `latest`.
- **totalCount** = 해당 프로그램 노출 리뷰 수. **averageRating** = 노출 리뷰 rating 평균(소수 1자리 반올림; 0건이면 0).
- **노출 필터**: `Review.isVisible = true` 만(신고/미노출 제외). store `PUBLISHED` 만(비공개/삭제 공방의 프로그램은 404 `PROGRAM_NOT_FOUND` — 다른 public 엔드포인트 정합).
- **응답 매핑**: `nickname = maskNickname(review.user.nickname)` — **작성자명 마스킹**(Figma "리뷰 카드: 작성자 ID(마스킹)" 확정). **기존 공방 reader `prisma-store-reviews.reader.ts:181 maskNickname`(앞 3글자 노출 + 나머지 길이만큼 `*`, 3글자 이하면 첫 글자+`*`, 빈값 `*`) 규칙 그대로 재사용** — 공용 util 로 추출해 두 reader 공유(중복 금지). `content = review.content ?? ''`, `photos = review_photos(sortOrder ASC).map(p => ({ imageUrl: p.imageUrl }))`.
- **모듈 배치(권장) = store 모듈** — 기존 `GET /stores/:slug/reviews`(`list-store-reviews.use-case`) + 프로그램 데이터(`list-store-programs`)가 store 모듈에 있어 응집도 높음. (plan 원안은 "ReviewModule"이나 user-리뷰 write/detail/delete 중심이라 부적합.) → `store.controller` 에 `@Get('stores/:slug/programs/:programId/reviews')` + `list-program-reviews.use-case` + `prisma-program-reviews.reader` + DTO(createZodDto(programReviewListResultSchema)) + 쿼리 DTO(page/limit/sort). **최종 모듈 위치는 착수 시 확인.**

**잔여 결정 (2026-06-13, Figma "리뷰 리스트 조회" 근거 확정)**:
- **작성자 표시 = 마스킹된 닉네임** (Figma "리뷰 카드: 작성자 ID(마스킹)"). BE 가 `nickname` 에 `maskNickname` 적용분을 넣음(공방 reader 규칙 재사용). FE 는 `nickname` 그대로 렌더.
- **userId 공개 노출 — 채택: 빈 문자열(`''`) 반환(익명화)**. 근거: ① Figma 가 작성자 식별자를 **마스킹/익명화**하라는 의도 → 실제 user UUID 를 게스트에게 노출하면 익명화 위반(같은 작성자 리뷰 정확 상관관계 가능) ② **공방 리뷰 계약엔 userId 필드 자체가 없음**(더 익명적) ③ FE 미사용 → 화면 영향 0. 계약 `userId: z.string()`(non-null) 만족 위해 빈 문자열. (shared 변경 없이 익명화 유지.)
- **모듈 배치 = store 모듈 확정**(기존 공방 리뷰 목록·프로그램 데이터와 응집).

**이번 batch 범위 = BE 1개.** shared·FE 무변경. 착수 = #276 머지 후 dev 기준 새 브랜치(`feature/user-class-reviews` 등). Open decisions #1~#3(lightbox/정렬 UI/페이지네이션 방식)은 **FE 이미 해소**(UI 완료).

## Context

- 요구사항명세서(고정): docs/requirements.md — `# 리뷰 review` > `5. 리뷰 조회` 섹션
- 기능명세: 클래스 리뷰 전체보기 (Notion 기능명세 DB `b242ee66b06c8349805601ce4a05247a`)
    - 실행주체: guest, user
    - 도메인: review
    - 트리거: 클래스 상세 화면 진입 / 리뷰 더보기 버튼 클릭
    - 연관화면: 리뷰 리스트
- API명세: (Notion API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`)
    - `GET /stores/{slug}/programs/{programId}/reviews` — 프로그램 리뷰 목록
- Relevant design docs: DESIGN.md 확인 필요 (리뷰 카드 variant enum, 별점 컴포넌트 size별 토큰, 썸네일 그리드 규격)
- Open decisions:
    - [ ] 이미지 확대보기(lightbox)는 별도 컴포넌트로 구현하는가, 기존 공용 컴포넌트를 재사용하는가?
    - [ ] `sort=rating_high` UI 트리거는 탭인가 드롭다운인가? DESIGN.md에 정의된 정렬 UI 패턴 확인 필요.
    - [ ] 무한스크롤 vs 페이지네이션 버튼 — UX 방식 결정 필요 (기능명세에 미명시).
    - [ ] `userId` 필드가 응답에 포함되나, 닉네임만 표시하는지 사람 확인 필요 (개인정보 노출 여부).

## API Contract (스냅샷)

<!-- planner가 Notion API명세를 읽어 여기에 고정. BE/FE/reviewer가 바인딩하는 SSOT.
     Notion 원본이 바뀌면 재plan → 이 섹션 diff로 추적. -->

### 데이터 모델

#### ReviewItem

| 필드        | 타입                         | 설명                                   |
| ----------- | ---------------------------- | -------------------------------------- |
| `id`        | string (UUID)                | 리뷰 식별자                            |
| `userId`    | string (UUID)                | 작성자 식별자                          |
| `nickname`  | string                       | 작성자 닉네임                          |
| `rating`    | number (1~5)                 | 별점                                   |
| `content`   | string \| null               | 리뷰 본문 (최대 500자)                 |
| `photos`    | `{ imageUrl: string }[]`     | 이미지 목록 (최대 3장)                  |
| `createdAt` | string (ISO 8601)            | 작성일시                               |

#### Pagination

| 필드          | 타입   | 설명             |
| ------------- | ------ | ---------------- |
| `currentPage` | number | 현재 페이지 번호 |
| `totalPages`  | number | 전체 페이지 수   |
| `limit`       | number | 페이지당 항목 수 |

---

### 엔드포인트

#### `GET /stores/{slug}/programs/{programId}/reviews` — 클래스 리뷰 목록 조회

**인증**: 불필요 (Guest 포함 전체 허용)

**Path Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `slug` | string | 공방 슬러그 |
| `programId` | string (UUID) | 클래스(프로그램) UUID |

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | number | `1` | 페이지 번호 |
| `limit` | number | `10` | 페이지당 항목 수 |
| `sort` | `latest` \| `rating_high` | `latest` | 정렬 기준 |

**Response 200 OK**

```json
{
    "statusCode": 200,
    "timestamp": "2026-05-25T19:20:00.000Z",
    "path": "/stores/todam-studio/programs/prog-uuid-001/reviews",
    "message": "리뷰 목록이 성공적으로 조회되었습니다.",
    "data": {
        "totalCount": 24,
        "averageRating": 4.7,
        "reviews": [
            {
                "id": "review-uuid-001",
                "userId": "user-uuid-001",
                "nickname": "토담이",
                "rating": 5,
                "content": "정말 즐거운 체험이었습니다. 작품도 예쁘게 완성되었어요!",
                "photos": [
                    {
                        "imageUrl": "https://cdn.todam.app/reviews/review-uuid-001/01.jpg"
                    }
                ],
                "createdAt": "2026-05-10T12:00:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 3,
            "limit": 10
        }
    },
    "error": null
}
```

**Response 404 Not Found**

```json
{
    "statusCode": 404,
    "timestamp": "2026-05-25T19:20:03.000Z",
    "path": "/stores/todam-studio/programs/prog-uuid-001/reviews",
    "message": "프로그램을 찾을 수 없습니다.",
    "data": null,
    "error": "PROGRAM_NOT_FOUND"
}
```

**Response 500 Internal Server Error**

```json
{
    "statusCode": 500,
    "timestamp": "2026-05-25T19:20:08.000Z",
    "path": "/stores/todam-studio/programs/prog-uuid-001/reviews",
    "message": "리뷰 목록 조회 중 서버 오류가 발생했습니다.",
    "data": null,
    "error": "INTERNAL_SERVER_ERROR"
}
```

---

> 참고: `/stores/{slug}/reviews` (공방 전체 리뷰 목록) API도 존재하나 이 기능의 Scope 밖. 공방 퍼블릭 페이지 리뷰 기능에서 별도 처리.

## Scope

- In:
    - `GET /stores/{slug}/programs/{programId}/reviews` BE 엔드포인트 구현
    - 리뷰 목록 UI: 평점 평균·총 건수 헤더, 리뷰 카드(닉네임, 별점, 본문, 이미지 썸네일, 작성일)
    - 정렬 전환 (최신순 / 별점 높은 순)
    - 페이지네이션 (방식은 Open decisions 해결 후 확정)
    - 이미지 썸네일 확대보기
    - 빈 상태(empty state) 화면
    - MSW mock → 실 API 연동 전환
    - UI: DESIGN.md 준수 (별점 컴포넌트 size·토큰, 리뷰 카드 variant enum, 썸네일 그리드 규격)

- Out:
    - 공방 전체 리뷰 목록 (`/stores/{slug}/reviews`) — 별도 기능으로 처리
    - 리뷰 작성·수정·삭제
    - 파트너 답글 기능 (MVP 이후)
    - 리뷰 신고 기능 (MVP 이후)
    - 이미지 원본 signed URL 조회 (썸네일만 표시; 확대보기는 thumbnailUrl 사용 또는 별도 상세 API 확인 필요)

## Plan

### BE

1. `ReviewModule` 내 `GET /stores/:slug/programs/:programId/reviews` 라우트 추가
    - `slug` + `programId` 유효성 검증, 공방 `PUBLISHED` 상태 확인
    - 삭제·비공개 리뷰 필터링
    - `sort` 쿼리(`latest` → `createdAt DESC` / `rating_high` → `rating DESC, createdAt DESC`) 처리
    - 페이지네이션 (`page`, `limit`)
    - `totalCount`, `averageRating`, `reviews[]`, `pagination` 조합 응답
2. DTO 정의: `GetProgramReviewsQueryDto`, `ReviewItemDto`, `ProgramReviewsResponseDto`
3. 단위 테스트: service 레이어 (정렬·페이지네이션·필터 검증)
4. E2E 테스트: 200 / 404 시나리오

### FE

5. DESIGN.md에서 리뷰 카드 variant enum, 별점 컴포넌트 토큰, 썸네일 그리드 규격 확인 (Open decisions 해결 선행)
6. MSW handler 추가: `GET /stores/:slug/programs/:programId/reviews`
7. 리뷰 목록 페이지/컴포넌트 구현
    - 평점 평균·총 건수 헤더
    - 정렬 전환 UI
    - `ReviewCard` 컴포넌트 (닉네임, 별점, 본문, 썸네일 그리드, 작성일)
    - 이미지 확대보기 (lightbox)
    - 빈 상태 컴포넌트
    - 페이지네이션 UI
8. 실 API 연동 전환 (MSW mock 제거)
9. UI 검증: DESIGN.md 토큰 적용 확인, 빈 상태·네트워크 오류 시나리오 수동 확인

## Out (단계별 완료물)

- API: `GET /stores/{slug}/programs/{programId}/reviews` 엔드포인트, DTO, service 로직
  - 신규 파일:
    - `apps/api/src/modules/store/infrastructure/persistence/review-author-mask.util.ts` — maskNickname 공용 util (기존 store-reviews reader에서 추출)
    - `apps/api/src/modules/store/infrastructure/persistence/prisma-program-reviews.reader.ts` — 클래스 리뷰 목록 Prisma reader (페이지 기반, isVisible 필터, sort, averageRating aggregate, maskNickname 적용, userId='')
    - `apps/api/src/modules/store/application/use-cases/list-program-reviews.use-case.ts` — 클래스 리뷰 목록 use-case
    - `apps/api/src/modules/store/application/use-cases/list-program-reviews.use-case.spec.ts` — 9개 시나리오 spec (404/정렬/페이지/averageRating/isVisible/마스킹/userId/photos)
    - `apps/api/src/modules/store/presentation/dto/list-program-reviews.dto.ts` — 응답 DTO (createZodDto(programReviewListResultSchema))
  - 수정 파일:
    - `packages/shared/src/contracts/program-edit.ts` — `programReviewListQuerySchema`(page/limit/sort, coerce·default) additive 추가(다른 store 핸들러처럼 query 스키마를 shared에 두고 `QueryZodValidationPipe` 사용 — reviewer 권고 반영). 기존 스키마 무변경.
    - `prisma-store-reviews.reader.ts` — private maskNickname → util import로 교체
    - `store-readers.ts` — ProgramReviewsReader 추상 클래스 + 관련 인터페이스 추가
    - `store.controller.ts` — GET stores/:slug/programs/:programId/reviews 핸들러 추가 (가드 없음)
    - `store.module.ts` — ListProgramReviewsUseCase, PrismaProgramReviewsReader provider 등록
    - `api-routes.snapshot.spec.ts` — listProgramReviews 라우트 스냅샷 추가
  - 결정 반영: page 기반 pagination, averageRating 소수1자리 반올림, 0건이면 totalPages=0/averageRating=0, userId='', maskNickname 공용화, store PUBLISHED 필터
- UI: `/classes/[id]/reviews` 화면 구현 완료. `ClassReviewsClient`에서 헤더(`클래스 리뷰`), 평균 별점·총 리뷰 수, 정렬 토글(`latest`/`rating_high`), 리뷰 카드(닉네임·별점·본문·썸네일·작성일), 페이지네이션, 빈 상태, 이미지 확대 모달을 제공. 클래스 상세의 리뷰 진입 링크는 `store`/`storeName` 쿼리를 보존한다.
- 연동: MSW handler → 실 API 전환, contract 스키마 기반 타입 바인딩 확인

## Risks

- `averageRating` 계산을 DB aggregate로 실시간 처리하면 대량 리뷰 시 쿼리 부하 발생 가능 — 캐시 또는 비정규화 컬럼 검토 필요
- 이미지 썸네일 CDN 경로 규칙이 변경되면 FE hardcode된 URL 패턴 영향 — 응답 URL을 그대로 사용하도록 처리
- Open decisions 미해결 시 FE 구현 착수 불가 (정렬 UI 패턴, 페이지네이션 방식)

## Validation

- Tests:
    - BE: `GET /stores/{slug}/programs/{programId}/reviews` 200/404 E2E
    - BE: 정렬 파라미터별 순서 검증 단위 테스트
    - BE: 삭제된 리뷰 필터링 단위 테스트
    - FE: `ReviewCard` 렌더링 단위 테스트 (별점·본문·이미지 없는 케이스 포함)
- Manual checks:
    - 리뷰 0건 빈 상태 화면 확인
    - 정렬 전환 후 순서 변경 확인
    - 이미지 썸네일 확대보기 동작 확인
    - 네트워크 오류 시 에러 처리 확인
- Observability:
    - 404 응답 로그 (잘못된 slug·programId)
    - 응답 시간 모니터링 (averageRating 집계 쿼리 성능)

## Decision Log

- 2026-06-02: `/stores/{slug}/programs/{programId}/reviews` API를 클래스 리뷰 전체보기의 단일 엔드포인트로 확정. `/stores/{slug}/reviews`(공방 전체 리뷰)는 Scope Out.
- 2026-06-02: 공방 상태 조건 — API명세 시스템 처리에 명시 없으나 요구사항상 PUBLISHED 공방만 노출 원칙 적용. BE 구현 시 확인 필요 → Open decisions 등록.

## Outcome

- Status: planning
- Follow-up:
    - Open decisions 4건 해결 후 FE 구현 착수
    - 공방 전체 리뷰 목록(`/stores/{slug}/reviews`) 기능 별도 plan 필요
