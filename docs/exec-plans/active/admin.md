# Feature Plan: 어드민 (Admin)

## Summary

- Goal: 내부 운영자가 어드민 전용 인증 파이프라인으로 로그인하고, 파트너가 제출한 공방을 검수(승인/반려)하며 PUBLISHED 공방을 노출 중단/재개하는 운영 콘솔을 구현한다. 화면 A-0(공통 가드)~A-3(공방 검수 상세)를 전부 포함한다.
- Owner:
- Date: 2026-06-11

## Status

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): `docs/requirements.md` — `admin` 도메인(p.11), `store` 5. 공방 검수(p.19), `partner` 3. 운영자 강제 정지(p.14)
- 기능명세: 사용자 확정본 직접 제공(Notion DB 별도 select 불필요)
  - A-0 공통 가드, A-1 로그인, A-2 공방 검수 목록, A-3 공방 검수 상세
- API명세: Notion API명세 DB select 완료
  - `POST /admin/auth/login` — 어드민 로그인
  - `GET /admin/stores` — 공방 심사 목록
  - `GET /admin/stores/:storeId` — 공방 심사 상세 (**Notion 미등록**, 코드베이스+기능명세 기반 설계)
  - `PATCH /admin/stores/:storeId/approve` — 공방 심사 승인
  - `PATCH /admin/stores/:storeId/reject` — 공방 심사 반려
  - `PATCH /admin/stores/:storeId/suspend` — 공방 노출 중단
  - `PATCH /admin/stores/:storeId/restore` — 공방 노출 재개
- Relevant design docs:
  - `apps/api/prisma/schema.prisma` — `Admin` 모델(admins 테이블), `Store`/`BusinessDocument`/`Partner` 모델
  - `apps/api/src/modules/admin/` — 디렉토리 구조만 존재(.gitkeep), 구현 없음
  - `apps/api/src/modules/timeslot/presentation/controllers/timeslot.controller.ts` — `POST /partner/stores/:storeId/time-slots/generate` (PartnerGuard 적용 중 — 승인 시 admin 호출 불가 문제)
  - `apps/api/src/common/guards/auth.guard.ts` — PassportStrategy 'jwt' 기반
  - `apps/api/src/modules/auth/infrastructure/strategies/jwt-access.strategy.ts` — User 기반 JWT 전략 패턴
  - `apps/web/src/features/auth/login/` — FE 로그인 패턴 참조 (api.ts, model/authStore.ts)
  - `packages/shared/src/contracts/auth.ts` — 기존 인증 contract 패턴
- Open decisions:
  1. **PATCH 엔드포인트 분리 방식 확정 필요**: 기능명세는 `PATCH /admin/stores/:id/status` body `{status, rejectedReason?}` 단일 엔드포인트를 명시했으나, Notion API명세는 approve/reject/suspend/restore 4개로 분리한다. 구현 전 어떤 설계를 따를지 결정 필요. **이 plan은 Notion 명세(4개 분리)를 따른다** — 각 액션이 허용 전이 상태가 다르고(PENDING→PUBLISHED vs PUBLISHED→SUSPENDED) 책임이 명확히 분리되기 때문. 기능명세의 `PATCH /admin/stores/:id/status`는 추상적 명세로 보고 실제 contract는 Notion 명세를 SSOT로 한다.
  2. **승인 시 타임슬롯 자동 생성 범위**: 기능명세에 "승인 시 타임슬롯 생성 API 호출"이 명시되어 있으나, 현재 `POST /partner/stores/:storeId/time-slots/generate`는 `PartnerGuard`가 걸려 있어 admin guard로는 직접 호출이 불가하다. 승인 BE 유스케이스 내부에서 `TimeslotGenerationService`를 직접 주입(guard 없이 도메인 서비스 레벨 호출)하는 방식으로 처리할지, 또는 생성 API를 admin도 호출 가능하도록 별도 경로를 추가할지, 또는 생성 범위(startDate~endDate)를 어드민이 지정할지 결정 필요. **현재 plan은 "승인 유스케이스 내부에서 GenerateTimeSlotsUseCase를 직접 주입해 호출"하는 방식을 기본으로 한다.** 생성 범위(startDate/endDate)는 Open decision — 아래 3번 참조.
  3. **타임슬롯 생성 범위(startDate/endDate) 결정**: 승인 시 어느 기간의 슬롯을 생성할지 명세에 없다. 예: 오늘부터 3개월 후까지 자동 계산? 어드민이 직접 범위 입력? 기본값으로 처리? 결정 필요.
  4. **`GET /admin/stores/:storeId` 상세 API 스키마**: Notion API명세에 미등록이다. 공방 정보(Store) + 사업자서류(BusinessDocument) + 파트너 정보를 합쳐 반환하는 구조로 설계했으나, 응답 필드 구성(이미지 목록 포함 여부, 편의정보 구조, 영업시간 포함 여부)에 대해 검토 필요.
  5. **어드민 refresh token 정책**: Notion API명세 로그인 응답에 `accessToken`만 포함된다. refresh token 발급 여부 및 HttpOnly Cookie 방식 동일 적용 여부 결정 필요. 현재 plan은 "어드민은 accessToken만 발급(refresh 없음), 만료 시 재로그인" 방식을 기본으로 한다.
  6. **어드민 FE 라우트 구조**: 어드민 콘솔을 Next.js `app/` 내 `(admin)/` 그룹 경로로 신설할지 별도 앱으로 분리할지 결정 필요. 현재 plan은 `apps/web/src/app/(admin)/` 그룹 경로 신설을 기본으로 한다.

