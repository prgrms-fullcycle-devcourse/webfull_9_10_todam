# Feature Plan: 파트너 공방 관리 - 공방등록

## Summary

- Goal: User가 파트너 신청을 위해 첫 공방을 등록하거나, 이미 승인된 Partner가 추가 공방을 등록한다. 4단계 폼(사업자 정보 → 공방 정보 → 영업 정보 → 예약 정보)을 작성하고 제출하면 `Store.status = PENDING`으로 전이된다. 첫 공방 등록 시 `Partner` 엔티티가 자동 생성(`status = PENDING`)된다.
- Owner:
- Date: 2026-06-01

## Status

- [x] API 구현
- [x] UI 구현
- [x] API 연동
- [x] (2026-06-03 reopen) 사업자등록증 파일 저장 — BE `POST /partner/business-documents/images` 신규
- [x] (2026-06-03 reopen) 사업자등록증 파일 저장 — `BusinessDocumentDto.documentUrl` + `create-store.use-case` `document_url` 저장 복원
- [x] (2026-06-03 reopen) 사업자등록증 파일 저장 — FE BusinessStep 실 업로드 연동(가짜 `mock://uploads` 제거) + 미리보기 + contract 반영
- [x] (2026-06-03) 검수중/반려 영속화 — BE `GET /partner/onboarding`(AuthGuard, `{partnerStatus, store{id,status,rejectedReason}}`) 신규
- [x] (2026-06-03) 검수중/반려 영속화 — FE 온보딩 게이트 layout(`partner/layout.tsx` + `(user)/apply/layout.tsx` + 공유 `PartnerOnboardingGate`)으로 진입 시 서버 상태 분기 렌더
- [x] (2026-06-03) 검수중/반려 영속화 — mock(`getStoreRegistrationStatus`, `/api/v1/partner/onboarding`) → 실 `GET /partner/onboarding` 전환(경로/응답 정렬)

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
  - **(2026-06-03 추가) 사업자등록증 파일 저장**: BE `POST /partner/business-documents/images`(store-비종속 presigned 신규), `BusinessDocumentDto.documentUrl` 추가 + `create-store.use-case`의 `document_url` 저장 복원, FE BusinessStep 실 업로드 연동 + 파일 미리보기.
  - **(2026-06-03 추가) 검수중/반려 화면 영속화**:
    - BE: `GET /partner/onboarding`(AuthGuard. PENDING/무파트너도 호출 가능, PartnerGuard 금지) — 토큰 userId로 partner·최신 온보딩 store 1건 조회 → `{ partnerStatus, store{id,status,rejectedReason} }` 반환.
    - FE: 온보딩 게이트 layout 신규 — `src/app/partner/layout.tsx` + `src/app/(user)/apply/layout.tsx` + 공유 `PartnerOnboardingGate`. 진입 시 `GET /partner/onboarding` 1회 조회 → `partnerStatus` 분기(PENDING→검수중, REJECTED→반려, APPROVED/null→children 통과).
    - 전환: 기존 mock(`getStoreRegistrationStatus`, `GET /api/v1/partner/onboarding`, `storeRegistrationStatusResultSchema`)을 실 `GET /partner/onboarding` + 중첩 응답 스키마로 전환(경로/응답 정렬).
- Out:
  - 사업자등록증 **OCR 국세청 진위 확인**(`ocrStatus`/`verifiedAt`) — 백로그. (파일 저장 자체는 In scope로 정정, 2026-06-03 Decision Log 참조.)
  - Admin 검수 승인/반려 처리 — 별도 admin 기능.
  - 공방 수정 (REJECTED 후 재제출) — 별도 기능.
  - 공방 목록 조회 (`GET /partner/stores`) — `partner-store-list` plan 소관.
  - 공방 이미지 삭제 (`DELETE /partner/stores/{storeId}/images/{imageId}`) — 등록 플로우 외 별도 편집 기능.

## Plan

