# Feature Plan: 사업자등록증 OCR 필드 자동채움

## Summary

- Goal: 사업자등록증 이미지 업로드 후 Google Cloud Vision OCR로 필드(사업자번호·상호명·대표자명·사업장주소·개업일자)를 추출해 공방등록 1단계 폼에 자동채움한다. OCR 서버 전용 호출, S3 private 유지, documentUrl IDOR 차단.
- Owner:
- Date: 2026-06-10

## Status

- [x] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): `docs/requirements.md` — `store` 도메인 §2 파트너 신청, 사업자 인증 단계
- 기능명세: Notion 기능명세 DB 매칭 없음(백로그 신규 기능). 확정 설계 SSOT: `C:\Users\FORYOUCOM\.claude\projects\C--todam-webfull-9-10-todam\memory\business-verification-design.md`
- API명세: Notion API명세 DB 미등록(신규 엔드포인트). Contract는 아래 스냅샷이 SSOT.
- Relevant design docs:
  - `apps/api/src/common/s3/s3.service.ts` — `objectExists`, `createPresignedPutUrl`, `deleteObject`
  - `apps/api/src/common/s3/s3-object.util.ts` — `keyFromImageUrl`, `buildObjectKey`, `CDN_BASE`
  - `apps/api/src/modules/store/application/use-cases/create-business-document-image.use-case.ts` — presigned 발급 유스케이스(재사용 패턴 참조)
  - `apps/api/src/modules/store/presentation/controllers/store.controller.ts` — 신규 라우트 추가 대상
  - `apps/web/src/features/studio/registration/ui/BusinessStep.tsx` — OCR prefill + startDate 필드 추가 대상
  - `apps/web/src/features/studio/registration/queries.ts` — OCR mutation 추가 대상
  - `apps/web/src/features/studio/registration/model/types.ts` — `business.startDate` 필드 추가 대상
  - `packages/shared/src/contracts/store-registration.ts` — OCR 응답 스키마 추가 대상
- Open decisions:
  - Google Cloud Vision API 키 관리 방식 미확정(Secret Manager vs `.env` `GOOGLE_VISION_API_KEY`). 프로비저닝 방식 결정 필요.
  - `startDate` 입력 UI 컴포넌트: 날짜 피커(YYYYMMDD 형식) vs 텍스트 입력(`TextInput` + 마스킹). 디자인 결정 필요.
  - OCR 파싱 실패(필드 미추출) 시 UX: "자동입력에 실패했어요. 직접 입력해 주세요" 토스트 후 폼 유지 — 이것으로 확정하되 이견 있으면 재검토.
  - `ocrStatus` enum 변경(`PENDING/VERIFIED/FAILED` → `PENDING/DONE/FAILED`)은 마이그레이션 포함. 기존 `VERIFIED` 데이터가 있으면 `DONE`으로 rename 처리 필요 — 실 데이터 현황 확인 요망.

## API Contract (스냅샷)

> Notion API명세 DB 미등록. 아래는 `business-verification-design.md` 확정 설계 기반 contract. 구현 전 검토·승인 후 확정.

### 데이터모델

**신규 Prisma 스키마 변경 (`BusinessDocument`)**

```
// 신설 컬럼
startDate       String?    @map("start_date") @db.VarChar(8)  // "YYYYMMDD", OCR prefill + 사용자 수정

// 제거: ocrStatus 컬럼 + OcrStatus enum + ocrRaw 컬럼
// 사유: 문서 신뢰 상태는 verificationStatus(진위확인, verify plan)로 일원화.
//       OCR은 prefill 보조 기능이라 별도 상태/원본 컬럼 불필요(둘 다 현재 읽기·쓰기 없는 죽은 컬럼).
// 처리 결과는 응답 HTTP status로 표현(성공 200 / 실패 404·413·415·500·503).
// 국세청 감사 원본이 필요하면 verify plan이 채우는 시점에 제대로 된 이름(예: nts_raw)으로 직접 추가.
```

**Zod 스키마 (`packages/shared/src/contracts/store-registration.ts`)**

