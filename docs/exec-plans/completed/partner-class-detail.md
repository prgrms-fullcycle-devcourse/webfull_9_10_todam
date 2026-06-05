# Feature Plan: 클래스 상세 조회

## Summary

- Goal: 파트너가 클래스 관리 화면에서 클래스 카드를 선택하면 해당 클래스의 상세 정보를 조회하고, 상태에 따라 수정/게시/게시 중단 CTA를 노출한다.
- Owner: -
- Date: 2026-06-01

## Status

- [x] API 구현
- [x] UI 구현
- [x] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md — `class` 도메인 (§ 클래스 상태, § 클래스 등록, § 클래스 수정·중단)
- 기능명세: 클래스 상세 조회 (Notion DB `b242ee66b06c8349805601ce4a05247a`)
- API명세:
  - `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭) (Notion DB `5852ee66b06c838bb8ec01c6bf4f2e25`)
  - `PATCH /partner/stores/{storeId}/programs/{programId}` — 프로그램 수정 (Notion DB)
  - `PATCH /partner/stores/{storeId}/programs/{programId}/status` — 프로그램 상태 변경 (ACTIVE↔INACTIVE) (Notion DB)
- Relevant design docs: DESIGN.md (UI 작업 시작 조건 확인 필요)
- Open decisions:
  1. ~~**파트너 전용 클래스 상세 GET 엔드포인트 부재**~~ **→ 해소 (2026-06-01)**: 기능 범위가 "파트너가 자신의 클래스 상세 조회"로 확정됨. 파트너는 `DRAFT`·`INACTIVE` 상태도 조회해야 하므로 퍼블릭 엔드포인트 재사용 불가. `GET /partner/stores/{storeId}/programs/{programId}` 신설로 결정.
  2. ~~**기능명세의 `난이도` 필드**~~ **→ 해소 (2026-06-01)**: `난이도` 포함으로 확정. API response에 `difficulty` 필드 추가. Notion API명세 DB 업데이트 필요.
  3. **UI: DESIGN.md 준수** — 클래스 상세 화면 및 수정 액션 바텀시트의 variant enum, 상태별 토큰, size별 height/padding/gap/radius 값이 DESIGN.md에 정의되어 있는지 확인 후 구현한다. 미정의 토큰 사용 금지.

## Scope

- In:
  - 파트너가 클래스 관리 목록에서 클래스 카드 클릭 시 클래스 상세 화면 진입
  - 클래스 상세 정보 조회 (대표 이미지, 클래스명, 설명, 가격, 소요시간, 평균 제작일, 수령 방식, 게시 상태) — 정원(수용 인원)은 공방 단위 `maxCapacityPerSlot`로 관리되어 클래스 상세에 포함하지 않음
  - 게시 상태에 따른 CTA 분기
    - `ACTIVE`: `클래스 정보 수정하기` 버튼 노출
    - `INACTIVE` / `DRAFT`: `클래스 게시하기` 버튼 노출
  - `클래스 정보 수정하기` 클릭 시 수정 액션 바텀시트 노출 (기본 정보 수정 / 운영 정보 수정 / 게시 중단)
  - 게시 중단 액션: `ACTIVE` → `INACTIVE` 상태 전이 (`PATCH .../status`)
  - 게시하기 액션: `INACTIVE`/`DRAFT` → `ACTIVE` 상태 전이 (`PATCH .../status`)
  - 존재하지 않는 클래스 접근 시 에러 화면 또는 토스트 처리
  - 권한 없는 공방 클래스 접근 시 403 처리
- Out:
  - 기본 정보 수정 화면 구현 (별도 기능: 클래스 수정)
  - 운영 정보 수정 화면 구현 (별도 기능: 클래스 수정)
  - 클래스 등록 (별도 기능)
  - 리뷰 목록 (`GET /stores/{slug}/programs/{programId}/reviews` — 별도 기능)
  - 타임슬롯 관리 (별도 기능)

## Plan

### BE

1. `GET /partner/stores/{storeId}/programs/{programId}` 신설
   - `@UseGuards(AuthGuard, PartnerGuard)` 적용
   - `DRAFT`·`INACTIVE`·`ACTIVE` 전체 상태 반환
   - `storeId` + 로그인 파트너 소유 검증 (타 파트너 클래스 접근 시 403)
2. `PATCH /partner/stores/{storeId}/programs/{programId}/status` 구현 확인
   - `@UseGuards(AuthGuard, PartnerGuard)` 적용
   - `DRAFT`→`ACTIVE`, `ACTIVE`→`INACTIVE`, `INACTIVE`→`ACTIVE` 전이 검증
   - 공방 소유 권한 확인 (`storeId` + `partnerId` 매핑)
3. MSW handler 작성: `GET .../programs/:programId`, `PATCH .../programs/:programId/status`

### FE

4. DESIGN.md에서 클래스 상세 화면 및 바텀시트 variant enum, 상태별 토큰 확인 (Open decisions #3)
5. MSW mock 데이터 정의 (`program` 응답 픽스처, status별 3종: `DRAFT`, `ACTIVE`, `INACTIVE`)
6. 클래스 상세 화면 컴포넌트 구현
   - 대표 이미지 슬라이드(또는 단일 이미지)
   - 클래스명, 가격, 소요시간, 평균 제작일, 수령 방식, 설명
   - 게시 상태 배지
   - 게시 상태에 따른 CTA 분기 렌더링
7. 수정 액션 바텀시트 컴포넌트 구현 (기본 정보 수정 / 운영 정보 수정 / 게시 중단 3항목)
8. 게시 상태 변경 핸들러 연결 (`PATCH .../status` 호출 → 응답 후 화면 갱신)
9. 에러 처리: 404(클래스 없음), 403(권한 없음) 케이스 화면 처리
10. MSW mock → 실 API 연동 (Open decisions #1 해소 후)
11. 연동 검증: 파트너 계정으로 실 API 호출, `status` 전이 후 화면 갱신 확인

## Out (단계별 완료물)

- API: `GET /partner/stores/{storeId}/programs/{programId}` (신설), `PATCH /partner/stores/{storeId}/programs/{programId}/status`
- UI: 클래스 상세 화면, 수정 액션 바텀시트
- 연동: 클래스 상세 조회 + 게시 상태 변경 실 API 연결, status 전이 시나리오 확인

### BE 완료 (2026-06-02)

- 추가:
  - `apps/api/src/modules/program/application/use-cases/get-program-detail.use-case.ts` — 파트너 클래스 상세 조회 use-case. 소유권 검증(타 파트너 403 FORBIDDEN, 없음/storeId 불일치 404 PROGRAM_NOT_FOUND), DRAFT·INACTIVE·ACTIVE 전체 상태 반환, images는 `status=UPLOADED`만 노출(serve-UPLOADED-only) + sortOrder asc 정렬.
  - `apps/api/src/modules/program/presentation/dto/get-program-detail.dto.ts` — 응답 DTO. Contract 정정본 데이터모델 1:1 (deliverable/childFriendly boolean, difficulty BASIC|INTERMEDIATE|ADVANCED, images[{imageUrl, thumbnailUrl|null}]).
  - `apps/api/src/modules/program/application/use-cases/update-program-status.use-case.spec.ts` — 상태 전이 단위 테스트 12 케이스(유효 전이 3, 무효 전이 3, 동일 상태 3, 권한/존재 검증 3). 전부 통과.
  - `apps/api/jest.config.js` — ts-jest 기반 jest 설정 (테스트 컴파일에만 jest 타입 노출).
- 수정:
  - `apps/api/src/modules/program/presentation/controllers/program.controller.ts` — `GET partner/stores/:storeId/programs/:programId` 핸들러 추가 (`@UseGuards(AuthGuard, PartnerGuard)`).
  - `apps/api/src/modules/program/program.module.ts` — `GetProgramDetailUseCase` provider 등록.
  - `apps/api/tsconfig.json` — `*.spec.ts`를 build/typecheck 대상에서 제외 (런타임 types는 불변).
  - `apps/api/package.json` — devDependencies에 jest, ts-jest, @types/jest, @nestjs/testing 추가 (기존 `test: jest` 스크립트용 toolchain 신설).
- 엔드포인트:
  - `GET /partner/stores/{storeId}/programs/{programId}` (신설) — Contract #1 그대로.
  - `PATCH /partner/stores/{storeId}/programs/{programId}/status` — 재검증 결과 Contract #2와 일치(유효 전이 DRAFT→ACTIVE / ACTIVE→INACTIVE / INACTIVE→ACTIVE 외 400 INVALID_STATUS_TRANSITION, 403 FORBIDDEN, 404 PROGRAM_NOT_FOUND). 보완 불필요.
- 검증: `tsc --noEmit` 0 에러, `nest build` 성공, `jest` 12/12 통과.
- 비고: `partner-class-create`에 테스트 toolchain이 부재(`.spec.ts` 0개, jest 미설치)했으나 repo의 `test: jest` 스크립트 의도에 맞춰 최소 toolchain을 신설함. 공유 config(`tsconfig.json`, `package.json`) 변경 포함 — reviewer 확인 요망.

### FE 연동 완료 (2026-06-04)

- 추가:
  - `apps/web/src/features/program/detail/api.ts` — `getPartnerProgramDetail(storeId, programId)` → 루트 `GET /partner/stores/{storeId}/programs/{programId}` (BASE `/partner`, store 도메인 컨벤션, apiFetch가 accessToken 부착). 응답 뷰 타입 `PartnerProgramDetailView`/`PartnerProgramDetailResultView` 신설 — Contract #1과 1:1 (images `{ imageUrl, thumbnailUrl|null }`, deliverable/childFriendly boolean, difficulty `ProgramDifficulty`, status `ProgramStatus`).
  - `apps/web/src/features/program/detail/queries.ts` — `usePartnerProgramDetail(storeId, programId)` (react-query, `enabled: !!storeId && !!programId`, queryKey `['partner','stores',storeId,'programs',programId]`).
- 수정:
  - `apps/web/src/features/program/detail/index.ts` — 신규 api/queries export.
  - `apps/web/src/app/partner/classes/[id]/page.tsx` — 데이터 소스를 `useProgramEditPreload`(edit preload, MOCK_SLUG 퍼블릭)에서 `usePartnerProgramDetail(storeId, programId)`로 교체. `use(params)`로 programId 언랩, `useSearchParams().get('storeId')`로 storeId 수신. 로딩/이미지 폴백/난이도 태그/featureTags/CTA·UI 보존.
  - `apps/web/src/features/program/list/ui/PartnerClassListItem.tsx` — `storeId` prop 추가, 진입 링크 `/partner/classes/${program.id}?storeId=${storeId}`로 변경.
  - `apps/web/src/app/partner/classes/page.tsx` — list 항목에 `storeId` 전달.
  - `apps/web/src/app/partner/stores/[id]/page.tsx` — 공방 상세 내 클래스 목록 `PartnerClassListItem`에 `storeId={id}` 전달(신규 required prop 대응).
- 연결지점: 클래스 관리 목록/공방 상세 → 클래스 상세(`?storeId=` 운반) → `GET /partner/stores/{storeId}/programs/{programId}` (DRAFT·INACTIVE·ACTIVE 전체 상태).
- 비범위 유지: edit 화면(`/partner/classes/[id]/edit/*`)의 `useProgramEditPreload`/`MOCK_SLUG`·퍼블릭 `getProgramDetail`·MSW 퍼블릭 mock은 미변경(별도 연동 작업).
- 검증: `apps/web` `tsc --noEmit` 0 에러, `lint` 0 error (잔여 `<img>` 경고는 전역 기존 경고).

## Risks

- 파트너 전용 GET 엔드포인트 신설: API명세 DB에 미등록 엔드포인트이므로 BE에서 신규 구현 필요. Notion API명세 DB에도 추가 필요.
- 기능명세의 `난이도` 필드: API 명세 및 요구사항에 미정의. 포함 시 스키마 변경 필요.

## Validation

- Tests: `PATCH .../status` 상태 전이 성공/실패(잘못된 전이, 권한 없음) 단위 테스트
- Manual checks:
  - `ACTIVE` 클래스 진입 → `클래스 정보 수정하기` 버튼 노출 확인
  - `INACTIVE` 클래스 진입 → `클래스 게시하기` 버튼 노출 확인
  - 게시 중단 액션 후 상태 배지 `INACTIVE` 갱신 확인
  - 게시하기 액션 후 상태 배지 `ACTIVE` 갱신 확인
  - 타 파트너의 클래스 URL 직접 접근 시 403 처리 확인
- Observability: `PATCH .../status` 응답 status code 및 error code 로깅

## Decision Log

- 2026-06-01: 기능명세 비고 "일반 사용자 클래스 상세 조회와 동일한 데이터 기반"에 따라 퍼블릭 엔드포인트 재사용 검토. DRAFT/INACTIVE 조회 불가 문제로 파트너 전용 GET 신설 여부를 Open decisions에 올림.

## Outcome

- Status: 완료(2026-06-04). API 구현·UI·API 연동 3단계 완료, reviewer drift 0 판정.
  - BE `GET /partner/stores/{storeId}/programs/{programId}`(AuthGuard+PartnerGuard, 전체 상태) 구현.
  - FE: 퍼블릭 mock preload → 파트너 실 BE 훅(`usePartnerProgramDetail`) 전환, storeId `?storeId=` 쿼리 운반. 설명 빈값 안내문구 + 3줄 더보기/접기 UI.
- Follow-up: `PartnerProgramDetailView`(Contract/BE DTO/FE 3곳 수기 중복) → packages/shared 파트너 detail zod 계약 승격 후보(비차단). edit 화면 storeId 연동은 별도.

## API Contract (스냅샷)

> Notion API명세 DB 기준 2026-06-01. 원본 변경 시 재plan 후 이 섹션 diff로 추적.

### 데이터모델

**Program (응답 기준)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string (UUID) | 프로그램 UUID |
| `storeId` | string (UUID) | 공방 UUID |
| `title` | string | 클래스명 (2~60자) |
| `description` | string \| null | 상세 설명 (최대 2000자) |
| `materials` | string \| null | 준비물 |
| `caution` | string \| null | 유의사항 |
| `price` | number | 가격 (원 단위, 양의 정수) |
| `durationMinutes` | number | 소요시간 (분 단위, 30분 단위 30~480) |
| `leadTimeDays` | number | 리드타임 (0일 이상) |
| `deliverable` | boolean | 택배 가능 여부 |
| `childFriendly` | boolean | 어린이 동반 가능 여부 |
| `difficulty` | `"BASIC"` \| `"INTERMEDIATE"` \| `"ADVANCED"` | 난이도 |
| `status` | `"DRAFT"` \| `"ACTIVE"` \| `"INACTIVE"` | 게시 상태 |
| `images` | `Array<{ imageUrl: string, thumbnailUrl: string \| null }>` | 대표 이미지 목록 (`status=UPLOADED`만 노출) |

> **2026-06-02 Contract 정정**: 머지된 `partner-class-create`(commit cda4f98) 및 실제 Prisma 스키마와 동기화. `deliveryOption` enum 제거 → `deliverable: boolean`, `childFriendly: boolean` 추가, `difficulty` 값 `BEGINNER`→`BASIC`. 조회 응답은 serve-UPLOADED-only 정책 준수.

### 엔드포인트

#### 1. `GET /partner/stores/{storeId}/programs/{programId}` — 파트너 클래스 상세 조회 (신설)

**가드**: `AuthGuard`, `PartnerGuard`

**Path Parameters**
- `storeId`: 공방 UUID
- `programId`: 프로그램 UUID

> 퍼블릭 엔드포인트(`GET /stores/{slug}/programs/{programId}`)는 `ACTIVE`만 반환하므로 파트너 컨텍스트에서 사용 불가. `DRAFT`·`INACTIVE` 포함 전체 상태 반환 필요.

**Response 200 OK**
```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:50:00.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001",
  "message": "프로그램 상세 정보가 성공적으로 조회되었습니다.",
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "storeId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "물레 체험 기초반",
      "description": "처음 도자기를 접하는 분들을 위한 물레 체험입니다.",
      "materials": "앞치마 (공방 제공), 편한 복장",
      "caution": "체험 당일 취소는 불가합니다.",
      "price": 45000,
      "durationMinutes": 120,
      "leadTimeDays": 30,
      "deliverable": true,
      "childFriendly": false,
      "difficulty": "BASIC",
      "status": "DRAFT",
      "images": [
        {
          "imageUrl": "https://cdn.todam.app/programs/prog-uuid-001/01.jpg",
          "thumbnailUrl": "https://cdn.todam.app/programs/prog-uuid-001/01_thumb.jpg"
        }
      ]
    }
  },
  "error": null
}
```

**Response 403 Forbidden**
```json
{
  "statusCode": 403,
  "data": null,
  "error": "FORBIDDEN"
}
```

**Response 404 Not Found**
```json
{
  "statusCode": 404,
  "data": null,
  "error": "PROGRAM_NOT_FOUND"
}
```

---

#### 2. `PATCH /partner/stores/{storeId}/programs/{programId}/status` — 프로그램 상태 변경

**가드**: `AuthGuard`, `PartnerGuard`

**Path Parameters**
- `storeId`: 공방 UUID
- `programId`: 프로그램 UUID

**Request Body**
```json
{
  "status": "ACTIVE"
}
```

유효 전이: `DRAFT`→`ACTIVE`, `ACTIVE`→`INACTIVE`, `INACTIVE`→`ACTIVE`

**Response 200 OK**
```json
{
  "statusCode": 200,
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

**Response 400** — 유효하지 않은 상태 전이 (`INVALID_STATUS_TRANSITION`)

**Response 403** — 공방 소유권 없음 (`FORBIDDEN`)

**Response 404** — 프로그램 없음 (`PROGRAM_NOT_FOUND`)

---

#### 3. `PATCH /partner/stores/{storeId}/programs/{programId}` — 프로그램 수정

**가드**: `AuthGuard`, `PartnerGuard`

**Path Parameters**
- `storeId`: 공방 UUID
- `programId`: 프로그램 UUID

**Request Body** (변경할 필드만 포함)
```json
{
  "title": "물레 체험 기초반 (개정)",
  "price": 48000,
  "caution": "체험 2시간 전까지 취소 가능합니다."
}
```

수정 가능 필드: `title`, `description`, `images`, `caution` (언제든 수정 가능)
스냅샷 분리 필드: `price`, `leadTimeDays` (기존 예약 1건 이상 시 `program_snapshots` 신규 row 생성)

**Response 200 OK**
```json
{
  "statusCode": 200,
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

**Response 403** — 공방 소유권 없음 (`FORBIDDEN`)

**Response 404** — 프로그램 없음 (`PROGRAM_NOT_FOUND`)