1. **(BE) 공방 초안 생성 `POST /stores`**: `store` 모듈 컨트롤러/서비스/리포지터리 구현. AuthGuard 적용. slug 중복 검증, 카카오맵 geocode 변환, `stores` + `store_operating_hours` row 생성(`status = DRAFT`). 첫 공방 여부(Partner 레코드 존재 확인) → `partners` row 자동 생성(`status = PENDING`).
2. **(BE) 이미지 presigned URL `POST /partner/stores/{storeId}/images`**: S3 presigned PUT URL 생성(5분 유효). `store_images` row 선생성. 응답에 `uploadUrl`, `imageId`, `imageUrl` 반환.
2-1. **(BE, 신규) 사업자등록증 presigned `POST /partner/business-documents/images`**: store-비종속. 토큰 `userId`로 key `business-documents/{userId}/{uuid}.{ext}` 생성 → presigned PUT URL(5분) 발급 → `{ uploadUrl, documentUrl }` 반환. DB row 선생성·confirm 없음. **닭-달걀 해결**: store 생성 전에 이 엔드포인트로 파일 업로드 → 발급된 `documentUrl`을 `POST /stores` body의 `businessDocument.documentUrl`에 실어 전송. `POST /stores` use-case가 `s3.objectExists(documentUrl)` 검증 후 `business_documents.document_url` 저장.
2-2. **(BE) `BusinessDocumentDto`/use-case 보정**: `create-store.dto.ts`의 `BusinessDocumentDto`에 `documentUrl?: string` 추가, `create-store.use-case`가 `business_documents.document_url`에 저장하도록 복원(현재 항상 null).
3. **(BE) 공방 심사 제출 `POST /partner/stores/{storeId}/submit`**: 상태 검증(`DRAFT` 또는 `REJECTED`) → 필수 항목 완비 검증(이름·주소·대표이미지 1장) → `stores.status = PENDING` 전이. notification 큐 등록(파트너 신청 알림).
4. **(UI) 실 API 연동 전환**: 기존 MSW mock을 실 API로 교체. `NEXT_PUBLIC_API_MOCKING=disabled` + `NEXT_PUBLIC_API_URL` 설정. `shared/api/auth-token.ts`에 accessToken 주입. 엔드포인트 경로 확정 반영.
5. **(UI) presigned 업로드 연동**: `POST /partner/stores/{storeId}/images` 호출 → 발급받은 `uploadUrl`로 S3 직접 PUT 업로드.
5-1. **(UI, 신규) 사업자등록증 실 업로드**: BusinessStep의 `mock://uploads/{name}` 가짜 documentUrl 제거 → `POST /partner/business-documents/images` 호출 → `uploadUrl`로 S3 직접 PUT → 발급된 `documentUrl`을 폼 상태에 보관 → `POST /stores` body `businessDocument.documentUrl`로 전송. 업로드된 파일 미리보기(파일명/썸네일) 노출.
6. **(UI) geocode 연동**: 다음 주소 검색 → 카카오 로컬 API 또는 BE geocode 엔드포인트로 위경도 변환.
7. **(연동) 제출 완료 → 검수 대기 화면**: `POST /partner/stores/{storeId}/submit` 성공 시 검토중 화면 렌더. 반려(`REJECTED`) 상태 조회 시 반려 사유 표시.
8. **(BE, 신규) 온보딩 상태 조회 `GET /partner/onboarding`**: `AuthGuard`만 적용(PartnerGuard 금지 — 무파트너/PENDING도 호출 가능). 토큰 userId로 partner 조회 → 없으면 `{partnerStatus: null, store: null}`. 있으면 `partnerStatus = partner.status`, 해당 파트너의 최신 생성순 온보딩 store 1건 조회 → `{id, status, rejectedReason}`(store 없으면 null). `rejectedReason`은 store.status가 REJECTED일 때만 값, 그 외 null.
9. **(FE, 신규) 온보딩 게이트 layout**: `src/app/partner/layout.tsx` + `src/app/(user)/apply/layout.tsx` 신규 → 공유 `PartnerOnboardingGate` 마운트. 게이트는 진입 시 `GET /partner/onboarding` 1회 조회 후 `partnerStatus`로 분기:
   - `PENDING` → `StoreRegistrationComplete`(검수중), `store.id` 사용.
   - `REJECTED` → 반려 화면(`store.rejectedReason` 노출).
   - `APPROVED` / `null` → `children` 통과(파트너센터 / 첫 등록 폼).
   - `StoreRegistrationComplete`의 '목록으로' 버튼은 `partnerStatus !== APPROVED`면 hidden.
   - `StoreRegistrationFlow`의 클라 `submittedStoreId` useState 분기는 같은 세션 즉시 전환용으로 유지(새로고침 후엔 게이트가 서버 상태로 렌더).
