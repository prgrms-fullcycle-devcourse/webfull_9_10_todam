# Feature Plan: 사업자등록증 진위확인 (국세청 API)

## Summary

- Goal: 공방등록 1단계 "다음" 클릭 시 서버가 국세청 API를 동기 호출해 사업자번호 위조 여부(진위확인)와 폐업/휴업 상태(상태조회)를 검증한다. 실패 시 진행을 차단하고, 통과 건만 관리자 심사에 올린다.
- **저장 모델(중요)**: 공방 등록은 4단계 입력 후 마지막 "신청하기"에서야 `POST /stores`로 store·BusinessDocument를 일괄 생성한다([StudioRegistrationFlow.tsx](apps/web/src/features/studio/registration/ui/StudioRegistrationFlow.tsx), [queries.ts](apps/web/src/features/studio/registration/queries.ts) `useSubmitStudioRegistration`). 즉 1단계 verify 시점엔 `BusinessDocument`(및 partnerId/storeId)가 없어 DB 저장이 불가능하다. 따라서:
  - **verify 엔드포인트 = stateless 게이트**: 국세청 호출 → 통과/차단 결과만 반환. DB를 건드리지 않는다.
  - **영구 기록 = 제출(`POST /stores`) 시점**: 서버가 BusinessDocument를 생성하면서 국세청 1회 재검증해 `verificationStatus`/`verifiedAt`/`businessState`를 채워 저장(신뢰경계 내 재검증, 프론트 결과를 신뢰하지 않음). OCR plan의 "OCR 결과 저장도 제출 시점" 전제와 일관.
- Owner:
- Date: 2026-06-10

## Status

- [x] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): `docs/requirements.md` — `store` 도메인, 파트너 신청 플로우, `partner` 도메인 capability 가드
- 기능명세: **Notion 기능명세 DB 매칭 없음** (백로그 신규 기능). 확정 설계 SSOT: `C:\Users\FORYOUCOM\.claude\projects\C--todam-webfull-9-10-todam\memory\business-verification-design.md`
- API명세: **Notion API명세 DB 미등록** (신규 엔드포인트 `/partner/business-documents/verify`). Contract는 아래 스냅샷이 SSOT. 구현 전 사람 검토·승인 필요.
- Relevant design docs:
  - `apps/api/src/modules/store/application/use-cases/create-business-document-image.use-case.ts` — 동일 store 모듈 유스케이스 패턴 참조
  - `apps/api/src/modules/store/presentation/controllers/store.controller.ts` — 신규 라우트 추가 대상
  - `packages/config/src/index.ts` — `apiSchema`에 `NTS_API_KEY` env 추가 대상
  - `apps/api/.env.example` — 국세청 API 키 추가 대상
  - `packages/shared/src/contracts/store-registration.ts` — verify 요청·응답 스키마 추가 대상
  - `apps/web/src/features/studio/registration/ui/BusinessStep.tsx` — "다음" 버튼 핸들러에 verify 게이트 추가 대상
  - `apps/web/src/features/studio/registration/queries.ts` — `useVerifyBusinessDocument` mutation 추가 대상
  - `apps/web/src/features/studio/registration/api.ts` — `verifyBusinessDocument()` 함수 추가 대상
  - `apps/api/prisma/schema.prisma` — `BusinessDocument` 모델 컬럼·enum 추가 대상
- OCR plan 선행 의존:
  - `docs/exec-plans/active/business-document-ocr.md`가 `startDate` 컬럼(`BusinessDocument`) 및 `OcrStatus` enum 재정의 마이그레이션을 담당한다. 이 plan의 Prisma 마이그레이션은 OCR plan이 완료(또는 같은 마이그레이션에 병합)된 이후에 실행해야 한다. OCR이 `startDate`를 폼에 채워야 verify 호출의 세 번째 입력(`startDate`)이 완성된다.
- Open decisions:
  1. **국세청 공공데이터포털 API 키 신청 완료 여부** — 서비스 키 승인이 수일~수주 걸릴 수 있다. 미승인 상태에서는 BE 모듈 구현까지는 진행 가능하나 통합 테스트 불가. 신청 현황 확인 필요.
  2. **진위확인 API 응답 내 납세자 상태 포함 여부** — 국세청 진위확인 API(`validate`) 응답에 `b_stt`(납세자 상태) 필드가 함께 반환되면 상태조회(`status`) API를 별도 호출할 필요 없다. 실제 응답 스펙 확인 후 "1회 호출로 통합" vs "2회 호출 분리" 결정. 현재 plan은 "1회 호출(진위확인)로 상태까지 처리"를 기본으로 하며, `b_stt` 미포함 시 2회 호출로 전환한다.
  3. **타임아웃 값** — 현재 5초 기준. 국세청 실 응답 시간 측정 후 조정 가능.
  4. **OCR plan과 마이그레이션 병합 여부** — `VerificationStatus`, `BusinessState` enum 신설 마이그레이션을 OCR plan의 마이그레이션 파일과 병합할지 별도 파일로 분리할지 구현 시 결정.

