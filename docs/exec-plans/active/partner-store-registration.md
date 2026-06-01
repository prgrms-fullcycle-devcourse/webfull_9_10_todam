# Feature Plan: 파트너 공방 관리 - 공방등록

## Summary

- Goal: User가 파트너 신청을 위해 첫 공방을 등록하거나, 이미 승인된 Partner가 추가 공방을 등록한다. 4단계 폼(사업자 정보 → 공방 정보 → 영업 정보 → 예약 정보)을 작성하고 제출하면 `Store.status = PENDING`으로 전이된다. 첫 공방 등록 시 `Partner` 엔티티가 자동 생성(`status = PENDING`)된다.
- Owner:
- Date: 2026-06-01

## Status

- [x] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md — `공방 store` 도메인(공방 상태/상태전이, 파트너 신청/첫 공방 등록, 추가 공방 등록), `partner` 도메인(파트너 상태/상태전이), 접근 주체/가드(`AuthGuard`, 첫 등록은 User 이상, 추가 등록은 `AuthGuard + PartnerGuard`)
- 기능명세: `첫 공방 등록` (기능명세 DB `b242ee66b06c8349805601ce4a05247a` — 실행주체: user / 도메인: store / 종료상태: PENDING / 연관화면: 공방 관리)
  - 트리거: 마이페이지 > 파트너 신청하기
  - 동작: 사업자 정보 → 공방 정보 → 영업 정보 → 예약 정보 4단계 폼 → 신청하기 제출 → 검수 완료 화면
  - 예외: slug 중복 / 필수값 누락 / 검수 반려 시 반려 사유 노출
  - 비고: 첫 공방 등록 = 파트너 온보딩 플로우. 승인 시 USER → PARTNER 권한 승격.
