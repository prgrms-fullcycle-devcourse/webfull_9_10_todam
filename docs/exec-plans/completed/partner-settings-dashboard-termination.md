# Feature Plan: 파트너 설정 - 대시보드, 해지

## Summary

- Goal: 승인된 파트너가 현재 선택 공방 기준 대시보드에서 예약·오늘 일정·제작 단계 현황을 확인하고, 설정 화면에서 파트너 자격을 자율 해지한다.
- Owner: FE / BE 미정
- Date: 2026-06-08

## Status

- [x] API 구현
- [x] UI 구현
- [x] API 연동

## Context

- 요구사항명세(고정): `docs/requirements.md`
  - `partner` §1 파트너 상태, §2 파트너 자율 해지.
  - 해지 가능 조건: 진행 중 예약(`PENDING`, `CONFIRMED`) 없음, 제작 중 작품 없음.
  - 해지 처리: `Partner.status = TERMINATED`, 연결 Store `SUSPENDED`, Class `INACTIVE`, 신규 예약 차단, 마이페이지 이동.
- 기능명세 DB 조회(2026-06-08):
  - `대시보드 조회`: 현재 선택 공방, 대기 예약, 오늘 일정, 예약 상태별 현황, 제작 단계별 현황, 진행 중 작품 수 조회.
  - `파트너 해지`: 기능명세 DB에 별도 항목 없음. 고정 요구사항과 API명세를 기준으로 계획한다.
- API명세 DB 조회(2026-06-08):
  - `GET /partner/artworks/count-by-step` — 제작 단계별 작품 수 조회.
  - `DELETE /partners/me` — 파트너 해지.
- 제공 시안 확인(2026-06-08):
  - `C:/Users/FORYOUCOM/AppData/Local/Temp/image 4.svg` — 온보딩·공방 목록과 함께 제시된 `P-02 대시보드(핵심)` 시안.
  - `C:/Users/FORYOUCOM/AppData/Local/Temp/image 121.svg` — `대시보드 — 메인`, `대시보드 — 액션 집중`, `설정(재정렬)` 시안.
  - `C:/Users/FORYOUCOM/AppData/Local/Temp/메인.png` — **대시보드 최종 화면 명세 정본**. 앞선 탐색 시안보다 우선한다.
  - 최종 표시 항목: 현재 공방 카드와 전환, 대기 중인 예약 목록, 오늘의 일정, 제작 중인 작품 단계별 수.
  - 빈 오늘 일정에서는 `예약 등록하기`를 노출한다.
  - 공방 전환 버튼은 공방별 오늘 예약 수를 표시하는 바텀시트를 연다.
  - `C:/Users/FORYOUCOM/AppData/Local/Temp/설정 - 회원탈퇴 - 모달.png`, `C:/Users/FORYOUCOM/Downloads/Description.png` — 설정 탈퇴 확인 모달/동작 참고.
  - 첨부 명세 원문은 `회원탈퇴`이나 본 계획의 endpoint는 `DELETE /partners/me` 파트너 해지다. 본 계획에서는 UI 패턴만 참고하고, 카피는 파트너 자격 해지 의미로 수정한다.
- 연관 계획:
  - `docs/exec-plans/active/partner-reservation-management.md` — 일별 예약 목록/월별 현황 계약.
  - `docs/exec-plans/active/partner-artwork-management.md` — 작품 단계 집계 API 확장 계약.
  - `docs/exec-plans/active/파트너-센터-이동하기-공방-등록하기.md` — `/partner` 진입·상태 게이트.
  - `docs/exec-plans/active/마이 - 회원탈퇴.md` — 승인 파트너의 회원 탈퇴 전 파트너 해지 선행.
- 현재 구현:
  - `/partner`는 `CurrentStoreSection`과 placeholder 카드만 존재한다.
  - `/partner/settings`는 공방 관리 진입만 존재하며 해지 UI는 없다.
  - `GET /partner/artworks/count-by-step`은 BE 구현 완료, FE 연동 없음.
  - `GET /partner/stores/{storeId}/reservations`는 BE 구현 완료. 대시보드 전용 집계 계약은 없음.
  - `apps/api/src/modules/partner/`는 빈 스캐폴드이며 `DELETE /partners/me`는 미구현이다.

