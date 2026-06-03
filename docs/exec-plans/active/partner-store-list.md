# Feature Plan: 파트너 공방 관리 - 공방 리스트 조회 (나의 공방 목록 조회)

## Summary

- Goal: 로그인한 파트너가 설정 > 공방 관리 진입 시 본인 소유 공방 전체를 상태와 함께 목록 조회한다.
- Owner: nogglee
- Date: 2026-06-01

## Status

- [x] API 구현
- [x] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): docs/requirements.md — `공방 store` 도메인(공방 상태/상태전이, 공방 조회), `partner` 도메인(파트너 상태), 접근 주체/가드(`AuthGuard + PartnerGuard`)
- 기능명세: `나의 공방 목록 조회` (기능명세 DB `b242ee66b06c8349805601ce4a05247a` 에서 select)
  - 실행주체: Partner / 도메인: partner / 연관화면: 설정
  - 표시: 공방명, 대표 이미지, 공방 주소, 사업자 승인 상태, 운영중 여부, 게시 상태(심사중/반려/게시중/게시중단), 현재 선택된 공방
  - 동작: 공방 상세 이동, 공방 등록 이동
  - 제한: 운영 권한 없는 공방 제외, 삭제 공방 제외, 빈 상태 화면, 네트워크 오류 처리
  - 정렬: 최신 생성순, 현재 선택 공방 강조
- API명세: `GET /partner/stores` (내 공방 목록 - 파트너센터). 상세 이동 대상은 별도 기능(`GET /partner/stores/{storeId}`), 등록 이동은 별도 기능(첫/추가 공방 등록) — 본 plan 범위 밖.
- Relevant design docs: DESIGN.md (작업 시작 조건 — variant enum / size별 토큰 / 상태별 컬러 토큰)
- Open decisions:
  - ✅ (UI-1) 게시 상태 Badge: Figma 디자인 확보. `Badge`에 `neutral` tone 추가(`bg-muted/text-foreground-secondary`). 매핑 3종 확정(심사중/게시중/게시중단). DRAFT/REJECTED만 잠정.
  - ✅ (UI-2) 공방 카드: `entities/store/ui/StoreManagementItem.tsx` 구현. Figma 토큰 매핑 완료(rounded-2xl/p-4/gap-3 등, 전부 semantic·Tailwind 스케일).
  - ✅ (UI-3) 빈 상태: `shared/ui/EmptyState.tsx` 공용 컴포넌트 구현(메시지 가변). 카피 "아직 등록된 공방이 없습니다." (임시 확정).
  - ⏳ (CONTRACT-1) "사업자 승인 상태" vs 응답 필드 불일치. **현 구현은 디자인 따라 `ownerName`(대표자) 표시 + store.status로 게시상태 Badge.** partner.status(사업자 승인) 별도 표기 필요한지 BE/기획 확정 대기.
  - ⏳ (CONTRACT-2) "현재 선택된 공방" 강조 — `공방 전환` 소관, 본 API 미포함. 선택 공방 출처 미확정 → 후속.
  - ⏳ (CONTRACT-3) 페이지네이션/총개수 없음(전체 반환). 다수 공방 대비 페이징 필요 여부 미확정.

## Scope

- In:
  - BE: `GET /api/v1/partner/stores` 구현(파트너 소유 공방 전체 조회, 최신 생성순 정렬, 삭제 공방 제외, 공통 응답 봉투). **현재 MSW mock만 구현, 실 BE(apps/api) 미구현.**
  - UI: 공방 관리 목록 화면 — 공방 카드(공방명/대표자/게시상태 Badge), 빈 상태, 로딩/오류 처리, 헤더 더보기(공방 등록) + 공방 상세/등록 라우팅.
  - 연동: 목록 조회 API 바인딩(타입/쿼리 훅 `usePartnerStores`), 상태 enum → 라벨/Badge 매핑(`StoreStatusBadge`).
- Out:
  - 공방 상세 조회(`GET /partner/stores/{storeId}`) 화면.
  - 공방 등록 플로우(첫/추가 공방 등록).
  - "현재 선택된 공방" 전환 로직(`공방 전환` 기능) — 본 화면에서는 강조 표시만 후속 결정.
  - 파트너 승인 상태(partner.status) 별도 조회/표시 — CONTRACT-1 결정 후.