## API Contract (스냅샷)

> Notion API명세 DB select 결과 + 코드베이스 기반 설계. `GET /admin/stores/:storeId`는 Notion 미등록으로 기능명세+코드베이스 기반 설계. 구현 전 사람 검토·승인 후 확정.

### 데이터모델

**`admins` 테이블 (기존 Prisma Admin 모델)**

```prisma
model Admin {
  id        String    @id @default(uuid()) @db.Uuid
  email     String    @unique @db.VarChar(255)
  password  String    @db.VarChar(255)   // bcrypt 해시
  name      String    @db.VarChar(100)
  createdAt DateTime? @map("created_at") @db.Timestamptz(6)

  @@map("admins")
}
```

> Admin은 User 테이블과 완전히 독립된 별도 테이블. User.role 방식이 아닌 별도 인증 파이프라인. `UserRole.ADMIN` enum은 현재 사용하지 않음.

**`stores` 관련 필드 (검수 관련)**

```prisma
// Store 모델 핵심 필드 (schema.prisma 기존)
status             StoreStatus   // DRAFT | PENDING | PUBLISHED | REJECTED | SUSPENDED
rejectedReason     String?       @map("rejected_reason")   // 반려 사유
suspendedReason    String?       @map("suspended_reason")  // 노출중단 사유
publishedAt        DateTime?     @map("published_at")
```

> `StoreStatus.REJECTED`: `schema.prisma`와 `packages/shared/src/enums/store-status.ts` 모두 `REJECTED` 값이 이미 존재. requirements.md의 "반려 시 DRAFT 전이" 명세와 다르며, Notion API명세·기능명세가 모두 `REJECTED`를 사용하므로 **`REJECTED`를 사용**한다.

**`business_documents` 관련 필드 (서류 검수)**

```prisma
// BusinessDocument 모델 핵심 필드 (schema.prisma 기존 + business-document-verify plan 추가분)
ownerName            String         @map("owner_name")
businessName         String         @map("business_name")
businessNumber       String         @map("business_number")
businessAddress      String         @map("business_address")
startDate            String?        @map("start_date")        // YYYYMMDD
documentUrl          String?        @map("document_url")       // 원본 이미지 S3 URL
verificationStatus   VerificationStatus @default(PENDING)      // PENDING|VERIFIED|MISMATCH|ERROR
verifiedAt           DateTime?      @map("verified_at")        // 진위확인 통과 시각
businessState        BusinessState? @map("business_state")     // ACTIVE|CLOSED|SUSPENDED
```

**JWT 페이로드 (admin 전용)**

```typescript
// AdminJwtPayload — 어드민 JWT 서명. 별도 시크릿(JWT_ADMIN_SECRET) 사용.
{
  sub: string;       // adminId (admins.id)
  type: 'admin';     // User JWT와 구분 (User는 type 없음)
}
```

**Zod 스키마 위치 (SSOT)**

```
packages/shared/src/contracts/admin.ts   // 신규 파일 (아래 스키마 모두 여기)
```