10. **(연동) mock → 실 전환**: `getStoreRegistrationStatus`/`/api/v1/partner/onboarding` GET mock 의존을 실 `GET /partner/onboarding`(루트 경로) + 중첩 응답 스키마(`partnerOnboardingResultSchema`)로 정렬. `partner-store-list`/`GET /partner/stores`는 **건드리지 않음**(전용 엔드포인트라 파급 없음).

## Out (단계별 완료물)

- API:
  - `POST /stores` — 공방 초안 생성 (slug 자동생성/중복검증, businessDocument 텍스트 필드 저장, 첫 공방 시 partner 자동생성). **[2026-06-03 완료] `businessDocument.documentUrl` 저장** — `BusinessDocumentDto.documentUrl`(IsOptional/IsString) 추가, `create-store.use-case`가 `S3Service.objectExists(keyFromImageUrl(documentUrl))` 검증(미존재 시 400 BAD_REQUEST) 후 `business_documents.document_url` 저장. 미첨부 시 null.
  - **[2026-06-03 완료] `POST /partner/business-documents/images` — 사업자등록증 store-비종속 presigned 업로드** — AuthGuard(PartnerGuard 없음), body `{fileName,fileType}`, key=`business-documents/{userId}/{uuid}.{ext}`(buildObjectKey), presigned PUT(300s), 응답 `{uploadUrl, documentUrl}`. DB row·confirm 없음.
  - `POST /partner/stores/:storeId/images` — 공방 이미지 presigned PUT URL 발급
  - `PATCH /partner/stores/:storeId/images/:imageId/confirm` — S3 객체 존재 검증 후 PENDING→UPLOADED
  - `POST /partner/stores/:storeId/submit` — 공방 심사 제출 (DRAFT/REJECTED → PENDING)
  - **[2026-06-03 완료] `GET /partner/onboarding` — 온보딩 상태 조회 (검수중/반려 영속화)** — 가드 `AuthGuard`만(PartnerGuard 금지). 토큰 userId로 partner 조회 → 없으면 `{partnerStatus:null, store:null}`. 있으면 `partnerStatus = partner.status` + 해당 partner의 최신 생성순(`createdAt desc`) store 1건 `{id, status, rejectedReason}`(store 없으면 null). `rejectedReason`은 `store.status === REJECTED`일 때만 값(`stores.rejected_reason` 컬럼 출처), 그 외 null. 정상상태(PENDING/REJECTED/무파트너) 모두 200, 에러는 401뿐.
    - 신규 파일: `application/use-cases/get-partner-onboarding.use-case.ts`, `presentation/dto/get-partner-onboarding.dto.ts`. 라우트는 `store.controller.ts`에 `GET partner/onboarding`(static, `partner/stores/:storeId`보다 먼저 등록). `store.module.ts` provider 등록.
    - shared: `packages/shared/src/contracts/store-registration.ts`에 `partnerOnboardingResultSchema`(+`partnerOnboardingStoreSchema`) 및 타입 신규. 기존 flat `storeRegistrationStatusResultSchema`는 mock 소비처 위해 유지(FE 전환은 fe 단계).
  - 주요 파일:
    - `apps/api/src/modules/store/store.module.ts`
    - `apps/api/src/modules/store/presentation/controllers/store.controller.ts`
    - `apps/api/src/modules/store/presentation/dto/create-store.dto.ts` (**2026-06-03 완료: `BusinessDocumentDto.documentUrl` 추가**)
    - 사업자등록증 presigned 발급은 별도 컨트롤러 대신 기존 `store.controller.ts`에 라우트 `POST partner/business-documents/images` 추가(store 도메인 일부, 기존 패턴 일관).
    - `apps/api/src/modules/store/presentation/dto/business-document-image.dto.ts` (**2026-06-03 신규: req/res DTO**)
    - `apps/api/src/modules/store/application/use-cases/create-business-document-image.use-case.ts` (**2026-06-03 신규**)
    - `apps/api/src/modules/store/presentation/dto/store-image.dto.ts`
    - `apps/api/src/modules/store/presentation/dto/submit-store.dto.ts`
    - `apps/api/src/modules/store/application/use-cases/create-store.use-case.ts` (**2026-06-03 완료: `document_url` 저장 복원 + `s3.objectExists(keyFromImageUrl(documentUrl))` 검증, S3Service 주입**)
    - `apps/api/src/modules/store/application/use-cases/create-store-image.use-case.ts`
    - `apps/api/src/modules/store/application/use-cases/confirm-store-image.use-case.ts`
    - `apps/api/src/modules/store/application/use-cases/submit-store.use-case.ts`
    - `apps/api/src/common/s3/s3.service.ts` (objectExists), `s3-object.util.ts` (keyFromImageUrl)
