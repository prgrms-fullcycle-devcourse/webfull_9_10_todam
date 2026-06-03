# Feature Plan: 클래스 등록

## Summary

- Goal: 파트너가 선택한 공방에 클래스(프로그램)를 2단계 플로우로 등록하고, 등록 완료 후 클래스 관리 화면으로 복귀한다.
- Owner:
- Date: 2026-06-01

## Status

- [ ] API 구현
  - [x] `POST /partner/stores/{storeId}/programs` (클래스 등록)
  - [x] `POST /partner/stores/{storeId}/programs/{programId}/images` (presigned 발급, status=PENDING row 선생성)
  - [x] `PATCH /partner/stores/{storeId}/programs/{programId}/status` (상태 변경)
  - [x] `PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm` (이미지 업로드 확인, PENDING→UPLOADED) — **신규(2026-06-02 협의)** / 2026-06-02 구현 완료
  - [x] 이미지 노출 정책(serve-UPLOADED-only) 반영 — 조회 응답에서 PENDING 은폐 (횡단) / **2026-06-02: 본 등록 plan 내에 이미지를 반환하는 조회 EP가 없음(program 모듈 전수 확인). 적용 대상 EP 부재로 정책 명문화로 갈음(reviewer 검증 완료, drift 0). 실제 `where:{status:'UPLOADED'}` 필터는 조회 기능 plan(partner-class-detail/list)이 준수 예정.**
  - [ ] PENDING cleanup 스케줄 작업 (createdAt 1시간 경과 PENDING 자동 삭제 + S3 객체 삭제) — **구현 보류(2026-06-02 결정). 인프라 방식(BullMQ vs @nestjs/schedule) 팀 협의 후 별도 진행. 이번 구현 범위에서 제외.**
- [x] UI 구현
- [ ] API 연동 (confirm 호출 단계 추가 반영 필요)

## Context