## Open Decisions

- ~~**D1. 대시보드 예약 영역 API 계약**~~ **해소(최종 화면 명세)**:
  - 대기 중인 예약: `GET /partner/stores/{storeId}/reservations/pending-summary`를 추가한다. 모든 미래 `PENDING` 예약을 날짜별 건수로 집계해 반환하며 FE가 노출 개수를 필터링한다. 원본 예약 전체를 내려주지 않는다.
  - 오늘의 일정: 기존 `GET /partner/stores/{storeId}/reservations?date={today}` 재사용. 예약 카드에 시간, 소요 시간, 클래스명, 예약자명/인원, 상태를 표시한다.
  - 별도 대시보드 통합 API는 만들지 않는다.
- ~~**D2. 대시보드 카드 상세 필드와 이동 경로**~~ **부분 해소(제공 시안)**:
  - 대기 중인 예약 날짜 카드 클릭 → 예약 목록으로 이동하며 해당 날짜 선택.
  - 오늘 일정 `모두 보기` → 오늘 날짜 필터가 적용된 예약 목록으로 이동.
  - 오늘 일정 카드 클릭 → 해당 예약 상세 화면으로 이동.
  - 오늘 일정 필드: 시간, 소요 시간, 클래스명, 예약자명/인원, 상태(`확정` 초록 / `대기` 노랑).
  - 제작 중인 작품 `자세히 보기` → 작품 목록 화면으로 이동.
  - 하단 예약/작품/설정 버튼 → 각 목록/설정 화면으로 이동.
  - 현재 공방 카드: 노출 상태, 공방명, 지역, 전환 버튼.
  - 정확한 route query 표현은 FE 구현 시 기존 예약 목록 query 계약에 맞춘다.
- ~~**D3. 작품 집계 계약 충돌**~~ **해소(메인.png)**: 대시보드는 API명세 원본 `{ drying, bisqueFiring, glazing, glazeFiring }`만 사용한다. `group`, `total`, `steps` 확장은 작품 관리 화면 소관이며 대시보드 계약에 포함하지 않는다.
- ~~**D4. 해지 본인 확인 방식**~~ **해소(사용자 결정)**: 별도 비밀번호/소셜 재인증 없이 확인 모달의 `탈퇴하기` CTA 클릭으로 `DELETE /partners/me`를 호출한다.
- ~~**D5. 해지 cascade 정본 충돌**~~ **해소(사용자 결정)**: 하나의 transaction에서 `Partner.status = TERMINATED`, `Partner.terminatedAt = now()`, 모든 Store `SUSPENDED`, 모든 Class/Program `INACTIVE`, `User.isPartner = false`, 신규 예약 차단을 처리한다.
- ~~**D6. 해지 후 클라이언트 인증/이동 처리**~~ **해소(사용자 결정)**: 해지 성공 시 모든 refresh session과 로컬 access token을 제거해 로그아웃하고 비인증 메인 `/`으로 이동한다.
- ~~**D7. 해지 확인 UI와 실패 안내**~~ **해소(제공 모달 참고)**:
  - 설정 화면의 `파트너 자격 해지` 클릭 → 확인 모달 노출.
  - 취소 CTA: `다음에 하기`.
  - 위험 CTA: `자격 해지하기` → 해지 API 호출.
  - 모달 제목: `파트너 자격을 해지하시겠어요?`
  - 모달 설명: `해지하면 등록한 공방과 클래스 운영이 중단되고 파트너 기능을 이용할 수 없어요.`
  - 첨부 명세의 `회원탈퇴`, `클래스와 수강생 리뷰가 모두 삭제` 카피는 사용하지 않는다.
  - `ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST`는 해지 불가 안내 모달 또는 토스트로 표시한다.