```typescript
// OCR 요청
export const businessDocumentOcrRequestSchema = z.object({
  documentUrl: z.string().url(),  // CDN URL (https://cdn.todam.app/business-documents/{userId}/...)
});
export type BusinessDocumentOcrRequest = z.infer<typeof businessDocumentOcrRequestSchema>;

// OCR 응답 (파싱된 필드, 미추출 필드는 null)
export const businessDocumentOcrResultSchema = z.object({
  businessNumber: z.string().nullable(),   // "000-00-00000" 형식 또는 null
  ownerName:      z.string().nullable(),
  businessName:   z.string().nullable(),
  businessAddress:z.string().nullable(),
  startDate:      z.string().nullable(),   // "YYYYMMDD" 또는 null
  // ocrStatus 없음 — 처리 성공/실패는 HTTP status로 표현. 개별 필드 null = 파싱 실패.
});
export type BusinessDocumentOcrResult = z.infer<typeof businessDocumentOcrResultSchema>;
```

### 엔드포인트

#### `POST /partner/business-documents/ocr`

- 인증: `AuthGuard` (User 이상). 공방 등록 전 단계이므로 `PartnerGuard` 미적용.
- 요청:
  ```json
  { "documentUrl": "https://cdn.todam.app/business-documents/{userId}/uuid.pdf" }
  ```
- 서버 처리 순서:
  1. `documentUrl` 검증 — `keyFromImageUrl(documentUrl)`로 key 추출
  2. prefix 화이트리스트: key가 `business-documents/` 로 시작하는지 확인
  3. 소유권 검증(IDOR 차단): key가 `business-documents/{현재 userId}/` 로 시작하는지 확인
  4. 존재 확인: `S3Service.objectExists(key)` → false면 404
  5. S3 GetObject(IAM 권한)로 이미지 바이트 읽기
  6. Google Cloud Vision `TEXT_DETECTION` 호출
  7. 전체 텍스트에서 정규식 파싱:
     - 사업자번호: `/\d{3}-\d{2}-\d{5}/`
     - 개업일자: `/\d{4}\.\s*\d{2}\.\s*\d{2}|\d{8}/` → "YYYYMMDD"로 정규화
     - 대표자명, 상호명, 사업장주소: 키워드 기반 라인 추출
  8. 응답 반환 (개별 필드 null은 파싱 실패 — graceful degradation, 처리 자체는 성공이므로 200)
- 응답 200:
  ```json
  {
    "data": {
      "businessNumber": "123-45-67890",
      "ownerName": "홍길동",
      "businessName": "흙담공방",
      "businessAddress": "서울특별시 성동구 둑섬로 273",
      "startDate": "20190315"
    }
  }
  ```
- 응답 실패:
  - `400 INVALID_DOCUMENT_URL` — prefix 화이트리스트 불일치
  - `403 FORBIDDEN` — 소유권 대조 실패(타 userId prefix)
  - `404 DOCUMENT_NOT_FOUND` — HeadObject 없음(미업로드)
  - `413 DOCUMENT_TOO_LARGE` — 파일 크기 10MB 초과(다운로드 전 HeadObject + 스트리밍 중 상한 둘 다)
  - `415 UNSUPPORTED_DOCUMENT_TYPE` — PDF 등 이미지가 아닌 문서(Vision TEXT_DETECTION 미지원)
  - `503 SERVICE_UNAVAILABLE` — Vision 자격증명 미설정(HttpException 그대로 전달)
  - `500 OCR_FAILED` — Vision API 장애 (전체 호출 실패 시. 파싱 실패는 200 + 필드 null)
- 서버 게이트(처리 순서 4): HeadObject 1회로 존재·크기·타입을 함께 검증한다.
  PDF(Content-Type `application/pdf` 또는 `.pdf`)는 415, 10MB 초과는 413으로 다운로드 전 반려.
  추가로 GetObject 스트리밍 중 누적이 10MB 초과하면 중단(HeadObject 이후 객체 교체 TOCTOU 방어).
- 업로드 차단: `POST /partner/business-documents/images`의 `fileType`을 `image/jpeg`·`image/png`로 제한(PDF 차단). FE도 업로드 전 `isBusinessDocumentFileType`로 사전 차단.

