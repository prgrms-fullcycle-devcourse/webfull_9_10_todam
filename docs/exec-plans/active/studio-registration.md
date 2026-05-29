# 공방 등록 (파트너 신청)

## Summary

- Goal: 유저가 첫 공방을 등록하면 곧 파트너 신청이 되는 4단계 폼 + 제출 완료 화면을 구현한다. 1차로 API 연동 없이 화면/상태를 mock으로 완성하고, 폼 필드에서 DTO 초안을 역산한다.
- Owner: 파트너 담당
- Date: 2026-05-29

## Context

- Relevant specs: Figma "공방 등록" 4단계 + 제출 완료(검토중/반려) 시안 5장.
- 유저 플로우: 유저 회원가입 → "공방 등록" = 파트너 신청. 첫 공방 등록이 신청 행위.
- 연계 문서:
  - `active/stepper-media-upload.md` — 대표 이미지 업로드(presigned)가 여기에 의존.
  - `completed/header-hook.md` — popup/sub Header(닫기 X) 사용.

### Open decisions (결정 완료)

- **롤 chicken-egg**: 신청 시점엔 user 롤. "공방 등록은 파트너만"은 2번째+ 공방 한정. 첫 등록 = user가 신청 → pending → 승인 시 partner 롤 + 공방 active.
- **API 연동 후행**: 엔드포인트/DTO 미확정. 화면을 mock으로 먼저 만들고, 폼 필드 → DTO 초안 도출 후 백엔드 합의.
- **DTO 도출 방향**: 화면 필드를 source로 역산. 본 문서 "DTO 초안" 섹션이 백엔드 제안서.

## Scope

### In

- 4단계 multi-step 폼 화면 (`features/studio-registration` + `entities/studio`).
- 단계 진행/검증/이전·다음 상태 관리 (mock).
- 제출 완료 화면 2종: 검토중 / 반려(사유 + 정보 수정하기).
- 폼 필드 → DTO 초안 도출.

### Out

- 실제 API 연동 (제출, OCR, 국세청 진위, URL 중복확인, 주소검색 wiring).
- 미디어 presigned 업로드 실연동 (`stepper-media-upload.md`에서 별도 처리).
- 롤 가드 / 2번째+ 공방 등록.
- 백엔드 신청 엔드포인트 / 심사 어드민.

## 화면 명세

### Step 1/4 — 사업자 정보

- 사업자 등록증 이미지 업로드: 카메라 → 갤러리/카메라 시트, 업로드 후 미리보기 교체, 우상단 X 삭제. (실연동 시) OCR로 자동입력 + 국세청 진위 검증.
- 필드: 사업자 등록번호(하이픈 없이 숫자), 상호명, 대표자명, 사업장 주소(주소검색 API, 도로명/지번), 상세 주소(주소 선택 후 활성화), 이메일.
- 안내: 이미 등록된 사업자번호 중복신청 불가.
- 다음: 필수 입력 시 활성화 → (실연동) 진위 검증 + 로딩 → 성공 2/4, 실패 토스트 "정확한 사업자 정보를 입력해 주세요".

### Step 2/4 — 공방 정보

- 대표 이미지(최대 5장): 카메라 추가 + X 삭제 — `StepperItemChild` 편집모드와 동일 패턴, 업로드는 presigned.
- 공방명.
- 공방 URL: `leadem.com/` 프리픽스 고정, slug만 입력, 실시간 중복확인, 영문/`-`/`_`만, 미입력 시 백에서 자동 생성.
- 전화번호: 숫자만/하이픈 자동, num keyboard.
- 공방 소개글(선택, 0/300자).
- 다음: 대표이미지 1장+·공방명·URL·전화번호 충족 시 → 3/4.

### Step 3/4 — 영업 정보

- 예약 오픈/마감(필수), 휴식 시작/종료(선택) — 바텀시트 타임피커. 휴식 미설정 시 "선택 안 함".
- 영업일 토글 chip(월~일), 선택 시 다크 배경, 전체 선택 기본.
- 편의 정보 체크박스: 주차, 반려동물 동반.
- 다음: 예약 오픈·마감 + 영업일 1개+ 선택 시 → 4/4.

### Step 4/4 — 예약 정보

- 예약 시간 간격: 1 / 1.5 / 2 / 3시간 (SegmentedControl류).
- 예약 취소 가능 기한: 체험일 N일 전까지 (counter Stepper -/+).
- 시간대별 최대 정원: 최대 N명 (counter Stepper -/+).
- 예약 승인 방식: 승인 후 확정 / 자동 확정 — **`RadioInput` 재사용**.
- 신청하기: 전체 충족 시 → 공방등록 API → 성공 검토중, 실패 반려 화면.