---

### 엔드포인트 1: `POST /admin/auth/login`

- 인증: 없음 (공개)
- Zod: `adminLoginRequestSchema`, `adminLoginResponseSchema`

Request body:
```json
{
  "email": "admin@todam.app",
  "password": "AdminPassword1!"
}
```

Response `200 OK`:
```json
{
  "statusCode": 200,
  "message": "어드민 로그인이 완료되었습니다.",
  "data": {
    "admin": {
      "id": "admin-uuid-001",
      "email": "admin@todam.app",
      "name": "관리자"
    },
    "accessToken": "eyJ..."
  }
}
```

에러:
- `401 INVALID_CREDENTIALS` — 이메일 또는 비밀번호 불일치
- `500 INTERNAL_SERVER_ERROR`

```typescript
// packages/shared/src/contracts/admin.ts
export const adminLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();
export type AdminLoginRequest = z.infer<typeof adminLoginRequestSchema>;

export const adminInfoSchema = z.object({
  id: z.string().meta({ example: 'admin-uuid-001' }),
  email: z.string().meta({ example: 'admin@todam.app' }),
  name: z.string().meta({ example: '관리자' }),
});
export type AdminInfo = z.infer<typeof adminInfoSchema>;

export const adminLoginResponseSchema = z.object({
  admin: adminInfoSchema,
  accessToken: z.string(),
});
export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;
```

---

### 엔드포인트 2: `GET /admin/stores`

- 인증: `AdminGuard` (admin JWT)
- Query: `status` (StoreStatus, default: PENDING), `page` (number, default: 1), `limit` (number, default: 10, max: 100), `q` (string, optional — 공방명·사업자명 검색)
- Zod: `adminStoreListQuerySchema`, `adminStoreListResponseSchema`

Response `200 OK`:
```json
{
  "data": {
    "stores": [
      {
        "storeId": "store-uuid-001",
        "name": "성수 토담 도예공방",
        "phone": "02-1234-5678",
        "address": "서울특별시 성동구 성수이로 12길 34",
        "regionSido": "서울",
        "regionSigungu": "성동구",
        "status": "PENDING",
        "createdAt": "2026-05-26T09:00:00.000Z",
        "updatedAt": "2026-05-26T09:00:00.000Z",
        "partner": {
          "partnerId": "partner-uuid-101",
          "nickname": "김파트너"
        },
        "businessDocument": {
          "documentId": "doc-uuid-001",
          "businessName": "토담 도예",
          "businessNumber": "123-45-67890",
          "ownerName": "김파트너",
          "verificationStatus": "VERIFIED"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "limit": 10,
      "totalCount": 1,
      "totalPages": 1
    }
  }
}
```

에러:
- `400 INVALID_FILTER_PARAMETERS`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `500 INTERNAL_SERVER_ERROR`

---

### 엔드포인트 3: `GET /admin/stores/:storeId`

> Notion 미등록. 기능명세 A-3 + 코드베이스(Store, BusinessDocument, StoreImage 모델) 기반 설계.

- 인증: `AdminGuard`
- Zod: `adminStoreDetailResponseSchema`

Response `200 OK`:
```json
{
  "data": {
    "store": {
      "id": "store-uuid-001",
      "name": "성수 토담 도예공방",
      "description": "도자기 체험 공방입니다.",
      "address": "서울특별시 성동구 성수이로 12길 34",
      "regionSido": "서울",
      "regionSigungu": "성동구",
      "phone": "02-1234-5678",
      "images": [
        { "imageUrl": "https://cdn.todam.app/...", "isThumbnail": true }
      ],
      "convenienceInfo": { "parking": true, "petFriendly": false },
      "reservationIntervalMinutes": 60,
      "maxCapacityPerSlot": 10,
      "cancelDeadlineDays": 3,
      "autoConfirm": false,
      "status": "PENDING",
      "publishedAt": null,
      "rejectedReason": null,
      "createdAt": "2026-05-26T09:00:00.000Z"
    },
    "businessDocument": {
      "id": "doc-uuid-001",
      "ownerName": "홍길동",
      "businessName": "토담 도예",
      "businessNumber": "123-45-67890",
      "businessAddress": "서울특별시 성동구 성수이로 12길 34",
      "startDate": "20190315",
      "documentUrl": "https://cdn.todam.app/documents/business-license.jpg",
      "verificationStatus": "VERIFIED",
      "verifiedAt": "2026-05-26T09:05:00.000Z",
      "businessState": "ACTIVE"
    },
    "partner": {
      "id": "partner-uuid-101",
      "nickname": "홍길동",
      "email": "partner@example.com"
    }
  }
}
```

