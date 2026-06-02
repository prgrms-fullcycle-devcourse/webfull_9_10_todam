# Feature Plan: 공방 상세 조회 (파트너센터)

## Summary

- Goal: 로그인한 파트너가 공방 관리에서 본인 소유 공방 1개를 선택해 등록 정보·운영 클래스·진행 예약을 상세 조회하고, 수정 화면으로 진입한다.
- Owner: nogglee
- Date: 2026-06-01

## Status

- [ ] API 구현
- [x] UI 구현
- [x] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md
  - `store` 도메인: 공방 상태(`DRAFT`/`PENDING`/`PUBLISHED`/`SUSPENDED`)·상태 전이, "4. 공방 조회"(단, 4는 퍼블릭 `/stores/[slug]` 고객 뷰. **본 기능은 파트너센터 전용 관리 화면으로 별개**)
  - `class` 도메인: 클래스 상태(`DRAFT`/`ACTIVE`/`INACTIVE`)
  - `review` 도메인: 공방 평균 별점·리뷰 수
  - 접근 주체/가드: `AuthGuard + PartnerGuard` (Partner.status = APPROVED)
- 기능명세: `공방 상세 조회` (기능명세 DB `b242ee66b06c8349805601ce4a05247a` 에서 select)
  - 실행주체: Partner / 도메인: store / 연관화면: 공방 관리 / 우선순위: 상
  - 선행조건: 로그인 파트너 + 대상 공방 운영 권한 + 공방 정보 등록됨
  - 트리거: 공방 목록 카드 클릭 / 공방 관리 진입 / 공방 등록 완료 후 상세 이동
  - 표시:
    - 대표 이미지 carousel
    - 기본 정보: 공방명, 평점, 리뷰 수, 공방 소개
    - 편의 정보: 주차 가능 여부, 반려동물 동반 가능 여부
    - 운영 중인 클래스 목록 (+ 클래스 준비 상태 표시 가능)
    - 현재 진행 중 예약 건수
    - `공방 정보 수정하기` 버튼 → 수정 항목 선택 바텀시트(공방 정보 / 영업 정보 / 예약 정보 수정 화면 이동)
  - 비노출: 일반 사용자용 `찜 버튼` 노출 안 함
  - 제한: 운영 권한 없는 공방 조회 불가, 삭제된 공방 조회 불가, 등록 클래스 없으면 empty UI, 네트워크 오류 처리
  - 비고: partner 전용 관리 화면 / 고객용 상세와 UI 일부 상이 / 수정 바텀시트는 상세 상태 유지한 채 노출 / 검수·게시 상태에 따라 일부 기능 접근 제한 가능