## API Contract (스냅샷)

> Notion API명세 DB 미등록. 아래는 `business-verification-design.md` 확정 설계 기반 contract. 구현 전 검토·승인 후 확정.

### 데이터모델

**Prisma 스키마 변경 (`BusinessDocument`)**

> 아래 컬럼들은 **제출(`POST /stores`) 시점에 서버가 채워 저장**한다(verify 엔드포인트는 stateless). verify 게이트는 이 컬럼을 읽거나 쓰지 않는다.

> ⚠️ 변경(2026-06-10): OCR plan이 `ocrRaw` 컬럼을 제거했다(죽은 컬럼 + 저장-시점 모호성). 따라서 국세청 원본 보관용 컬럼은 **이 plan이 신규 컬럼 `nts_raw Json?`로 직접 추가**한다(아래 "참고" 섹션 참조). 기존 `ocrRaw.nts` 참조는 모두 `ntsRaw`(신규 컬럼)로 읽는다.

```prisma
// 신설 컬럼 (OCR plan의 startDate 컬럼 추가 이후 동일 마이그레이션 또는 이후 마이그레이션에 포함)
verificationStatus  VerificationStatus  @default(PENDING) @map("verification_status")
ntsRaw              Json?               @map("nts_raw")
  // 국세청 진위확인/상태조회 원본 응답 보관(감사·디버깅). 제출 시점에 채움.
  // (구 ocrRaw 컬럼 제거 대체. OCR 원본은 보관하지 않음 — prefill 전용.)
verifiedAt          DateTime?           @map("verified_at") @db.Timestamptz(6)
  // 진위확인 VERIFIED 통과 시에만 기록. MISMATCH/ERROR는 null.
  // 기존 schema.prisma에 verifiedAt이 있으나 의미 미확정 상태였음 → 이 plan에서 "VERIFIED 통과 시각"으로 확정.
verificationCheckedAt DateTime?         @map("verification_checked_at") @db.Timestamptz(6)
  // verify 엔드포인트 매 호출 시 갱신 (결과 무관).
businessState       BusinessState?      @map("business_state")
  // 국세청 상태조회 결과(ACTIVE/CLOSED/SUSPENDED). 진위 통과(VERIFIED) 시 기록. MISMATCH/ERROR는 null.

// 신설 enum
enum VerificationStatus {
  PENDING    // 진위확인 미수행 (초기값)
  VERIFIED   // 진위확인 통과 = 번호·이름·개업일이 실제 등록정보와 일치 (영업상태 무관 — 폐업·휴업도 VERIFIED)
  MISMATCH   // 입력 정보가 실제 등록정보와 불일치 (valid==02, 사용자 잘못 입력, 최종 상태)
  ERROR      // 국세청 API 장애·타임아웃 (일시적, 재시도 가능)
}
// 직교 설계: verificationStatus(진위 일치)와 businessState(영업 상태)는 별개 축이다.
//   "등록 가능"은 저장값이 아니라 파생 판단: verificationStatus===VERIFIED && businessState===ACTIVE.
//   폐업·휴업 = VERIFIED + businessState=CLOSED/SUSPENDED + message(BUSINESS_CLOSED/SUSPENDED)로 차단.

enum BusinessState {
  ACTIVE     // 계속사업자
  CLOSED     // 폐업
  SUSPENDED  // 휴업
}
```

**참고: `ntsRaw`(Json) 활용** (구 `ocrRaw` 대체)

국세청 API 원본 응답은 신규 컬럼 `BusinessDocument.ntsRaw`에 보관한다. 감사·디버깅 목적.
OCR 원본은 보관하지 않는다(OCR은 prefill 보조 기능).

```json
// ntsRaw 구조 예시
{
  "validate": { /* 국세청 진위확인 원본 응답 */ },
  "status":   { /* 국세청 상태조회 원본 응답, b_stt 미포함 시에만 사용 */ }
}
```

**Zod 스키마 (`packages/shared/src/contracts/store-registration.ts`)**