- ~~**D8. 대시보드 최종 레이아웃 선택**~~ **해소(메인.png)**: 현재 공방 → 대기 중인 예약 → 오늘의 일정 → 제작 중인 작품 순서의 단일 스크롤 화면으로 구현한다. 액션 집중, 주간 통계, 방문자 수, 완성 대기, 지연 중은 범위에서 제외한다.
- ~~**D9. 대기 예약 날짜 목록 범위/정렬**~~ **해소(사용자 결정)**: BE가 현재 날짜 이후 모든 `PENDING` 예약을 날짜별로 집계해 가까운 날짜순으로 반환한다. FE가 화면에서 표시할 날짜 개수를 필터링한다.
- ~~**D10. 공방 전환 바텀시트 데이터**~~ **해소(사용자 결정)**: 기존 `GET /partner/stores` 각 item에 `todayReservationCount`를 추가한다.
- ~~**D11. 예약 등록하기 목적지**~~ **해소(기존 구현 확인)**: `POST /partner/stores/{storeId}/reservations` 수동 예약 등록 API는 이미 구현되어 있다. 빈 일정의 `예약 등록하기`는 partner-reservation-management의 수동 예약 등록 FE 플로우로 이동한다. 정확한 FE route는 해당 plan 구현 시 확정한다.
- ~~**D12. 해지 모달 최종 카피**~~ **해소(사용자 결정)**: 기능을 `파트너 자격 해지`로 정의하고 D7의 제목·설명·CTA를 사용한다.

## API Contract (스냅샷)

공통 응답 envelope는 `statusCode`, `timestamp`, `path`, `message`, `data`, `error`를 따른다.

### 데이터 모델

- `User`: `id`, `isPartner`. 해지 성공 시 `isPartner = false`.
- `Partner`: `userId`, `status`, `terminatedAt`. 해지 가능 상태는 `APPROVED`, 성공 상태는 `TERMINATED`.
- `Store`: Partner 소유 공방. 해지 성공 시 모두 `SUSPENDED`.
- `Program`(요구사항의 Class): 공방 클래스. 해지 성공 시 모두 `INACTIVE`.
- `Reservation`: 해지 차단 상태 `PENDING | CONFIRMED`.
- `Artwork`: 진행 중 작품이 존재하면 해지 차단. 종료 상태 집합은 artwork 도메인 계약을 재사용한다.

### `GET /partner/artworks/count-by-step` — 제작 단계별 작품 수

- Guard: `AuthGuard + PartnerGuard`.
- Query: `storeId?` — 지정 시 파트너 소유 공방인지 검증.
- `200 data` 정본:
  ```json
  {
    "drying": 12,
    "bisqueFiring": 8,
    "glazing": 4,
    "glazeFiring": 2
  }
  ```
