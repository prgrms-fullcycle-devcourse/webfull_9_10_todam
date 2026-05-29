# apispec ↔ Prisma Schema 일치 검증

## Summary

- Goal: `docs/api/apispec.md`의 API 명세와 `apps/api/prisma/schema.prisma`가 일치하는지 검증하고 불일치 항목 정리
- Owner: 태성
- Date: 2026-05-29

## Context

- Relevant specs: `docs/api/apispec.md`, `apps/api/prisma/schema.prisma`
- Open decisions: 불일치 발견 시 apispec 수정 또는 schema 수정 여부 팀 협의 필요

## Scope

- In:
  - 모든 도메인 모델 필드명 / 타입 / enum 값 비교
  - API 요청·응답 바디의 필드명과 Prisma 모델 필드 비교
  - apispec에 정의된 enum 값과 schema enum 값 비교
  - 관계(relation) 구조 비교 (1:1, 1:N 등)
- Out:
  - API 엔드포인트 URL 패턴 검증
  - 비즈니스 로직 검증
  - 성능/보안 검토

## Plan

1. 도메인별 Prisma 모델과 apispec 응답 바디 필드 비교
   - User, Partner, Store, Program, ProgramTimeSlot
   - Reservation, Artwork, ArtworkLog, ArtworkPhoto
   - Review, ReviewPhoto, Notification, Report
2. enum 값 전체 비교
   - schema enum ↔ apispec 명시 enum 값 일치 여부
   - `packages/shared` enum과도 3-way 비교
3. 관계 구조 비교
   - apispec 응답에 포함된 중첩 객체가 schema relation과 일치하는지
4. 불일치 항목 목록화
   - 심각도 분류: 스키마 수정 필요 / apispec 수정 필요 / 팀 협의 필요
5. 수정 또는 이슈 등록

## Risks

- apispec이 오래된 경우 실제 구현 기준이 모호해질 수 있음
- schema 수정 시 기존 마이그레이션 영향 범위 확인 필요

## Validation

- Manual checks: 불일치 항목 목록 팀 리뷰

## Decision Log

-

## Outcome

- Status: DONE (2026-05-29)
- Follow-up: 아래 불일치 목록 기준으로 팀 회의 후 수정 방향 결정 필요

---

## 불일치 항목 목록

### 🔴 스키마 수정 필요 (Schema 변경 + Migration 필요)

#### [S-1] StoreOperatingHour.dayOfWeek — Int → Enum 변환 필요
- **Schema**: `dayOfWeek Int`
- **Apispec**: `"dayOfWeek": "MON"` (문자열 enum)
- **영향**: `store_operating_hours` 테이블 컬럼 타입 변경 + `DayOfWeek` enum 추가
- **제안**: schema에 `enum DayOfWeek { MON TUE WED THU FRI SAT SUN }` 추가, 컬럼 타입 변경

#### [S-2] StoreOperatingHour — breakTime 단일 필드 → breakStart + breakEnd 분리
- **Schema**: `breakTime DateTime @db.Time(6)` (단일)
- **Apispec**: `"breakStart": "13:00"`, `"breakEnd": "14:00"` (분리)
- **영향**: 컬럼 2개 추가 + 기존 컬럼 제거 마이그레이션
- **제안**: `breakStart DateTime @db.Time(6)`, `breakEnd DateTime @db.Time(6)` 분리 (nullable 가능성 있음)

#### [S-3] StoreImage.isPrimary ↔ apispec isThumbnail — 필드명 불일치
- **Schema**: `isPrimary Boolean @map("is_primary")`
- **Apispec**: `"isThumbnail": true`
- **제안**: 둘 중 하나로 통일. `isThumbnail`이 의미상 더 명확하면 schema 수정, 그렇지 않으면 apispec 수정

#### [S-4] BusinessDocument.representativeName ↔ apispec ownerName — 필드명 불일치
- **Schema**: `representativeName String @map("representative_name")`
- **Apispec**: `"ownerName": "김토담"` (요청·응답 모두)
- **제안**: `ownerName`으로 통일 권장 (사용자 친화적). schema + DB 컬럼 rename

#### [S-5] User — emailVerified 필드 없음
- **Schema**: User 모델에 `emailVerified` 없음
- **Apispec**: `/auth/email/verify-code` 처리 시 `emailVerified = true`로 업데이트, 응답에도 포함
- **제안**: `emailVerified Boolean @default(false) @map("email_verified")` 추가

#### [S-6] FavoriteStore 모델 없음
- **Schema**: 해당 모델 없음
- **Apispec**: `favorite_stores` 테이블 참조 (`/stores/{storeId}/favorite`, `/users/me/favorite-stores`)
- **제안**: `model FavoriteStore` 추가 (userId, storeId, createdAt 최소 구성)