```typescript
// ─── 진위확인 요청
export const businessDocumentVerifyRequestSchema = z.object({
  businessNumber: z
    .string()
    .regex(/^\d{10}$/, '사업자등록번호는 하이픈 없이 숫자 10자리여야 합니다.')
    .meta({ example: '1234567890' }),
  ownerName: z.string().min(1).meta({ example: '홍길동' }),
  startDate: z
    .string()
    .regex(/^\d{8}$/, '개업일자는 YYYYMMDD 8자리여야 합니다.')
    .meta({ example: '20190315' }),
});
export type BusinessDocumentVerifyRequest = z.infer<typeof businessDocumentVerifyRequestSchema>;

// ─── 진위확인 응답
export const businessDocumentVerifyResultSchema = z.object({
  verificationStatus: z.nativeEnum(VerificationStatus),
  // VERIFIED 시에만 값. 그 외 null.
  businessState: z.nativeEnum(BusinessState).nullable(),
  // 사용자에게 표시할 표준화된 메시지 키 (FE가 i18n/분기 처리)
  message: z.enum([
    'VERIFIED',             // 진위확인 통과
    'MISMATCH',             // 정보 불일치 — "정확한 사업자 정보를 입력해 주세요"
    'BUSINESS_CLOSED',      // 폐업 사업장 — "폐업한 사업장은 등록할 수 없어요"
    'BUSINESS_SUSPENDED',   // 휴업 사업장 — "휴업 중인 사업장입니다. 고객센터로 문의해주세요"
    'NTS_ERROR',            // 국세청 장애/타임아웃 — "잠시 후 다시 시도해주세요" (절대 MISMATCH 문구와 혼용 금지)
  ]),
});
export type BusinessDocumentVerifyResult = z.infer<typeof businessDocumentVerifyResultSchema>;
```

**VerificationStatus / BusinessState enum (`packages/shared/src/enums/`)**

```typescript
// packages/shared/src/enums/verification-status.ts
export enum VerificationStatus {
  PENDING  = 'PENDING',
  VERIFIED = 'VERIFIED',
  MISMATCH = 'MISMATCH',
  ERROR    = 'ERROR',
}

// packages/shared/src/enums/business-state.ts
export enum BusinessState {
  ACTIVE    = 'ACTIVE',
  CLOSED    = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
}
```

### 엔드포인트

#### `POST /partner/business-documents/verify`

- 인증: `AuthGuard` (User 이상). 공방 등록 1단계이므로 `PartnerGuard` 미적용.
- 요청 body:
  ```json
  {
    "businessNumber": "1234567890",
    "ownerName": "홍길동",
    "startDate": "20190315"
  }
  ```
- 서버 처리 순서:
  1. Zod 입력 검증 (`businessDocumentVerifyRequestSchema`)
  2. 국세청 진위확인 API 호출 (타임아웃 5초):
     - endpoint: `https://api.odcloud.kr/api/nts-businessman/v1/validate`
     - 헤더: `Authorization: Infuser {NTS_API_KEY}`
     - body: `{ "businesses": [{ "b_no": "1234567890", "p_nm": "홍길동", "start_dt": "20190315" }] }`
  3. 응답 `data[0].valid` 확인:
     - `"01"` → 일치(진위확인 통과). `b_stt` 필드 포함 여부 확인.
     - `"02"` → 불일치 → `verificationStatus: MISMATCH`, 진행 차단
  4. **`b_stt` 포함 시 (1회 호출 경로):**
     - `b_stt`가 `"계속사업자"` → `businessState: ACTIVE`
     - `b_stt`가 `"폐업자"` → `businessState: CLOSED`, message: `BUSINESS_CLOSED`
     - `b_stt`가 `"휴업자"` → `businessState: SUSPENDED`, message: `BUSINESS_SUSPENDED`
  5. **`b_stt` 미포함 시 (2회 호출 경로):**
     - 상태조회 API 추가 호출:
       - endpoint: `https://api.odcloud.kr/api/nts-businessman/v1/status`
       - body: `{ "b_no": ["1234567890"] }`
     - `b_stt` 필드로 동일 분기 처리
  6. **(stateless) DB 저장 없음** — 이 시점엔 BusinessDocument가 존재하지 않는다. 국세청 결과를 응답 DTO로만 반환한다.
  7. 응답 반환
  8. 타임아웃·네트워크 오류 → `verificationStatus: ERROR`, message: `NTS_ERROR`
- 응답 200 (통과):
  ```json
  {
    "data": {
      "verificationStatus": "VERIFIED",
      "businessState": "ACTIVE",
      "message": "VERIFIED"
    }
  }
  ```
- 응답 200 (정보 불일치):
  ```json
  {
    "data": {
      "verificationStatus": "MISMATCH",
      "businessState": null,
      "message": "MISMATCH"
    }
  }
  ```
- 응답 200 (국세청 장애):
  ```json
  {
    "data": {
      "verificationStatus": "ERROR",
      "businessState": null,
      "message": "NTS_ERROR"
    }
  }
  ```

> **설계 근거**: MISMATCH와 ERROR 모두 200으로 반환하는 이유 — 진위확인 결과 자체가 정상 응답이며 HTTP 에러(4xx/5xx)는 서버 처리 자체 실패에만 사용한다. FE는 `verificationStatus`와 `message`로 분기 처리한다.