## Plan

1. (BE) `GET /partner/stores` 컨트롤러/서비스 구현: PartnerGuard 적용, `partner_id` 기준 조회, `deletedAt` 제외, `createdAt DESC` 정렬, 응답 DTO를 API Contract 스냅샷 스키마로 직렬화.
2. (UI) 공방 관리 목록 화면 + 공방 카드/게시상태 Badge/빈 상태 컴포넌트. UI-1~3 토큰 확보 전엔 mock으로 골격만, 토큰 확정 후 스타일 적용. DESIGN.md 준수.
3. (연동) 응답 타입 정의 + 조회 훅(react-query 등), status enum→라벨 매핑 유틸, 로딩/401·403·500/빈 배열 상태 처리. 상세·등록 라우팅 연결.

## Out (단계별 완료물)

- API(mock): `apps/web/src/mocks/handlers.ts` `GET */api/v1/partner/stores`, `mocks/db.ts` `listPartnerStores()` + 시드 3종(최신 생성순).
- API(실 BE, apps/api): `GET /api/v1/partner/stores` 구현 완료.
  - `modules/store/presentation/controllers/store.controller.ts` — `@Get('partner/stores')` 라우트 추가(`@UseGuards(AuthGuard, PartnerGuard)`, `@ResponseMessage('내 공방 목록이 성공적으로 조회되었습니다.')`).
  - `modules/store/application/use-cases/list-partner-stores.use-case.ts` — userId→partner.id 식별, `store.findMany({ where:{partnerId}, orderBy:{createdAt:'desc'} })`, BusinessDocument(최초 1건) join으로 ownerName 매핑, createdAt ISO8601 직렬화.
  - `modules/store/presentation/dto/list-partner-stores.dto.ts` — `PartnerStoreListItemDto`(id/name/ownerName/status/createdAt) + `ListPartnerStoresResponseDto`({ stores }). contract 스냅샷 1:1.
  - `modules/store/store.module.ts` — `ListPartnerStoresUseCase`, `PartnerGuard` provider 등록.
  - 응답 봉투/에러는 기존 `ResponseInterceptor`·`AuthGuard`(401)·`PartnerGuard`(403) 재사용. 빌드/타입체크 통과.
  - 스키마 메모: Store에 `deletedAt` 컬럼 없음(soft-delete 미도입) → "삭제 공방 제외" 필터는 현 스키마에 적용 불가하여 생략. ownerName은 Store에 없고 `BusinessDocument.ownerName`이 유일 출처 → store의 최초 BusinessDocument를 join하여 매핑.
- UI:
  - `entities/store/ui/StoreManagementItem.tsx` — 공방 카드(공방명/대표자/Badge slot)
  - `entities/store/ui/StoreStatusBadge.tsx` — status→tone+label+dot 매핑
  - `packages/ui/Badge.tsx` — `neutral` tone 추가
  - `packages/ui/Menu.tsx` — `MenuItem.icon`(trailing) 추가 + 디자인 정렬
  - `shared/ui/EmptyState.tsx` — 빈 상태 공용
  - `app/partner/stores/page.tsx` — 목록 화면(로딩/에러/빈/카드)
  - 헤더 더보기: `shared/model/header-action.ts`(store) + `widgets/header` rightAction 슬롯 + `features/store/list/ui/StoreListHeaderMenu.tsx`
  - 헤더 전역 스타일: `bg-transparent`·border 제거(Header 위젯/등록 인라인 헤더)
- 연동: `features/store/list/` `api.ts`(`getPartnerStores`) + `queries.ts`(`usePartnerStores`). 계약 `packages/shared/.../store-list.ts`.
- 부수: 등록 플로우 `returnTo` prop 추가(`/partner/stores/new` → 닫기 시 리스트 복귀).

## Risks