- API명세: API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25` 에서 select
  - `GET /partner/stores/{storeId}` (내 공방 상세 - 파트너센터) — **확보** + CONTRACT-1/3로 `rating`/`reviewCount`/`inProgressReservationCount` 필수 필드 추가
  - `GET /partner/stores/{storeId}/programs` (운영 클래스 목록) — **CONTRACT-2 신설 확정**
  - 진행 중 예약 건수 → 상세 응답 `inProgressReservationCount` 필드로 단일화 (CONTRACT-3)
- Relevant design docs: DESIGN.md (작업 시작 조건 — variant enum / size별 height·padding·gap·radius / 상태별 토큰)
- Open decisions:
  - ✅ (CONTRACT-1, resolved 2026-06-01) 상세 응답에 UI 요구 필드(평점·리뷰 수·진행 중 예약 수)가 **반드시 존재해야 함** 확정. → 상세 응답에 `rating`/`reviewCount`/`inProgressReservationCount` 필수 필드 추가(API Contract 반영 완료).
  - ✅ (CONTRACT-2, resolved 2026-06-01) 파트너 클래스 목록 GET 엔드포인트 **신설 확정**. 파트너는 여러 공방 소유 → 공방별 클래스 목록 조회. `GET /partner/stores/{storeId}/programs` 신설(contract 작성 완료).
  - ✅ (CONTRACT-3, resolved 2026-06-01) "진행 중" 예약 = **체험 완료 처리되지 않은 예약 건**으로 확정. `inProgressReservationCount`를 이 정의로 산출(상세 응답 단일 필드).
  - ✅ (CONTRACT-4, resolved 2026-06-01) 클래스 status enum/전이 확정 — `DRAFT`(작성 중)/`ACTIVE`(예약 가능·퍼블릭 노출)/`INACTIVE`(일시 중단·신규 예약 불가). 전이: 없음→DRAFT(등록 시작), DRAFT→ACTIVE(게시 완료), ACTIVE→INACTIVE(일시 중단), INACTIVE→ACTIVE(재게시). "클래스 준비 상태" 라벨은 이 enum을 SSOT로 매핑.
  - ✅ (CONTRACT-5, resolved 2026-06-01) 삭제 공방 처리는 명세 누락 그대로 유지하되 **404(`STORE_NOT_FOUND`) 정책 기본 유지**로 명시. 별도 soft-delete 스키마 결정 불필요. + 원문 오타 `suspededReason` → `suspendedReason` 수정 반영(보고 포함).
  - ⏳ (UI-1) 수정 항목 선택 바텀시트(공방/영업/예약 정보) variant·항목 구성·이동 라우트 디자인 확보 여부 확인 → 미확정 시 디자인 대기. + 클래스 준비 상태 라벨 문구(enum→표시문구) 디자인 확정 대기.
  - ⏳ (UI-2) 대표 이미지 carousel·편의 정보 칩·클래스 카드·empty UI 디자인 토큰(DESIGN.md 작업 시작 조건) 확보 여부 확인.
  - UI: DESIGN.md 준수.

## Scope

- In:
  - BE: `GET /partner/stores/{storeId}` 구현(소유 권한 검증, 상세+운영시간+이미지+사업자서류 + `rating`/`reviewCount`/`inProgressReservationCount` 집계 반환, 공통 응답 봉투, 401/403/404/500). 삭제·미존재 공방 404(CONTRACT-5).
  - BE: `GET /partner/stores/{storeId}/programs` 신설(CONTRACT-2) — 공방별 운영 클래스 목록, class status enum 전체 포함, 소유 권한 검증, empty 시 `[]`.
  - UI: 파트너센터 공방 상세 화면 — 대표 이미지 carousel, 기본 정보(공방명/평점/리뷰수/소개), 편의 정보(주차/반려동물), 운영 클래스 목록(+ 준비 상태=class status, empty UI), 진행 예약 건수, `공방 정보 수정하기` 버튼 + 수정 항목 선택 바텀시트, 로딩/오류 처리. 찜 버튼 미노출.
  - 연동: 상세 조회 + 클래스 목록 API 바인딩(타입/쿼리 훅), store status·class status enum → 라벨 매핑, 401/403/404/500/empty 상태 처리, 수정 화면 라우팅.
- Out:
  - 공방 정보/영업 정보/예약 정보 **수정 화면** 자체 구현 (바텀시트에서 라우팅만, 각 수정은 별도 기능).
  - 클래스 등록/수정/상태변경 (별도 class 기능).
  - 퍼블릭 고객용 공방 상세(`/stores/[slug]`) — 별개 기능.
  - 예약 목록/예약 관리 화면 (`GET /partner/stores/{storeId}/reservations` 포함).
  - 클래스 준비 상태 라벨 표시 문구 디자인 (UI-1) — enum 매핑은 In, 문구는 디자인 확정 후.

## Plan

1. (BE) `GET /partner/stores/{storeId}` 컨트롤러/서비스: PartnerGuard, `partner_id` 소유 검증(불일치 403), 미존재·삭제 404(CONTRACT-5), 상세 DTO를 API Contract 스냅샷 스키마로 직렬화. `rating`/`reviewCount`(review 도메인 집계)·`inProgressReservationCount`(체험 미완료 예약 건수 집계, CONTRACT-3) 포함. 필드명 `suspendedReason`.
2. (BE) `GET /partner/stores/{storeId}/programs` 신설(CONTRACT-2): 소유 검증, class status(`DRAFT`/`ACTIVE`/`INACTIVE`) 전체 포함, `{ id, title, status, thumbnailUrl, price, durationMinutes, createdAt }[]`, empty 시 `[]`.
3. (UI) 공방 상세 화면 골격: carousel, 기본 정보, 편의 정보 칩, 클래스 목록(+empty), 진행 예약 건수 슬롯, 수정 버튼 + 바텀시트. 토큰 확보 전엔 mock으로 골격, DESIGN.md 작업 시작 조건 확보 후 스타일 적용. DESIGN.md 준수.
4. (연동) 응답 타입/zod 계약(`packages/shared/src/contracts/store-detail.ts`, `store-programs.ts`) + 조회 훅. store status·class status enum→라벨 매핑(class enum 전이 규칙 SSOT 준수). 로딩/401·403·404·500/빈 클래스 상태. 수정 항목 선택 시 각 수정 라우트로 이동(상세 상태 유지).

## Out (단계별 완료물)

- API:
- UI: 파트너센터 공방 상세 화면(`apps/web/src/app/partner/stores/[id]/page.tsx`) — 대표 이미지 carousel, 기본 정보(공방명/상태 배지/평점·리뷰수/문의·공유/소개), 편의 정보 칩(주차·반려동물), 운영 중 클래스 목록(+empty), `공방 정보 수정하기` 버튼. 찜 버튼 미노출. 로딩/401·403·404·500/클래스 empty 분기. **(디자인 확정분 반영, 2026-06-01)** 진행 중 예약 건수 별도 섹션 제거 → 수정 바텀시트 헤더 문구로 이동. 평점 행에 문의하기·공유하기(아이콘+라벨, 핸들러 no-op + TODO) 추가. 상세 골격을 entities로 추출하고 page는 조합으로 슬림화.
  - entities(`apps/web/src/entities/store/`, 순수 표현 — 데이터페치·라우팅·feature 의존 없음, 고객 뷰와 공유 목적): `ui/StoreImageCarousel`(features→이동, props만), `ui/StoreInfoSummary`(공방명/평점/리뷰수/소개 + badge·actions 슬롯으로 뷰별 차이 흡수), `ui/ConvenienceChips`(features 인라인→추출, `convenienceInfo` prop), `ui/ProgramListItem`·`ui/ProgramStatusBadge`(features→이동), `model/program-status-label.ts`(CONTRACT-4 SSOT, 순수 enum→라벨 매핑 → features→이동). `entities/store/index.ts` export 추가.
  - features 잔류(`apps/web/src/features/store/detail/ui/`): `StoreEditSheet`만 — `useRouter`+`useSheet` 라우팅/오버레이 의존이라 feature. Figma 확정분 구조로 교체(grabber, 헤더=공방명 24bold + "현재 진행 중인 예약이 총 N건 있어요" 18 foreground-secondary, 슬롯 3개=공방정보/영업정보/예약정보 수정 → 각 edit 라우트, 아이콘박스 32x32 rounded-lg `bg-secondary-subtle`(=gold-100 #F3E7C8)·아이콘 16 `text-secondary-darker`(=gold-800 #6B4C07), chevron=`RightIcon`, 닫기 Button outline lg). props: `storeId`·`storeName`·`inProgressReservationCount`.
  - 모두 `@todam/ui`(EditIcon/InformationIcon/CalendarIcon/RightIcon/PhoneIcon/ShareIcon/Button/Badge/Rating)·기존 shared/ui + semantic 토큰/Tailwind 기본 스케일로 구성(DESIGN.md 준수, arbitrary value·raw hex 없음). `packages/ui` 신규 컴포넌트 추가 없음 → Storybook 등록 대상 없음. 리뷰 미리보기 썸네일은 스킵(미구현). UI-2(carousel/칩/카드 전용 디자인 토큰) 확정 시 스타일 보강 필요.
- 연동:
  - 계약(zod): `packages/shared/src/contracts/store-detail.ts`(`StoreDetail`/`StoreDetailResult`/`StoreDetailErrorCode`, `suspendedReason`·`rating`·`reviewCount`·`inProgressReservationCount` 반영), `store-programs.ts`(`PartnerProgramListItem`/`PartnerProgramListResult`, ProgramStatus enum). `packages/shared/src/index.ts` export 등록.
  - API 바인딩: `apps/web/src/features/store/detail/api.ts` — `GET /api/v1/partner/stores/{storeId}`, `GET /api/v1/partner/stores/{storeId}/programs`. 조회 훅 `queries.ts`(`usePartnerStoreDetail`/`usePartnerStorePrograms`, 401/403/404 무재시도).
  - enum→라벨: store status는 기존 `StoreStatusBadge`(entities/store) 재사용, class status는 `ProgramStatusBadge`+`program-status-label`(entities/store로 이동, CONTRACT-4 전이/enum SSOT).
  - 수정 라우팅: `StoreEditSheet`에서 `useSheet` 바텀시트→`/partner/stores/{id}/edit/{info|business|reservation}`(라우트 존재 확인). 상세 상태 유지(라우팅만, 수정 화면 자체는 Out).
  - MSW mock(BE 미구현 대비 연동 검증용): `apps/web/src/mocks/db.ts`(`findPartnerStoreDetail`/`findPartnerStorePrograms` + 시드 — store-seed-0001 정상·클래스 3종 status, store-seed-0002 클래스 empty), `handlers.ts`(`:storeId`·`:storeId/programs` GET, 미존재 404 `STORE_NOT_FOUND`).
  - 검증: 목록 카드 클릭→상세 라우팅 이미 연결됨(`/partner/stores/page.tsx`). `pnpm --filter @todam/shared typecheck` / `@todam/web typecheck` 통과, `@todam/web lint` 0 error. dev 서버 `/partner/stores/store-seed-0001`·미존재 id 라우트 컴파일·200 확인(데이터 페치는 MSW client-side). 401/403 응답 분기는 mock 미생성(현 mock은 소유자 단일·404만) — BE 연동 시 실응답으로 확인 필요.

## Risks

- (해소) CONTRACT-1~5 확정 — 상세 응답 필수 필드·클래스 목록 엔드포인트·진행 예약 정의·class enum·삭제 정책 확정. 구현 블로킹 해제.
- `inProgressReservationCount`/`rating`/`reviewCount`는 BE 집계 쿼리 비용 발생 — N+1 주의(공방 상세 1건이므로 영향 작으나 집계 SQL 최적화 필요).
- 계약 drift 해소: 원본 오타 `suspededReason` → `suspendedReason` 확정. **API명세 Notion 원본도 동일하게 수정 반영 필요**(원본 미수정 시 재plan diff 발생).
- base path: 명세 `/partner/stores/{storeId}` ↔ 코드 컨벤션 `/api/v1/partner/stores/{storeId}`.
- 검수·게시 상태별 기능 접근 제한(비고) 규칙 미상세 → 기획 확정 필요(잔여).
- UI-1(준비 상태 라벨 문구)·UI-2(디자인 토큰) 디자인 확정 대기 — UI 스타일 적용 블로킹.

## Validation

- Tests: BE 소유 공방만 조회/타파트너 403/미존재 404 단위·e2e. FE status enum→라벨 매핑 단위, empty(클래스 0)·에러 상태 렌더 테스트.
- Manual checks: 파트너 토큰 상세 조회, 타파트너 공방 403, 미존재 404, 클래스 0개 empty UI, 네트워크 차단 오류 UI, 찜 버튼 미노출 확인, 수정 바텀시트 노출/라우팅.
- Observability: 조회 실패(500) 로깅.

## Decision Log

- 기능명 `공방 상세 조회`는 기능명세 DB 정확 일치(실행주체 partner, 도메인 store, 연관화면 공방 관리). API는 `GET /partner/stores/{storeId}`로 확정.
- 요구사항 "4. 공방 조회"(`/stores/[slug]`)는 퍼블릭 고객 뷰로, 본 파트너센터 상세와 **별개 기능**임을 명시(기능명세 비고 일치).
- 기능명세 요구(평점/리뷰수/진행예약수/클래스목록)와 현 API명세 응답 불일치 → CONTRACT-1~5로 사람 결정 받음(2026-06-01).
- (resolved 2026-06-01) CONTRACT-1: 상세 응답에 `rating`/`reviewCount`/`inProgressReservationCount` 필수 필드 추가.
- (resolved 2026-06-01) CONTRACT-2: `GET /partner/stores/{storeId}/programs` 신설 — 파트너 다공방 소유, 공방별 클래스 목록.
- (resolved 2026-06-01) CONTRACT-3: "진행 중" = 체험 완료 처리되지 않은 예약 건. `inProgressReservationCount` 단일 필드로 산출.
- (resolved 2026-06-01) CONTRACT-4: class status enum `DRAFT`/`ACTIVE`/`INACTIVE` + 전이 4종 확정. 준비 상태 라벨 SSOT.
- (resolved 2026-06-01) CONTRACT-5: 삭제 공방은 404(`STORE_NOT_FOUND`) 기본 정책 유지(soft-delete 스키마 별도 결정 불필요). 오타 `suspededReason`→`suspendedReason` 수정.

## Outcome

- Status: CONTRACT-1~5 확정 반영 완료(2026-06-01). API Contract 확정 → 구현(implementer) 이관 가능. 잔여 Open decisions는 UI-1·UI-2(디자인) — BE/연동 착수는 블로킹 없음, UI 스타일 적용만 디자인 대기.
- Follow-up: (1) API명세 Notion 원본의 `suspededReason` → `suspendedReason` 오타 수정 반영. (2) UI-1·UI-2 디자인 토큰 확보. (3) 검수·게시 상태별 기능 접근 제한 규칙 기획 확정.

## API Contract (스냅샷)

### 데이터모델 (store 상세 응답 — 현 API명세 그대로)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string(UUID) | 공방 ID |
| `partnerId` | string(UUID) | 파트너 ID |
| `name` | string | 공방명 |
| `slug` | string | 슬러그 |
| `description` | string | 공방 소개 |
| `phone` | string | 대표 연락처 |
| `address` | string | 주소(도로명) |
| `latitude` | number | 위도 |
| `longitude` | number | 경도 |
| `convenienceInfo` | object | `{ parking: boolean, pet: boolean, wifi: boolean }` — 주차·반려동물·와이파이 |
| `autoConfirm` | boolean | 자동 예약 확정 여부 |
| `cancelDeadlineDays` | number | 취소 가능 d-day |
| `status` | enum | `DRAFT` \| `PENDING` \| `PUBLISHED` \| `SUSPENDED` |
| `rejectedReason` | string \| null | 검수 반려 사유 |
| `suspendedReason` | string \| null | 노출 중단 사유 (원문 오타 `suspededReason` → `suspendedReason`으로 수정 확정, CONTRACT-5) |
| `rating` | number | **(CONTRACT-1 확정)** 공방 평균 별점. 리뷰 없으면 `0`. UI 기본 정보 표시 필수 |
| `reviewCount` | number | **(CONTRACT-1 확정)** 공방 리뷰 수. 리뷰 없으면 `0`. UI 기본 정보 표시 필수 |
| `inProgressReservationCount` | number | **(CONTRACT-1/3 확정)** 진행 중 예약 건수 = **체험 완료 처리되지 않은 예약 건** 수. 없으면 `0`. UI 표시 필수 |
| `operatingHours` | array | `[{ dayOfWeek, openTime, closeTime, breakStart, breakEnd }]` |
| `images` | array | `[{ id, imageUrl, thumbnailUrl, isThumbnail, sortOrder }]` — 대표 이미지 carousel용 |
| `businessDocument` | object | `{ ownerName, email, businessName, businessNumber, businessAddress, ocrStatus }` |
| `publishedAt` | string(ISO8601) \| null | 게시 일시 |
| `createdAt` | string(ISO8601) | 생성 일시 |

> CONTRACT-1/3 확정: 상세 응답에 `rating`/`reviewCount`/`inProgressReservationCount`를 **필수 필드로 포함**(기능명세 요구 3종 SSOT). 운영 클래스 목록은 별도 엔드포인트(아래 CONTRACT-2)로 분리.
> CONTRACT-3 정의: "진행 중" 예약 = **체험 완료(완료 처리) 되지 않은 예약 건**. `inProgressReservationCount`는 해당 정의로 BE가 집계해 단일 정수로 반환.

### 엔드포인트

- `GET /api/v1/partner/stores/{storeId}` — 내 공방 상세 (파트너센터)
  - 가드: `AuthGuard + PartnerGuard` (인증 토큰으로 파트너 capability 검증)
  - Request Headers: `Accept: application/json`, `Authorization: Bearer {accessToken}`
  - Path: `storeId` (조회할 공방 UUID)
  - Request body/query: 없음
  - 시스템 처리: 토큰으로 파트너 capability 검증 → `storeId` 조회 + `partner_id`가 요청자와 일치 확인 → 상세 정보·운영시간·이미지·사업자 서류·반려 사유 + 집계값(`rating`·`reviewCount`: review 도메인 집계 / `inProgressReservationCount`: 체험 미완료 예약 건수)을 함께 반환. 삭제 공방(미존재)은 404(CONTRACT-5).
  - Response `200 OK`:
    ```json
    {
      "statusCode": 200,
      "timestamp": "2026-05-25T18:15:00.000Z",
      "path": "/partner/stores/a1b2c3d4-...",
      "message": "공방 상세 정보가 성공적으로 조회되었습니다.",
      "data": {
        "store": {
          "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
          "name": "토담 공방",
          "slug": "todam-studio",
          "description": "흙과 함께하는 도자기 체험 공방입니다.",
          "phone": "02-1234-5678",
          "address": "서울특별시 성동구 성수이로 12길 34",
          "latitude": 37.5446,
          "longitude": 127.0556,
          "convenienceInfo": { "parking": true, "pet": false, "wifi": true },
          "autoConfirm": false,
          "cancelDeadlineDays": 1,
          "status": "PUBLISHED",
          "rejectedReason": null,
          "suspendedReason": null,
          "rating": 4.8,
          "reviewCount": 132,
          "inProgressReservationCount": 5,
          "operatingHours": [
            { "dayOfWeek": "MON", "openTime": "10:00", "closeTime": "19:00", "breakStart": "13:00", "breakEnd": "14:00" }
          ],
          "images": [
            { "id": "img-uuid-001", "imageUrl": "https://cdn.todam.app/stores/todam-studio/01.jpg", "thumbnailUrl": "https://cdn.todam.app/stores/todam-studio/01_thumb.jpg", "isThumbnail": true, "sortOrder": 1 }
          ],
          "businessDocument": {
            "ownerName": "김토담", "email": "partner@example.com", "businessName": "토담 공방",
            "businessNumber": "123-45-67890", "businessAddress": "서울특별시 성동구 성수이로 12길 34", "ocrStatus": "VERIFIED"
          },
          "publishedAt": "2026-05-20T10:00:00.000Z",
          "createdAt": "2026-05-18T12:00:00.000Z"
        }
      },
      "error": null
    }
    ```
  - 에러:
    - `401 UNAUTHORIZED` — "인증이 필요합니다."
    - `403 FORBIDDEN` — "해당 공방에 대한 접근 권한이 없습니다."
    - `404 STORE_NOT_FOUND` — "공방을 찾을 수 없습니다."
    - `500 INTERNAL_SERVER_ERROR` — "공방 상세 조회 중 서버 오류가 발생했습니다."
  - 공통 응답 봉투: `{ statusCode, timestamp, path, message, data, error }`

- **(신설 확정 — CONTRACT-2)** `GET /api/v1/partner/stores/{storeId}/programs` — 파트너센터 운영 클래스 목록
  - 배경: 파트너는 여러 공방을 소유하며, 공방별 운영 클래스 목록을 조회한다. 퍼블릭 `GET /stores/{slug}/programs`는 `ACTIVE`만 노출하므로 파트너센터용 별도 엔드포인트로 분리(아래 status enum 전체 포함).
  - 가드: `AuthGuard + PartnerGuard`, `storeId`의 `partner_id`가 요청자와 일치 확인(불일치 403).
  - Request Headers: `Accept: application/json`, `Authorization: Bearer {accessToken}`
  - Path: `storeId` (조회할 공방 UUID)
  - Request body/query: 없음 (목록 전체 반환. 페이지네이션 필요 시 차후 보강)
  - Response `200 OK`:
    ```json
    {
      "statusCode": 200,
      "timestamp": "2026-05-25T18:15:00.000Z",
      "path": "/partner/stores/a1b2c3d4-.../programs",
      "message": "운영 클래스 목록이 성공적으로 조회되었습니다.",
      "data": {
        "programs": [
          {
            "id": "prog-uuid-001",
            "title": "도자기 물레 원데이 클래스",
            "status": "ACTIVE",
            "thumbnailUrl": "https://cdn.todam.app/programs/prog-001_thumb.jpg",
            "price": 45000,
            "durationMinutes": 120,
            "createdAt": "2026-05-19T09:00:00.000Z"
          }
        ]
      },
      "error": null
    }
    ```
  - 클래스 `status` enum (CONTRACT-4 확정):
    - `DRAFT` — 파트너가 정보 작성 중
    - `ACTIVE` — 예약 가능, 퍼블릭 페이지 노출
    - `INACTIVE` — 파트너 일시 중단, 신규 예약 불가
  - 상태 전이 (CONTRACT-4 확정): `(없음)→DRAFT`(등록 시작) / `DRAFT→ACTIVE`(게시 완료) / `ACTIVE→INACTIVE`(일시 중단) / `INACTIVE→ACTIVE`(재게시).
  - "클래스 준비 상태" 라벨은 class `status` enum을 그대로 SSOT로 사용. FE 라벨 매핑은 UI-1 디자인 확정에 따른다(plan은 enum만 고정).
  - 에러: `401 UNAUTHORIZED` / `403 FORBIDDEN`(타파트너 공방) / `404 STORE_NOT_FOUND`(미존재·삭제 공방, CONTRACT-5) / `500 INTERNAL_SERVER_ERROR`.
  - 클래스 0개 시 `data.programs: []` (UI empty 처리).

> CONTRACT-3 확정: 진행 중 예약 건수는 별도 엔드포인트가 아니라 **상세 응답 `inProgressReservationCount` 필드**로 단일화. "진행 중" = 체험 완료 처리되지 않은 예약 건. 커서 기반 예약 목록(`GET /partner/stores/{storeId}/reservations`)은 본 기능 Scope Out(예약 관리 화면 소관).