- 에러 응답 (엔드포인트 자체 실패):
  - `400 BAD_REQUEST` — 입력 형식 오류 (Zod 검증 실패)
  - `401 UNAUTHORIZED` — 인증 토큰 없음

### 제출 시 영구 저장 (`POST /stores` 핸들러)

verify 게이트가 stateless이므로, 진위확인 결과의 **영구 기록은 공방 등록 제출 시점에 서버가 수행**한다. 기존 store 생성 유스케이스(`BusinessDocument` 생성 구간)에 다음을 추가한다:

1. BusinessDocument 생성 직전, `NtsService`로 **국세청 1회 재검증**(`validate` + 필요 시 `status`). 입력은 제출 바디의 `businessNumber`/`ownerName`/`startDate`.
2. 결과를 BusinessDocument 생성 데이터에 포함해 저장:
   - `verificationCheckedAt = now()` (항상)
   - VERIFIED 시: `verificationStatus = VERIFIED`, `verifiedAt = now()`, `businessState`
   - MISMATCH/CLOSED/SUSPENDED 시: `verificationStatus`/`businessState`만, `verifiedAt = null`
   - ERROR 시: `verificationStatus = ERROR` (best-effort 저장, 제출 자체는 막지 않음 — 관리자 심사에서 재확인)
   - `ntsRaw`에 국세청 원본 응답 저장(신규 컬럼)
3. **정책 결정 필요(Open decision)**: 제출 시 재검증이 MISMATCH/CLOSED면 제출을 거부(4xx)할지, 일단 저장하고 관리자 심사로 넘길지. 기본은 **저장 후 심사 위임**(동기 게이트에서 이미 1차 차단했으므로). verify 게이트를 우회한 직접 제출 방어용으로 ERROR가 아닌 한 기록만 남기고 통과시킨다.

> **국세청 호출 2회**(1단계 게이트 + 제출 시 재검증)가 발생한다. 공공데이터포털 API 무료·일일한도 내라 부담은 작다. 재검증을 생략하고 게이트 결과를 신뢰하려면 프론트가 결과를 동봉해야 하는데, 이는 신뢰경계 위반이라 채택하지 않는다.

### MSW mock (개발용)

```typescript
// apps/web/src/mocks/handlers/ 적절한 파일에 추가
http.post('/api/v1/partner/business-documents/verify', () =>
  HttpResponse.json({
    data: {
      verificationStatus: 'VERIFIED',
      businessState: 'ACTIVE',
      message: 'VERIFIED',
    },
  })
)
```

## Scope

- In:
  - BE: `POST /partner/business-documents/verify` 엔드포인트 신설
  - BE: `NtsService` (`apps/api/src/modules/store/infrastructure/nts.service.ts` 또는 `common/nts/`) — 국세청 API 2종 클라이언트 (진위확인, 상태조회), 타임아웃 5초, 재시도 없음(동기 게이트)
  - BE: `VerifyBusinessDocumentUseCase` — 검증 로직, 결과 DTO 반환 (**stateless, DB 미접근**)
  - BE: `POST /stores` 생성 유스케이스(기존)에 국세청 재검증 + 진위확인 컬럼 저장 로직 추가 (`verificationStatus`/`verifiedAt`/`verificationCheckedAt`/`businessState`/`ntsRaw`)
  - BE: Prisma 스키마 — `ntsRaw Json? @map("nts_raw")` 신규 컬럼 추가(구 `ocrRaw` 제거 대체)
  - BE: Prisma 스키마 — `verificationStatus`, `verifiedAt`, `verificationCheckedAt`, `businessState` 컬럼 추가; `VerificationStatus`, `BusinessState` enum 신설
  - BE: 마이그레이션 파일 생성 (OCR plan 마이그레이션과 병합 또는 별도)
  - BE: `createApiEnv()`에 `NTS_API_KEY` env 추가 (`packages/config/src/index.ts`)
  - BE: `apps/api/.env.example`에 `NTS_API_KEY` 항목 추가
  - Shared: `VerificationStatus`, `BusinessState` enum 파일 신설 (`packages/shared/src/enums/`)
  - Shared: `businessDocumentVerifyRequestSchema`, `businessDocumentVerifyResultSchema` 추가 (`store-registration.ts`)
  - FE: `api.ts`에 `verifyBusinessDocument()` 함수 추가
  - FE: `queries.ts`에 `useVerifyBusinessDocument()` mutation 추가
  - FE: `BusinessStep.tsx` — "다음" 버튼 클릭 시 verify mutation 호출, 로딩 스피너 + 버튼 비활성화, 결과 분기 처리
  - FE: 결과별 UX:
    - `VERIFIED` + `ACTIVE` → 다음 단계 진행
    - `MISMATCH` → 에러 토스트: "정확한 사업자 정보를 입력해 주세요" + 진행 차단
    - `BUSINESS_CLOSED` → 에러 토스트: "폐업한 사업장은 등록할 수 없어요" + 진행 차단
    - `BUSINESS_SUSPENDED` → 에러 토스트: "휴업 중인 사업장입니다. 고객센터로 문의해주세요" + 진행 차단
    - `NTS_ERROR` → 에러 토스트: "잠시 후 다시 시도해주세요" + 버튼 재활성화 (재시도 허용, 절대 MISMATCH 문구와 혼용 금지)
  - FE: MSW mock 핸들러 추가