- CONTRACT-1: "사업자 승인 상태" 의미 미확정. 현 구현은 디자인 따라 `ownerName`+store.status만. partner.status 표기 필요 시 계약/카드 수정 필요.
- 계약 drift: 원 API명세(slug/address/thumbnailUrl/publishedAt) ↔ 구현 계약(ownerName 추가, 4필드 제외). 실 BE 구현 시 합의 필수.
- base path: 명세 `/partner/stores` ↔ 코드 컨벤션 `/api/v1/partner/stores`.
- DRAFT/REJECTED Badge 매핑 잠정(디자인 미제공).
- 페이지네이션 부재(CONTRACT-3).
- **심사 상태 SSOT = `store.status` (per-store), `partner.status` 아님.** 파트너는 멀티 스토어 가능 → 심사/반려를 partner에 두면 전 스토어 오염. BE는 심사 결과를 스토어 단위로 보관·반환. `partner.status`는 계정 승인(추가 등록 게이트)용으로 분리.
- **검수 결과 화면 라우팅**: 별도 라우트 없이 공방 상세(`GET /partner/stores/{id}`)의 `status`로 FE가 분기(PENDING/REJECTED → 결과화면, PUBLISHED/SUSPENDED → 일반 상세). 따라서 상세 응답에 정확한 `status` + `rejectedReason` 필수.
- **파트너 홈(`/partner`) 진입 리다이렉트**: 첫 등록 검수 대기 중이면 결과화면으로 보내야 함. 현 FE는 `GET /partner/onboarding`(latest 1건) `storeStatus != PUBLISHED` 기준 — mock 한계(목록이 파트너 스코프 아님) 회피용. 실 BE에선 "인증 파트너의 게시중 공방 0개 && 미게시 공방 존재" 판정이 권위. 멀티스토어 시 latest-onboarding 단독 판정은 부정확(게시중 보유 파트너 오인 리다이렉트 위험).

## Validation

- Tests: BE 서비스 단위(소유 공방만/정렬/삭제 제외), 가드(401·403) e2e. FE enum→라벨 매핑 단위, 빈 상태/에러 상태 렌더 테스트.
- Manual checks: 파트너 토큰으로 목록 조회, 비파트너 토큰 403, 공방 0개 빈 상태, 네트워크 차단 시 오류 UI.
- Observability: 조회 실패(500) 로깅.

## Decision Log

- 기능명 `파트너 공방 관리 - 공방 리스트 조회`는 기능명세 DB에 정확 일치 없음 → 후보 중 `나의 공방 목록 조회`로 매칭(실행주체 partner, 연관화면 설정, 표시 항목 일치). API는 `GET /partner/stores`로 확정.
- 카드 필드: Figma `StoreManagementItem`엔 thumbnail/address 없음, `ownerName`(대표자) 있음 → 계약을 디자인 기준으로 작성(slug/address/thumbnailUrl/publishedAt 제외, ownerName 추가).
- Badge 회색(심사중) tone이 기존 `Badge`에 없어 `neutral` tone 추가(토큰 `bg-muted/text-foreground-secondary`). dot 색 = 텍스트색(currentColor)으로 3종 일치.
- 헤더 더보기: Header 위젯이 route-driven(layout 마운트)이라 페이지가 props 직접 못 줌 → `header-action` zustand store(modal/sheet/toast 패턴)로 우측 슬롯 주입.
- 드롭다운: 커스텀 재구현 대신 `@todam/ui` `Menu` 재사용. trailing icon(+) 위해 `MenuItem.icon` 추가.
- 빈 상태 `EmptyState`를 web 공용으로 분리(`shared/ui`).
- 폴더/파일명: `features/store/list`(상위 store 중복 제거), 계약 `contracts/store-list.ts`(형제 `store-registration.ts`와 prefix 일치).
- 헤더 전역 스타일: `bg-transparent` + border 제거(디자인 합의).
- 등록 플로우 `returnTo`: 진입점별 닫기 목적지 분리(`/apply`→`/my`, `/partner/stores/new`→`/partner/stores`).
- 2026-06-03: 심사 결과를 `store.status`(per-store)로 확정, `partner.status` 분리(멀티 스토어 대응). 검수 결과 화면(`StoreReviewResult`)은 공방 상세 라우트에서 status 분기로 렌더(별도 라우트 X). 검토중·반려 모두 헤더 없음. 하단 이동: 등록 직후 1회성(Complete)=홈(`/`), 상세/재진입(ReviewResult)=목록(`/partner/stores`).
- 2026-06-03: 파트너 홈 진입 시 미게시 공방이면 결과화면 리다이렉트(FE는 onboarding latest 기준 임시). 정확 판정은 BE 권위 필요 — Follow-up.