### MSW mock (개발용)

```typescript
// apps/web/src/mocks/handlers/store.ts 또는 partner.ts 에 추가
http.post('/api/v1/partner/business-documents/ocr', () =>
  HttpResponse.json({
    data: {
      businessNumber: '123-45-67890',
      ownerName: '홍길동',
      businessName: '흙담공방',
      businessAddress: '서울특별시 성동구 둑섬로 273',
      startDate: '20190315',
    },
  })
)
```

## Scope

- In:
  - BE: `POST /partner/business-documents/ocr` 엔드포인트 신설
  - BE: Google Cloud Vision 클라이언트 모듈 (`common/vision/` 또는 `store` 내 infra service)
  - BE: `documentUrl` 3단계 보안 검증 (prefix 화이트리스트, IDOR, objectExists)
  - BE: Prisma 스키마 — `BusinessDocument.startDate` 컬럼 추가, `ocrStatus`·`ocrRaw` 컬럼 + `OcrStatus` enum 제거
  - BE: 마이그레이션 — `ocr_status`·`ocr_raw` DROP COLUMN + `OcrStatus` DROP TYPE (`start_date`는 직전 마이그레이션에서 추가)
  - Shared: `businessDocumentOcrRequestSchema`, `businessDocumentOcrResultSchema` 추가
  - Shared: `OcrStatus` enum 파일 제거 + 전 계약(store-edit·store-registration)에서 `ocrStatus` 필드 제거
  - Shared: `createStoreBusinessDocumentSchema`에 `startDate` 필드 추가 (optional)
  - FE: `StudioRegistrationForm.business`에 `startDate: string` 필드 추가
  - FE: `BusinessStep.tsx` — 이미지 업로드 후 OCR mutation 호출, 응답으로 폼 prefill (startDate 필드 포함)
  - FE: `BusinessStep.tsx` — 개업일자 `TextInput` 신설 (OCR prefill + 사용자 수정 가능, B안)
  - FE: `queries.ts` — `useOcrBusinessDocument` mutation 추가
  - FE: `api.ts` — `ocrBusinessDocument(documentUrl)` 함수 추가
  - FE: MSW mock 핸들러 추가
- Out:
  - 국세청 진위확인 API 호출 (`POST /partner/business-documents/verify`) — 별도 문서
  - `VerificationStatus`, `BusinessState` enum 신설 — 진위확인 문서 소관 (같은 마이그레이션에 묶일 수 있으나 scope는 해당 문서)
  - OCR 결과를 `BusinessDocument` DB에 저장하는 로직 — 공방 등록 제출(`POST /stores`) 시점에 이미 처리됨(변경 불필요)
  - 이미지 압축·리사이즈 후처리 (BullMQ) — 사업자등록증은 원본 유지
  - 관리자 OCR 결과 조회/재파싱 UI

## Plan

### BE

1. **Google Cloud Vision 모듈 생성**
   - `apps/api/src/common/vision/vision.service.ts` 신설
   - `@google-cloud/vision` 패키지 설치 (`apps/api`)
   - `createApiEnv()`에 `GOOGLE_VISION_API_KEY` (또는 credentials JSON path) 추가
   - `VisionService.detectText(imageBuffer: Buffer): Promise<string>` 메서드 구현

2. **파싱 유틸 작성**
   - `apps/api/src/modules/store/application/ocr/business-document-parser.ts`
   - 입력: 전체 텍스트 문자열
   - 출력: `{ businessNumber, ownerName, businessName, businessAddress, startDate }` (미추출 필드 `null`)
   - 정규식 단위 테스트 작성 (실제 사업자등록증 텍스트 샘플 기반)

3. **ocrStatus·ocrRaw 제거 + 마이그레이션** (코드리뷰 후 방향 전환)
   - `apps/api/prisma/schema.prisma`: `ocrStatus`·`ocrRaw` 컬럼 + `OcrStatus` enum 제거
   - `packages/shared/src/enums/ocr-status.ts` 파일 삭제 + 전 계약에서 `ocrStatus` 필드 제거
   - 마이그레이션 `20260610100000_drop_ocr_columns`: `DROP COLUMN ocr_status, ocr_raw` + `DROP TYPE "OcrStatus"`
   - (이전 `..._ocr_status_done_and_start_date` rename 마이그레이션은 이미 적용됨 → 수정하지 않고 별도 drop 마이그레이션 추가)