- Out:
  - OCR(이미지→필드 추출·폼 자동채움) — `docs/exec-plans/active/business-document-ocr.md` 소관
  - `startDate` 컬럼 추가 + `OcrStatus` enum 재정의 마이그레이션 — OCR plan 소관
  - 비동기 검증 (BullMQ 워커) — 동기 게이트 방식 확정으로 불필요
  - 자동반려 처리 — 관리자 휴먼인더루프 방식 확정으로 불필요
  - 진위확인 결과 관리자 UI 열람 — 별도 백로그
  - 재시도 횟수 제한 (rate limiting) — 별도 백로그

## Plan

### 선행 조건

- [x] 국세청 공공데이터포털 "국세청_사업자등록정보 진위확인 및 상태조회" 서비스 키 신청 및 승인 — **2026-06-11 발급 완료, 실 API 호출 테스트 정상 확인.**
- [ ] OCR plan의 `startDate` 컬럼 마이그레이션 완료 (또는 동일 마이그레이션에 병합 결정)

### BE

1. **env 추가**
   - `packages/config/src/index.ts` `apiSchema`에 `NTS_API_KEY: z.string().optional()` 추가
     - 바로 위 `GOOGLE_VISION_*`(OCR 키)와 동일 컨벤션: **외부 API 키는 env 스키마에서 optional로 두고, 사용 지점(NtsService)에서 존재 검증**한다(부재 시 NtsApiError→ERROR). required로 좁히면 키 미보유 환경(타 개발자·CI)의 부팅이 막히고 형제 키와 불일치. (초기 plan의 `z.string()` 표기는 이 컨벤션 미반영 — 정정)
   - `apps/api/.env.example`에 `NTS_API_KEY=` 항목 추가

2. **Shared enum·스키마 추가**
   - `packages/shared/src/enums/verification-status.ts` 신설 (`VerificationStatus`)
   - `packages/shared/src/enums/business-state.ts` 신설 (`BusinessState`)
   - `packages/shared/src/enums/index.ts` re-export 추가
   - `packages/shared/src/contracts/store-registration.ts`에 `businessDocumentVerifyRequestSchema`, `businessDocumentVerifyResultSchema` 추가

3. **Prisma 스키마 변경 + 마이그레이션**
   - `apps/api/prisma/schema.prisma`:
     - `BusinessDocument`에 `verificationStatus`, `verifiedAt`(기존 컬럼 의미 확정), `verificationCheckedAt`, `businessState` 추가
     - `VerificationStatus`, `BusinessState` enum 신설
   - `prisma migrate dev` 실행 (기존 `BusinessDocument` 레코드의 `verificationStatus` 초기값 `PENDING`)
   - OCR plan 마이그레이션과 병합 여부 결정 후 파일 처리

4. **NtsService 구현**
   - 위치: `apps/api/src/modules/store/infrastructure/nts.service.ts` (또는 `common/nts/`)
   - 의존: `HttpService` (NestJS `@nestjs/axios`) 또는 Node `fetch`
   - 메서드:
     - `validate(businessNumber, ownerName, startDate): Promise<NtsValidateResponse>` — 5초 타임아웃
     - `getStatus(businessNumber): Promise<NtsStatusResponse>` — `b_stt` 미포함 시 분기 경로에서만 호출
   - `NTS_API_KEY`는 `createApiEnv()` 주입
   - 타임아웃·네트워크 오류 → `NtsApiError`(커스텀 예외) throw

5. **VerifyBusinessDocumentUseCase 구현 (stateless)**
   - 위치: `apps/api/src/modules/store/application/use-cases/verify-business-document.use-case.ts`
   - 처리 흐름 (DB 미접근):
     1. `NtsService.validate()` 호출
     2. 응답 `valid === "02"` → MISMATCH 결과 DTO 반환
     3. `valid === "01"`:
        - `b_stt` 포함 → businessState 결정 (1회 호출 경로)
        - `b_stt` 미포함 → `NtsService.getStatus()` 추가 호출 (2회 호출 경로)
     4. businessState에 따라 CLOSED/SUSPENDED → message 세팅, VERIFIED 차단
     5. 결과 DTO 반환 (verificationStatus/businessState/message)
   - `NtsApiError` catch → ERROR 결과 DTO 반환
   - **국세청 결과→businessState/message 매핑 로직은 제출 핸들러와 공유**해야 하므로, 순수 함수(예: `resolveVerification(ntsResponse)`)로 분리해 use-case와 store 생성 유스케이스 양쪽에서 재사용한다.

