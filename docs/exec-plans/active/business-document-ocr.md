# Feature Plan: 사업자등록증 OCR 필드 자동채움

## Summary

- Goal: 사업자등록증 이미지 업로드 후 Google Cloud Vision OCR로 필드(사업자번호·상호명·대표자명·사업장주소·개업일자)를 추출해 공방등록 1단계 폼에 자동채움한다. OCR 서버 전용 호출, S3 private 유지, documentUrl IDOR 차단.
- Owner:
- Date: 2026-06-10

## Status

- [ ] API 구현
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

// enum 변경: OcrStatus
// BEFORE: PENDING | VERIFIED | FAILED
// AFTER:  PENDING | DONE     | FAILED
// 마이그레이션: 기존 VERIFIED → DONE rename
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
  ocrStatus:      z.nativeEnum(OcrStatus), // DONE | FAILED
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
  8. `ocrRaw`에 Vision 원본 응답 저장(DB 저장은 BusinessDocument 생성 시점이 아니므로 이 단계는 응답에만 포함)
  9. 응답 반환 (`ocrStatus: DONE` — 텍스트 추출 성공, 개별 필드 null은 파싱 실패)
- 응답 200:
  ```json
  {
    "data": {
      "businessNumber": "123-45-67890",
      "ownerName": "홍길동",
      "businessName": "흙담공방",
      "businessAddress": "서울특별시 성동구 둑섬로 273",
      "startDate": "20190315",
      "ocrStatus": "DONE"
    }
  }
  ```
- 응답 실패:
  - `400 INVALID_DOCUMENT_URL` — prefix 화이트리스트 불일치
  - `403 FORBIDDEN` — 소유권 대조 실패(타 userId prefix)
  - `404 DOCUMENT_NOT_FOUND` — objectExists false
  - `500 OCR_FAILED` — Vision API 장애 (전체 호출 실패 시. 파싱 실패는 200 + 필드 null)

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
      ocrStatus: 'DONE',
    },
  })
)
```

## Scope

- In:
  - BE: `POST /partner/business-documents/ocr` 엔드포인트 신설
  - BE: Google Cloud Vision 클라이언트 모듈 (`common/vision/` 또는 `store` 내 infra service)
  - BE: `documentUrl` 3단계 보안 검증 (prefix 화이트리스트, IDOR, objectExists)
  - BE: Prisma 스키마 — `BusinessDocument.startDate` 컬럼 추가, `OcrStatus` enum `VERIFIED→DONE` rename
  - BE: 마이그레이션 파일 생성 (기존 `VERIFIED` 데이터 → `DONE` 변환 포함)
  - Shared: `businessDocumentOcrRequestSchema`, `businessDocumentOcrResultSchema` 추가
  - Shared: `OcrStatus` enum `DONE` 추가 (기존 `VERIFIED` 제거 또는 deprecated 처리)
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

3. **OcrStatus enum 변경 + 마이그레이션**
   - `apps/api/prisma/schema.prisma`: `OcrStatus` — `VERIFIED` → `DONE`
   - `packages/shared/src/enums/ocr-status.ts`: `DONE` 추가, `VERIFIED` 제거
   - `prisma migrate dev` 실행, 기존 `VERIFIED` 데이터 → `DONE` UPDATE SQL 포함

4. **`startDate` 컬럼 추가 마이그레이션**
   - `BusinessDocument.startDate String? @map("start_date") @db.VarChar(8)` 추가
   - 기존 마이그레이션과 묶어서 1개 마이그레이션 파일로 처리

5. **OCR 유스케이스 작성**
   - `apps/api/src/modules/store/application/use-cases/ocr-business-document.use-case.ts`
   - 의존: `S3Service`, `VisionService`
   - documentUrl 3단계 보안 검증 → S3 GetObject → Vision 호출 → 파싱 → 응답 반환
   - `ocrRaw`는 응답 DTO에 포함하지 않음(서버 내부 보관용 — 향후 `BusinessDocument` 저장 시 사용)

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

- API: `POST /partner/business-documents/ocr` 엔드포인트, `VisionService`, `BusinessDocumentParser`, OcrStatus 마이그레이션, startDate 마이그레이션
- UI: `BusinessStep.tsx` 개업일자 필드 추가 + OCR prefill 로직
- 연동: 이미지 업로드 완료 시 OCR 자동 호출 → 폼 5개 필드 prefill 동작 확인

## Risks

- Google Cloud Vision 비용: 사업자등록증 1장 = 1 unit. 월 1,000건 무료 초과 시 과금. 스팸 업로드 방지 고려(현재 rate limit 없음).
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
  - `ocrRaw` 컬럼에 Vision 원본 텍스트 보관 (감사·재파싱 대비)

## Decision Log

- 2026-06-10: OCR 엔진 Google Cloud Vision 확정 (CLOVA 탈락). 범용 텍스트 추출 후 서버 파싱.
- 2026-06-10: S3 private 유지, 서버 IAM GetObject. ACL 변경 없음.
- 2026-06-10: `AuthGuard`만 적용 (PartnerGuard 미적용). 공방 등록 시작 전 단계라 Partner 레코드 미존재 가능.
- 2026-06-10: OCR prefill + 사용자 수정 허용(B안). 자동완성 후 잠금(A안) 탈락 — 오탐 리스크.
- 2026-06-10: `OcrStatus.DONE` 신설 (기존 `VERIFIED` 제거). OCR-전용 상태와 진위확인 상태를 enum 분리.
- 2026-06-10: 기능명세 DB 매칭 없음 확인 → 확정 설계 메모리가 SSOT임을 plan에 명시.

## Outcome

- Status: 미착수
- Follow-up: 진위확인 plan(`business-document-verify.md`) 작성 후 같은 마이그레이션 파일에 `VerificationStatus`, `BusinessState` enum 추가 병합 가능.