4. **`startDate` 컬럼 추가 마이그레이션**
   - `BusinessDocument.startDate String? @map("start_date") @db.VarChar(8)` 추가
   - 기존 마이그레이션과 묶어서 1개 마이그레이션 파일로 처리

5. **OCR 유스케이스 작성**
   - `apps/api/src/modules/store/application/use-cases/ocr-business-document.use-case.ts`
   - 의존: `S3Service`, `VisionService`
   - documentUrl 보안 검증 → HeadObject(존재·크기·타입) → S3 GetObject → Vision 호출 → 파싱 → 응답 반환
   - 원본 텍스트는 저장하지 않는다(prefill 전용). 감사 필요 시 verify plan 소관.

6. **컨트롤러 라우트 추가**
   - `store.controller.ts`에 `POST /partner/business-documents/ocr` 라우트 추가
   - `AuthGuard`만 적용 (PartnerGuard 없음 — 공방 등록 전 단계)
   - Zod 파이프 바인딩 (`businessDocumentOcrRequestSchema`)

7. **Shared contract 추가**
   - `packages/shared/src/contracts/store-registration.ts`에 `businessDocumentOcrRequestSchema`, `businessDocumentOcrResultSchema` 추가
   - `createStoreBusinessDocumentSchema`에 `startDate: z.string().optional().nullable()` 추가

### FE

8. **폼 타입 확장**
   - `model/types.ts` `StudioRegistrationForm.business`에 `startDate: string` 추가 (초기값 `''`)
   - `model/studio.ts`(zustand store) `patchBusiness` 액션에 `startDate` 반영

9. **API + mutation 추가**
   - `api.ts`에 `ocrBusinessDocument(documentUrl: string)` 추가 (`POST /partner/business-documents/ocr`)
   - `queries.ts`에 `useOcrBusinessDocument()` mutation 추가

10. **BusinessStep.tsx 수정**
    - 이미지 업로드 성공 후 `useOcrBusinessDocument` 호출
    - 응답 필드를 `patchBusiness`로 prefill (null 필드는 skip — 기존 값 유지)
    - 개업일자 `TextInput` 추가 (label: "개업일자", placeholder: "예) 20190315", `inputMode: "numeric"`)
    - OCR 진행 중 스피너 표시 (이미지 업로드 완료 ~ OCR 응답 사이)
    - OCR 전체 실패(5xx) 시 토스트: "사업자등록증 자동입력에 실패했어요. 직접 입력해 주세요."
    - OCR 성공이지만 일부 필드 null 시: 추출된 필드만 prefill, 추출 실패 필드는 빈 칸 유지 (별도 토스트 없음)

11. **MSW mock 핸들러 추가**
    - `apps/web/src/mocks/handlers/` 적절한 파일에 `POST /api/v1/partner/business-documents/ocr` 추가

12. **`POST /stores` 바디에 startDate 포함**
    - `api.ts` `toCreateStudioBody` 함수에 `businessDocument.startDate` 필드 추가 (optional)
    - BE `CreateBusinessDocumentDto`에 `startDate` 필드 추가 및 `BusinessDocument` 생성 시 저장
    - ⚠️ 이 `POST /stores` 생성 유스케이스(BusinessDocument 생성 구간)는 **진위확인 plan도 수정**한다(제출 시 국세청 재검증 후 `verificationStatus` 등 저장 — `business-document-verify.md` BE 6번). 두 plan이 같은 파일을 건드리므로 구현 순서·머지 시 충돌 주의. startDate 저장(OCR) + 진위확인 결과 저장(verify)을 한 번의 BusinessDocument 생성에 합친다.

### 의존관계 메모

- `BusinessDocument.startDate`는 진위확인(`POST /partner/business-documents/verify`)의 필수 입력이다. OCR 문서에서 컬럼·UI를 신설하고, 진위확인 문서는 이 필드를 읽어 국세청 API에 전달한다.