6. **`POST /stores` 생성 유스케이스에 진위확인 저장 추가**
   - 기존 store/BusinessDocument 생성 유스케이스를 찾아(`create-store`/`create-studio` 계열) BusinessDocument 생성 직전에:
     1. `NtsService` 재검증 호출 → `resolveVerification()`로 결과 산출
     2. BusinessDocument 생성 데이터에 `verificationStatus`/`verifiedAt`(VERIFIED만)/`verificationCheckedAt`(항상)/`businessState`/`ntsRaw` 포함
     3. ERROR면 best-effort 저장(제출은 막지 않음). MISMATCH/CLOSED 제출 거부 여부는 Open decision(기본: 저장 후 심사 위임)
   - `NtsService`를 store 생성 유스케이스에 주입

7. **컨트롤러 라우트 추가**
   - `store.controller.ts`에 `POST /partner/business-documents/verify` 라우트 추가
   - `@UseGuards(AuthGuard)` 적용 (PartnerGuard 없음)
   - `@Body(new ZodValidationPipe(businessDocumentVerifyRequestSchema))` 바인딩
   - `@ResponseMessage('진위확인 완료')` 데코레이터

### FE

8. **api.ts에 함수 추가**
   - `verifyBusinessDocument(body: BusinessDocumentVerifyRequest): Promise<BusinessDocumentVerifyResult>`
   - `POST /partner/business-documents/verify` 호출

9. **queries.ts에 mutation 추가**
   - `useVerifyBusinessDocument()` — `mutationFn: verifyBusinessDocument`