에러:
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 STORE_NOT_FOUND`
- `500 INTERNAL_SERVER_ERROR`

---

### 엔드포인트 4: `PATCH /admin/stores/:storeId/approve`

- 인증: `AdminGuard`
- Request body: 없음
- 전이: `PENDING` → `PUBLISHED` (첫 공방이면 `Partner.status = APPROVED` 동시 전이)
- 승인 후 타임슬롯 생성 (Open decision 2·3 해소 후 범위 확정)

Response `200 OK`:
```json
{
  "data": {
    "store": {
      "id": "...",
      "status": "PUBLISHED",
      "publishedAt": "2026-05-25T21:40:00.000Z"
    }
  }
}
```

에러:
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 STORE_NOT_FOUND`
- `409 INVALID_STORE_STATUS` — PENDING이 아닌 공방
- `500 INTERNAL_SERVER_ERROR`

---

### 엔드포인트 5: `PATCH /admin/stores/:storeId/reject`

- 인증: `AdminGuard`
- 전이: `PENDING` → `REJECTED`
- Zod: `adminStoreRejectRequestSchema`

Request body:
```json
{
  "rejectedReason": "사업자등록증 이미지가 불명확합니다."
}
```

Response `200 OK`:
```json
{
  "data": {
    "store": {
      "id": "...",
      "status": "REJECTED",
      "rejectedReason": "사업자등록증 이미지가 불명확합니다."
    }
  }
}
```