## Outcome

- Status: UI·연동(mock) 완료. 실 BE(apps/api) + CONTRACT-1 확정 + 상세화면/공방전환 후속.
- Follow-up:
  - 실 `GET /api/v1/partner/stores` BE 구현 + 계약 합의(ownerName/제외필드).
  - CONTRACT-1(사업자 승인 상태 표기) 기획·BE 확정.
  - DRAFT/REJECTED Badge 디자인 확정.
  - 더보기 외 항목·페이지네이션(CONTRACT-3)·현재선택 강조(CONTRACT-2).
  - **심사 결과 SSOT를 `store.status`로 BE 구현**(per-store), `partner.status`는 계정 승인 전용 분리. 상세 응답 `status`+`rejectedReason` 보장.
  - **파트너 홈 리다이렉트 판정 BE화**: 인증 파트너의 "게시중 0개 && 미게시 존재" 여부로 결과화면 유도. 현 FE의 onboarding-latest 단독 판정은 멀티스토어 오인 위험 → 전용 신호(예: `GET /partner/me` 또는 stores 요약에 `hasPublishedStore`/`pendingReviewStoreId`) 제공 검토.

## API Contract (스냅샷)

### 데이터모델 (응답 store 항목)

> ⚠️ **구현 시 디자인(Figma) 기준으로 확정** — 원 API명세의 `slug/address/thumbnailUrl/publishedAt`는 카드에서 미사용이라 제외, 디자인에 있는 `ownerName`(대표자)을 추가. BE 합의 필요(CONTRACT-1 참고).

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 공방 ID (카드 key·상세 라우팅) |
| `name` | string | 공방명 |
| `ownerName` | string | 대표자명 (카드 "대표자 {ownerName}") |
| `status` | enum | `DRAFT` \| `PENDING` \| `PUBLISHED` \| `REJECTED` \| `SUSPENDED` |
| `createdAt` | string(ISO8601) | 생성 일시 (정렬 기준: 최신순) |

> 라벨/Badge 매핑(디자인 확정 3종): PENDING→심사중(neutral·회색), PUBLISHED→게시중(success·초록), SUSPENDED→게시중단(danger·빨강). DRAFT→작성중, REJECTED→반려는 디자인 미제공 → 잠정 매핑(neutral/danger), 추후 확정.
> zod 계약: `packages/shared/src/contracts/store-list.ts` (`PartnerStoreListItem` / `PartnerStoreListResult`).

### 엔드포인트

- `GET /api/v1/partner/stores` — 내 공방 목록 (파트너센터)
  - 가드: `AuthGuard + PartnerGuard` (인증 토큰으로 파트너 capability 검증)
  - Request Headers: `Accept: application/json`, `Authorization: Bearer {accessToken}`
  - Request: path/query/body 없음
  - 시스템 처리: 요청자 식별 → partner capability 검증 → `stores` 테이블에서 `partner_id` 소속 공방 전체 조회 → 상태 무관 본인 소유 전부 반환(최신 생성순)
  - Response `200 OK`:
    ```json
    {
      "statusCode": 200,
      "timestamp": "2026-05-25T18:10:00.000Z",
      "path": "/api/v1/partner/stores",
      "message": "내 공방 목록이 성공적으로 조회되었습니다.",
      "data": {
        "stores": [
          {
            "id": "store-seed-0001",
            "name": "흙과 사람",
            "ownerName": "김리듬",
            "status": "PUBLISHED",
            "createdAt": "2026-05-30T10:00:00.000Z"
          }
        ]
      },
      "error": null
    }
    ```
  - 에러:
    - `401 UNAUTHORIZED` — "인증이 필요합니다."
    - `403 FORBIDDEN` — "파트너 권한이 필요합니다."
    - `500 INTERNAL_SERVER_ERROR` — "공방 목록 조회 중 서버 오류가 발생했습니다."
  - 공통 응답 봉투: `{ statusCode, timestamp, path, message, data, error }`