## Out (단계별 완료물)

- API (완료):
  - `packages/shared/src/enums/ocr-status.ts` — `VERIFIED` 제거, `DONE` 추가
  - `packages/shared/src/contracts/store-registration.ts` — `businessDocumentOcrRequestSchema`, `businessDocumentOcrResultSchema`, `BusinessDocumentOcrRequest`, `BusinessDocumentOcrResult` 추가; `createStoreBusinessDocumentSchema`에 `startDate` optional 추가
  - `packages/shared/src/contracts/store-edit.ts` — `OcrStatus.VERIFIED` → `OcrStatus.DONE` 예시값 수정
  - `apps/api/prisma/schema.prisma` — `OcrStatus.VERIFIED` → `DONE`, `BusinessDocument.startDate` 컬럼 추가
  - `apps/api/prisma/migrations/20260610090000_ocr_status_done_and_start_date/migration.sql` — 마이그레이션 파일 (실행 미완료 — DB 연결 후 `prisma migrate deploy` 필요)
  - `apps/api/src/common/vision/vision.service.ts` — `VisionService.detectText(imageBuffer, mimeType?)`
  - `apps/api/src/common/vision/vision.module.ts` — Global VisionModule
  - `apps/api/src/app.module.ts` — `VisionModule` 등록
  - `apps/api/src/common/s3/s3.service.ts` — `getObjectBuffer(key)` 메서드 추가
  - `apps/api/src/modules/store/application/ocr/business-document-parser.ts` — 정규식 파싱 유틸
  - `apps/api/src/modules/store/application/ocr/business-document-parser.spec.ts` — 단위 테스트 17개 (전체 통과)
  - `apps/api/src/modules/store/application/use-cases/ocr-business-document.use-case.ts` — OCR 유스케이스 (3단계 보안검증 + S3 GetObject + Vision + 파싱)
  - `apps/api/src/modules/store/presentation/dto/ocr-business-document.dto.ts` — 요청/응답 DTO
  - `apps/api/src/modules/store/presentation/controllers/store.controller.ts` — `POST /partner/business-documents/ocr` 라우트 추가
  - `apps/api/src/modules/store/store.module.ts` — `OcrBusinessDocumentUseCase` provider 등록
  - `apps/api/src/modules/store/domain/repositories/store-writers.ts` — `CreateStoreInput.businessDocument.startDate` 추가
  - `apps/api/src/modules/store/infrastructure/persistence/prisma-create-store.command.ts` — `startDate` 저장
- UI: 미착수 (FE 8~11번)
- 연동: 미착수 (FE 9~12번)

## Risks

- Google Cloud Vision 비용: 사업자등록증 1장 = 1 unit. 월 1,000건 무료 초과 시 과금. 동일 이미지 재호출은 Redis 결과 캐시(TTL 600s)로 Vision 재호출을 막아 비용·부하를 줄였다. 단 **서로 다른 이미지를 빠르게 반복 업로드+OCR하는 스팸**에는 캐시가 무력 — 사용자별 호출 제한(throttle)은 미적용(후속 고려).
- PDF 처리: Vision API는 PDF를 직접 처리하지 않음. `business-documents/` presigned 업로드는 PDF 허용(`application/pdf`). PDF인 경우 Vision 호출 전 첫 페이지 이미지 변환 필요(`pdf-to-image` 또는 Vision PDF feature). 미처리 시 PDF 업로드 케이스에서 OCR 동작 안 함.
- 파싱 정확도: 이미지 품질·레이아웃 변형 시 정규식 파싱 실패 가능. 실패 시 해당 필드 null + 수동 입력 유도로 graceful degradation.
- 마이그레이션 `OcrStatus.VERIFIED → DONE`: 기존 `VERIFIED` 데이터가 있으면 변환 필요. 없으면 단순 enum rename.

## Validation

- Tests:
  - `business-document-parser.spec.ts`: 정규식 파싱 단위 테스트 (사업자번호, 개업일자 정규화, 키워드 추출)
  - `ocr-business-document.use-case.spec.ts`: S3Service, VisionService mock 기반 유스케이스 테스트 (IDOR 차단, objectExists false 케이스)
