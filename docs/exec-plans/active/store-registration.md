# 공방 등록 (store-registration)

## Summary

- Goal: 유저가 공방을 등록하는 4단계 폼 + 제출 완료(검토중/반려) 화면. 첫 등록은 곧 파트너 신청.
- 현재: **UI/플로우 + mock(MSW) 구현 완료.** 실 API·인증·외부연동(OCR/주소/업로드)은 후행.
- Owner: 파트너 담당 / Date: 2026-05-29

## Status

<!-- 게이트가 읽음. 셋 다 [x] 여야 completed/ 이동 가능. 현재 UI만 완료. -->

- [x] UI 구현
- [ ] API 구현
- [ ] API 연동

## Out (단계별 완료물)

- UI: 4단계 폼(사업자/공방/영업/예약) + 제출완료(검토중·반려) 화면, MSW mock 연동. `apps/web/src/features/store-registration`. 타입체크 통과.
- API: (미구현)
- 연동: (미구현 — 아래 "실연동 전환 체크리스트" 8항목)

## 용어

- slice 명 = `store-registration` (prisma `Store` 도메인 일치). 기존 "onboarding" 명칭 폐기.
- 첫 공방 등록 = 파트너 신청(USER→PARTNER 승격). 2번째+ = 파트너의 공방 추가. **둘 다 동일 플로우** (공방별 사업자 검증 필요).

## 진입 라우트

| 라우트 | 진입 | 주체 |
|---|---|---|
| `/apply` (`app/(user)/apply`) | 마이 > 파트너 신청하기 | user (첫 등록) |
| `/partner/stores/new` | 설정 > 공방관리 > 공방등록 | partner (2번째+) |

둘 다 `<StoreRegistrationFlow />` 한 줄. mode 분기 없음. 전역 store는 플로우 이탈 시 reset(unmount).

## 화면 (4단계 + 완료)

1. **사업자 정보** — 사업자등록증 업로드(박스+카메라) + 등록번호·상호명·대표자명·사업장주소(주소검색→상세)·이메일. OCR·진위검증 후행(현재 수기).
2. **공방 정보** — 대표이미지 그리드(최대5, presigned 후행=mock) + 공방명 + 공방URL(`leadem.com/` + slug, debounce 중복확인) + 전화번호 + 소개글(300자).
3. **영업 정보** — 예약 오픈/마감 + 휴식(선택) + 영업일 chip(월~일) + 편의정보(주차/반려동물). 타임피커는 native(바텀시트 후행).
4. **예약 정보** — 시간 간격(chip) + 취소기한·정원(Stepper) + 승인방식(RadioInput).
- **제출 완료**: 검토중(초록 hero + 검수 카드 + 요약 ResultTable) / 반려(빨강 + 사유 + 정보 수정하기). `?preview=rejected`로 반려 미리보기.

## 구조

```
packages/shared/                 ← 백·web 공유
  enums/                 상태값 (prisma 기준)
  constants/regex.ts     정규식 패턴 단일출처
  contracts/             zod 계약 (요청/응답 스키마+타입)
    fields.ts            공용 필드(email/phone/slug/businessNumber/password…)
    store-registration.ts  공방등록 액션 스키마
    like.ts              찜 토글
apps/web/src/
  shared/api/            client(apiFetch+인증헤더)·auth-token(주입지점)·types(봉투)
  shared/lib/            daumPostcode
  mocks/                 MSW (db·handlers·browser·MswProvider)
  features/store-registration/   ui(steps+Flow+Complete)·model(store·types)·api·queries
  features/toggle-like/          LikeToggleButton·api·queries (찜 동작)
  app/                   pages·QueryProvider·layout
```

- 검증 = zod 단일소스: `constants/regex` → `contracts/fields` → `contracts/<도메인>`(액션 단위). 폼 validity·mock·(백)DTO 동일 스키마 재사용.
- 데이터: TanStack Query (query=조회/mutation=쓰기). 인증헤더는 `auth-token.ts` 주입형(현재 토큰 null = 백 auth 미구현).
- mock: MSW가 `ApiResponse` 봉투로 계약대로 응답. `NEXT_PUBLIC_API_MOCKING`(.env.local, 기본 on).

## 백엔드 body 계약 (확정)

평탄 구조: top-level `name/slug/description/phone/address/latitude/longitude/convenienceInfo/images/autoConfirm` + `reservationIntervalMinutes/cancelDeadlineDays/maxCapacityPerSlot` + nested `businessDocument{documentUrl,ownerName,businessName,businessNumber,businessAddress,email}` + `operatingHours[]{dayOfWeek("MON"..),openTime,closeTime,breakStart,breakEnd}`. 스키마 = `storeRegistrationSubmitRequestSchema`.

## 실연동 전환 체크리스트 (mock → 실서버)

| # | 무엇 | 위치 | 내용 |
|---|---|---|---|
| 1 | mock 끄기 | `.env.local` | `NEXT_PUBLIC_API_MOCKING=disabled` + `NEXT_PUBLIC_API_URL`. mocks/ 코드 유지(자동 bypass) |
| 2 | 인증 연결 | `shared/api/auth-token.ts` | `setAuthTokenGetter(()=>authStore.accessToken)` |
| 3 | 401 refresh | `shared/api/client.ts` | 토큰 갱신+재시도 |
| 4 | 엔드포인트 경로 | `features/*/api.ts` | 현재 `/api/v1/partner/onboarding` 등 → 백 실제 경로 |
| 5 | OCR·진위검증 | `BusinessStep.tsx` | 수기 → 업로드 자동입력 + 진위 게이팅 |
| 6 | presigned 업로드 | BusinessStep·StoreInfoStep | `documentUrl`·`images` mock → 실업로드 key |
| 7 | geocode | `features/store-registration/api.ts` | mock `/geocode` → 카카오 로컬 API |
| 8 | 예약 필드 합의 | `contracts/store-registration.ts` | interval/cancelDeadline/maxCapacity 백 수용 확정 |

## 후행 (별도)

- 운영자 검수(승인/반려) admin — 승인 시 USER→PARTNER + Store PUBLISHED.
- 반려 → 정보 수정 링크 연결.
- 바텀시트 타임피커, Badge 색 variant(반려 danger).

## Decision Log

- 2026-05-29: 첫 등록=파트너 신청, 2번째+=공방 추가. 동일 플로우(공방별 사업자 검증).
- 2026-05-29: 계약/검증 = `packages/shared` zod 단일소스. 백 `createZodDto`로 공유.
- 2026-05-29: slice 명 `partner-onboarding` → `store-registration` (Store 도메인 일치).
- 2026-05-29: 라우트 `/apply`(user 영역). `/partner/*`(파트너 shell)과 분리.
- 2026-05-29: 찜 토글 = `features/toggle-like` (재사용 확실). 공방카드 entity는 재사용처 없어 미추출(rule of three).

## Outcome

- Status: UI/플로우/mock 완료. 타입체크 통과. 실 API·외부연동 후행.
- Follow-up: 위 실연동 체크리스트 8항목 + admin 검수.
