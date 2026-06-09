# Feature Plan: 파트너 예약 내부 메모 수정

## Summary

- Goal: 파트너가 예약 상세 화면에서 내부 메모를 수정·저장할 수 있는 API를 구현하고, FE 저장하기 액션에 연동한다.
- Owner:
- Date: 2026-06-09

## Status

- [x] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md — `reservation` 도메인, `파트너 수동 예약 등록` 섹션 (internalMemo 최대 200자)
- 기능명세: "내부 메모 업데이트" (기능명세 DB b242ee66b06c8349805601ce4a05247a)
  - 실행주체: partner / 도메인: reservation
  - 선행조건: 로그인된 파트너 + 예약 존재 + 현재 선택된 공방 운영 권한 보유
  - 트리거: 예약 상세 화면 내 내부 메모 입력 → 저장하기 버튼 클릭
- API명세: Notion API명세 DB(5852ee66b06c838bb8ec01c6bf4f2e25)에 `/partner/reservations/{reservationId}/internal-memo` 전용 항목 없음. Contract는 아래 스냅샷에서 신규 정의.
- Relevant design docs: UI는 기존 TextArea(maxLength=200) + 저장하기 actionLabel 패턴 유지 — 신규 디자인 토큰 불필요.
- Resolved decisions (2026-06-09 사용자 확정):
  - **OD-1 [확정]**: 빈 문자열(`""`) → `null` 정규화. DB nullable 컬럼 기준이며 조회 응답 `internalMemo: null`과 정합.
  - **OD-2 [확정]**: 모든 예약 상태에서 메모 수정 허용 (CANCELED 포함). 운영 메모는 예약 상태와 별개로 계속 기록 가능.

---

## API Contract (스냅샷)

> Notion API명세 DB에 해당 엔드포인트 항목 없음. 기능명세 + 기존 파트너 예약 API 패턴(confirm/cancel/complete) + 요구사항(internalMemo 최대 200자)으로 contract를 추론·정의. BE/FE 공유 SSOT.

### 데이터모델

`Reservation` 테이블의 `internal_memo` 컬럼 (string | null, max 200자) 을 직접 갱신.

### 엔드포인트

**`PATCH /partner/reservations/{reservationId}/internal-memo`**

목적: 파트너가 특정 예약의 내부 메모를 수정한다.

Guards: `AuthGuard`, `PartnerGuard`

#### Request

```
Headers:
  Content-Type: application/json
  Authorization: Bearer {accessToken}

Path Parameters:
  reservationId: string  — 예약 UUID

Body:
{
  "internalMemo": string | null   // max 200자. null 또는 "" 전달 시 null 정규화(OD-1)
}
```

#### Response

**200 OK**
```json
{
  "statusCode": 200,
  "timestamp": "2026-06-09T10:00:00.000Z",
  "path": "/partner/reservations/res-uuid-001/internal-memo",
  "message": "내부 메모가 저장되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-001",
      "internalMemo": "전화 예약 / 현장 결제 예정"
    }
  },
  "error": null
}
```

**400 Bad Request** (길이 초과)
```json
{
  "statusCode": 400,
  "timestamp": "2026-06-09T10:00:01.000Z",
  "path": "/partner/reservations/res-uuid-001/internal-memo",
  "message": "내부 메모는 최대 200자까지 입력할 수 있습니다.",
  "data": null,
  "error": "INTERNAL_MEMO_TOO_LONG"
}
```

**403 Forbidden**
```json
{
  "statusCode": 403,
  "timestamp": "2026-06-09T10:00:02.000Z",
  "path": "/partner/reservations/res-uuid-001/internal-memo",
  "message": "해당 예약에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "timestamp": "2026-06-09T10:00:03.000Z",
  "path": "/partner/reservations/res-uuid-001/internal-memo",
  "message": "예약을 찾을 수 없습니다.",
  "data": null,
  "error": "RESERVATION_NOT_FOUND"
}
```

### Shared Contract Schema (추가 위치: `packages/shared/src/contracts/reservation-detail.ts`)

```typescript
// 내부 메모 수정 요청
export const updateInternalMemoRequestSchema = z.object({
    internalMemo: z.string().max(200).nullable(),
});
export type UpdateInternalMemoRequest = z.infer<typeof updateInternalMemoRequestSchema>;

// 내부 메모 수정 응답 data 페이로드
export const updateInternalMemoResponseSchema = z.object({
    reservation: z.object({
        id: z.string(),
        internalMemo: z.string().nullable(),
    }),
});
export type UpdateInternalMemoResponse = z.infer<typeof updateInternalMemoResponseSchema>;
```

---

## Scope