- UI: (디자인 변경 없음 — 연동 레이어만 수정)
  - `apps/web/src/features/store/registration/ui/StoreRegistrationFlow.tsx` — 제출 결과를 `storeId` 상태로 보관, 완료 화면에 전달. 에러 분기를 실 API 코드(`SLUG_CONFLICT`/`PARTNER_NOT_APPROVED`/`BAD_REQUEST`)로 교체.
  - `apps/web/src/features/store/registration/ui/StoreRegistrationComplete.tsx` — `storeId` prop 수신 → `GET /partner/stores/{storeId}`(PartnerStoreDetailResult) 기반으로 검수 상태/반려 사유/요약 표시. REJECTED 시 반려 사유 노출.
- 연동:
  - `packages/shared/src/contracts/store-registration.ts` — 실 API 4종 계약 타입 신설(`CreateStoreRequest/Result`, `CreateStoreImageRequest/Result`, `ConfirmStoreImageResult`, `SubmitStoreResult`) + `StoreRegistrationApiErrorCode` enum. (기존 onboarding mock 계약은 유지.) (**2026-06-03: `BusinessDocumentImageRequest`(`{ fileName, fileType }`)/`BusinessDocumentImageResult`(`{ uploadUrl, documentUrl }`) 추가 + `CreateStoreRequest.businessDocument.documentUrl?: string` 추가 필요**.)
  - `apps/web/src/features/store/registration/api.ts` — 루트 경로 실 엔드포인트로 재작성: `POST /stores`, `POST /partner/stores/{id}/images`, `uploadToPresignedUrl`(S3 직접 PUT), `PATCH .../confirm`, `POST .../submit`, `getStoreReviewStatus(GET /partner/stores/{id})`. 폼→body 매핑 `toCreateStoreBody`. (**2026-06-03: `POST /partner/business-documents/images` 호출 + `toCreateStoreBody`에 `businessDocument.documentUrl` 매핑 추가 필요**.)
  - **`apps/web/src/features/store/registration/ui/BusinessStep.tsx` (2026-06-03 완료)** — 가짜 `mock://uploads/{name}` documentUrl 생성 제거 → `useUploadBusinessDocument`(presigned 발급 → S3 PUT) 호출 후 발급 `documentUrl` 폼 상태(`patchBusiness`) 보관. 업로드 중 추가셀 비활성(`addDisabled`), 실패 시 toast. 미리보기: 이미지 파일은 로컬 `URL.createObjectURL` 썸네일(`src`), PDF 등은 파일명 라벨(`label`). 제거 시 objectURL revoke + documentUrl null.
  - **`apps/web/src/features/store/registration/api.ts` (2026-06-03 완료)** — `createBusinessDocumentImage(body {fileName,fileType})` → `POST /partner/business-documents/images`(루트 경로, MSW `/api/v1` 미가로챔 → 실 BE) → `{uploadUrl, documentUrl}`. `toCreateStoreBody`의 `businessDocument`에 `documentUrl: form.business.documentUrl` 매핑 추가.
  - **`apps/web/src/features/store/registration/queries.ts` (2026-06-03 완료)** — `useUploadBusinessDocument` mutation 신설(`useGeocode` 패턴): presigned 발급 → `uploadToPresignedUrl` S3 PUT → `{documentUrl}` 반환.
  - `apps/web/src/features/store/registration/model/store.ts` — `business.documentUrl` 초기 null / 필수조건 `!!b.documentUrl` 유지. mock 문자열 가정 코드 없음(변경 불필요).
  - `apps/web/src/features/store/registration/queries.ts` — `useSubmitStoreRegistration` 을 초안생성→이미지 presigned 업로드/확인(순차)→제출 오케스트레이션으로 재작성, `storeId` 반환. `useStoreReviewStatus` 신설.
  - **[2026-06-03 완료] 검수중/반려 영속화 — FE 온보딩 게이트 layout (fe)**:
    - `apps/web/src/features/store/registration/api.ts` — `getPartnerOnboarding()` 신규(`GET /partner/onboarding` 루트 경로, MSW 미가로챔 → 실 BE, 응답 `PartnerOnboardingResult`). 기존 mock `getStoreRegistrationStatus`(`/api/v1/partner/onboarding`) 제거.
    - `apps/web/src/features/store/registration/queries.ts` — `usePartnerOnboarding()` query hook 신규(진입 1회 조회). 기존 `useStoreRegistrationStatus` 제거.
    - `apps/web/src/features/store/registration/ui/PartnerOnboardingGate.tsx` (신규) — `usePartnerOnboarding()` 조회 → `partnerStatus` 분기: PENDING/REJECTED & store 존재 → `StoreRegistrationComplete`(store.id, partnerStatus 전달), APPROVED/null/조회실패 → children 통과. 로딩 중 null.
    - `apps/web/src/app/partner/layout.tsx` (신규) + `apps/web/src/app/(user)/apply/layout.tsx` (신규) — 동일 `PartnerOnboardingGate` 로 영역 전체 wrap.
    - `apps/web/src/features/store/registration/ui/StoreRegistrationComplete.tsx` — `partnerStatus?: PartnerStatus|null` prop 추가. `partnerStatus` 가 전달되고 APPROVED 아니면 하단 '홈으로'(BottomBar) 버튼 hidden(`showBottomAction`). 미전달(같은 세션 제출 직후 플로우)이면 기존 버튼 유지.
    - `apps/web/src/app/partner/page.tsx` — 기존 `useStoreRegistrationStatus` 기반 검수중 리다이렉트 로직 제거(게이트가 layout 에서 처리). static 컴포넌트로 단순화.
    - `apps/web/src/features/store/registration/index.ts` — `PartnerOnboardingGate`/`usePartnerOnboarding` export, `useStoreRegistrationStatus` export 제거.
    - `StoreRegistrationFlow` 의 `submittedStoreId` useState 즉시 전환 유지(같은 세션 UX). 새로고침 후엔 layout 게이트가 서버 상태로 렌더.
    - 검증: `@todam/shared` typecheck → `web typecheck`/`lint` 통과(0 errors). MSW `/api/v1/partner/onboarding` 핸들러는 dead code 로 잔존(실 경로 무영향).
  - `apps/web/.env.local` — `NEXT_PUBLIC_API_MOCKING=disabled`, `NEXT_PUBLIC_API_URL=http://localhost:4000`.
  - 인증: `apps/web/src/shared/api/client.ts` 가 `getAuthToken()` → `Authorization: Bearer` 자동 주입(기존 패턴 재사용, 변경 없음).
  - 미해결(재plan 필요): geocode·slug-availability 실 BE 미존재. contract 스냅샷에도 미정의 → `api.ts` 에서 MSW 경로 유지(`/api/v1/...`)로 표시만 남김. mock disabled 전환 시 두 호출 및 기타 MSW 의존 화면 영향 — Risks 참조.
  - (후속 갭 보정, BOSS 결정 반영):
    - geocode 실연동: `apps/web/src/shared/lib/kakaoGeocode.ts` 신설 — Kakao Maps JS SDK `services.Geocoder().addressSearch` 로 주소→좌표 변환(BE 변환 없음, 현 contract 대로 FE 가 `latitude`/`longitude` 산출). `api.ts geocode()` 가 MSW(`/api/v1/geocode`) 의존 제거하고 `geocodeAddress()` 호출로 교체. `BusinessStep.handleAddressSearch` 는 좌표 변환 실패해도 주소 선택 유지(0/0 폴백 + 안내 토스트) — 키 미설정 graceful. env 키 `NEXT_PUBLIC_KAKAO_MAP_KEY` placeholder 추가.
    - slug 중복확인: MSW mock 유지(별도 be 후속). `api.ts checkSlug` 는 `/api/v1/partner/stores/slug-availability` 경로 유지, 전역 mock(on) 이 가로챔. UI 게이트(`slugChecked && slugAvailable`) 미변경.
    - maxCapacityPerSlot contract 보정: plan 스냅샷 데이터모델 표 + `POST /stores` body 예시에 `maxCapacityPerSlot`(number) 추가. shared `createStoreRequestSchema` 는 이미 보유, FE 폼값 전송 유지.
    - mock 경로 분리: `.env.local` `NEXT_PUBLIC_API_MOCKING=disabled`→`enabled` 되돌림. 등록 실 API 4종은 루트 경로(`/stores`, `/partner/stores/...`)라 mock 핸들러(`*/api/v1`)와 충돌 없음(검증: `handlers.ts API='*/api/v1'`) → unhandled→bypass→실 BE. 핸들러 제거 불필요. env 주석을 현 상태(전역 mock on, 등록만 실 BE)로 갱신.