10. **StudioRegistrationFlow.tsx — "다음" 버튼 게이트 구현**
   - ⚠️ "다음" 버튼은 `BusinessStep.tsx`가 아니라 [StudioRegistrationFlow.tsx:165](apps/web/src/features/studio/registration/ui/StudioRegistrationFlow.tsx#L165)의 BottomBar에 있고 `onClick={next}`(zustand 액션, 모든 step 공통)로 동작한다. **Business step(step===StoreRegistrationStep.Business)일 때만** verify 게이트를 끼운다.
   - "다음" onClick을 분기: Business step이면 `handleBusinessNext`(verify 통과 시 `next()`), 그 외 step은 기존 `next()` 그대로.
   - `handleBusinessNext` 흐름:
     1. `verifyMutation.mutateAsync({ businessNumber: stripHyphens(form.business.businessNumber), ownerName: form.business.ownerName, startDate: form.business.startDate })`
     2. 로딩 중: "다음" 버튼 `disabled`, 스피너 표시 (`verifyMutation.isPending`)
     3. `message === 'VERIFIED'` → `next()` 호출(다음 단계 진행)
     4. `message === 'MISMATCH'` → 에러 토스트: "정확한 사업자 정보를 입력해 주세요" (진행 안 함)
     5. `message === 'BUSINESS_CLOSED'` → 에러 토스트: "폐업한 사업장은 등록할 수 없어요"
     6. `message === 'BUSINESS_SUSPENDED'` → 에러 토스트: "휴업 중인 사업장입니다. 고객센터로 문의해주세요"
     7. `message === 'NTS_ERROR'` → 에러 토스트: "잠시 후 다시 시도해주세요" + 버튼 재활성화(재시도 허용)
   - `startDate`는 OCR plan 완료 후 `business.startDate` 폼 필드에서 읽음 (OCR plan 선행 의존)
   - 주의: 게이트 통과는 stepValid(`isStepValid`)와 별개. 폼이 valid해도 verify 통과 전엔 `next()` 호출 금지.

11. **MSW mock 핸들러 추가**
    - `apps/web/src/mocks/handlers/` 적절한 파일에 `POST /api/v1/partner/business-documents/verify` 핸들러 추가
    - 개발 중 VERIFIED / MISMATCH / NTS_ERROR 케이스를 수동 전환해 UX 검증 가능하도록 주석 처리

## Out (단계별 완료물)

- API: `POST /partner/business-documents/verify`(stateless) 엔드포인트, `NtsService`, `VerifyBusinessDocumentUseCase`, `POST /stores` 생성 유스케이스의 진위확인 저장 로직, `VerificationStatus`/`BusinessState` 마이그레이션
  - `packages/shared/src/enums/verification-status.ts` — `VerificationStatus` enum 신설
  - `packages/shared/src/enums/business-state.ts` — `BusinessState` enum 신설
  - `packages/shared/src/index.ts` — 두 enum re-export 추가
  - `packages/shared/src/contracts/store-registration.ts` — `businessDocumentVerifyRequestSchema`, `businessDocumentVerifyResultSchema`, 타입 추가
  - `apps/api/prisma/schema.prisma` — `BusinessDocument`에 `verificationStatus`/`ntsRaw`/`verifiedAt`/`verificationCheckedAt`/`businessState` 컬럼 추가; `VerificationStatus`/`BusinessState` enum 신설
  - `apps/api/prisma/migrations/20260611130000_add_verification_columns/migration.sql` — 마이그레이션 파일
  - `apps/api/src/modules/store/infrastructure/nts.service.ts` — 국세청 API 클라이언트 (`validate`/`getStatus`, 5초 타임아웃, `NtsApiError`)
  - `apps/api/src/modules/store/application/use-cases/verify-business-document.use-case.ts` — stateless 유스케이스 + `resolveVerification()` 순수함수
  - `apps/api/src/modules/store/infrastructure/persistence/prisma-create-store.command.ts` — `POST /stores` 제출 시 국세청 재검증 + 진위확인 컬럼 저장 로직 추가
  - `apps/api/src/modules/store/presentation/controllers/store.controller.ts` — `POST /partner/business-documents/verify` 라우트 추가
  - `apps/api/src/modules/store/presentation/dto/verify-business-document.dto.ts` — Swagger DTO
  - `apps/api/src/modules/store/store.module.ts` — `NtsService`, `VerifyBusinessDocumentUseCase` 등록
  - `apps/api/src/modules/store/application/use-cases/verify-business-document.use-case.spec.ts` — 유스케이스 테스트 (18개 중 9개)
  - `apps/api/src/modules/store/infrastructure/nts.service.spec.ts` — HTTP 클라이언트 테스트 (9개)
  - `apps/api/src/modules/api-routes.snapshot.spec.ts` — 신규 라우트 스냅샷 반영
  - 검증: `tsc --noEmit` 0 오류, Jest 371/371 통과
- UI: `StudioRegistrationFlow.tsx` Business step "다음" 버튼 게이트 (스피너, 분기 토스트, 진행 차단)
- 연동: 실 국세청 API 호출 → 결과별 UX 분기 동작 확인 (키 승인 후)

## Risks

- **국세청 API 키 승인 지연**: 외부 심사로 수일~수주 소요. 키 없이 BE 구현까지는 가능하나 통합 테스트 및 실 검증 불가. 계획 일정에 완충 필요.
- **`b_stt` 포함 여부 미확정**: 진위확인 API 응답에 납세자 상태가 포함될 경우 상태조회 API 별도 호출 불필요. 포함되지 않을 경우 2회 호출로 처리. 실제 응답 스펙 확인 전까지 2회 호출 경로를 항상 구현해 두고, 1회 경로는 `b_stt` 존재 여부로 런타임 분기.
- **MISMATCH ↔ ERROR 혼용 위험**: 이 둘은 서버 로직, FE 문구, DB 저장 모두 분리되어야 한다. 국세청 점검/장애 시 멀쩡한 사용자가 차단되는 오탐을 방지하려면 ERROR는 반드시 재시도 허용 경로로 처리해야 한다.
- **타임아웃 UX**: 국세청 응답이 5초를 초과하면 ERROR 처리. 프론트 로딩 스피너가 5초 이상 표시될 수 있어 사용자 이탈 가능. 실 응답 시간 측정 후 타임아웃 조정 가능.
- **폐업/휴업 차단 UX**: 사업자가 휴업 중이라도 재개업 가능. 차단 문구는 안내성으로 작성하고 고객센터 연결을 유도한다.
- **OCR 없이 verify 호출**: OCR plan 미완료 상태에서는 `startDate` 폼 필드가 없어 수동 입력으로만 동작. verify BE 구현은 OCR과 무관하게 독립 진행 가능.

## Validation

- Tests:
  - `verify-business-document.use-case.spec.ts`: `NtsService` mock 기반 유스케이스 테스트
    - VERIFIED 경로 (b_stt 포함 1회, 미포함 2회)
    - MISMATCH 경로
    - CLOSED / SUSPENDED 경로
    - NtsApiError(타임아웃) → ERROR 경로
    - DB upsert 케이스별 필드 검증 (`verifiedAt` null 여부, `verificationCheckedAt` 항상 갱신)
  - `nts.service.spec.ts`: HTTP 클라이언트 mock 기반 타임아웃·응답 파싱 테스트
- Manual checks:
  - 실 국세청 API 키 승인 후: 유효한 사업자번호로 VERIFIED 응답 확인
  - 대표자명 틀리게 입력 → MISMATCH 토스트 표시, 다음 단계 진행 차단 확인
  - 국세청 키를 잘못된 값으로 교체 → NTS_ERROR 토스트, 버튼 재활성화, MISMATCH 문구 미표시 확인
  - 타임아웃 시뮬레이션(mock으로 5초 지연) → ERROR 경로 UX 확인
  - 폐업 사업자번호 입력 → BUSINESS_CLOSED 토스트, 진행 차단 확인
- Observability:
  - NtsService에서 국세청 API 호출 실패 시 서버 로그에 상태코드 및 에러 기록
  - `verificationCheckedAt` 및 `verificationStatus` DB 컬럼으로 검증 이력 추적 가능
  - `ntsRaw` 컬럼에 국세청 원본 응답 보관 (감사·디버깅)

## Decision Log

- 2026-06-10: **verify 엔드포인트 stateless 확정.** 공방 등록이 마지막 "신청하기"에서 store·BusinessDocument를 일괄 생성([queries.ts](apps/web/src/features/studio/registration/queries.ts) `useSubmitStudioRegistration`)하므로 1단계 verify 시점엔 저장 대상 레코드가 없음. verify는 게이트(결과만 반환), 영구 기록은 `POST /stores` 제출 시 서버가 국세청 재검증해 저장. (초기 plan의 "1단계 BusinessDocument upsert"는 실행 불가라 폐기.)
- 2026-06-10: 동기 게이트 방식 확정 (BullMQ 비동기 워커 불필요). "다음" 클릭 시 국세청 API 동기 호출.
- 2026-06-10: MISMATCH ≠ ERROR 분리 확정. MISMATCH=최종(차단), ERROR=일시적(재시도). 절대 혼용 금지.
- 2026-06-10: 관리자 심사 = 휴먼인더루프. VERIFIED 건만 심사에 올라오고 자동반려 없음.
- 2026-06-10: `verifiedAt` 기존 컬럼을 "VERIFIED 통과 시각" 의미로 확정 (기존 schema에 컬럼 존재, 의미 미확정 상태였음).
- 2026-06-10: `b_stt` 포함 여부에 따라 1회/2회 호출 런타임 분기. 실 스펙 확인 전까지 양 경로 모두 구현.
- 2026-06-10: 기능명세 DB 및 API명세 DB 매칭 없음 확인 → 확정 설계 메모리(`business-verification-design.md`)가 SSOT임을 명시.
- 2026-06-10: `AuthGuard`만 적용 (PartnerGuard 없음). 공방 등록 1단계 = Partner 레코드 미존재 가능.
- 2026-06-11: **국세청 API 키 발급 완료**, 실 API 호출 테스트 정상. 통합 테스트 가능 상태.
- 2026-06-11: **`NTS_API_KEY`는 env 스키마에서 `optional()` 유지 확정.** 바로 위 `GOOGLE_VISION_*`(OCR) 키와 동일하게 "외부 API 키 = env optional + 사용 지점 검증" 컨벤션을 따른다. required로 좁히면 키 미보유 환경(타 개발자·CI) 부팅 차단 + 형제 키와 불일치. 초기 plan의 `z.string()`(required) 표기를 정정. (리뷰 DRIFT-2 해소: 코드가 컨벤션에 맞고 plan이 틀렸던 케이스.)
- 2026-06-11: **VERIFIED 재정의 + 직교 설계 확정.** 초기 설계는 "VERIFIED = 진위 통과 + ACTIVE"로 묶어, 폐업·휴업을 `verificationStatus=MISMATCH`로 매핑했음 → `MISMATCH + businessState=CLOSED`라는 모순값 발생(MISMATCH는 valid==02 전용인데 폐업은 valid==01). 해소: `verificationStatus`(진위 일치 여부)와 `businessState`(영업 상태)를 **직교 축**으로 분리. 폐업·휴업 = `VERIFIED` + `businessState=CLOSED/SUSPENDED` + message로 차단. "등록 가능"은 저장값이 아니라 파생 판단(`VERIFIED && ACTIVE`). enum 추가·마이그레이션 불필요(기존 4값 유지). businessState를 verificationStatus에 흡수(A안)하면 두 컬럼이 중복되므로 기각. 코드: [verify-business-document.use-case.ts](apps/api/src/modules/store/application/use-cases/verify-business-document.use-case.ts) `resolveVerification` CLOSED/SUSPENDED 분기 `MISMATCH→VERIFIED`.

## Outcome

- Status: 미착수
- Follow-up:
  - 국세청 API 키 승인 후 통합 테스트 진행
  - OCR plan과 마이그레이션 파일 병합 여부 구현 시 결정
  - 진위확인 통과 후 관리자 심사 화면에서 `verificationStatus` 표시 여부 (관리자 UI 백로그)