- In:
  - `@todam/shared` contracts에 `updateInternalMemoRequestSchema` / `updateInternalMemoResponseSchema` 추가
  - BE: `PATCH /partner/reservations/:reservationId/internal-memo` 엔드포인트 구현
    - UseCase: `UpdatePartnerReservationInternalMemoUseCase`
    - Repository: `PartnerReservationRepository`에 `updateInternalMemo` 메서드 추가
    - DTO: `UpdateInternalMemoDto` / `UpdateInternalMemoResponseDto`
    - 공방 소유 권한 검증 (`partnerUserId` 대조)
    - `internalMemo` 200자 초과 검증
    - `""` → `null` 정규화 (OD-1 확정 후 적용)
  - FE: `PartnerReservationDetailClient.handleSaveMemo` stub → 실 API 연결
    - `entities/reservation/api.ts`에 `updatePartnerReservationInternalMemo` 함수 추가
    - `entities/reservation/queries.ts`에 `useUpdatePartnerReservationInternalMemoMutation` 추가
    - 저장 성공 시: `memoDraft.saved` 갱신 + `PARTNER_DETAIL_KEY` 캐시 invalidate
    - 저장 실패 시: 공통 toast 에러 처리

- Out:
  - 예약 상세 조회 응답 shape 변경 없음 (이미 `internalMemo` 포함됨)
  - 내부 메모 이력 로깅 (ArtworkLog 패턴 적용 없음 — reservation 도메인)
  - 알림 발송 없음
  - 다른 예약 상태 전이 없음

---

## Plan

### BE (apps/api)

1. **Shared Contract 추가** (`packages/shared/src/contracts/reservation-detail.ts`)
   - `updateInternalMemoRequestSchema`: `{ internalMemo: z.string().max(200).nullable() }`
   - `updateInternalMemoResponseSchema`: `{ reservation: { id, internalMemo } }`
   - `packages/shared/src/index.ts`에서 이미 `reservation-detail` 전체 export 중이므로 별도 export 추가 불필요

2. **Repository 인터페이스 확장** (`apps/api/src/modules/reservation/domain/repositories/partner-reservation.repository.ts`)
   - `updateInternalMemo(reservationId: string, memo: string | null): Promise<{ id: string; internalMemo: string | null }>`

3. **Repository 구현** (`apps/api/src/modules/reservation/infrastructure/persistence/prisma-partner-reservation.repository.ts`)
   - `prisma.reservation.update({ where: { id }, data: { internalMemo: memo } })` 로 구현

4. **UseCase 작성** (`apps/api/src/modules/reservation/application/use-cases/update-partner-reservation-internal-memo.use-case.ts`)
   - `findDetail(reservationId)` → `partnerUserId !== userId` 이면 FORBIDDEN
   - `""` → `null` 정규화
   - `updateInternalMemo` 호출 후 결과 반환

5. **DTO 추가** (`apps/api/src/modules/reservation/presentation/dto/partner-reservation.dto.ts`)
   - `UpdateInternalMemoDto extends createZodDto(updateInternalMemoRequestSchema)`
   - `UpdateInternalMemoResponseDto extends createZodDto(updateInternalMemoResponseSchema)`

6. **Controller 등록** (`apps/api/src/modules/reservation/presentation/controllers/partner-reservation.controller.ts`)
   - `@Patch('partner/reservations/:reservationId/internal-memo')`
   - `@UseGuards(AuthGuard, PartnerGuard)`
   - `@Body(new ZodValidationPipe(updateInternalMemoRequestSchema)) dto`
   - UseCase 주입 및 호출

7. **Module 등록** (`apps/api/src/modules/reservation/reservation.module.ts`)
   - `UpdatePartnerReservationInternalMemoUseCase` provider 추가

### FE (apps/web)

8. **API 함수 추가** (`apps/web/src/entities/reservation/api.ts`)
   - `updatePartnerReservationInternalMemo(reservationId, body: UpdateInternalMemoRequest)`

9. **Mutation hook 추가** (`apps/web/src/entities/reservation/queries.ts`)
   - `useUpdatePartnerReservationInternalMemoMutation(reservationId)`
   - `onSuccess`: `setMemoDraft` saved 갱신 로직과 분리하기 위해 컴포넌트에서 `onSuccess` 콜백으로 처리
   - 캐시: `PARTNER_DETAIL_KEY, reservationId` invalidate

10. **PartnerReservationDetailClient 연결** (`apps/web/src/features/reservation/detail/ui/PartnerReservationDetailClient.tsx`)
    - `useUpdatePartnerReservationInternalMemoMutation` 추가
    - `handleSaveMemo` stub → `mutation.mutate({ internalMemo: memo })`
    - `onSuccess`: `setMemoDraft(prev => prev ? { ...prev, saved: prev.value } : null)`
    - `onError`: `pushToast({ message: '메모 저장에 실패했습니다.' })`
    - 저장 중 버튼 disabled 처리 (`mutation.isPending`)