- 요구사항명세서(고정): docs/requirements.md — `# 클래스 class` 섹션 (상태·등록·수정·중단)
- 기능명세: 클래스 등록 (Notion 기능명세 DB `b242ee66b06c8349805601ce4a05247a`)
- API명세: (Notion API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`)
  - `GET /partner/stores`
  - `POST /partner/stores/{storeId}/programs`
  - `PATCH /partner/stores/{storeId}/programs/{programId}/status`
  - `POST /partner/stores/{storeId}/programs/{programId}/images`
  - `PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm` (신규 — 공방 등록의 confirm 패턴 차용)
- 선례 참조: `docs/exec-plans/active/partner-store-registration.md` — 공방 이미지 confirm 엔드포인트 + S3 `objectExists`/`keyFromImageUrl` 정합성 패턴. 클래스 이미지도 동일 패턴으로 일관화.
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
  - BE: `PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm` 구현 — 소유권 검증 → S3 `objectExists` → `program_images.status` PENDING→UPLOADED (신규)
  - BE: 이미지 노출 정책(serve-UPLOADED-only) — 클래스 조회 응답은 `status=UPLOADED` 이미지만 노출. 본 plan에서 정책을 명문화하고, 실제 필터 적용은 조회 기능 plan(partner-class-detail/list)이 따른다.
  - BE: PENDING cleanup 스케줄 작업 — `createdAt` 1시간 경과한 `status=PENDING` `program_images` 자동 삭제(row + S3 객체). 구현 방식: **`@nestjs/schedule` `@Cron`** (아래 Decision Log 참조).
  - BE: `programs` + `program_snapshots` + `program_images` 엔티티 생성
  - FE: S3 PUT 성공 직후 confirm(PATCH .../confirm) 호출 단계 추가

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

5b. **BE: 이미지 confirm API 구현 (신규)** (`PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm`)
   - AuthGuard + PartnerGuard
   - 소유권 검증: program → store → partner.userId (기존 `create-program-image.use-case.ts`의 검증 쿼리 재사용)
   - `program_images` row 조회 → 없으면 404 `PROGRAM_IMAGE_NOT_FOUND`
   - 이미 `UPLOADED`면 409 `ALREADY_UPLOADED`
   - S3 `objectExists(keyFromImageUrl(image.imageUrl))` → 객체 부재 시 400 `IMAGE_NOT_UPLOADED`
   - 통과 시 `status` PENDING→UPLOADED 전이
   - 구현 패턴: `apps/api/src/modules/store/application/use-cases/confirm-store-image.use-case.ts` 그대로 차용(store→program, storeImage→programImage 치환)
   - 신규 파일: `apps/api/src/modules/program/application/use-cases/confirm-program-image.use-case.ts`, `program.controller.ts`에 `@Patch('partner/stores/:storeId/programs/:programId/images/:imageId/confirm')` 라우트 추가, `program.module.ts` provider 등록

5c. **BE: 이미지 노출 정책 (serve-UPLOADED-only)**
   - 클래스 조회(상세/목록/이미지) 응답은 `where: { status: 'UPLOADED' }`로 필터하여 PENDING 은폐.
   - 본 등록 plan에는 조회 엔드포인트가 없으므로 정책 명문화만 수행. 실제 필터는 조회 기능 plan(partner-class-detail / partner-class-list 등)이 본 정책을 준수하도록 Risks/Decision Log에 횡단 영향 기재.

5d. **BE: PENDING cleanup 스케줄 작업 (신규)**
   - `@nestjs/schedule` 도입(`apps/api/package.json`에 의존성 추가, `ScheduleModule.forRoot()`를 `app.module.ts`에 등록 — 현재 미설치/미등록).
   - `@Cron`(예: 매시 정각)으로 `createdAt < now() - 1h` AND `status = 'PENDING'`인 `program_images` 조회 → 각 row의 `keyFromImageUrl(imageUrl)`로 S3 `deleteObject` 시도(best-effort) → row 삭제.
   - 1시간 기준 근거: presigned PUT URL 만료 5분 + 클라이언트 재시도/지연 여유 마진.
   - 신규 파일: `apps/api/src/modules/program/application/tasks/program-image-cleanup.task.ts` (또는 module 컨벤션에 맞는 위치), `program.module.ts` provider 등록.

6. **FE: MSW mock 핸들러 등록**
   - `GET /partner/stores` → 200
   - `POST /partner/stores/:storeId/programs` → 201
   - `PATCH /partner/stores/:storeId/programs/:programId/status` → 200
   - `POST /partner/stores/:storeId/programs/:programId/images` → 201
   - `PATCH /partner/stores/:storeId/programs/:programId/images/:imageId/confirm` → 200 (신규)

7. **FE: 클래스 등록 UI 구현**
   - 1단계: 대표 이미지, 클래스명, 난이도(`BASIC|INTERMEDIATE|ADVANCED`), 상세 설명 (최대 1000자)
   - 2단계: 가격, 소요시간, 리드타임 (0일 이상), 어린이 동반(`childFriendly`), 택배 가능 여부(`deliverable`) — 정원(수용 인원)은 공방 단위 `maxCapacityPerSlot`로 관리(2026-06-02 결정)되어 클래스 등록에서 제외
   - 단계별 필수값 완료 시 다음/저장 버튼 활성화
   - 이탈 확인 다이얼로그 (변경사항 있을 때)
   - UI: DESIGN.md 준수 (variant enum, 상태별 토큰, size별 height/padding/gap/radius 적용)

8. **FE: API 연동** (연동 순서 갱신)
   - ① 2단계 저장 → `POST /programs` 호출 → programId 획득 (ACTIVE 직접 생성)
   - ② programId로 이미지 Pre-signed URL 발급(`POST .../images`) → `programImageId` 보관
   - ③ 발급받은 `uploadUrl`로 S3 직접 PUT 업로드
   - ④ **S3 PUT 성공 직후 `PATCH .../images/{imageId}/confirm` 호출** → PENDING→UPLOADED 승격 (신규 단계)
   - 성공: 클래스 관리 화면 이동 + 토스트
   - 실패: 등록 화면 유지 + 실패 토스트. confirm 실패 시 이미지가 PENDING으로 남아 cleanup 대상이 됨(고아 방지).

## Out (단계별 완료물)

- API:
  - 엔드포인트:
    - `POST /partner/stores/{storeId}/programs` — 클래스 등록 (AuthGuard+PartnerGuard, 소유권+PUBLISHED 검증, programs+program_snapshots 동시 생성, status=ACTIVE 직접 생성, 201)
    - `POST /partner/stores/{storeId}/programs/{programId}/images` — 이미지 Pre-signed PUT URL 발급 + program_images row 선 생성 (status=PENDING, JPG/PNG/HEIC만, 아니면 400 INVALID_FILE_TYPE)
    - `PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm` — **(신규, 2026-06-02)** 소유권 검증 → S3 objectExists → PENDING→UPLOADED. 404 PROGRAM_IMAGE_NOT_FOUND / 409 ALREADY_UPLOADED / 400 IMAGE_NOT_UPLOADED / 403 FORBIDDEN
    - `PATCH /partner/stores/{storeId}/programs/{programId}/status` — 상태 변경 (DRAFT→ACTIVE/ACTIVE→INACTIVE/INACTIVE→ACTIVE, 위반 시 400 INVALID_STATUS_TRANSITION)
    - 스케줄: PENDING cleanup `@Cron` — 1h 경과 PENDING program_images 삭제 (신규, 2026-06-02)
    - 횡단 정책: serve-UPLOADED-only — 조회 응답은 UPLOADED 이미지만 노출 (신규, 2026-06-02)
  - DB 스키마 (Prisma): `Program`에 `difficulty(ProgramDifficulty enum)`, `childFriendly`, `deliverable` 추가 / `deliveryOption`·`ProgramDeliveryOption` 제거 (decision #1,#2,#4). `ProgramSnapshot`·`ProgramImage`는 기존 모델 재사용.
    - 마이그레이션: `apps/api/prisma/migrations/20260602140000_program_difficulty_child_friendly_deliverable/migration.sql`
    - 스키마: `apps/api/prisma/schema.prisma`
  - 생성 파일:
    - `apps/api/src/modules/program/program.module.ts`
    - `apps/api/src/modules/program/presentation/controllers/program.controller.ts`
    - `apps/api/src/modules/program/presentation/dto/create-program.dto.ts`
    - `apps/api/src/modules/program/presentation/dto/update-program-status.dto.ts`
    - `apps/api/src/modules/program/presentation/dto/program-image.dto.ts`
    - `apps/api/src/modules/program/application/use-cases/create-program.use-case.ts`
    - `apps/api/src/modules/program/application/use-cases/create-program-image.use-case.ts`
    - `apps/api/src/modules/program/application/use-cases/update-program-status.use-case.ts`
    - (생성 완료, 2026-06-02) `apps/api/src/modules/program/application/use-cases/confirm-program-image.use-case.ts` — 소유권(program→store→partner.userId) 검증 → programImage 조회(없거나 programId 불일치 시 404 PROGRAM_IMAGE_NOT_FOUND) → UPLOADED면 409 ALREADY_UPLOADED → S3 objectExists(keyFromImageUrl) 부재 시 400 IMAGE_NOT_UPLOADED → 소유권 위반 403 FORBIDDEN → PENDING→UPLOADED 전이. 응답 `data.image={id,status}`.
    - (신규 예정) `apps/api/src/modules/program/application/tasks/program-image-cleanup.task.ts`
  - 수정 파일: `apps/api/src/app.module.ts` (ProgramModule 등록, `ScheduleModule.forRoot()` 추가 예정), `apps/api/package.json` (`@nestjs/schedule` 추가 예정)
  - **2026-06-02 추가 구현 라운드 (confirm + serve-UPLOADED-only)**:
    - 생성: `apps/api/src/modules/program/application/use-cases/confirm-program-image.use-case.ts` (`confirm-store-image.use-case.ts` 패턴 차용, store→program 치환)
    - 수정: `apps/api/src/modules/program/presentation/controllers/program.controller.ts` (`@Patch('partner/stores/:storeId/programs/:programId/images/:imageId/confirm')` 라우트 + `@HttpCode(200)` + AuthGuard/PartnerGuard + ResponseMessage 추가)
    - 수정: `apps/api/src/modules/program/program.module.ts` (`ConfirmProgramImageUseCase` provider 등록)
    - confirm 엔드포인트: `PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm` — body 없음, 200 OK, envelope `data.image={id,status}`. 에러 404 PROGRAM_IMAGE_NOT_FOUND / 409 ALREADY_UPLOADED / 400 IMAGE_NOT_UPLOADED / 403 FORBIDDEN.
    - serve-UPLOADED-only: program 모듈 전수 확인 결과 이미지를 응답에 포함하는 조회 EP 없음(create/confirm 이미지 use-case만 존재, program list/detail 조회는 본 plan Out 범위 — 별도 조회 plan 소관). 적용 대상 EP 부재 → 정책 명문화로 갈음, 실제 필터는 조회 기능 plan에서 준수 예정.
    - PENDING cleanup: plan 보류 결정(Decision Log 2026-06-02)에 따라 이번 라운드 미구현. `@nestjs/schedule` 의존성·ScheduleModule 미추가.
    - 검증: `tsc --noEmit` 통과, `npx nest build` 통과.
  - 검증: `tsc --noEmit` 통과, `nest build` 통과. (API 패키지에 jest 하니스 미구성 — 단위 테스트는 별도 인프라 작업 필요.)
- UI:
- 연동:

## Risks

- **이미지 업로드 순서** — Pre-signed URL은 `programId`가 있어야 발급 가능. 1단계에서 이미지 선택 → state 보관 → 2단계 저장(`POST /programs`) 후 업로드. FE state 설계 주의.
- **PATCH /status 엔드포인트** — 초기 등록 플로우에서는 미사용 (ACTIVE 직접 생성). ACTIVE→INACTIVE 전이용으로 유지.
- **고아 레코드(orphan record)** — presigned 발급 시 `program_images` row가 PENDING으로 선생성되나 S3 PUT/confirm이 누락되면 row(+S3 객체)가 고아로 남음. confirm + serve-UPLOADED-only + PENDING cleanup 3종 세트로 차단(2026-06-02 협의).
- **serve-UPLOADED-only 횡단 영향** — 이 정책은 본 등록 plan 밖의 조회 기능(partner-class-detail, partner-class-list, 공개 클래스 상세 등)에도 적용되는 횡단 규칙. 해당 plan들이 이미지 조회 시 `status=UPLOADED` 필터를 반드시 적용해야 함. 누락 시 PENDING(미업로드/고아) 이미지가 노출되어 깨진 이미지 표시 위험.
- **`@nestjs/schedule` 미설치** — 현재 `apps/api`에 BullMQ/스케줄러 모두 미셋업(`ioredis`만 존재). cleanup용으로 `@nestjs/schedule`을 신규 도입해야 함. 멀티 인스턴스 배포 시 `@Cron`이 인스턴스마다 중복 실행될 수 있으나, 삭제 작업은 멱등(이미 삭제된 row는 no-op)이라 현 단계 영향 경미. 향후 다중 인스턴스 확대 시 BullMQ repeatable + 분산 락으로 이관 검토.
- **cleanup 시점 vs confirm 경합** — cleanup 직전 사용자가 업로드 중일 수 있으나, 1시간 마진(presigned 5분의 12배)으로 정상 플로우는 영향 없음.

## Validation

- Tests:
  - BE: `POST /programs` 유효성 단위 테스트 (필수 필드 누락, durationMinutes 범위(30~480) 위반, 공방 PUBLISHED 아닌 경우)
  - BE: `PATCH /status` 잘못된 전이 시 400 반환 테스트
  - BE: `PATCH .../confirm` — 정상(PENDING→UPLOADED), 타인 소유 403, 없는 이미지 404, 이미 UPLOADED 409, S3 객체 부재 400 케이스
  - BE: cleanup task — 1h 초과 PENDING만 삭제, 1h 미만 PENDING/UPLOADED는 보존, S3 deleteObject 호출 확인 (jest 하니스 미구성이면 별도 인프라 작업 필요 — 단위 테스트는 후속)
  - FE: 2단계 필수값 미입력 시 저장 버튼 비활성화
  - FE: 이탈 다이얼로그 동작
  - FE: S3 PUT 성공 후 confirm 호출 / confirm 실패 시 에러 토스트
- Manual checks:
  - 정상 플로우: 1단계 입력 → 다음 → 2단계 입력 → 저장 → 이미지 업로드 → confirm → 토스트 → 클래스 관리 목록에 신규 클래스 표시(UPLOADED 이미지 노출)
  - 공방 PUBLISHED 아닌 경우 403 응답 처리
  - 이미지 미업로드 시 저장 불가
  - confirm 누락 상태로 1시간 경과 → cleanup이 PENDING row + S3 객체 삭제 확인
  - 조회 응답에 PENDING 이미지가 노출되지 않음(serve-UPLOADED-only)
- Observability:
  - 클래스 등록 성공/실패 서버 로그
  - cleanup 실행 로그(삭제 건수), S3 deleteObject 실패 시 경고 로그

## Decision Log

- 2026-06-01: plan 작성. Open decision 6건 도출 (난이도 필드, 어린이 동반 필드, 이미지 업로드 순서, deliveryOption enum, description 글자 수, leadTimeDays 범위).
- 2026-06-01: Open decision 전체 해소. difficulty/childFriendly BE 추가 확정. DRAFT 생략 (ACTIVE 직접 생성). deliveryOption → deliverable boolean. description 1000자. leadTimeDays 0일 이상.
- 2026-06-02: 클래스 이미지 고아 레코드 차단 협의 → **confirm + serve-UPLOADED-only + PENDING cleanup 3종 세트** 도입 확정. 공방 등록(partner-store-registration)에서 채택한 동일 패턴으로 일관화.
- 2026-06-02: **confirm 엔드포인트 추가 확정** — `PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm`. `confirm-store-image.use-case.ts`를 차용(소유권→S3 objectExists→PENDING→UPLOADED). 에러코드: 404 PROGRAM_IMAGE_NOT_FOUND / 409 ALREADY_UPLOADED / 400 IMAGE_NOT_UPLOADED / 403 FORBIDDEN. 응답 envelope는 공방 confirm과 동일(`data.image = { id, status }`).
- 2026-06-02: **serve-UPLOADED-only 확정** — 조회 응답은 `status=UPLOADED` 이미지만 노출, PENDING 은폐. 본 등록 plan엔 조회 EP가 없어 정책 명문화만 하고, 실제 필터는 조회 기능 plan(partner-class-detail/list)이 준수. 횡단 영향을 Risks에 기재.
- 2026-06-02: **PENDING cleanup 구현 방식 = `@nestjs/schedule` `@Cron`** 으로 결정. 근거: 코드/`apps/api/package.json` 확인 결과 BullMQ·`@nestjs/schedule` 모두 미설치(`ioredis`만 존재). 메모리상 Redis+BullMQ 도입 방침이 있으나 cleanup 단일 주기 작업에는 BullMQ 풀스택(큐+워커+repeatable) 셋업이 과대. 더 가벼운 `@nestjs/schedule` 채택. 향후 큐 작업이 늘어나면 BullMQ로 이관 검토.
- 2026-06-02: **cleanup 기준 1시간** 확정 — presigned PUT 만료 5분 + 클라이언트 재시도/네트워크 지연 여유 마진.
- 2026-06-02: **API 구현 상태 재개봉** — 기존 `[x] API 구현`을 `[ ]`로 되돌림. confirm 엔드포인트·cleanup task·serve-UPLOADED-only가 추가되어 BE 추가 구현이 필요(등록/이미지발급/상태변경 3종은 완료 유지, 하위 체크로 분리 표기).
- 2026-06-02: **소요시간 30분 단위(배수) 제약 제거** — FE에서 30분 단위 강제를 해제(팀 협의)함에 따라 BE도 `create-program.use-case.ts`의 `durationMinutes % 30` 검사를 삭제. **정수·범위(30~480) 제약은 유지**(팀원이 "30배수"만 언급). plan contract/데이터모델/에러문구 및 Notion API명세(POST /programs)도 동기 갱신.
- 2026-06-02: **PENDING cleanup 구현 보류 결정** — 이번 구현 범위는 **confirm + serve-UPLOADED-only** 2종으로 한정. cleanup은 인프라 방식(`@nestjs/schedule` vs BullMQ)이 팀 인프라 방향과 엮여 있어 별도 협의 후 진행. cleanup 미구현 동안 PENDING 고아 row는 serve-UPLOADED-only로 사용자 노출만 차단되고 DB엔 잔존(추후 cleanup으로 정리). `@nestjs/schedule @Cron` 결정(2026-06-02)은 보류 해제 시 채택 후보로 유지.

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
| durationMinutes | number | 30~480분 (30분 단위 제약 제거 — 2026-06-02) |
| difficulty | enum | BASIC \| INTERMEDIATE \| ADVANCED |
| childFriendly | boolean | 어린이 동반 가능 여부 |
| leadTimeDays | number | 0일 이상 |
| deliverable | boolean | 택배 가능 여부 |
| status | enum | DRAFT \| ACTIVE \| INACTIVE |
| createdAt | datetime | |
| updatedAt | datetime | |

#### program_snapshots (가격·리드타임 변경 이력)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| programId | UUID | FK → programs.id |
| price | number | |
| leadTimeDays | number | |
| createdAt | datetime | |

> 2026-06-02: `capacity` 제거. 수용 인원은 공방 단위 `stores.max_capacity_per_slot`로 일원화. 슬롯별 예약 인원 합산이 `maxCapacityPerSlot`를 넘지 않도록 예약 단계에서 제어할 계획.

#### program_images

| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| programId | UUID | FK → programs.id |
| imageUrl | string | CDN URL (원본). 키 = `programs/{programId}/images/{uuid}.{ext}` |
| thumbnailUrl | string? | CDN 썸네일 URL |
| isThumbnail | boolean | 대표 이미지 여부 (클래스당 최대 1) |
| status | enum | `PENDING` \| `UPLOADED`. 발급 시 PENDING 선생성, confirm 시 UPLOADED 승격 |
| createdAt | datetime | cleanup 기준 시각(1h 경과 PENDING 삭제 대상) |

> **이미지 노출 정책 (serve-UPLOADED-only)**: 모든 클래스 조회(상세/목록/이미지) 응답은 `status=UPLOADED` 이미지만 노출하고 `PENDING`은 은폐한다. 횡단 규칙으로, 본 등록 plan 밖의 조회 기능 plan들이 이 정책을 준수해야 한다.
>
> **PENDING cleanup**: `createdAt`이 1시간 이상 경과한 `status=PENDING` row는 스케줄 작업(`@nestjs/schedule` `@Cron`)이 S3 객체와 함께 자동 삭제한다. 1시간 = presigned 만료(5분) + 여유 마진.

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
- `400` INVALID_REQUEST (소요시간 범위 위반 등)
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

지원 형식 처리: 발급 시 `program_images` row를 `status=PENDING`으로 선생성. 업로드 완료는 별도 confirm(아래 5번)으로 확정.

에러 응답:
- `400` INVALID_FILE_TYPE
- `500` INTERNAL_SERVER_ERROR

---

#### 5. `PATCH /partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm` — 이미지 업로드 완료 확인 (신규, 2026-06-02)

**Guards:** AuthGuard, PartnerGuard

**Path Params:** `storeId` (UUID), `programId` (UUID), `imageId` (UUID)

**Request Body:** 없음

**시스템 처리:** 소유권 검증(program → store → partner.userId) → `program_images` row 조회 → `status=UPLOADED`면 409 → S3 `objectExists(keyFromImageUrl(imageUrl))`로 실제 업로드 확인 → `status` PENDING→UPLOADED 전이. (공방 `confirm-store-image.use-case.ts` 패턴 차용)

Response 200 OK:
```json
{
  "statusCode": 200,
  "timestamp": "2026-06-02T19:20:00.000Z",
  "path": "/partner/stores/{storeId}/programs/{programId}/images/{imageId}/confirm",
  "message": "이미지 업로드가 확인되었습니다.",
  "data": {
    "image": {
      "id": "prog-img-uuid-001",
      "status": "UPLOADED"
    }
  },
  "error": null
}
```

에러 응답:
- `400` IMAGE_NOT_UPLOADED — S3에 객체 없음(업로드 미완료)
- `403` FORBIDDEN — 클래스/공방 소유 권한 없음
- `404` PROGRAM_IMAGE_NOT_FOUND — 이미지(또는 클래스) 없음
- `409` ALREADY_UPLOADED — 이미 UPLOADED인 이미지
- `500` INTERNAL_SERVER_ERROR

---