## Risks

- presigned URL 5분 만료: 공방 이미지 업로드 중 만료 시 재발급 로직 필요.
- slug 자동 생성: 미입력 시 BE에서 nanoid로 생성. FE는 slug 필드를 선택 입력으로 처리.
- **[미구현] 추가 공방 등록 가드(`403 PARTNER_NOT_APPROVED`)**: 규칙은 Decision Log(2026-06-01) 확정 — 첫 등록은 status 무관, 2번째부터 `partner.status == APPROVED` 필수, 그 외(PENDING/REJECTED/SUSPENDED/TERMINATED) 403. **현재 어디에도 반영 안 됨**:
  - contract `StoreRegistrationErrorCode` enum에 `PARTNER_NOT_APPROVED` 없음 (현재 `VALIDATION_ERROR`/`BUSINESS_NUMBER_ALREADY_REGISTERED`/`STORE_SLUG_DUPLICATED`만).
  - MSW `POST /partner/onboarding` 핸들러에 status 게이트 없음 → 무조건 `createStoreRegistration` 생성.
  - FE `StoreRegistrationFlow.handleSubmit` 에 403 PARTNER_NOT_APPROVED 분기 없음.
  - **인가 규칙이므로 BE에서 최종 강제 필수**(클라 검사는 우회 가능, UX 미러용). 구현 시 contract enum + mock 게이트 + FE 토스트 동시 반영.

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
- **2026-06-03 (정정): 사업자등록증 파일 저장 = IN scope.** 2026-06-01 "사업자등록증 업로드 전체 백로그 제외" 결정을 **정정한다**. BOSS 결정: 사업자등록증 **파일 자체는 저장**해야 한다(`document_url` 저장 복원). 백로그로 남기는 것은 **OCR/국세청 진위 확인**(`ocrStatus`/`verifiedAt`)뿐이다.
  - store-비종속 presigned 업로드 엔드포인트 **신규**(`POST /partner/business-documents/images`) 필요 — 사업자등록증은 `POST /stores` body의 `businessDocument`에 포함돼 **store 생성 전**에 업로드돼야 하므로(닭-달걀), store-scoped 이미지 패턴(`POST /partner/stores/:storeId/images`) 재사용 불가.
  - `BusinessDocumentDto`에 `documentUrl` 필드 추가, `create-store.use-case`가 `business_documents.document_url` 저장하도록 복원(현재 미사용 → null). `business_documents.document_url` nullable 컬럼은 이미 존재(migration `20260601090000_business_document_url_nullable`).
  - **confirm 단계 생략**(단순화): 업로드 후 confirm 핸드셰이크 없이 `POST /stores` 시점에 `businessDocument.documentUrl`만 받는다. 객체 존재 검증은 `POST /stores` use-case에서 `s3.objectExists(documentUrl)`로 수행.
