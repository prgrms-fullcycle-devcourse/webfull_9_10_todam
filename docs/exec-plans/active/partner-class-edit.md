# Feature Plan: 클래스 정보 수정

## Summary

- Goal: 파트너가 등록된 클래스(프로그램)의 기본 정보와 운영 정보를 수정할 수 있도록 한다.
- Owner:
- Date: 2026-06-01

## Status

- [x] API 구현
- [x] UI 구현
- [x] API 연동 (텍스트/운영 PATCH·이미지 추가·기존 이미지 삭제 실 BE 연동 완료)

## Context

- 요구사항명세서(고정): docs/requirements.md — `class` 도메인 § 3. 클래스 수정·중단
- 기능명세: "클래스 정보 수정" (기능명세 DB `b242ee66b06c8349805601ce4a05247a`)
- API명세:
  - `PATCH /partner/stores/{storeId}/programs/{programId}` — 프로그램 수정
  - `POST /partner/stores/{storeId}/programs/{programId}/images` — 이미지 Pre-signed URL 발급 (교체)
  - `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭, preload 참고용)
- Relevant design docs: DESIGN.md (UI 규칙 확보 필요 — Open decisions 참조)
- Open decisions: **모두 해소됨 (2026-06-01)**
  1. **이미지 삭제 API**: BE가 `DELETE .../images/{imageId}` 엔드포인트 추가. 교체 시 기존 이미지 삭제 + 신규 업로드.
  2. **파트너 전용 조회 API 불필요**: `DRAFT`/`INACTIVE` preload는 UI에서 진입점 자체를 막으므로 퍼블릭 엔드포인트(`GET /stores/{slug}/programs/{programId}`) 사용.
  3. **`difficulty` 컬럼 존재**: `programs` 테이블에 컬럼 추가 필요. PATCH body에 포함.
  4. **`childrenAllowed`, `deliveryAvailable` 별도 boolean 필드 필요**: `deliveryOption`과 독립적으로 추가.
  5. **description 최대 글자수**: 기능명세 기준 **1000자** 적용.

---

## Scope

- In:
  - 기본 정보 수정 폼: 대표 이미지, 클래스명, 난이도, 상세 설명
  - 운영 정보 수정 폼: 가격, 소요시간, 리드타임, 어린이 동반 가능, 택배 배송 가능
  - 수정 폼 데이터 preload (기존 값 초기화)
  - 변경사항 있을 때만 저장 버튼 활성화 (dirty state)
  - 저장 성공 시 클래스 상세 조회 화면으로 이동 + 토스트 메시지 노출
  - 저장 실패 시 수정 화면 유지 + 실패 토스트 노출
  - 이탈 시 변경사항 확인 다이얼로그
  - 가격·정원·리드타임 변경 시 스냅샷 분리(서버 자동 처리, FE는 일반 PATCH 요청)
  - MSW mock 작성 (실 API 연동 전)

- Out:
  - 클래스 상태 변경 (ACTIVE↔INACTIVE) — 별도 기능
  - 클래스 등록 신규 생성 — 별도 기능
  - 클래스 삭제 — MVP 범위 외
  - 이미지 삭제 API — 명세 미확인 (Open decision #1)
  - 타임슬롯 수정 — 별도 기능

---

## Plan

### BE

1. `PATCH /partner/stores/{storeId}/programs/{programId}` 구현
   - `AuthGuard`, `PartnerGuard` 적용
   - 공방 소유 권한 검증 (`storeId` + `partnerId`)
   - partial update 처리 (변경 필드만 반영)
   - `price`, `leadTimeDays` 변경 + 기존 예약 1건 이상이면 `program_snapshots` 신규 row 생성
   - `programs.updated_at` 갱신

2. `POST /partner/stores/{storeId}/programs/{programId}/images` 구현 (이미 존재할 경우 확인)
   - S3 Pre-signed PUT URL 발급
   - `program_images` row 선 생성 (`image_url`, `is_thumbnail`)
   - `isThumbnail = true` 처리 시 기존 thumbnail 교체 정책 결정 (Open decision #1 해소 후)

3. 이미지 삭제 엔드포인트 추가 여부 결정 후 구현 (Open decision #1)

3-1. `GET /stores/{slug}/programs/{programId}` 퍼블릭 상세 구현 (preload용, 비인증, ACTIVE만 노출)

### FE

4. 수정 폼 라우트 및 레이아웃 구성
   - 기본 정보 수정 탭 / 운영 정보 수정 탭 분리 (기능명세 트리거 기준)
   - 진입점: 클래스 상세 조회 화면 내 "기본 정보 수정" / "운영 정보 수정" 버튼

5. preload 처리
   - Open decision #2 해소 후: 파트너 전용 조회 또는 퍼블릭 API 사용 결정
   - React Query로 서버 데이터 fetch → 폼 초기값 세팅

6. 폼 상태 관리
   - react-hook-form + zod 스키마 검증
   - `isDirty` 상태로 저장 버튼 활성/비활성 제어
   - 이탈 시 `useBeforeUnload` 또는 라우터 가드로 확인 다이얼로그

7. 이미지 업로드 처리
   - Pre-signed URL 발급 → S3 직접 PUT 업로드 → PATCH body에 `imageUrl` 포함
   - 대표 이미지 최소 1장 유지 검증
   - 5MB 이하, JPG/PNG/HEIC 형식 검증 (클라이언트 사이드)

8. 저장 처리
   - PATCH 호출 → 성공 시 클래스 상세로 이동 + "수정된 클래스 정보가 반영되었어요" 토스트
   - 실패 시 현재 화면 유지 + 실패 토스트

9. MSW mock 작성
   - `PATCH /partner/stores/:storeId/programs/:programId` handler
   - `POST /partner/stores/:storeId/programs/:programId/images` handler

### 검증

10. 유닛 테스트: zod 스키마 경계값, 스냅샷 분리 로직
11. 통합 확인: dirty state 동작, 이탈 가드, 이미지 교체 플로우

---

## Out (단계별 완료물)

- API (구현 완료 2026-06-04, 마이그레이션 없음 — 기존 컬럼만 사용):
  - `PATCH /partner/stores/{storeId}/programs/{programId}` — partial update. 신규: `update-program.use-case.ts`, `update-program.dto.ts`. 수정 가능 필드 title/description/materials/caution/price/leadTimeDays/durationMinutes/difficulty/childFriendly/deliverable. price 또는 leadTimeDays 실변경 + 기존 예약(reservations.programId 카운트) 1건 이상 시 `program_snapshots` 신규 row 생성(트랜잭션). 응답 `data.program` = {id,title,price,status,updatedAt}.
  - `DELETE /partner/stores/{storeId}/programs/{programId}/images/{imageId}` — 신규: `delete-program-image.use-case.ts`. 권한 403 FORBIDDEN, 미존재 404 IMAGE_NOT_FOUND. S3 원본/썸네일 삭제 후 row 삭제(store 이미지 삭제 패턴 동일). 응답 data: null.
  - `POST .../images` — 기존 구현 contract 일치 확인 완료(programImageId/uploadUrl/imageUrl, INVALID_FILE_TYPE 처리). 미수정.
  - `GET /stores/{slug}/programs/{programId}` — 신규: `get-public-program-detail.use-case.ts`. 퍼블릭(비인증), slug로 공방 식별 + `status=ACTIVE`·이미지 `UPLOADED`만 노출, 미해당 404 PROGRAM_NOT_FOUND. 응답 DTO는 `GetProgramDetailResponseDto` 재사용.
  - 공용화: S3 원본·썸네일 best-effort 삭제 로직을 `S3Service.deleteImageObjects(urls)`로 추출, `delete-program-image`·`delete-store-image` 양쪽에서 사용(중복 제거).
  - 수정 파일: `program.controller.ts`(PATCH·DELETE·퍼블릭 GET 라우트 추가), `program.module.ts`(provider 등록), `s3.service.ts`(deleteImageObjects), `delete-store-image.use-case.ts`(공용 메서드 사용).
  - 주의: contract 데이터모델 표의 `images` 필드는 PATCH request 예시에 미포함 → 이미지 관리는 POST/DELETE 전용으로 처리하고 PATCH DTO에서 제외(드리프트 방지).
- UI: 기본 정보 수정 폼, 운영 정보 수정 폼, 이탈 다이얼로그
- 연동 (fe, 2026-06-04):
  - `apps/web/src/features/program/edit/api.ts` — MSW mock(`/api/v1`) 제거, 실 BE 루트(`/partner`)로 전환. `patchProgram`/`postProgramImage`/`deleteProgramImage` 모두 `apiFetch`(accessToken 자동 부착) 사용. 퍼블릭 `getProgramDetail`/`useProgramDetail` 은 edit 에서 제거(preload 는 파트너 상세 재사용).
  - `apps/web/src/features/program/edit/model/useProgramEditPreload.ts` — MOCK_SLUG 퍼블릭 mock 제거 → `usePartnerProgramDetail(storeId, programId)`(features/program/detail) 재사용. 시그니처 `(storeId, programId)`.
  - storeId 운반: `ClassEditSheet`(features/program/detail) 에 `storeId` prop 추가 → edit info/operations 링크에 `?storeId=` 부착. `classes/[id]/page.tsx` 가 `useSearchParams().get('storeId')` 로 받은 storeId 를 ClassEditSheet 에 전달. edit 두 page(`edit/info`,`edit/operations`) 가 `useSearchParams().get('storeId')` 수신 → preload·mutation 에 전달.
  - PATCH 저장: `ProgramOperationsEditScreen`(price/leadTimeDays/durationMinutes/childFriendly/deliverable) + `ProgramInfoEditScreen`(title/description/difficulty) → `usePatchProgram(storeId, programId)` 실 BE 호출. shared `ProgramEditRequest`(partial) 로 전송. 성공 토스트·`router.back()` 보존.
  - 이미지 추가: `ProgramInfoEditScreen` 신규 이미지 = `useUploadProgramImage`(postProgramImage presigned 발급) → `uploadToS3`(S3 PUT) 실 BE 연동.
  - edit 화면 program 타입 `ProgramDetail`(퍼블릭) → `PartnerProgramDetail`(shared) 로 전환.
  - 검증: `apps/web` tsc --noEmit 통과, eslint 변경분 error 0(기존 `<img>` warning 1, 이번 변경 무관).
- **기존 이미지 삭제 (gap 해소·연동 완료, fe 2026-06-04)**:
  - BE/shared 해소: 파트너 상세(`GET /partner/stores/{storeId}/programs/{programId}`) 이미지 응답에 `programImageId`·`isThumbnail` 추가됨. shared `partnerProgramDetailImageSchema` = `{ programImageId, imageUrl, thumbnailUrl|null, isThumbnail }`.
  - 연동: `ProgramInfoEditScreen` 기존 이미지 매핑 id 를 실 `image.programImageId` 로 사용(합성키 `existing-{index}` 제거). 저장 시 `images.deletedImageIds` 를 `useDeleteProgramImage` → `deleteProgramImage(storeId, programId, programImageId)` 실 BE DELETE 로 호출(신규 추가분은 서버 미반영이라 로컬 제거만). `isSaving` 에 delete mutation pending 포함.
  - 대표 이미지 지정 UI(`isThumbnail` 토글)는 현재 `PendingImageField`/`ImageUploadGrid` 에 없음 — 표시는 `thumbnailUrl ?? imageUrl` 유지. 별도 대표 지정 UI 추가는 범위 외.
  - detail 화면(`classes/[id]/page.tsx`)은 `images[0].imageUrl` 만 소비 → 스키마 필드 추가는 비파괴, 영향 없음 확인.
  - 검증: `apps/web` tsc --noEmit 통과, eslint error 0(기존 `<img>` warning 무관).

---

## Risks

- **스냅샷 분리 미인지**: FE가 가격/정원/리드타임 수정 후 "기존 예약에 반영되지 않음"을 UI로 안내하지 않으면 파트너 혼란 발생. 변경 시 안내 문구 또는 확인 다이얼로그 필요 여부 결정 필요.
- **`difficulty` / `childrenAllowed` / `deliveryAvailable` DB 마이그레이션**: 신규 컬럼이므로 BE 마이그레이션 선행 후 FE 연동 가능. 순서 주의.

---

## Validation

- Tests:
  - PATCH 요청 시 partial update 정상 동작 (미전송 필드 유지)
  - 기존 예약 있을 때 가격 변경 → `program_snapshots` 신규 row 생성 확인
  - 기존 예약 없을 때 가격 변경 → 스냅샷 미생성 확인
  - dirty state false일 때 저장 버튼 비활성화 확인
  - 이탈 시 다이얼로그 노출 확인
- Manual checks:
  - 대표 이미지 교체 후 클래스 상세 화면에서 즉시 반영 확인
  - 저장 실패 시 폼 데이터 유지 확인
  - "수정된 클래스 정보가 반영되었어요" 토스트 노출 확인
- Observability: PATCH 응답 200/403/404 로그 확인

---

## Decision Log

- 2026-06-01: plan 초안 작성. 이미지 삭제 API, 파트너 전용 조회 API, 난이도 필드, 어린이 동반/배송 가능 필드의 서버 스키마 미확인으로 Open decisions 등록.
- 2026-06-01: Open decisions 전체 해소. BE가 DELETE 이미지 엔드포인트 추가, difficulty/childrenAllowed/deliveryAvailable 컬럼 추가. description 1000자. DRAFT/INACTIVE preload는 UI 진입점 차단으로 대응.
- 2026-06-04: 구현 착수 시 contract가 머지된 데이터모델과 모순 발견 → 정정. (1) `capacity` 제거(공방 단위 `stores.maxCapacityPerSlot` 일원화), 스냅샷 트리거 `price`/`leadTimeDays`로 한정. (2) 배송은 `deliverable` boolean 단일(`deliveryOption` enum 폐기). (3) 외부 필드명 기존 생성/상세 API와 동일하게 `childFriendly`/`deliverable`. (4) `materials` 수정 가능 필드 포함. `difficulty`는 컬럼 기존재로 마이그레이션 불필요. 이미지 발급 POST는 이미 구현됨(신규 불필요).
- 2026-06-04: 퍼블릭 상세 `GET /stores/{slug}/programs/{programId}`가 미구현(레포에 슬러그 기반 공개 라우트 없음)임을 확인 → contract #4로 함께 구현하기로 결정. 가시성 정책: slug 식별 + `status=ACTIVE`만 노출, 이미지 `UPLOADED`만, 미해당 404. contract #4 예시의 stale 필드(`capacity`/`deliveryOption`) 정정. (Open decision #2의 "퍼블릭 엔드포인트 사용" 전제가 미구현 상태였음을 해소)

---

## Outcome

- Status: planning
- Follow-up: Open decisions 1~5 해소 후 구현(implementer)으로 이관

## API Contract (스냅샷)

### 데이터모델

**programs (수정 가능 필드)**

| 필드 | 타입 | 분류 | 비고 |
|------|------|------|------|
| `title` | string | 기본 정보 | 클래스명, 2~60자 |
| `description` | string \| null | 기본 정보 | 상세 설명, 최대 1000자 (기능명세 기준) |
| `materials` | string \| null | 기본 정보 | 준비물 (수정 가능) |
| `caution` | string \| null | 기본 정보 | 유의사항 |
| `price` | number | 운영 정보 | 양의 정수, 예약 존재 시 스냅샷 분리 |
| `leadTimeDays` | number | 운영 정보 | 예약 존재 시 스냅샷 분리 |
| `durationMinutes` | number | 운영 정보 | 30분 단위 |
| `difficulty` | `BASIC` \| `INTERMEDIATE` \| `ADVANCED` | 기본 정보 | 기본/중급/심화 |
| `childFriendly` | boolean | 운영 정보 | 어린이 동반 가능 여부 |
| `deliverable` | boolean | 운영 정보 | 택배 배송 가능 여부 |
| `images` | `program_images[]` | 기본 정보 | Pre-signed URL로 S3 직접 업로드 |

> **정정(2026-06-04)**: `capacity`는 `programs`에서 제거됨(공방 단위 `stores.maxCapacityPerSlot`로 일원화)이라 수정 대상에서 제외. 배송은 `deliverable` boolean 하나로 통일(`deliveryOption` enum 미존재). 필드명은 기존 생성/상세 API와 동일하게 `childFriendly`/`deliverable` 사용.

**program_images**

| 필드 | 타입 | 비고 |
|------|------|------|
| `programImageId` | string (UUID) | |
| `imageUrl` | string | CDN URL |
| `thumbnailUrl` | string | 240x240 |
| `isThumbnail` | boolean | 대표 이미지 여부 |

**program_snapshots** (가격·리드타임 변경 + 기존 예약 1건 이상인 경우 자동 생성, FE 직접 접근 없음. `price`·`leadTimeDays` 컬럼만 보유)

---

### 엔드포인트

#### 1. `PATCH /partner/stores/{storeId}/programs/{programId}` — 프로그램 수정

**Guard**: `AuthGuard`, `PartnerGuard`

**Request**

```
PATCH /partner/stores/{storeId}/programs/{programId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

Body (변경할 필드만 포함, partial update):

```json
{
  "title": "물레 체험 기초반 (개정)",
  "description": "처음 도자기를 접하는 분들을 위한 물레 체험입니다.",
  "materials": "앞치마 (공방 제공), 편한 복장",
  "caution": "체험 2시간 전까지 취소 가능합니다.",
  "difficulty": "BASIC",
  "price": 48000,
  "leadTimeDays": 30,
  "durationMinutes": 120,
  "childFriendly": true,
  "deliverable": false
}
```

**Response 200 OK**

```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:05:00.000Z",
  "path": "/partner/stores/{storeId}/programs/{programId}",
  "message": "프로그램이 성공적으로 수정되었습니다.",
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "title": "물레 체험 기초반 (개정)",
      "price": 48000,
      "status": "ACTIVE",
      "updatedAt": "2026-05-25T19:05:00.000Z"
    }
  },
  "error": null
}
```

**Error cases**

| 코드 | error | 사유 |
|------|-------|------|
| 403 | `FORBIDDEN` | 공방 소유 권한 없음 |
| 404 | `PROGRAM_NOT_FOUND` | 프로그램 없음 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 오류 |

---

#### 2. `POST /partner/stores/{storeId}/programs/{programId}/images` — 이미지 Pre-signed URL 발급

**Guard**: `AuthGuard`, `PartnerGuard`

**Request**

```
POST /partner/stores/{storeId}/programs/{programId}/images
Authorization: Bearer {accessToken}
Accept: application/json
```

Body:

```json
{
  "fileName": "program_01.png",
  "fileType": "image/png",
  "isThumbnail": true
}
```

**Response 201 Created**

```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T19:15:00.000Z",
  "path": "/partner/stores/{storeId}/programs/{programId}/images",
  "message": "프로그램 이미지 업로드용 URL이 발급되었습니다.",
  "data": {
    "programImageId": "prog-img-uuid-001",
    "uploadUrl": "https://todam-bucket.s3.ap-northeast-2.amazonaws.com/programs/.../uuid.png?...",
    "imageUrl": "https://cdn.todam.app/programs/.../uuid.png"
  },
  "error": null
}
```

**Error cases**

| 코드 | error | 사유 |
|------|-------|------|
| 400 | `INVALID_FILE_TYPE` | 지원하지 않는 파일 형식 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 오류 |

---

#### 3. `DELETE /partner/stores/{storeId}/programs/{programId}/images/{imageId}` — 이미지 삭제

**Guard**: `AuthGuard`, `PartnerGuard`

**Response 200 OK**

```json
{
  "statusCode": 200,
  "message": "프로그램 이미지가 삭제되었습니다.",
  "data": null,
  "error": null
}
```

**Error cases**

| 코드 | error | 사유 |
|------|-------|------|
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `IMAGE_NOT_FOUND` | 이미지 없음 |

---

#### 4. `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭, preload 참고용)

**Guard**: 없음 (비인증 허용). 가시성: 공방 `slug` 식별 + **`status = ACTIVE` 클래스만 노출**(DRAFT/INACTIVE 은폐), 이미지는 `UPLOADED`만. 미해당 시 404 `PROGRAM_NOT_FOUND`. 응답 DTO는 파트너 상세(`GetProgramDetailResponseDto`)와 동일 형태 재사용.

**Response 200 OK — `data.program` 주요 필드**

```json
{
  "id": "prog-uuid-001",
  "storeId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "물레 체험 기초반",
  "description": "처음 도자기를 접하는 분들을 위한 물레 체험입니다.",
  "materials": "앞치마 (공방 제공), 편한 복장",
  "caution": "체험 당일 취소는 불가합니다.",
  "price": 45000,
  "durationMinutes": 120,
  "leadTimeDays": 30,
  "deliverable": false,
  "childFriendly": false,
  "difficulty": "BASIC",
  "status": "ACTIVE",
  "images": [
    {
      "imageUrl": "https://cdn.todam.app/programs/prog-uuid-001/01.jpg",
      "thumbnailUrl": "https://cdn.todam.app/programs/prog-uuid-001/01_thumb.jpg"
    }
  ]
}
```

---