에러:
- `400 REJECTION_REASON_REQUIRED`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 STORE_NOT_FOUND`
- `409 ALREADY_PROCESSED` or `409 INVALID_STORE_STATUS`
- `500 INTERNAL_SERVER_ERROR`

---

### 엔드포인트 6: `PATCH /admin/stores/:storeId/suspend`

- 인증: `AdminGuard`
- 전이: `PUBLISHED` → `SUSPENDED`
- Zod: `adminStoreSuspendRequestSchema`

Request body:
```json
{
  "suspendedReason": "허위 정보 게재로 인한 노출 중단 조치입니다."
}
```

Response `200 OK`:
```json
{
  "data": {
    "store": {
      "id": "...",
      "status": "SUSPENDED",
      "suspendedReason": "허위 정보 게재로 인한 노출 중단 조치입니다."
    }
  }
}
```

에러:
- `409 INVALID_STORE_STATUS` — PUBLISHED가 아닌 공방
- `500 INTERNAL_SERVER_ERROR`

---

### 엔드포인트 7: `PATCH /admin/stores/:storeId/restore`

- 인증: `AdminGuard`
- 전이: `SUSPENDED` → `PUBLISHED`
- Request body: 없음

Response `200 OK`:
```json
{
  "data": {
    "store": {
      "id": "...",
      "status": "PUBLISHED",
      "updatedAt": "2026-05-25T21:55:00.000Z"
    }
  }
}
```

에러:
- `409 INVALID_STORE_STATUS` — SUSPENDED가 아닌 공방
- `500 INTERNAL_SERVER_ERROR`

---

### 공방 상태 전이 정리 (admin 작업 대상)

```
PENDING  → PUBLISHED  (approve)
PENDING  → REJECTED   (reject, rejectedReason 필수)
PUBLISHED → SUSPENDED (suspend, suspendedReason 필수)
SUSPENDED → PUBLISHED (restore)
```

> requirements.md `store` 섹션 상태 전이 명세 중 "PENDING → DRAFT (반려)"는 코드베이스(`StoreStatus.REJECTED` 존재)·Notion API명세·기능명세 모두 `REJECTED` 전이를 사용하므로 이를 따른다. requirements.md 갱신 필요.

## Scope

- In:
  - **Shared**: `packages/shared/src/contracts/admin.ts` 신규 파일 (모든 admin contract zod 스키마)
  - **BE**: `apps/api/src/modules/admin/` 모듈 전체 구현
    - `AdminGuard` (별도 JWT 전략 `jwt-admin`)
    - `POST /admin/auth/login` — AdminLoginUseCase
    - `GET /admin/stores` — ListAdminStoresUseCase (offset 페이지네이션, q 필터)
    - `GET /admin/stores/:storeId` — GetAdminStoreDetailUseCase
    - `PATCH /admin/stores/:storeId/approve` — ApproveStoreUseCase (Partner 동시 전이 포함)
    - `PATCH /admin/stores/:storeId/reject` — RejectStoreUseCase
    - `PATCH /admin/stores/:storeId/suspend` — SuspendStoreUseCase
    - `PATCH /admin/stores/:storeId/restore` — RestoreStoreUseCase
    - Prisma 변경 없음 (Admin, Store, BusinessDocument 모델 기존 사용)
    - `JWT_ADMIN_SECRET` env 추가 (`packages/config/src/index.ts` + `apps/api/.env.example`)
  - **FE**: `apps/web/src/app/(admin)/` 경로 그룹 신설
    - `/admin/login` — A-1 로그인 화면
    - `/admin/stores` — A-2 공방 검수 목록
    - `/admin/stores/[storeId]` — A-3 공방 검수 상세
    - `apps/web/src/features/admin/` feature 디렉토리
      - `auth/` — adminAuthStore (accessToken 메모리 보관), api.ts
      - `store-review/` — api.ts, queries.ts, 목록/상세 UI 컴포넌트
    - A-0 라우트 가드: middleware 또는 layout-level redirect
  - **FE MSW mock**: `apps/web/src/mocks/handlers/admin.ts` 신규

- Out:
  - Partner 강제 정지 (`PATCH /admin/partners/:partnerId/suspend`) — Notion API명세에 존재하나 이번 범위 외. 별도 plan.
  - 공방 노출 재개 시 알림 발송 — notification 도메인 연동은 별도 백로그.
  - 어드민 계정 생성/관리 UI — 운영 내부 처리.
  - 어드민 refresh token — Open decision 5에 따라 이번 범위 외.

## Plan

### Phase 0: Shared contract 파일 생성

1. `packages/shared/src/contracts/admin.ts` 신규 생성
   - `adminLoginRequestSchema` / `AdminLoginRequest`
   - `adminLoginResponseSchema` / `AdminLoginResponse`
   - `adminStoreListQuerySchema` / `AdminStoreListQuery`
   - `adminStoreListItemSchema` / `AdminStoreListItem`
   - `adminStoreListResponseSchema` / `AdminStoreListResponse`
   - `adminStoreDetailResponseSchema` / `AdminStoreDetailResponse`
   - `adminStoreRejectRequestSchema` / `AdminStoreRejectRequest`
   - `adminStoreSuspendRequestSchema` / `AdminStoreSuspendRequest`
2. `packages/shared/src/index.ts` (또는 `contracts/index.ts`) re-export 추가

### Phase 1: BE — 어드민 인증 파이프라인

3. **env 추가**
   - `packages/config/src/index.ts` `apiSchema`에 `JWT_ADMIN_SECRET: z.string()` 추가
   - `apps/api/.env.example`에 `JWT_ADMIN_SECRET=` 추가

4. **JWT 전략 신설 (`jwt-admin`)**
   - `apps/api/src/modules/admin/infrastructure/strategies/jwt-admin.strategy.ts`
   - `admins` 테이블 조회. payload: `{ sub: adminId, type: 'admin' }`. 별도 secret.

5. **AdminGuard 신설**
   - `apps/api/src/modules/admin/presentation/guards/admin.guard.ts` 또는 `common/guards/admin.guard.ts`
   - `PassportAuthGuard('jwt-admin')` 래핑

6. **AdminLoginUseCase**
   - `apps/api/src/modules/admin/application/use-cases/admin-login.use-case.ts`
   - `admins` 테이블 이메일 조회 → bcrypt 비교 → admin JWT 서명 → 응답 반환
   - refresh token 미발급 (Open decision 5)

7. **AdminController (auth 라우트)**
   - `apps/api/src/modules/admin/presentation/controllers/admin.controller.ts`
   - `POST /admin/auth/login`

8. **admin.module.ts 등록**

### Phase 2: BE — 공방 검수 API

9. **ListAdminStoresUseCase**
   - offset 페이지네이션 (page/limit)
   - `status` 필터 (기본 PENDING), `q` 검색 (Store.name, BusinessDocument.businessName)
   - Store + BusinessDocument + Partner(User.nickname, User.email) join

10. **GetAdminStoreDetailUseCase**
    - Store + StoreImage + BusinessDocument + Partner(User) 조회
    - convenienceInfo, operatingHours 포함 여부 확인 (Open decision 4)

11. **ApproveStoreUseCase**
    - PENDING 검증 → `Store.status = PUBLISHED`, `publishedAt = now()`
    - **첫 공방 판단 = `Partner.status === PENDING`** (공방 개수 카운트 X). PENDING이면 이번이 첫 승인 → `Partner.status = APPROVED`, `approvedAt = now()` 동시 전이. 이미 APPROVED면 Store만 PUBLISHED로 전이(파트너 상태 유지).
    - 타임슬롯 생성 (Open decision 2·3 해소 후 구현)

12. **RejectStoreUseCase**
    - PENDING 검증 → `Store.status = REJECTED`, `rejectedReason` 저장
    - `Partner.status` 유지 (변경 없음)

13. **SuspendStoreUseCase**
    - PUBLISHED 검증 → `Store.status = SUSPENDED`, `suspendedReason` 저장

14. **RestoreStoreUseCase**
    - SUSPENDED 검증 → `Store.status = PUBLISHED`, `suspendedReason = null`

15. **AdminController에 공방 검수 라우트 추가**
    - `GET /admin/stores`
    - `GET /admin/stores/:storeId`
    - `PATCH /admin/stores/:storeId/approve`
    - `PATCH /admin/stores/:storeId/reject`
    - `PATCH /admin/stores/:storeId/suspend`
    - `PATCH /admin/stores/:storeId/restore`
    - 모두 `@UseGuards(AdminGuard)` 적용

16. **api-routes.snapshot.spec.ts 갱신**

### Phase 3: FE — 어드민 라우트·인증

17. **어드민 전용 라우트 그룹 신설**
    - `apps/web/src/app/(admin)/layout.tsx` — A-0 라우트 가드 적용 (adminAuthStore 미인증 시 `/admin/login` 리다이렉트)
    - `apps/web/src/app/(admin)/admin/login/page.tsx` — A-1

18. **adminAuthStore**
    - `apps/web/src/features/admin/auth/model/adminAuthStore.ts`
    - `state: 'AUTHENTICATED' | 'UNAUTHENTICATED'`, `accessToken`, `admin` (id/email/name)
    - localStorage 보관 (기존 userAuthStore와 동일 패턴)
    - 401 인터셉터 → `clearAuth()` + `/admin/login` 리다이렉트

19. **admin API 클라이언트**
    - `apps/web/src/features/admin/auth/api.ts` — `adminLogin()`
    - `apps/web/src/shared/api/adminApiFetch.ts` (또는 기존 clientApiFetch에 adminToken getter 오버로드) — admin accessToken 자동 주입

### Phase 4: FE — A-1 로그인 화면

20. **LoginForm**
    - `apps/web/src/features/admin/auth/ui/AdminLoginForm.tsx`
    - 이메일/비밀번호 입력, 로그인 버튼
    - 성공 → `adminAuthStore.setAuth()` → `/admin/stores` 이동
    - 자격 오류 토스트: "이메일 또는 비밀번호가 올바르지 않습니다."
    - 권한 없음(403 FORBIDDEN) 토스트: "어드민 계정이 아닙니다." (일반/파트너 계정으로 admin API 호출 시)

### Phase 5: FE — A-2 공방 검수 목록

21. **AdminStoreListPage**
    - `apps/web/src/app/(admin)/admin/stores/page.tsx`
    - 기본 status=PENDING, 페이지네이션 UI
    - 필터: 상태 탭 (PENDING / PUBLISHED / REJECTED), 검색 입력 (q)
    - 빈 상태: "검수 대기 공방 없음" (status=PENDING) / 각 상태별 빈 메시지
    - 행 클릭 → `/admin/stores/:storeId`

22. **adminStoreList api/queries**
    - `apps/web/src/features/admin/store-review/api.ts` — `getAdminStores()`
    - `apps/web/src/features/admin/store-review/queries.ts` — `useAdminStores(params)`

### Phase 6: FE — A-3 공방 검수 상세

23. **AdminStoreDetailPage**
    - `apps/web/src/app/(admin)/admin/stores/[storeId]/page.tsx`
    - 공방 정보 섹션: name, description, address+지역, phone, 이미지(썸네일 포함), 편의정보, 예약설정
    - 사업자 서류 섹션: ownerName, businessName, businessNumber, businessAddress, startDate, documentUrl("원본 보기" 링크), verifiedAt(진위확인 여부 뱃지)
    - 액션 버튼: "승인" / "반려" (PENDING 상태에서만 표시)
    - "노출 중단" (PUBLISHED 상태에서만 표시), "노출 재개" (SUSPENDED 상태에서만 표시)
    - 반려 모달: rejectedReason 텍스트에리어 (필수), 확인 버튼
    - 노출중단 모달: suspendedReason 텍스트에리어 (필수), 확인 버튼
    - 승인 확인 모달: "승인하시겠습니까?" (파괴적 작업)
    - 처리 성공 → 목록으로 이동 + 토스트

24. **adminStoreDetail api/queries/mutations**
    - `getAdminStoreDetail(storeId)`, `useAdminStoreDetail(storeId)`
    - `approveStore(storeId)`, `useApproveStore()`
    - `rejectStore(storeId, body)`, `useRejectStore()`
    - `suspendStore(storeId, body)`, `useSuspendStore()`
    - `restoreStore(storeId)`, `useRestoreStore()`

### Phase 7: FE — MSW mock

25. **admin MSW 핸들러 추가**
    - `apps/web/src/mocks/handlers/admin.ts`
    - `POST /api/v1/admin/auth/login` — 성공/실패 케이스
    - `GET /api/v1/admin/stores` — 목록 mock
    - `GET /api/v1/admin/stores/:storeId` — 상세 mock
    - `PATCH /api/v1/admin/stores/:storeId/approve|reject|suspend|restore` — 각 결과 mock

## Out (단계별 완료물)

- API:
  - `packages/shared/src/contracts/admin.ts` — 모든 admin contract zod 스키마 SSOT
  - `apps/api/src/modules/admin/` — 모듈 전체 (guard, use-cases, controller, infrastructure)
  - `POST /admin/auth/login`, `GET /admin/stores`, `GET /admin/stores/:storeId`
  - `PATCH /admin/stores/:storeId/approve|reject|suspend|restore` (7개 엔드포인트)
  - `apps/api/src/modules/api-routes.snapshot.spec.ts` — 신규 라우트 반영

- UI:
  - `apps/web/src/app/(admin)/` 라우트 그룹 (login, stores, stores/[storeId])
  - `apps/web/src/features/admin/` feature (auth, store-review)
  - A-0 라우트 가드 (layout.tsx 레벨)
  - A-1 로그인 화면 (AdminLoginForm)
  - A-2 목록 (필터·페이지네이션 포함)
  - A-3 상세 (공방정보·서류·액션 모달)

- 연동:
  - 어드민 로그인 → JWT 발급 → 목록/상세 API 호출 동작 확인
  - 승인/반려/노출중단/재개 각 액션 동작 + 상태 뱃지 변경 확인
  - 401 만료 시 로그아웃 + 로그인 리다이렉트 확인

## Risks

- **타임슬롯 생성 범위 미결정 (Open decision 2·3)**: 승인 시 타임슬롯 자동 생성 범위가 결정되지 않으면 ApproveStoreUseCase 구현을 완결할 수 없다. Open decision 해소 전에는 "승인만 수행, 타임슬롯 생성은 별도 단계"로 구현해두고 추후 추가 가능.
- **`GET /admin/stores/:storeId` 응답 필드 구성**: Notion 미등록이라 코드베이스 기반 설계이므로 실제 어드민 검수에 필요한 필드가 빠질 수 있다. 검토 후 추가 가능.
- **AdminGuard와 기존 AuthGuard 충돌 방지**: 어드민 JWT는 별도 secret을 사용하고 `type: 'admin'` claim을 포함해야 한다. 기존 `jwt` 전략과 `jwt-admin` 전략을 명확히 분리하지 않으면 어드민 토큰으로 일반 API 접근 가능성 있음.
- **어드민 accessToken 만료 시 UX**: refresh token 없으므로 만료 시 재로그인 필요. 만료 시각(1시간)이 짧으면 작업 중 강제 로그아웃될 수 있다. 운영 환경에서 토큰 유효시간 조정 또는 refresh 추가 검토.
- **REJECTED enum 코드베이스 사용 여부**: `StoreStatus.REJECTED`가 schema.prisma와 enum에 이미 존재하나, requirements.md는 "반려 시 DRAFT 전이"를 명시. 이 plan은 코드베이스·Notion 명세 기준 `REJECTED`를 사용하므로, requirements.md 명세 갱신 필요(plan 범위 외).

## Validation

- Tests:
  - `admin-login.use-case.spec.ts` — 이메일 없음 / 비밀번호 불일치 / 성공
  - `list-admin-stores.use-case.spec.ts` — 상태 필터, q 검색, 페이지네이션
  - `approve-store.use-case.spec.ts` — PENDING 아닌 상태 409, 첫 공방 Partner 전이, 추가 공방 Partner 유지
  - `reject-store.use-case.spec.ts` — PENDING 아닌 상태 409, rejectedReason 필수
  - `suspend-store.use-case.spec.ts` — PUBLISHED 아닌 상태 409
  - `restore-store.use-case.spec.ts` — SUSPENDED 아닌 상태 409
- Manual checks:
  - 일반 User accessToken으로 `/admin/stores` 호출 → 401 or 403 확인
  - PENDING 공방 승인 → status PUBLISHED, 목록에서 제거(PENDING 필터 기준)
  - 첫 공방 승인 → Partner.status APPROVED 전이 확인
  - 반려 사유 미입력 → 400 에러, 모달에서 "입력해주세요" 표시
  - 401 만료 시 어드민 로그인 페이지로 리다이렉트 확인
  - 빈 목록 상태 UI 확인
- Observability:
  - 승인/반려/노출중단 액션 서버 로그 (storeId, adminId, action, timestamp)

## Decision Log

- 2026-06-11: **PATCH 엔드포인트 4개 분리 방식 채택**. 기능명세의 단일 PATCH 명세보다 Notion API명세의 approve/reject/suspend/restore 분리가 상태 전이 검증·에러 코드 분리에 유리. Notion 명세를 SSOT로 한다.
- 2026-06-11: **Admin 테이블 별도 파이프라인 확정**. `schema.prisma`에 `Admin` 모델(admins 테이블)이 이미 존재. `UserRole.ADMIN` enum은 사용하지 않는다.
- 2026-06-11: **StoreStatus.REJECTED 사용**. 코드베이스 enum과 Notion API명세 모두 REJECTED를 사용. requirements.md의 "반려 시 DRAFT" 명세는 구 명세로 보고 REJECTED를 따른다.
- 2026-06-11: **어드민 refresh token 미발급(이번 범위 외)**. Notion API명세 로그인 응답에 accessToken만 포함. 만료 시 재로그인.
- 2026-06-11: **첫 공방 판단 = `Partner.status === PENDING`**. 공방 검수 승인이 파트너 승인의 트리거(별도 파트너 심사 액션 없음). 파트너가 아직 PENDING이면 첫 승인으로 보고 `Partner.status = APPROVED` 동시 전이, 이미 APPROVED면 Store만 PUBLISHED. 공방 개수 카운트 대신 status 체크로 구현(requirements.md §5 "첫 공방인 경우" == 파트너 미승인 상태와 동치).
- 2026-06-11: **타임슬롯 생성 Open decision 유지**. 승인 시 타임슬롯 자동 생성 필요하나 범위(startDate/endDate) 및 PartnerGuard 우회 방법 미결정. ApproveStore 유스케이스는 승인만 먼저 구현, 타임슬롯 생성은 decision 해소 후 추가.

## Outcome

- Status: 미착수
- Follow-up:
  - Open decision 2·3 (타임슬롯 생성 범위) 해소 후 ApproveStoreUseCase 완결
  - Open decision 4 (`GET /admin/stores/:storeId` 상세 필드) 검토
  - requirements.md `store` 섹션 "반려 시 DRAFT" → "반려 시 REJECTED" 갱신
  - 파트너 강제 정지 (`PATCH /admin/partners/:partnerId/suspend`) 별도 plan
  - 어드민 refresh token 정책 장기 검토