- **2026-06-03: 검수중/반려 화면 영속화 — 전용 200 엔드포인트 채택(BOSS 결정, contract 정식 스냅샷).** Follow-up 노트("전용 GET /partner/onboarding으로 구현 예정")를 정식 contract로 확정한다.
  - **bundle 방식(`GET /partner/stores` 확장) 폐기**: 목록 엔드포인트에 온보딩 상태를 끼워넣지 않고 책임을 분리한 전용 200 엔드포인트(`GET /partner/onboarding`)를 둔다. `partner-store-list`/`GET /partner/stores`는 무변경(파급 없음).
  - **가드 = AuthGuard**(PartnerGuard 금지): 무파트너/PENDING/REJECTED 사용자도 자기 온보딩 상태를 조회해야 하므로 PartnerGuard를 걸면 안 된다. 가드 정책표(온보딩=AuthGuard, 파트너센터=PartnerGuard)와 일관.
  - **게이트 키 = `partnerStatus`**(storeStatus 아님): 추가 공방 등록 시에도 partner는 APPROVED 불변이므로 게이트가 파트너센터/등록 폼을 통과시킨다(추가 공방의 PENDING store가 전체 진입을 막지 않음). store는 검수중/반려 화면의 표시 데이터(id/rejectedReason) 용도.
  - **응답 형태 = 중첩 `{partnerStatus, store{...}}`**: 기존 flat mock `storeRegistrationStatusResultSchema`(partnerId/storeId/partnerStatus/storeStatus/rejectedReason)를 중첩 형태로 정리. partner 유무로 한 단계, store 유무로 또 한 단계 분기가 명확해 게이트 로직에 유리. null 처리: partner 없음→`{partnerStatus:null, store:null}`, store 없음→`store:null`, `rejectedReason`은 REJECTED일 때만 값.
  - 정상상태(PENDING/REJECTED 포함)는 모두 200으로 표현. 에러는 401(미인증)뿐.