#### [S-7] ProgramImage 모델 없음
- **Schema**: 해당 모델 없음
- **Apispec**: `program_images` 테이블 참조 (`/partner/stores/{storeId}/programs/{programId}/images`)
- **제안**: `model ProgramImage` 추가 (programId, imageUrl, thumbnailUrl, sortOrder 등)

#### [S-8] OcrStatus enum — VERIFIED 값 없음
- **Schema**: `PENDING | SUCCESS | FAILED`
- **Apispec**: `"ocrStatus": "VERIFIED"` 사용 (문서 OCR 완료·검증 시)
- **제안**: `VERIFIED` 추가, 또는 `SUCCESS` → `VERIFIED` 로 rename (팀 협의)

#### [S-9] Partner — suspendedAt 필드 없음
- **Schema**: `approvedAt`, `terminatedAt` 있으나 `suspendedAt` 없음
- **Apispec**: `/admin/partners/{partnerId}/suspend` 응답에 `"suspendedAt"` 포함
- **제안**: `suspendedAt DateTime? @map("suspended_at")` 추가

#### [S-10] Program — sortOrder 필드 없음
- **Schema**: 해당 필드 없음
- **Apispec**: `/stores/{slug}/programs` 응답에 `"sortOrder": 1` 포함, `sort_order`로 정렬
- **제안**: `sortOrder Int @default(0) @map("sort_order")` 추가

---

### 🟡 apispec 수정 필요 (Schema가 구현 기준)

#### [A-1] Store.rejectedReason ↔ apispec rejectionReason — 필드명 불일치
- **Schema**: `rejectedReason String? @map("rejected_reason")`
- **Apispec**: `"rejectionReason": "..."` (reject 응답)
- **제안**: apispec을 `rejectedReason`으로 수정

#### [A-2] Store.suspendedReason ↔ apispec suspensionReason — 필드명 불일치
- **Schema**: `suspendedReason String? @map("suspended_reason")`
- **Apispec**: `"suspensionReason": "..."` (suspend 응답)
- **제안**: apispec을 `suspendedReason`으로 수정

#### [A-3] Program.durationMinutes ↔ apispec duration — 필드명 불일치
- **Schema**: `durationMinutes Int @map("duration_minutes")`
- **Apispec**: `"duration": 120` (요청·응답 모두)
- **제안**: apispec을 `durationMinutes`로 수정 (단위 명시가 더 명확)

#### [A-4] Program.deliveryOption / CUSTOMER_SELECT ↔ apispec receiveOption / CUSTOMER_CHOICE
- **Schema**: `deliveryOption ProgramDeliveryOption`, `CUSTOMER_SELECT`
- **Apispec**: `"receiveOption": "CUSTOMER_CHOICE"` (요청·응답 모두)
- **영향**: 필드명 + enum 값 모두 불일치
- **제안**: apispec을 schema 기준(`deliveryOption`, `CUSTOMER_SELECT`)으로 수정

#### [A-5] Review.body ↔ apispec content — 필드명 불일치
- **Schema**: `body String?`
- **Apispec**: `"content": "..."` (리뷰 작성·수정·조회 모두)
- **제안**: apispec을 `body`로 수정 (또는 schema를 `content`로 — 팀 선호에 따라)

#### [A-6] Reservation.reserverName / reserverPhone ↔ apispec participantName / participantPhone
- **Schema**: `reserverName`, `reserverPhone`
- **Apispec**: `"participantName"`, `"participantPhone"` (수동 예약 요청·목록 조회 응답)
- **제안**: apispec을 `reserverName`, `reserverPhone`으로 수정

#### [A-7] Reservation.scheduledAt ↔ apispec experienceAt — 필드명 불일치
- **Schema**: `scheduledAt DateTime @map("scheduled_at")`
- **Apispec**: `"experienceAt": "2026-06-01T10:00:00.000Z"` (요청·응답 모두)
- **제안**: apispec을 `scheduledAt`으로 수정

#### [A-8] Reservation.memo ↔ apispec internalMemo — 필드명 불일치
- **Schema**: `memo String?`
- **Apispec**: `"internalMemo": "현장 방문 예약"` (수동 예약 요청)
- **제안**: apispec을 `memo`로 수정

#### [A-9] Reservation.deliveryMethod ↔ apispec receiveMethod — 필드명 불일치
- **Schema**: `deliveryMethod ReservationDeliveryMethod`
- **Apispec**: `"receiveMethod": "DELIVERY"` (예약 상세 조회 응답)
- **제안**: apispec을 `deliveryMethod`로 수정