- API명세: 아래 엔드포인트 4종 (API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`에서 select)
  - `POST /stores` — 공방 초안 생성 (파트너 신청 포함)
  - `POST /partner/stores/{storeId}/images` — 공방 이미지 presigned URL 발급
  - `PATCH /partner/stores/{storeId}/images/{imageId}/confirm` — 이미지 업로드 완료 확인 (PENDING → UPLOADED)
  - `POST /partner/stores/{storeId}/submit` — 공방 심사 제출 (DRAFT → PENDING)
- Relevant design docs: DESIGN.md (작업 시작 조건 — 단계별 진행 indicator, 폼 필드 size 토큰, 상태 Badge variant enum 확보 필요)
- Open decisions:
  - (CONTRACT-2) 첫 공방(User) vs 추가 공방(APPROVED Partner) 분기는 명세 기준 서버가 파트너 엔티티 존재 여부로 처리. 가드는 `AuthGuard`만 적용.
  - (UI-1) 4단계 진행 indicator(Stepper) 컴포넌트 디자인 토큰(활성/완료/미완료 상태별 컬러) DESIGN.md 미확정.
  - (UI-2) 반려 상태 Badge variant(`danger`) 컬러 토큰 미확정.

## Scope

- In:
  - BE: `POST /stores` (공방 초안 생성 + 첫 공방 시 Partner 엔티티 자동 생성), `POST /partner/stores/{storeId}/images` (presigned PUT URL 발급), `POST /partner/stores/{storeId}/submit` (PENDING 전이) 3개 엔드포인트 구현. slug 중복 검증, 카카오맵 geocode 연동.
  - UI: 4단계 폼(공방 정보 / 영업 정보 / 이미지 업로드 / 예약 정보) + 제출 완료(검토중 / 반려) 화면. (`apps/web/src/features/store-registration` 기존 UI가 존재하므로 실 API 연동 집중.)
  - 연동: 실 API로 mock 전환 (`.env.local` `NEXT_PUBLIC_API_MOCKING=disabled`), 인증 헤더 연결, presigned 업로드(공방 이미지), geocode 연동.
- Out:
  - 사업자등록증 **파일 업로드**(`documentUrl`) 및 **OCR 국세청 진위 확인** — 백로그. (피그마 1단계에 파일 업로드 필드 없음. 사업자 정보 텍스트 필드는 In 스코프)
  - Admin 검수 승인/반려 처리 — 별도 admin 기능.
  - 공방 수정 (REJECTED 후 재제출) — 별도 기능.
  - 공방 목록 조회 (`GET /partner/stores`) — `partner-store-list` plan 소관.
  - 공방 이미지 삭제 (`DELETE /partner/stores/{storeId}/images/{imageId}`) — 등록 플로우 외 별도 편집 기능.

## Plan

1. **(BE) 공방 초안 생성 `POST /stores`**: `store` 모듈 컨트롤러/서비스/리포지터리 구현. AuthGuard 적용. slug 중복 검증, 카카오맵 geocode 변환, `stores` + `store_operating_hours` row 생성(`status = DRAFT`). 첫 공방 여부(Partner 레코드 존재 확인) → `partners` row 자동 생성(`status = PENDING`).
2. **(BE) 이미지 presigned URL `POST /partner/stores/{storeId}/images`**: S3 presigned PUT URL 생성(5분 유효). `store_images` row 선생성. 응답에 `uploadUrl`, `imageId`, `imageUrl` 반환.
3. **(BE) 공방 심사 제출 `POST /partner/stores/{storeId}/submit`**: 상태 검증(`DRAFT` 또는 `REJECTED`) → 필수 항목 완비 검증(이름·주소·대표이미지 1장) → `stores.status = PENDING` 전이. notification 큐 등록(파트너 신청 알림).
4. **(UI) 실 API 연동 전환**: 기존 MSW mock을 실 API로 교체. `NEXT_PUBLIC_API_MOCKING=disabled` + `NEXT_PUBLIC_API_URL` 설정. `shared/api/auth-token.ts`에 accessToken 주입. 엔드포인트 경로 확정 반영.
5. **(UI) presigned 업로드 연동**: `POST /partner/stores/{storeId}/images` 호출 → 발급받은 `uploadUrl`로 S3 직접 PUT 업로드.
6. **(UI) geocode 연동**: 다음 주소 검색 → 카카오 로컬 API 또는 BE geocode 엔드포인트로 위경도 변환.
7. **(연동) 제출 완료 → 검수 대기 화면**: `POST /partner/stores/{storeId}/submit` 성공 시 검토중 화면 렌더. 반려(`REJECTED`) 상태 조회 시 반려 사유 표시.

## Out (단계별 완료물)

- API:
  - `POST /stores` — 공방 초안 생성 (slug 자동생성/중복검증, businessDocument 저장, 첫 공방 시 partner 자동생성)
  - `POST /partner/stores/:storeId/images` — 공방 이미지 presigned PUT URL 발급
  - `PATCH /partner/stores/:storeId/images/:imageId/confirm` — S3 객체 존재 검증 후 PENDING→UPLOADED
  - `POST /partner/stores/:storeId/submit` — 공방 심사 제출 (DRAFT/REJECTED → PENDING)
  - 주요 파일:
    - `apps/api/src/modules/store/store.module.ts`
    - `apps/api/src/modules/store/presentation/controllers/store.controller.ts`
    - `apps/api/src/modules/store/presentation/dto/create-store.dto.ts`
    - `apps/api/src/modules/store/presentation/dto/store-image.dto.ts`
    - `apps/api/src/modules/store/presentation/dto/submit-store.dto.ts`
    - `apps/api/src/modules/store/application/use-cases/create-store.use-case.ts`
    - `apps/api/src/modules/store/application/use-cases/create-store-image.use-case.ts`
    - `apps/api/src/modules/store/application/use-cases/confirm-store-image.use-case.ts`
    - `apps/api/src/modules/store/application/use-cases/submit-store.use-case.ts`
    - `apps/api/src/common/s3/s3.service.ts` (objectExists), `s3-object.util.ts` (keyFromImageUrl)
- UI:
- 연동:

## Risks

- presigned URL 5분 만료: 공방 이미지 업로드 중 만료 시 재발급 로직 필요.
- slug 자동 생성: 미입력 시 BE에서 nanoid로 생성. FE는 slug 필드를 선택 입력으로 처리.

## Validation

- Tests: BE 서비스 단위(slug 중복, Partner 자동 생성 여부, 상태 전이), 가드(401·403) e2e. FE 폼 유효성(zod 스키마), presigned 업로드 성공/실패 분기.
- Manual checks: User 토큰으로 첫 공방 등록 → Partner 엔티티 생성 확인. Partner 토큰으로 추가 공방 등록. slug 중복 409. 제출 완료 화면 정상 이동.
- Observability: presigned URL 발급 실패 로깅.

## Decision Log

- 2026-06-01: 기능명세 DB에서 `공방등록` 검색 → `첫 공방 등록` 항목으로 매칭(실행주체 user, 도메인 store, 종료상태 PENDING).
- 2026-06-01: API명세 DB 확인 → 공방 등록 엔드포인트는 `POST /stores` (not `/partner/stores`). request body에 `businessDocument` 포함, `convenienceInfo.wifi` 필드 추가, `reservationIntervalMinutes`/`maxCapacityPerSlot` 미포함 확인.
- 2026-06-01: UI는 기존 store-registration plan에서 MSW mock 구현이 완료된 상태. 본 plan은 BE 구현 + 실 API 연동 전환에 집중.
- 2026-06-01: 사업자등록증 업로드 및 OCR 진위 확인 전체 백로그 제외. 피그마 디자인에 해당 필드 없음. `businessDocument` 필드도 현재 스코프에서 제거.
- 2026-06-01: 피그마 1단계 재확인 → 사업자 정보 텍스트 필드(사업자번호/상호명/대표자명/사업장주소/이메일)는 폼에 존재. `businessDocument`를 텍스트 입력 필드로 복원(파일 업로드·OCR만 백로그 유지). `business_documents.document_url`을 nullable로 변경(migration `20260601090000_business_document_url_nullable`).
- 2026-06-01: 파트너 분기 명세 충실화 → 추가 공방 등록은 `APPROVED` 파트너만 허용. 그 외 status(PENDING/REJECTED/SUSPENDED/TERMINATED)는 `403 PARTNER_NOT_APPROVED`로 차단. (CONTRACT-2의 "partner 존재로만 분기"에서 status 검증 추가.)
- 2026-06-01: 피그마 3단계(영업 정보)에 "예약 시간 간격"(1/1.5/2/3시간) 필드 존재 확인 → `reservationIntervalMinutes`(분 단위, 60/90/120/180) Store에 추가. 추후 프로그램 타임슬롯 생성 기준값으로 사용. `stores.reservation_interval_minutes` 컬럼 추가(migration `20260601100000_add_store_reservation_interval`).

## Outcome

- Status:
- Follow-up: Admin 검수(승인/반려) — 별도 admin plan. 반려 후 재제출(공방 수정) — 별도 기능. 사업자등록증 OCR — 백로그.

## API Contract (스냅샷)

### 데이터모델

#### Store (생성/제출 관련 핵심 필드)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string(UUID) | 공방 ID |
| `name` | string | 공방명 (2~40자) |
| `slug` | string | 영문 소문자·숫자·하이픈, 4~40자, unique. 미입력 시 nanoid 자동 생성 |
| `description` | string \| null | 공방 소개 (최대 1000자) |
| `phone` | string | 대표 연락처 |
| `address` | string | 도로명 주소 |
| `latitude` | number | 위도 (카카오맵 API로 변환) |
| `longitude` | number | 경도 (카카오맵 API로 변환) |
| `convenienceInfo` | object | `{ parking: boolean, pet: boolean, wifi: boolean }` |
| `autoConfirm` | boolean | 자동 예약 확정 여부 |
| `cancelDeadlineDays` | number | 취소 가능 기한(d-day) |
| `reservationIntervalMinutes` | number | 예약 시간 간격(분). `60`/`90`/`120`/`180` 중 하나. 추후 프로그램 타임슬롯 생성 기준 |
| `operatingHours` | array | 영업 요일·시간 (아래 참조) |
| `status` | enum | `DRAFT` \| `PENDING` \| `PUBLISHED` \| `REJECTED` \| `SUSPENDED` |

#### operatingHours 항목

| 필드 | 타입 | 설명 |
|------|------|------|
| `dayOfWeek` | string | `MON` \| `TUE` \| `WED` \| `THU` \| `FRI` \| `SAT` \| `SUN` |
| `openTime` | string | HH:mm 형식 |
| `closeTime` | string | HH:mm 형식 |
| `breakStart` | string \| null | 휴식 시작 (선택) |
| `breakEnd` | string \| null | 휴식 종료 (선택) |

#### businessDocument 항목 (사용자 직접 입력)

| 필드 | 타입 | 설명 |
|------|------|------|
| `businessNumber` | string | 사업자등록번호. 하이픈 없이 숫자 10자리 |
| `businessName` | string | 상호명 (최대 200자) |
| `ownerName` | string | 대표자명 (최대 100자) |
| `businessAddress` | string | 사업장 주소 (최대 500자) |
| `email` | string \| null | 사업자 이메일 (선택) |

> `documentUrl`(사업자등록증 파일), `ocrStatus`/`verifiedAt`(국세청 진위 확인)는 **백로그**. 스키마상 `document_url`은 nullable로 변경됨.

---

### 엔드포인트

#### 1. `POST /stores` — 공방 초안 생성 (파트너 신청 포함)

- 가드: `AuthGuard` (User 이상)
- Request Headers: `Content-Type: application/json`, `Authorization: Bearer {accessToken}`
- Request Body:
  ```json
  {
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
    "reservationIntervalMinutes": 60,
    "operatingHours": [
      {
        "dayOfWeek": "MON",
        "openTime": "10:00",
        "closeTime": "19:00",
        "breakStart": "13:00",
        "breakEnd": "14:00"
      }
    ],
    "businessDocument": {
      "businessNumber": "5555555555",
      "businessName": "흙담",
      "ownerName": "김리듬",
      "businessAddress": "서울특별시 성동구 둑섬로 273(성수동)",
      "email": "leadem@studio.com"
    }
  }
  ```
- 시스템 처리: slug 중복 검증 → 사업자등록번호 형식 검증(숫자 10자리) → **파트너 분기**(레코드 없음 → 첫 공방, `partners` 자동 생성 `status = PENDING` / 레코드 있고 `APPROVED` → 추가 공방 허용 / 그 외 status → 403 차단) → 카카오맵으로 위경도 변환 → `stores` row 생성(`status = DRAFT`) → `store_operating_hours` + `business_documents` 저장
- Response `201 Created`:
  ```json
  {
    "statusCode": 201,
    "timestamp": "2026-06-01T00:00:00.000Z",
    "path": "/stores",
    "message": "공방이 성공적으로 등록되었습니다. 제출 후 검수를 진행해주세요.",
    "data": {
      "store": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
        "name": "토담 공방",
        "slug": "todam-studio",
        "status": "DRAFT",
        "createdAt": "2026-06-01T00:00:00.000Z"
      }
    },
    "error": null
  }
  ```
- 에러:
  - `400 BAD_REQUEST` — 필수 필드 누락 / slug 형식 오류 / 사업자번호 형식 오류
  - `401 UNAUTHORIZED` — 인증 필요
  - `403 PARTNER_NOT_APPROVED` — 승인되지 않은 파트너의 추가 공방 등록 시도
  - `409 SLUG_CONFLICT` — slug 중복

---

#### 2. `POST /partner/stores/{storeId}/images` — 공방 이미지 presigned URL 발급

- 가드: `AuthGuard` (공방 소유 권한 검증)
- Request Headers: `Content-Type: application/json`, `Authorization: Bearer {accessToken}`
- Path Params: `storeId` (UUID)
- Request Body:
  ```json
  {
    "fileName": "workshop_main.jpg",
    "fileType": "image/jpeg",
    "isThumbnail": true
  }
  ```
- 시스템 처리: presigned PUT URL 생성(5분 유효) → `store_images` row 선생성 → uploadUrl + imageId 반환
- Response `201 Created`:
  ```json
  {
    "statusCode": 201,
    "timestamp": "2026-06-01T00:00:00.000Z",
    "path": "/partner/stores/{storeId}/images",
    "message": "Pre-signed URL이 성공적으로 발급되었습니다. 5분 이내에 업로드를 완료해주세요.",
    "data": {
      "imageId": "img-uuid-001",
      "uploadUrl": "https://todam-bucket.s3.ap-northeast-2.amazonaws.com/stores/.../images/uuid.jpg?...",
      "imageUrl": "https://cdn.todam.app/stores/.../images/uuid.jpg"
    },
    "error": null
  }
  ```
- 에러:
  - `400 FILE_SIZE_EXCEEDED` — 5MB 초과
  - `401 UNAUTHORIZED` / `403 FORBIDDEN` / `500 INTERNAL_SERVER_ERROR`

---

#### 3. `PATCH /partner/stores/{storeId}/images/{imageId}/confirm` — 이미지 업로드 완료 확인

- 가드: `AuthGuard` (공방 소유 권한 검증)
- Request Headers: `Authorization: Bearer {accessToken}`
- Path Params: `storeId` (UUID), `imageId` (UUID)
- Request Body: 없음
- 시스템 처리: 소유권 검증 → imageId로 store_images row 조회 → status `PENDING` 검증 → `UPLOADED`로 전이. 이미 `UPLOADED`면 409.
- Response `200 OK`:
  ```json
  {
    "statusCode": 200,
    "timestamp": "2026-06-01T00:00:00.000Z",
    "path": "/partner/stores/{storeId}/images/{imageId}/confirm",
    "message": "이미지 업로드가 확인되었습니다.",
    "data": {
      "image": {
        "id": "img-uuid-001",
        "status": "UPLOADED"
      }
    },
    "error": null
  }
  ```
- 에러:
  - `401 UNAUTHORIZED` / `403 FORBIDDEN`
  - `404 NOT_FOUND` — 이미지 없음
  - `409 ALREADY_UPLOADED` — 이미 업로드 확인된 이미지

---

#### 4. `POST /partner/stores/{storeId}/submit` — 공방 심사 제출 (DRAFT → PENDING)

- 가드: `AuthGuard` (공방 소유 권한 검증)
- Request Headers: `Authorization: Bearer {accessToken}`
- Path Params: `storeId` (UUID)
- Request Body: 없음
- 시스템 처리: `DRAFT` 또는 `REJECTED` 상태 검증 → 필수 항목 완비 검증 → `stores.status = PENDING` 전이 → 어드민 검수 대기 알림 발송
- Response `200 OK`:
  ```json
  {
    "statusCode": 200,
    "timestamp": "2026-06-01T00:00:00.000Z",
    "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/submit",
    "message": "공방 검수 신청이 완료되었습니다. 검수 결과를 기다려 주세요.",
    "data": {
      "store": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "status": "PENDING",
        "updatedAt": "2026-06-01T00:00:00.000Z"
      }
    },
    "error": null
  }
  ```
- 에러:
  - `400 MISSING_REQUIRED_FIELDS` — 필수 정보 누락
  - `403 FORBIDDEN` — 공방 소유 권한 없음
  - `409 INVALID_STORE_STATUS` — DRAFT/REJECTED 외 상태
  - `500 INTERNAL_SERVER_ERROR`

---