11. **entities/reservation/index.ts export 확인**
    - `useUpdatePartnerReservationInternalMemoMutation` export 추가

---

## Out (단계별 완료물)

### API 구현 완료 (2026-06-09)

- `packages/shared/src/contracts/reservation-detail.ts` — `updateInternalMemoRequestSchema`, `updateInternalMemoResponseSchema`, `UpdateInternalMemoRequest`, `UpdateInternalMemoResponse` 추가
- `apps/api/src/modules/reservation/domain/repositories/partner-reservation.repository.ts` — `updateInternalMemo(reservationId, memo)` 추상 메서드 추가
- `apps/api/src/modules/reservation/infrastructure/persistence/prisma-partner-reservation.repository.ts` — `updateInternalMemo` 구현 (`prisma.reservation.update`)
- `apps/api/src/modules/reservation/application/use-cases/update-partner-reservation-internal-memo.use-case.ts` — UseCase 신규 생성 (findDetail → FORBIDDEN 검증 → OD-1 정규화 → updateInternalMemo)
- `apps/api/src/modules/reservation/presentation/dto/partner-reservation.dto.ts` — `UpdateInternalMemoDto`, `UpdateInternalMemoResponseDto` 추가
- `apps/api/src/modules/reservation/presentation/controllers/partner-reservation.controller.ts` — `PATCH partner/reservations/:reservationId/internal-memo` 핸들러 추가
- `apps/api/src/modules/reservation/reservation.module.ts` — `UpdatePartnerReservationInternalMemoUseCase` provider 등록
- `apps/api/src/modules/reservation/application/use-cases/update-partner-reservation-internal-memo.use-case.spec.ts` — 단위 테스트 8개 (404/403/200/OD-1/OD-2) 모두 통과
- `apps/api/src/modules/api-routes.snapshot.spec.ts` — 신규 라우트 스냅샷 등록
- 전체 테스트: 187/187 통과

---

- UI: `PartnerReservationDetailClient` — `handleSaveMemo` 실 API 연결, `isPending` 비활성화, 성공/실패 toast
- 연동: `updateInternalMemoRequestSchema` / `updateInternalMemoResponseSchema`로 req/res 타입 검증, `PARTNER_DETAIL_KEY` 캐시 갱신으로 상세 조회와 internalMemo 정합성 유지

---

## Risks

- **권한 검증 방식**: 기존 confirm/cancel/complete UseCase는 `findForAction`으로 `partnerUserId`를 조회한다. 내부 메모 수정은 예약 상태와 무관하므로 `findDetail`(이미 `partnerUserId` 포함)을 재사용한다. `findForAction` 미사용 — 설계 일관성 관점에서 검토 필요.
- **OD-1 미확정**: `""` 정규화 정책이 확정되지 않으면 `partnerReservationDetailSchema.internalMemo: z.string().nullable()` 과 불일치 가능 (빈 문자열 vs null). 조기 확정 권장.
- **동시 수정 없음**: internalMemo는 파트너 단독 편집 필드이므로 낙관적 락 불필요.

---

## Validation

- Tests:
  - `UpdatePartnerReservationInternalMemoUseCase` 단위 테스트
    - 정상 저장 (200자 이내)
    - 200자 초과 → zod 검증에서 400
    - 타 파트너 예약 → FORBIDDEN
    - 존재하지 않는 예약 → 404
    - `""` → null 정규화 확인
  - (선택) E2E: `PATCH /partner/reservations/:id/internal-memo` Happy Path
- Manual checks:
  - 예약 상세 진입 → 메모 수정 → 저장하기 클릭 → 성공 toast → dirty 해제
  - 저장 후 페이지 이탈 → "저장하지 않고 나갈까요?" modal 미노출 확인
  - 200자 초과 입력 불가 (TextArea maxLength=200으로 프론트 차단)
  - 403/404 케이스 toast 에러 확인
- Observability: 없음 (별도 알림 트리거 없음)

---

## Decision Log

- 2026-06-09: Notion API명세 DB에 전용 항목 없음 확인. 기능명세 + 기존 파트너 예약 패턴으로 contract 신규 정의.
- 2026-06-09: 응답 shape를 `{ reservation: { id, internalMemo } }` 최소 페이로드로 결정. 전체 상세 재반환 불필요 (FE는 캐시 invalidate로 최신화).
- 2026-06-09: OD-1(`""` → null 정규화) 가정 채택. 확정 전 구현 시작 가능하나 단위 테스트에서 행동 명시 필요.
- 2026-06-09: OD-2(모든 예약 상태에서 수정 허용) 가정 채택. CANCELED 예약의 메모 수정도 허용.

---

## Outcome

- Status: planned
- Follow-up: OD-1 확정 후 UseCase 구현 시 정규화 코드 확정.