#### [A-10] Artwork.memo ↔ apispec internalMemo (artwork 상세 응답)
- **Schema**: `memo String?`
- **Apispec**: `"internalMemo": "물레 성형 완료, 균열 없음"` (파트너 작품 상세 조회)
- **제안**: apispec을 `memo`로 수정

---

### 🔵 팀 협의 필요

#### [T-1] Reservation.canceledBy — UUID FK vs "CUSTOMER"/"PARTNER" enum 표현
- **Schema**: `canceledBy String? @map("canceled_by") @db.Uuid` → User FK (누가 취소했는지 UUID)
- **Apispec**: `"canceledBy": "CUSTOMER"` (역할 문자열)
- **상황**: schema는 취소한 사용자 UUID를 저장하고 있으나, 응답에서는 역할("CUSTOMER", "PARTNER")로 노출하고 싶은 것으로 보임
- **선택지**:
  - (a) DTO 레이어에서 UUID → role 변환 처리 (schema 유지)
  - (b) `canceledByType` enum 컬럼 별도 추가

#### [T-2] ArtworkStatus — count-by-step API 명칭 불일치
- **Schema**: `BISQUE_FIRING`, `GLAZE_FIRING`
- **Apispec count-by-step 응답**: `"firstFiring"`, `"secondFiring"` (camelCase key)
- **상황**: schema enum 이름(BISQUE_FIRING)과 apispec 응답 key(firstFiring)가 다름. 응답 key는 DTO 매핑으로 처리 가능하므로 큰 문제 아닐 수 있음
- **선택지**: DTO에서 매핑하거나, apispec 응답 key를 schema 기준(`bisqueFiring`, `glazeFiring`)으로 맞춤

#### [T-3] blocked_slots 테이블 참조 (BlockedSlot 모델 없음)
- **Schema**: BlockedSlot 모델 없음
- **Apispec**: `/programs/{programId}/available-slots` 시스템 처리에서 `blocked_slots` 테이블 조회 언급
- **상황**: 백엔드 결정으로 BlockedSlot 대신 `ProgramTimeSlot.status = 'CLOSED'`로 처리하기로 결정된 것으로 보임
- **선택지**: apispec 시스템 처리 설명에서 `blocked_slots` 참조를 `program_time_slots.status = 'CLOSED'`로 수정

#### [T-4] Program.currentSnapshotId 없음
- **Schema**: ProgramSnapshot이 별도 모델로 존재하나, Program에 `currentSnapshotId` 참조 없음
- **Apispec**: 프로그램 수정 시 `programs.current_snapshot_id`를 갱신한다고 기술
- **선택지**: schema에 `currentSnapshotId String? @map("current_snapshot_id")` 추가하거나, snapshot 중 최신 createdAt으로 조회하는 방식 채택

#### [T-5] ArtworkLog — changedAt vs createdAt
- **Schema**: ArtworkLog에 `createdAt`만 존재
- **Apispec**: 파트너 작품 상세 logs 배열에 `"changedAt"` 포함
- **선택지**: DTO에서 `createdAt`을 `changedAt`으로 노출하거나, apispec을 `createdAt`으로 수정

---

### ℹ️ 참고 (불일치이나 영향 낮음)

- **Admin.updatedAt 없음**: apispec에서 Admin updatedAt을 사용하지 않으므로 현재 영향 없음
- **Partner.rejectedReason ↔ apispec rejectionReason**: Store와 동일 패턴 ([A-1] 참고), Partner 모델도 동일 수정 필요
- **Partner.suspendedReason ↔ apispec suspensionReason**: Store와 동일 패턴 ([A-2] 참고)

---

## 수정 우선순위 요약

| 번호 | 항목 | 심각도 | 추천 수정 대상 |
|------|------|--------|----------------|
| S-1 | StoreOperatingHour.dayOfWeek 타입 | 높음 | Schema |
| S-2 | breakTime → breakStart/breakEnd | 높음 | Schema |
| S-5 | User.emailVerified 없음 | 높음 | Schema |
| S-6 | FavoriteStore 모델 없음 | 높음 | Schema |
| S-7 | ProgramImage 모델 없음 | 중간 | Schema |
| S-8 | OcrStatus.VERIFIED 없음 | 중간 | Schema |
| S-3 | isPrimary vs isThumbnail | 중간 | 팀 협의 |
| S-4 | representativeName vs ownerName | 중간 | 팀 협의 |
| A-4 | receiveOption/CUSTOMER_CHOICE | 높음 | Apispec |
| A-5 | Review body vs content | 높음 | 팀 협의 |
| A-6~9 | Reservation 필드명 다수 | 높음 | Apispec |
| T-1 | canceledBy 타입 의미 | 높음 | 팀 협의 |
| T-4 | currentSnapshotId | 중간 | 팀 협의 |