### 제출 완료

- 검토중: "등록한 공방을 검토중이에요", 서류검토 카드 "검토 중" 배지, 공방 요약(상호명·주소·사업자번호·신청일시·이메일), 홈으로.
- 반려: "공방 등록이 반려되었어요", 반려 배지 + 사유, 정보 수정하기(반려 시만, 1/4단계 이동 + 입력 데이터 복원), 홈으로.

### 공통

- Header: popup type, 뒤로가기(이전 단계) + 닫기 X(등록 중단 → 공방 관리 리스트).
- 단계 진행바: ProgressBar.

## 컴포넌트 재사용

| 화면 요소 | 컴포넌트 |
|---|---|
| 단계 진행바 | `ProgressBar` |
| 대표 이미지 추가/삭제 | `StepperItemChild` 편집모드 패턴 + presigned 업로드 |
| 예약 시간 간격 | `SegmentedControl` |
| 취소 기한 / 최대 정원 | counter hook + Stepper(-/+) — 신규 or 기존 재사용 |
| 예약 승인 방식 | `RadioInput` |
| 편의 정보 | `Checkbox` |
| 검증 실패 알림 | `Toast` |
| 헤더 | `widgets/header` (popup) |
| 영업시간/휴식 | 바텀시트 타임피커 (`StandardBottomSheet` 기반, 신규 피커 필요) |

## DTO 초안 (백엔드 합의용)

```ts
// 사업자
businessRegistrationImageKey: string   // presigned key
businessNumber: string                 // 숫자만
companyName: string                    // 상호명
ownerName: string
address: { base: string; detail: string }
email: string

// 공방
imageKeys: string[]                    // max 5
studioName: string
studioSlug: string | null              // null이면 서버 자동생성
phone: string
intro?: string                         // max 300

// 영업
reservationOpenTime: string            // "HH:mm"
reservationCloseTime: string
breakStartTime?: string
breakEndTime?: string
businessDays: number[]                 // 0=일 ~ 6=토 등 (규약 합의)
amenities: { parking: boolean; pet: boolean }

// 예약
reservationIntervalMin: 60 | 90 | 120 | 180
cancelDeadlineDays: number
maxCapacityPerSlot: number
approvalType: "manual" | "auto"

// 상태 (서버)
status: "reviewing" | "rejected" | "approved"
rejectReason?: string
appliedAt: string
```

## 외부 / 백엔드 의존 (실연동 시)

- OCR (사업자등록증 자동입력).
- 국세청 사업자 진위확인.
- 주소검색 API (카카오/다음 — 프론트 직접 가능).
- 공방 URL slug 중복확인.
- 미디어 presigned 업로드 (`stepper-media-upload.md`).
- 공방등록 제출 / 심사 상태 조회 엔드포인트.

## Plan

1. `entities/studio` slice — 타입(위 DTO), 상태 enum, 표현 컴포넌트(요약 카드 등).
2. `features/studio-registration` slice — 4단계 폼 ui + 단계/검증 model(폼 상태, step 전환).
3. 라우트 배치 결정 후 페이지 연결 (후보: `app/partner/stores/new` — 현재 stub).
4. mock 데이터로 단계 전환·검증·제출 완료(검토중/반려) 흐름 완성.
5. 폼 필드 확정 → DTO 초안 백엔드 합의.
6. (후행) API/업로드/진위검증 wiring + 롤 가드.

## Risks

- 다단계 폼 상태 관리 복잡도 — step별 부분 검증 + 뒤로 시 데이터 보존. 폼 상태 단일 store로.
- URL slug 실시간 중복확인 debounce/race.
- 반려 → 정보 수정 시 입력 데이터 복원 (제출 payload 보존 필요).
- presigned 업로드 미완 시 대표 이미지 단계 mock 처리 → 실연동 전환 경계 명확히.
- 라우트 배치: `app/partner/*`는 파트너 전용 shell. 신청은 아직 user → 배치/가드 재검토.

## Validation

- Tests: 단계 전환·검증 로직 단위 (가능 시).
- Manual checks: 4단계 진행/뒤로/닫기, 각 단계 다음 버튼 활성 조건, 제출 완료 검토중·반려 분기, 반려 정보수정 데이터 복원.
- `pnpm --filter @todam/web typecheck` / `lint`.

## Decision Log

- 2026-05-29: 첫 공방 등록 = 파트너 신청으로 확정. 롤 가드는 2번째+ 공방에만.
- 2026-05-29: API 연동 후행, 화면 mock 우선 + 폼 필드에서 DTO 역산.

## Outcome

- Status: 계획 작성 완료. 구현 미착수.
- Follow-up: 라우트 배치 확정, presigned 업로드 연계(`stepper-media-upload.md`).
