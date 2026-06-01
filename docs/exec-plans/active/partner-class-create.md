# Feature Plan: 클래스 등록

## Summary

- Goal: 파트너가 선택한 공방에 클래스(프로그램)를 2단계 플로우로 등록하고, 등록 완료 후 클래스 관리 화면으로 복귀한다.
- Owner:
- Date: 2026-06-01

## Status

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md — `# 클래스 class` 섹션 (상태·등록·수정·중단)
- 기능명세: 클래스 등록 (Notion 기능명세 DB `b242ee66b06c8349805601ce4a05247a`)
- API명세: (Notion API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`)
  - `GET /partner/stores`
  - `POST /partner/stores/{storeId}/programs`
  - `PATCH /partner/stores/{storeId}/programs/{programId}/status`
  - `POST /partner/stores/{storeId}/programs/{programId}/images`
- Relevant design docs: DESIGN.md (UI 작업 전 variant enum / 상태별 토큰 확인 필요)
- Open decisions: **전체 해소 (2026-06-01)**
  1. **난이도(difficulty) 필드** — `BASIC / INTERMEDIATE / ADVANCED` 3단계 enum. **BE 추가 확정.**
  2. **어린이 동반 가능 여부** — 필드명 `childFriendly: boolean`. **BE 추가 확정.**
  3. **이미지 업로드 순서** — DRAFT 생략 가능. `POST /programs` 직접 ACTIVE 생성 허용. 이미지는 programId 획득 후 별도 업로드.
  4. **`deliveryOption` 방식** — enum 제거. **`deliverable: boolean`** (택배 가능 여부)으로 단순화.
  5. **`description` 최대 글자 수** — **기능명세 기준 1000자** 적용.
  6. **`leadTimeDays` 범위** — **기능명세 기준 0일 이상** 적용.

## Scope

- In:
  - FE: 클래스 등록 2단계 플로우 UI (1단계: 기본정보 / 2단계: 운영정보)
  - FE: 대표 이미지 Pre-signed URL S3 직접 업로드
  - FE: 등록 완료 후 클래스 관리 화면 이동 + 토스트 ("새로운 클래스가 등록되었어요")
  - FE: 입력 중 화면 이탈 시 변경사항 확인 다이얼로그
  - BE: `POST /partner/stores/{storeId}/programs` 구현
  - BE: `PATCH /partner/stores/{storeId}/programs/{programId}/status` 구현
  - BE: `POST /partner/stores/{storeId}/programs/{programId}/images` Pre-signed URL 발급 구현
  - BE: `programs` + `program_snapshots` + `program_images` 엔티티 생성

- Out:
  - 클래스 수정·삭제 (별도 기능)
  - ACTIVE → INACTIVE 상태 변경 토글 (별도 기능: "클래스 게시 상태 변경")
  - 타임슬롯 생성 (`POST /programs/{programId}/time-slots`) — 별도 기능
  - 클래스 목록 조회 (`GET /stores/{slug}/programs`, `GET /partner/stores/{storeId}/programs`) — 클래스 관리 화면 기능
  - MVP 외: 클래스 정렬 순서 변경

## Plan

1. **BE: DB 스키마 작성**
   - `programs` 테이블 (status: DRAFT/ACTIVE/INACTIVE)
   - `program_snapshots` 테이블
   - `program_images` 테이블

3. **BE: 클래스 등록 API 구현** (`POST /partner/stores/{storeId}/programs`)
   - AuthGuard + PartnerGuard 적용
   - 공방 소유 권한 검증 + PUBLISHED 상태 검증
   - 필수 필드 유효성 검사
   - `programs` + `program_snapshots` row 동시 생성 (status = DRAFT)

4. **BE: 이미지 Pre-signed URL 발급 API 구현** (`POST /partner/stores/{storeId}/programs/{programId}/images`)
   - S3 객체 키 생성 및 presigned PUT URL 발급
   - `program_images` row 선 생성

5. **BE: 상태 변경 API 구현** (`PATCH /partner/stores/{storeId}/programs/{programId}/status`)
   - 유효 전이 검증
   - `programs.status` 갱신

6. **FE: MSW mock 핸들러 등록**
   - `GET /partner/stores` → 200
   - `POST /partner/stores/:storeId/programs` → 201
   - `PATCH /partner/stores/:storeId/programs/:programId/status` → 200
   - `POST /partner/stores/:storeId/programs/:programId/images` → 201

7. **FE: 클래스 등록 UI 구현**
   - 1단계: 대표 이미지, 클래스명, 난이도(`BASIC|INTERMEDIATE|ADVANCED`), 상세 설명 (최대 1000자)
   - 2단계: 가격, 소요시간, 정원, 리드타임 (0일 이상), 어린이 동반(`childFriendly`), 택배 가능 여부(`deliverable`)
   - 단계별 필수값 완료 시 다음/저장 버튼 활성화
   - 이탈 확인 다이얼로그 (변경사항 있을 때)
   - UI: DESIGN.md 준수 (variant enum, 상태별 토큰, size별 height/padding/gap/radius 적용)

8. **FE: API 연동**
   - 2단계 저장 → `POST /programs` 호출 → programId 획득 (ACTIVE 직접 생성)
   - programId로 이미지 Pre-signed URL 발급 → S3 직접 PUT 업로드
   - 성공: 클래스 관리 화면 이동 + 토스트
   - 실패: 등록 화면 유지 + 실패 토스트

## Out (단계별 완료물)

- API:
- UI:
- 연동:

## Risks

- **이미지 업로드 순서** — Pre-signed URL은 `programId`가 있어야 발급 가능. 1단계에서 이미지 선택 → state 보관 → 2단계 저장(`POST /programs`) 후 업로드. FE state 설계 주의.
- **PATCH /status 엔드포인트** — 초기 등록 플로우에서는 미사용 (ACTIVE 직접 생성). ACTIVE→INACTIVE 전이용으로 유지.

## Validation

- Tests:
  - BE: `POST /programs` 유효성 단위 테스트 (필수 필드 누락, durationMinutes 30분 단위 위반, 공방 PUBLISHED 아닌 경우)
  - BE: `PATCH /status` 잘못된 전이 시 400 반환 테스트
  - FE: 2단계 필수값 미입력 시 저장 버튼 비활성화
  - FE: 이탈 다이얼로그 동작
- Manual checks:
  - 정상 플로우: 1단계 입력 → 다음 → 2단계 입력 → 저장 → 토스트 → 클래스 관리 목록에 신규 클래스 표시
  - 공방 PUBLISHED 아닌 경우 403 응답 처리
  - 이미지 미업로드 시 저장 불가
- Observability:
  - 클래스 등록 성공/실패 서버 로그

## Decision Log

- 2026-06-01: plan 작성. Open decision 6건 도출 (난이도 필드, 어린이 동반 필드, 이미지 업로드 순서, deliveryOption enum, description 글자 수, leadTimeDays 범위).
- 2026-06-01: Open decision 전체 해소. difficulty/childFriendly BE 추가 확정. DRAFT 생략 (ACTIVE 직접 생성). deliveryOption → deliverable boolean. description 1000자. leadTimeDays 0일 이상.

## Outcome

- Status:
- Follow-up:

## API Contract (스냅샷)

### 데이터 모델

#### programs (클래스)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| storeId | UUID | FK → stores.id |
| title | string | 클래스명, 2~60자 |
| description | string? | 상세 설명, 최대 1000자 |
| materials | string? | 준비물 |
| caution | string? | 유의사항 |
| price | number | 양의 정수 (원 단위) |
| durationMinutes | number | 30분 단위, 30~480분 |
| capacity | number | 1~30 |
| difficulty | enum | BASIC \| INTERMEDIATE \| ADVANCED |
| childFriendly | boolean | 어린이 동반 가능 여부 |
| leadTimeDays | number | 0일 이상 |
| deliverable | boolean | 택배 가능 여부 |
| status | enum | DRAFT \| ACTIVE \| INACTIVE |
| createdAt | datetime | |
| updatedAt | datetime | |

#### program_snapshots (가격·정원·리드타임 변경 이력)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| programId | UUID | FK → programs.id |
| price | number | |
| capacity | number | |
| leadTimeDays | number | |
| createdAt | datetime | |

#### program_images

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| programId | UUID | FK → programs.id |
| imageUrl | string | CDN URL (원본) |
| thumbnailUrl | string | CDN 썸네일 URL |
| isThumbnail | boolean | 대표 이미지 여부 |
| createdAt | datetime | |

---

### 엔드포인트

#### 1. `GET /partner/stores` — 파트너 공방 목록 조회

**Guards:** AuthGuard, PartnerGuard

Response 200 OK:
```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:10:00.000Z",
  "path": "/partner/stores",
  "message": "내 공방 목록이 성공적으로 조회되었습니다.",
  "data": {
    "stores": [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "토담 공방",
        "slug": "todam-studio",
        "address": "서울특별시 성동구 성수이로 12길 34",
        "status": "PUBLISHED",
        "thumbnailUrl": "https://cdn.todam.app/stores/todam-studio/thumb.jpg",
        "publishedAt": "2026-05-20T10:00:00.000Z",
        "createdAt": "2026-05-18T12:00:00.000Z"
      }
    ]
  },
  "error": null
}
```

에러 응답:
- `401` UNAUTHORIZED
- `403` FORBIDDEN (파트너 권한 없음)

---

#### 2. `POST /partner/stores/{storeId}/programs` — 클래스 등록

**Guards:** AuthGuard, PartnerGuard

Request Body:
```json
{
  "title": "물레 체험 기초반",
  "description": "처음 도자기를 접하는 분들을 위한 물레 체험입니다.",
  "materials": "앞치마 (공방 제공), 편한 복장",
  "caution": "체험 당일 취소는 불가합니다.",
  "price": 45000,
  "durationMinutes": 120,
  "capacity": 6,
  "difficulty": "BASIC",
  "childFriendly": false,
  "leadTimeDays": 30,
  "deliverable": true
}
```

Response 201 Created:
```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T19:00:00.000Z",
  "path": "/partner/stores/{storeId}/programs",
  "message": "프로그램이 성공적으로 등록되었습니다.",
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "storeId": "{storeId}",
      "title": "물레 체험 기초반",
      "status": "ACTIVE",
      "createdAt": "2026-05-25T19:00:00.000Z"
    }
  },
  "error": null
}
```

에러 응답:
- `400` INVALID_REQUEST (소요시간 30분 단위 위반 등)
- `403` STORE_NOT_PUBLISHED
- `500` INTERNAL_SERVER_ERROR

---

#### 3. `PATCH /partner/stores/{storeId}/programs/{programId}/status` — 상태 변경

**Guards:** AuthGuard, PartnerGuard

Request Body:
```json
{ "status": "ACTIVE" }
```

유효 전이: DRAFT → ACTIVE, ACTIVE → INACTIVE, INACTIVE → ACTIVE

Response 200 OK:
```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:10:00.000Z",
  "path": "/partner/stores/{storeId}/programs/{programId}/status",
  "message": "프로그램 상태가 성공적으로 변경되었습니다.",
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "status": "ACTIVE",
      "updatedAt": "2026-05-25T19:10:00.000Z"
    }
  },
  "error": null
}
```

에러 응답:
- `400` INVALID_STATUS_TRANSITION
- `500` INTERNAL_SERVER_ERROR

---

#### 4. `POST /partner/stores/{storeId}/programs/{programId}/images` — 이미지 Pre-signed URL 발급

**Guards:** AuthGuard, PartnerGuard

Request Body:
```json
{
  "fileName": "program_01.png",
  "fileType": "image/png",
  "isThumbnail": true
}
```

지원 형식: JPG, PNG, HEIC / 최대 5MB

Response 201 Created:
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

에러 응답:
- `400` INVALID_FILE_TYPE
- `500` INTERNAL_SERVER_ERROR

---
