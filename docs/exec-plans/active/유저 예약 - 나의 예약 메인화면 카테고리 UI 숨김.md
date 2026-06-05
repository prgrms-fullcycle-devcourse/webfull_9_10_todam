# Feature Plan: 유저 예약 - 나의 예약 메인화면 카테고리 UI 숨김

## Summary

- Goal: `/my/reservations` 예약 목록 카드에서 category 텍스트와 앞 구분점(`・`)을 화면에서 제거한다. 실 API에 category 소스가 없어 빈 값이 되는 drift를 렌더 레이어에서 해결. 새 API/계약 변경 없음.
- Owner: FE
- Date: 2026-06-05

## Status

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

> 이 기능은 FE UI-only 수정이다. "API 구현" / "API 연동" 체크는 해당 없으므로 이 plan의 완료 기준은 "UI 구현" 단일 체크.

## Context

- 요구사항명세서(고정): `docs/requirements.md` (`reservation` 도메인 섹션)
- 기능명세: "나의 예약 목록 조회" plan — `docs/exec-plans/active/user-예약-나의 예약조회.md` (Decision Log 2026-06-01 PR #63: category 필드 contract 추가 + `category・storeName・hh:mm` 렌더 확정 기록 포함)
- API명세: 해당 없음 (FE UI-only, 신규/변경 API 없음)
- Open decisions: D-1, D-2 (아래 참조)

### Drift 배경 (이미 확인된 사실)

| 위치 | 상태 |
|---|---|
| `apps/web/src/mocks/db.ts` (stores/favorites ~L91-190, reservations ~L427+) | category 하드코딩 — mock 전용 |
| `packages/shared/src/contracts/reservation-list.ts:30` | `category: z.string()` 선언 존재 |
| `apps/api/prisma/schema.prisma` `model Store` / `model Program` | category 필드 없음 |
| 공방/클래스 등록 폼 (`StoreRegistrationForm`, `ProgramRegistrationForm`) | category 입력 없음 |

결론: 실 API 연동 시 category는 채울 소스가 없어 빈 값이 됨 → "나의 예약 메인화면에서 카테고리 UI 안 보이게" 결정.

## API Contract (스냅샷)

해당 없음 (FE UI-only, 신규/변경 API 없음).

참고: 기존 contract(`packages/shared/src/contracts/reservation-list.ts`) `category: z.string()` 필드와 mock db는 **이번 범위에서 건드리지 않는다**. 렌더만 숨김.

## 대상 파일 확정 (코드 조사 결과)

### 나의 예약 메인화면 렌더 경로

`/my/reservations` 목록 화면의 렌더 체인:

```
apps/web/src/app/(user)/my/reservations/page.tsx
  └─ ReservationsListClient   (apps/web/src/app/(user)/my/reservations/_components/ReservationsListClient.tsx)
       └─ ReservationCard     (apps/web/src/app/(user)/my/reservations/_components/ReservationCard.tsx:44)
```

`ReservationsListClient`는 `ReservationCard`만 사용한다. `entities/reservation/ui/CardItem.tsx`는 이 화면에서 **사용되지 않는다** — `@/entities/reservation` 배럴을 import하는 곳은 `ReservationCard.tsx`(ReservationStatusBadge만)와 `features/reservation/detail/ui/ArtworkStageCard.tsx` 둘뿐이다.

### 수정 대상: 단일 파일

`apps/web/src/app/(user)/my/reservations/_components/ReservationCard.tsx`

- **L44**: `{item.category}・{item.storeName}・{time}` → `{item.storeName}・{time}`

### entities/reservation/ui/CardItem.tsx 영향 범위

`CardItem`은 `entities/reservation/index.ts`에서 배럴 재노출되어 있으나, 프로젝트 내 어떤 파일도 `CardItem`을 import하지 않는다(grep 확인). 즉 **현재 미사용 컴포넌트**이므로 이번 수정과 무관하다. D-2 참조.

## Scope

- In:
  - `ReservationCard.tsx` L44: meta line에서 `{item.category}・` 제거 → `{item.storeName}・{time}` 로 변경
- Out:
  - `entities/reservation/ui/CardItem.tsx` — 이 화면에서 사용 안 됨, 건드리지 않음
  - `packages/shared/src/contracts/reservation-list.ts` `category` 필드 — 건드리지 않음
  - `apps/web/src/mocks/db.ts` category 시드 — 건드리지 않음
  - 찜 목록 등 다른 화면 — 이번 요청은 "나의 예약 메인화면" 한정
  - category 소스 부재 근본 해결(backlog) — 별도 이슈

## Plan

1. `ReservationCard.tsx` L44의 meta line을 `{item.storeName}・{time}` 으로 변경한다. `{item.category}・` 접두부 제거.
2. 수정 후 `/my/reservations` 화면에서 예약 카드가 `storeName・hh:mm` 형태로 표시되는지 브라우저로 확인한다.
3. mock db의 category가 있어도 렌더에서 안 보이는지, category가 빈 문자열일 때도 meta line이 깔끔하게 나오는지 확인한다.

## Out (단계별 완료물)

- API: 해당 없음
- UI: `apps/web/src/app/(user)/my/reservations/_components/ReservationCard.tsx` — meta line category 제거
- 연동: 해당 없음

## Risks

- 없음 (단일 파일, 단일 라인 변경)

## Validation

- Manual checks:
  - `/my/reservations` 진입 → 예약 카드 meta line이 `storeName・hh:mm` 형태로 표시됨
  - mock 데이터(category 값 있음)에서도 category 텍스트 미노출 확인
  - 다른 화면(찜 목록, 예약 상세 등) 영향 없음 확인

## Decision Log

- 2026-06-05: 코드 조사 결과 `/my/reservations` 화면은 `ReservationCard.tsx`만 사용, `entities/reservation/ui/CardItem.tsx`는 미사용 컴포넌트임 확인. 수정 대상 단일 파일 확정.
- 2026-06-05: D-1 결정 — category 텍스트와 앞 구분점(`・`) 함께 제거하여 `{storeName}・{time}` 형태로 정리. 구분점 하나가 남아 포맷이 유지됨.
- 2026-06-05: D-2 결정 — `CardItem`이 미사용 컴포넌트이므로 prop optional 처리 등 공용 컴포넌트 변경 불필요. 호출부(`ReservationCard.tsx`)에서만 수정.
- 2026-06-05: D-3 결정 — shared 계약 `category` 필드와 mock db는 이번 범위에서 건드리지 않음. 근본 해결(category 소스 확보 또는 계약 필드 제거)은 backlog.

## Open Decisions

없음 — D-1/D-2/D-3 모두 위 Decision Log에서 확정.

## Outcome

- Status: planned
- Follow-up (backlog):
  - `packages/shared/src/contracts/reservation-list.ts` 및 `favorite.ts`의 `category` 필드 제거 또는 optional 처리 (Prisma 모델·등록 폼에 category 미존재 drift 근본 해결)
  - `entities/reservation/ui/CardItem.tsx` 미사용 컴포넌트 정리 여부 검토
  - `apps/web/src/mocks/db.ts` category 시드 제거 검토