- Manual checks:
  - 실제 사업자등록증 이미지로 OCR 엔드포인트 호출 → 5개 필드 prefill 확인
  - 타 userId prefix URL 전달 시 403 반환 확인
  - 존재하지 않는 key → 404 반환 확인
  - PDF 업로드 케이스 동작 확인 (OCR 성공 또는 명확한 에러 처리)
  - OCR prefill 후 사용자가 값 수정 → 수정된 값으로 POST /stores 전송 확인
- Observability:
  - Vision API 호출 실패 시 서버 로그에 에러 코드 기록
  - OCR 완료 로그는 추출 필드 수만 기록(PII 미노출). 원본 텍스트는 저장하지 않음.

## Decision Log

- 2026-06-10: OCR 엔진 Google Cloud Vision 확정 (CLOVA 탈락). 범용 텍스트 추출 후 서버 파싱.
- 2026-06-10: S3 private 유지, 서버 IAM GetObject. ACL 변경 없음.
- 2026-06-10: `AuthGuard`만 적용 (PartnerGuard 미적용). 공방 등록 시작 전 단계라 Partner 레코드 미존재 가능.
- 2026-06-10: OCR prefill + 사용자 수정 허용(B안). 자동완성 후 잠금(A안) 탈락 — 오탐 리스크.
- 2026-06-10: `OcrStatus.DONE` 신설 (기존 `VERIFIED` 제거). OCR-전용 상태와 진위확인 상태를 enum 분리.
- 2026-06-10: 기능명세 DB 매칭 없음 확인 → 확정 설계 메모리가 SSOT임을 plan에 명시.
- 2026-06-10: 코드리뷰 반영 — (1) PDF는 다운로드 전 415 반려(500→415), (2) 10MB 초과 413 차단(무제한 버퍼링 방지), (3) Vision 503 자격증명 오류는 use-case에서 500으로 덮지 않고 그대로 전달. 업로드 단계 fileType 화이트리스트는 미적용 유지(별도 결정).
- 2026-06-10: `BusinessDocument.ocrStatus` 제출 시 확정 방식 결정 — **제출(`POST /stores`) 시 서버가 verify plan의 제출 처리에서 확정**(클라이언트 전달은 스푸핑 위험으로 탈락). OCR 엔드포인트는 prefill 전용이라 상태를 저장하지 않으며, 생성 시점 ocrStatus 저장은 `business-document-verify.md` 소관. 그 전까지 생성된 row의 ocrStatus는 null.
- 2026-06-10: **`ocrStatus` 컬럼·`OcrStatus` enum 전면 제거**로 최종 결정(위 결정 대체). 근거: 문서 신뢰 상태는 `verificationStatus`(진위확인)로 일원화하고, OCR은 폼 prefill 보조라 별도 상태 필드가 불필요(항상 null로 남는 중복 신호). 처리 성공/실패는 응답 HTTP status로 표현. store-detail/edit 응답 계약(완료 기능)·apispec·web mock·OCR 응답 스키마에서 `ocrStatus` 제거. 이미 적용된 rename 마이그레이션은 보존하고 별도 drop 마이그레이션 추가.
- 2026-06-10: **`ocrRaw` 컬럼도 제거**로 결정(ocrStatus와 동일 원칙). 근거: `ocrRaw`는 현재 읽기·쓰기 모두 없는 죽은 컬럼이고, "OCR 원본" 보관은 ocrStatus와 같은 저장-시점 모호성을 가진다. 명확히 채울 수 있는 건 제출 시 국세청 원본뿐이며, 그건 `ocr`이 아니라 진위확인 데이터다. 따라서 감사 원본 컬럼은 **verify plan이 채우는 시점에 제대로 된 이름(예: `nts_raw`)으로 직접 추가**한다. drop 마이그레이션을 `20260610100000_drop_ocr_columns`로 확장(`ocr_status`+`ocr_raw`+`OcrStatus`). 영향: api 311 tests·shared/api/web tsc 통과. ▶ **verify plan(`business-document-verify.md`) 수정 필요**: `ocrRaw.nts` 참조를 신규 컬럼으로 교체.
- 2026-06-10: 코드리뷰 2차 반영 — (1) **PDF 업로드 차단**: images `fileType`을 jpeg/png enum으로 제한 + FE 사전 차단(`isBusinessDocumentFileType`). (2) **startDate 표시·재수정**: store-detail 응답(`storeBusinessDocumentSchema`)·PATCH 수정 계약(`businessDocumentUpdateRequestSchema`)·reader·persistence에 `startDate` 추가(반려 후 수정 가능). (3) **개업일자 실날짜 검증**: `businessStartDateSchema`(fields.ts) — 8자리 + 실제 달력 날짜 refine(20261399·20260230 거부). (4) **TOCTOU 방어**: `getObjectBuffer(key, maxBytes)` 스트리밍 중 상한 초과 시 중단→413.
- 2026-06-10: **OCR rate limit = Redis 결과 캐시(dedup)로 결정**. `(documentKey)`별 OCR 결과를 Redis에 TTL 600s 캐싱 — 동일 이미지 재호출 시 Vision 미호출. OCR은 이미지별 결정적이고 key에 userId 포함이라 안전. Redis 장애는 best-effort 무시(OCR 정상 수행). 사용자별 호출 횟수 throttle(@nestjs/throttler 등)은 신규 의존성이라 미도입(후속).
- 2026-06-10: 코드리뷰 3차 반영 — (1) **저장 시 소유권 검증(P1)**: `assertOwnedBusinessDocumentImage`(common/s3/business-document.util.ts) 공용 헬퍼 신설 — prefix 화이트리스트 + IDOR(`business-documents/{userId}/`) + 업로드 존재 + JPEG/PNG Content-Type. `POST /stores`·PATCH 사업자정보 양쪽 적용(기존엔 objectExists만 했음). OCR use-case의 인라인 검증도 이 헬퍼(`resolveOwnedBusinessDocumentKey`)로 통합. (2) **캐시 stale 방지(P2)**: HeadObject를 캐시보다 먼저 수행(삭제 객체는 404) + 캐시 키에 ETag 포함(`ocr:result:{key}:{etag}` — 동일 key 객체 교체 시 캐시 무효화). (3) **린트(P3)**: 미사용 `CDN_BASE` import 제거(헬퍼 통합으로 해소). 영향: api 323 tests·tsc·eslint(0 errors) 통과. ▷ 사용자별 throttle·동시요청 분산락(P2)은 별도 결정(cache-only 유지).
- 2026-06-10: 코드리뷰 4차 반영 — (1) **OCR 타입검증 일치(P1)**: OCR use-case가 PDF만 차단하던 것을 공용 화이트리스트(`assertBusinessDocumentContentType`)로 교체. `application/octet-stream`·Content-Type 없음 등도 Vision 전달 전 415. 저장 검증과 동일 규칙. (2) **undefined Content-Type 거절(P2)**: 화이트리스트이므로 `contentType === undefined`도 415(기존엔 통과). (3) **공용 헬퍼 테스트(P2)**: `business-document.util.spec.ts` 신설(외부 URL/IDOR/미존재/타입 미허용/undefined 등). 영향: api 339 tests·eslint(0 errors) 통과.
- 2026-06-10: **HEIC 미허용 확정** — 리뷰어가 HEIC 허용을 요청했으나, **Google Vision은 HEIC를 지원하지 않는다**(JPEG/PNG/GIF/BMP/WEBP/RAW/ICO/PDF/TIFF만). 화이트리스트에 HEIC를 넣으면 "업로드 OK·OCR 실패"의 PDF와 동일한 불일치가 재발하므로 **추가하지 않기로 결정**(사용자 확인). 아이폰 HEIC는 추후 필요 시 FE 변환(heic2any) 또는 서버 변환(sharp/heic-convert)으로 대응 — 단순 화이트리스트 확장은 금지. `business-document.util.spec.ts`가 `image/heic → 415`로 이 결정을 고정.

## Outcome

- Status: 미착수
- Follow-up: 진위확인 plan(`business-document-verify.md`) 작성 후 같은 마이그레이션 파일에 `VerificationStatus`, `BusinessState` enum 추가 병합 가능.