## Outcome

- Status:
- Follow-up: Admin 검수(승인/반려) — 별도 admin plan. 반려 후 재제출(공방 수정) — 별도 기능. 사업자등록증 **OCR/국세청 진위 확인(`ocrStatus`/`verifiedAt`)** — 백로그. (파일 저장 자체는 2026-06-03 IN scope로 정정.)
- Follow-up: **추가 공방 등록 APPROVED 가드 구현** — contract `PARTNER_NOT_APPROVED`(403) 추가 + MSW `/partner/onboarding` status 게이트 + FE 403 토스트. (규칙=Decision Log 2026-06-01, 현재 미구현 — Risks 참조.)
- Follow-up: **BE slug-availability 엔드포인트 추가** (별도 be) — 현재 slug 중복확인은 MSW mock 의존(`/api/v1/partner/stores/slug-availability`). 실 BE 엔드포인트 신설 후 FE `checkSlug` 경로를 루트 실 API 로 전환. 제출 시점 `409 SLUG_CONFLICT` 는 이미 실 연동됨.
- ~~Follow-up: 검수중/반려 화면 영속화~~ → **2026-06-03 본 plan In scope로 승격, contract 스냅샷 완료**(아래 API Contract #5 `GET /partner/onboarding`). Status·Scope·Plan·Decision Log 반영. 구현 대기(미체크).

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
| `maxCapacityPerSlot` | number | 타임슬롯당 최대 예약 인원. BE `CreateStoreDto` 필수 |
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
| `documentUrl` | string \| null | 사업자등록증 파일 S3 URL. `POST /partner/business-documents/images`로 presigned 업로드 후 발급된 URL. 미첨부 시 null |

> **IN scope**: `documentUrl`(사업자등록증 파일 저장). **백로그**: `ocrStatus`/`verifiedAt`(국세청 진위 확인). 스키마상 `document_url`은 nullable(migration `20260601090000_business_document_url_nullable`).

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
    "maxCapacityPerSlot": 8,
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
      "email": "leadem@studio.com",
      "documentUrl": "https://cdn.todam.app/business-documents/{userId}/uuid.pdf"
    }
  }
  ```
- 시스템 처리: slug 중복 검증 → 사업자등록번호 형식 검증(숫자 10자리) → `documentUrl` 존재 시 `s3.objectExists(documentUrl)` 검증 → **파트너 분기**(레코드 없음 → 첫 공방, `partners` 자동 생성 `status = PENDING` / 레코드 있고 `APPROVED` → 추가 공방 허용 / 그 외 status → 403 차단) → 카카오맵으로 위경도 변환 → `stores` row 생성(`status = DRAFT`) → `store_operating_hours` + `business_documents`(`document_url` 포함) 저장
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

#### 1-1. `POST /partner/business-documents/images` — 사업자등록증 presigned 업로드 (store-비종속)

- 가드: `AuthGuard` (User 이상). **storeId 불필요** — 사업자등록증은 `POST /stores` 호출 전에 업로드되므로 store-scoped 패턴 사용 불가(닭-달걀).
- Request Headers: `Content-Type: application/json`, `Authorization: Bearer {accessToken}`
- Request Body:
  ```json
  {
    "fileName": "business_license.pdf",
    "fileType": "application/pdf"
  }
  ```
- 시스템 처리: 토큰의 `userId`로 key 생성 `business-documents/{userId}/{uuid}.{ext}` → presigned PUT URL 생성(5분 유효) → uploadUrl + documentUrl 반환. **DB row 선생성·confirm 핸드셰이크 없음** — 객체 존재 검증은 `POST /stores`에서 `s3.objectExists(documentUrl)`로 수행.
- Response `201 Created`:
  ```json
  {
    "statusCode": 201,
    "timestamp": "2026-06-03T00:00:00.000Z",
    "path": "/partner/business-documents/images",
    "message": "Pre-signed URL이 성공적으로 발급되었습니다. 5분 이내에 업로드를 완료해주세요.",
    "data": {
      "uploadUrl": "https://todam-bucket.s3.ap-northeast-2.amazonaws.com/business-documents/{userId}/uuid.pdf?...",
      "documentUrl": "https://cdn.todam.app/business-documents/{userId}/uuid.pdf"
    },
    "error": null
  }
  ```
- 에러:
  - `400 FILE_SIZE_EXCEEDED` — 5MB 초과 / `400 BAD_REQUEST` — fileType 허용 범위 외(image/*, application/pdf)
  - `401 UNAUTHORIZED` / `500 INTERNAL_SERVER_ERROR`

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

#### 5. `GET /partner/onboarding` — 온보딩 상태 조회 (검수중/반려 영속화)

- 가드: **`AuthGuard`** (User 이상). **PartnerGuard 금지** — 무파트너/PENDING/REJECTED 사용자도 자기 온보딩 상태를 조회해야 함. (온보딩 상태조회라 AuthGuard. 파트너센터 기능과 가드 정책 일관.)
- Request Headers: `Authorization: Bearer {accessToken}`
- Path/Query Params: 없음
- Request Body: 없음
- 시스템 처리: 토큰 `userId`로 partner 조회.
  - partner 없음 → `{ partnerStatus: null, store: null }`.
  - partner 있음 → `partnerStatus = partner.status`. 해당 파트너의 **최신 생성순(created_at desc) 온보딩 store 1건** 조회 → `store = { id, status, rejectedReason }`. store 없음 → `store: null`.
  - `rejectedReason` — `store.status === REJECTED`일 때 반려 사유 문자열, 그 외 모든 상태에서 `null`.
- 응답 데이터 스키마 (`data`):

  | 필드 | 타입 | 설명 |
  |------|------|------|
  | `partnerStatus` | `PartnerStatus \| null` | `PENDING`/`APPROVED`/`REJECTED`/`SUSPENDED`/`TERMINATED`. partner 없으면 null |
  | `store` | `object \| null` | 최신 온보딩 store 1건. 없으면 null |
  | `store.id` | string(UUID) | 공방 ID |
  | `store.status` | `StoreStatus` | `DRAFT`/`PENDING`/`PUBLISHED`/`REJECTED`/`SUSPENDED` |
  | `store.rejectedReason` | `string \| null` | `store.status === REJECTED`일 때만 값, 그 외 null |

  > FE 게이트 분기 키 = `partnerStatus`. `PENDING`→검수중 화면(store.id 사용), `REJECTED`→반려 화면(store.rejectedReason), `APPROVED`/`null`→children 통과. (추가 공방 등록 시에도 partner는 APPROVED 불변이라 게이트가 막지 않음.)

- Response `200 OK` (partner 있음, 검수중):
  ```json
  {
    "statusCode": 200,
    "timestamp": "2026-06-03T00:00:00.000Z",
    "path": "/partner/onboarding",
    "message": "온보딩 상태를 조회했습니다.",
    "data": {
      "partnerStatus": "PENDING",
      "store": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "status": "PENDING",
        "rejectedReason": null
      }
    },
    "error": null
  }
  ```
- Response `200 OK` (반려):
  ```json
  {
    "statusCode": 200,
    "timestamp": "2026-06-03T00:00:00.000Z",
    "path": "/partner/onboarding",
    "message": "온보딩 상태를 조회했습니다.",
    "data": {
      "partnerStatus": "REJECTED",
      "store": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "status": "REJECTED",
        "rejectedReason": "사업자등록증 이미지가 식별되지 않습니다. 재첨부 후 다시 제출해 주세요."
      }
    },
    "error": null
  }
  ```
- Response `200 OK` (무파트너 / 첫 등록 전):
  ```json
  {
    "statusCode": 200,
    "timestamp": "2026-06-03T00:00:00.000Z",
    "path": "/partner/onboarding",
    "message": "온보딩 상태를 조회했습니다.",
    "data": { "partnerStatus": null, "store": null },
    "error": null
  }
  ```
- 에러:
  - `401 UNAUTHORIZED` — 미인증
  - (정상상태 PENDING/REJECTED/무파트너는 모두 200으로 표현 — 에러 아님)

> **contract 정리 노트**: 기존 mock `storeRegistrationStatusResultSchema`(flat: partnerId/storeId/storeName/slug/partnerStatus/storeStatus/rejectedReason/...)를 폐기하고 위 중첩 `{partnerStatus, store{id,status,rejectedReason}}` 단일 스키마로 확정. shared `packages/shared/src/contracts/store-registration.ts`에 신규 `partnerOnboardingResultSchema`로 정의(또는 기존 스키마 교체). `partner-store-list`/`GET /partner/stores`는 무변경.

---