- Errors: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`.
- 현재 BE 구현 완료. 대시보드는 원본 4단계 응답을 유지한다.

### `GET /partner/stores/{storeId}/reservations` — 대시보드 예약 데이터 후보

- 기존 partner-reservation-management 계약/구현을 재사용한다.
- 오늘의 일정: `date={today}`. 시간 오름차순으로 표시한다.
- 현재 응답 필드: `id`, `programTitle`, `scheduledAt`, `reserverName`, `participantCount`, `status`, `source`, `createdAt`.
- 화면의 소요 시간(`2시간`) 표시에 필요한 `durationMinutes`를 item 응답에 추가한다.
- 오늘 일정 목록/상세 route에 연결한다.

### `GET /partner/stores/{storeId}/reservations/pending-summary` — 대기 예약 날짜별 집계

- Guard: `AuthGuard + PartnerGuard` + 공방 소유권.
- Request body: 없음.
- 처리: 현재 날짜(KST) 이후 `PENDING` 예약 전체를 날짜별로 집계하고 가까운 날짜순으로 반환한다.
- 원본 예약 item은 반환하지 않는다. FE는 전체 날짜 집계 중 화면에 표시할 개수를 선택한다.
- `200 data`:
  ```json
  {
    "dates": [
      { "date": "2026-05-25", "reservationCount": 2 },
      { "date": "2026-06-03", "reservationCount": 5 }
    ]
  }
  ```

### `GET /partner/stores` — 공방 전환 목록 확장

- 기존 현재 공방/공방 목록 API로 공방명, 지역, 노출 상태, 선택 상태를 제공한다.
- 각 공방 item에 KST 오늘 기준 예약 수 `todayReservationCount: number`를 추가한다.
- 전환 바텀시트에서 공방명과 `오늘 예약 N건`을 표시한다.

### `DELETE /partners/me` — 파트너 자율 해지

- Guard: 유효한 Access Token. 현재 Partner가 `APPROVED`인지 검증.
- Request body: 없음. 별도 본인 재인증 없이 확인 모달 CTA로 호출한다.
- 처리:
  1. 파트너 소유 모든 Store 조회.
  2. `PENDING | CONFIRMED` 예약 또는 미완료 작품 존재 시 거부.
  3. `Partner.status = TERMINATED`.
  4. `Partner.terminatedAt = now()`.
  5. 모든 Store `SUSPENDED`, 모든 Class/Program `INACTIVE`.
  6. `User.isPartner = false`.
  7. 모든 refresh session 만료.
- `200 data`: `null`.
- Errors:

| status | code | 의미 |
|---|---|---|
| 400 | `ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST` | 활성 예약 또는 미완료 작품 존재 |
| 401 | `UNAUTHORIZED` | 인증 정보 무효/만료 |
| 404 | `PARTNER_NOT_FOUND` | 해지 가능한 파트너 없음 |
| 500 | `INTERNAL_SERVER_ERROR` | 해지 처리 실패 |

## Scope

- In:
  - `/partner` 현재 선택 공방 기반 대시보드 UI, loading/error/empty 상태.
  - 로고 헤더와 알림 진입점.
  - 현재 공방 카드: 노출 상태, 공방명, 지역, 공방 전환.
  - 공방 전환 바텀시트: 공방 목록, 오늘 예약 수, 새 공방 등록하기.
  - 대기 중인 예약 날짜별 카드.
  - 오늘 일정 목록과 예약 탭/상세 이동.
  - 오늘 일정이 없을 때 empty state와 `예약 등록하기`.
  - 제작 중인 작품 단계별 수와 작품 목록 이동.
  - 제작 단계별 작품 수 `GET /partner/artworks/count-by-step?storeId=...` 연동.
  - 대기 예약·오늘 일정 `GET /partner/stores/{storeId}/reservations` 연동.
  - 공방 전환 시 모든 대시보드 query 재조회.
  - `/partner/settings`에 파트너 해지 진입점, 확인 UI, 실패 안내, 성공 후 권한/라우팅 갱신.
  - `DELETE /partners/me` BE 구현과 shared contract.
- Out:
  - 파트너 신청/승인/정지, 공방·클래스 관리 구현.
  - 작품 관리 상세/상태 변경.
  - 예약 관리 상세/확정/거절.
  - 일반 회원 탈퇴(`DELETE /users/me`).
  - 액션 집중 화면, 주간 통계, 방문자 수, 운송장/픽업/작품 진행 action card.
  - 신규 대시보드 통합 endpoint.

## Plan

1. **계약 고정**: 해지 endpoint와 UI 용어를 `파트너 자격 해지`로 통일하고 shared/API/UI 계약을 기준으로 구현한다.
2. **Shared contract**: 예약 목록 item에 `durationMinutes`를 추가하고, 대기 예약 날짜별 집계와 `todayReservationCount`, `DELETE /partners/me` 성공/에러 타입을 추가한다.
3. **해지 BE**: partner 모듈 controller/use-case/repository를 구현한다. 승인 상태와 차단 조건을 검증하고 하나의 transaction에서 Partner/Store/Program/User 상태 전이와 세션 만료를 수행한다.
4. **대시보드 FE**: placeholder를 최종 명세 기반의 현재 공방 카드, 대기 중인 예약, 오늘 일정, 제작 중인 작품으로 교체하고 기존 예약/작품 query를 연결한다. 공방 변경 시 query key가 storeId를 포함해 재조회되도록 한다.
5. **설정/해지 FE**: 설정 메뉴에 해지 진입점과 확인 UI를 추가하고 `DELETE /partners/me`를 연결한다. 성공 시 인증·partner onboarding/current-store cache를 무효화하고 비인증 메인 `/`으로 이동한다.
6. **통합 검증**: 대시보드 공방 전환, 빈 데이터, 401/403, 해지 차단/성공/cascade/재진입 차단을 검증한다.

## Out (단계별 완료물)

- API:
  - [x] `GET /partner/artworks/count-by-step` 계약 정렬/회귀 검증.
  - [x] `GET /partner/stores/{storeId}/reservations` 오늘 일정 조회 + `durationMinutes`.
  - [x] `GET /partner/stores/{storeId}/reservations/pending-summary` 날짜별 전체 대기 예약 집계.
  - [x] `GET /partner/stores` item의 `todayReservationCount`.
  - [x] `POST /partner/stores/{storeId}/reservations` 기존 구현 재사용.
  - [x] `DELETE /partners/me` partner 모듈 구현.
- UI:
  - `/partner` 현재 공방 카드, 대기 예약 날짜 카드, 오늘 일정, 제작 단계 현황과 상태 화면.
  - 공방 전환 바텀시트와 오늘 일정 empty state.
  - `/partner/settings` 파트너 해지 진입/확인/결과 UI.
- 연동:
  - current store 변경 기반 대시보드 재조회.
  - 해지 성공 후 partner 권한/cache/route 갱신.

## Risks

- 예약 목록 응답에는 현재 `durationMinutes`만 부족하므로 기존 API 계약 확장이 필요하다.
- 대기 예약은 원본 전체가 아니라 날짜별 집계 전체를 반환해 payload 증가를 제한한다.
- `GET /partner/stores`에 오늘 예약 수 집계를 추가하므로 목록 조회 쿼리 성능과 N+1 방지 검증이 필요하다.
- 작품 집계 API는 기존 API명세와 artwork 계획의 확장 계약이 달라 contract drift 위험이 있다.
- 해지 cascade를 transaction으로 묶지 않으면 Partner만 종료되고 Store/Class가 운영 상태로 남을 수 있다.
- 파트너 해지 성공 시 일반 사용자 계정도 로그아웃된다. 이는 사용자 결정이며 회원 데이터 자체는 삭제하지 않는다.
- 첨부 모달이 회원탈퇴 카피를 사용하므로 실제 파트너 해지 동작과 혼동될 위험이 있다.

## Validation

- Tests:
  - 작품 집계: storeId 소유권, 네 단계 count, 빈 데이터 0, 401/403.
  - 해지: APPROVED 정상 성공, 비승인/기해지 거부, 활성 예약 차단, 미완료 작품 차단, 승인된 cascade transaction, `isPartner=false`.
  - FE: current store 변경 시 query 재조회, dashboard loading/error/empty, 해지 오류 코드별 안내, 성공 후 cache/route 갱신.
  - 대시보드 이동: 대기 예약 날짜 카드, 오늘 일정 모두 보기/상세, 작품 자세히 보기, 예약 등록하기, 공방 전환.
- Manual checks:
  - 두 공방 간 전환 시 대시보드 데이터가 섞이지 않는다.
  - 현재 공방 → 대기 중인 예약 → 오늘의 일정 → 제작 중인 작품 순서와 CTA가 최종 화면 명세를 따른다.
  - 예약/작품 없는 공방은 빈 상태를 노출한다.
  - 활성 예약/작품이 있으면 해지되지 않고 안내가 보인다.
  - 정상 해지 후 파트너 센터 접근이 차단되고 확정 목적지로 이동한다.
- Observability:
  - 파트너 해지 성공/거부 로그에 `userId`, `partnerId`, 차단 사유, `terminatedAt` 기록. 개인정보/토큰은 기록하지 않는다.
- 실행 결과(2026-06-08, BE):
  - `corepack pnpm --filter @todam/api test -- --runInBand` — 25 suites, 112 tests 통과.
  - `corepack pnpm --filter @todam/api typecheck` — 통과.
  - `corepack pnpm --filter @todam/api lint` — 오류 없음, 기존 경고 4건.
  - `corepack pnpm --filter @todam/shared typecheck` / `lint` / `build` — 통과.
  - `TEST_DATABASE_URL=...integration corepack pnpm --filter @todam/api test:integration` — 실제 PostgreSQL KST 대기 예약 집계 테스트 통과.
  - `git diff --check` — 통과.

## Decision Log

- (2026-06-08) 기능명세 DB에 `파트너 해지` 항목이 없음을 확인. 고정 요구사항과 `DELETE /partners/me` API명세를 정본 후보로 사용한다.
- (2026-06-08) 대시보드 예약 영역에 대응하는 단일 확정 API가 없어 D1로 보류했다. 기존 예약 목록 API 재사용 가능성만 기록하고 신규 endpoint는 만들지 않았다.
- (2026-06-08) `GET /partner/artworks/count-by-step`은 BE 구현 완료, `DELETE /partners/me`는 partner 모듈 빈 스캐폴드로 미구현임을 확인했다.
- (2026-06-08) 사용자 제공 시안 2건을 확인해 대시보드 표시 항목과 액션 종류를 계획에 반영했다. 두 시안의 구성 차이와 집계 정의는 D8/D9로 보류했다.
- (2026-06-08) 사용자 제공 `메인.png`를 대시보드 최종 정본으로 지정했다. 앞선 액션 집중/주간 통계 가정을 제거하고 기존 예약 목록 API 2회 조회 + 작품 집계 API 재사용으로 계약을 좁혔다.
- (2026-06-08) 사용자 결정: 미래 대기 예약은 BE가 날짜별 건수 전체를 집계해 반환하고 FE가 표시 개수를 필터링한다. 원본 예약 전체 반환은 피한다.
- (2026-06-08) 사용자 결정: `GET /partner/stores`에 `todayReservationCount` 추가. 수동 예약 등록 API는 기존 `POST /partner/stores/{storeId}/reservations` 구현을 재사용한다.
- (2026-06-08) 실제 예약 목록 응답 점검: 화면 필드 중 `durationMinutes`만 누락되어 계약 확장 대상으로 확정했다.
- (2026-06-08) 사용자 결정: 별도 재인증 없이 확인 모달 CTA로 파트너 해지, 권장 cascade 적용, 성공 시 로그아웃 후 비인증 메인 `/` 이동.
- (2026-06-08) 첨부 모달은 `회원탈퇴` 명세이지만 본 계획은 `DELETE /partners/me` 파트너 해지다. UI 패턴만 참고하고 최종 카피는 D12에서 정한다.
- (2026-06-08) 사용자 결정: 기능과 UI 용어를 `파트너 자격 해지`로 확정. 모달은 `파트너 자격을 해지하시겠어요?` / `자격 해지하기`를 사용한다.

## Outcome

- Status: BE 구현 완료. 대시보드 UI와 API 연동은 미완료.
- BE 결과: 예약 목록 `durationMinutes`, KST 미래 대기 예약 날짜 집계, 공방별 KST 오늘 예약 수, 파트너 자격 해지 transaction/cascade/session 만료와 shared 계약을 구현했다. API의 KST 날짜 계산은 `common/date/kst-date.util.ts`로 공통화했다. 해지 transaction은 Serializable + 충돌 재시도를 적용했고, 대기 예약 날짜 집계는 PostgreSQL KST `GROUP BY`로 이동했다. 공방 목록/해지 성공 DTO는 shared Zod 계약을 직접 사용한다.
- Follow-up: `/impl partner-settings-dashboard-termination fe`로 UI/API 연동을 진행한다.
