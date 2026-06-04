# Feature Plan: 메인 온보딩

## Summary

- Goal: 회원가입 직후 최초 로그인 사용자에게 서비스 이용 방향(공방 예약 / 공방 등록)을 선택하도록 유도하고, 선택에 따라 화면을 분기 처리한다.
- Owner:
- Date: 2026-06-02

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
각 항목 체크 기준:
- API 구현: 실 BE(`apps/api`) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: **실 API** 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크(연동 아님).
-->

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

<!-- 요구사항=docs/requirements.md. 기능/API명세=Notion DB에서 notion-fetch.mjs --find로 select. -->

- 요구사항명세서(고정): docs/requirements.md — `auth` 도메인(회원가입, 로그인 처리), `partner` 도메인(파트너 신청), `store` 도메인(공방 등록 플로우) 참조
- 기능명세: `온보딩` (기능명세 DB `b242ee66b06c8349805601ce4a05247a` — `--find "온보딩"`)
- API명세:
  - `GET /users/me` (API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25`)
  - `POST /auth/login` (API명세 DB)
  - 온보딩 완료 저장 전용 API — 명세 없음 (Open decision #1 참조)
- Relevant design docs: DESIGN.md — 온보딩 바텀시트, 선택 버튼(variant enum, 상태별 토큰) 확보 필요
- Open decisions:
  1. **온보딩 완료 여부 저장 방식 미확정**: `GET /users/me` 및 로그인 응답에 `isOnboarded` 또는 유사 필드가 없음. 아래 중 하나를 결정해야 함:
     - (A) `PATCH /users/me` 또는 신규 `POST /users/me/onboarding` 엔드포인트 추가하여 서버에 저장
     - (B) `GET /users/me` 응답에 `isOnboarded: boolean` 필드 추가
     - (C) 클라이언트 로컬스토리지에만 저장 (서버 상태 없음 — 기기 변경 시 재진입)
     → **결정 전 BE 구현 착수 금지**
  2. **온보딩 재진입 판단 기준**: "이미 온보딩을 완료한 사용자는 재진입하지 않는다"는 조건을 어디서 판단할지 — 서버 응답 필드 vs. 클라이언트 로컬 플래그
  3. **UI: DESIGN.md 준수** — 온보딩 바텀시트의 variant enum, size별 height/padding/gap/radius, 상태별 토큰이 DESIGN.md에 정의되어 있는지 확인 필요. 미정의 시 이 항목에 질문 추가.

## API Contract (스냅샷)

<!-- planner가 Notion API명세를 읽어 여기에 고정. BE/FE/reviewer가 바인딩하는 SSOT.
     Notion 원본이 바뀌면 재plan → 이 섹션 diff로 추적. -->

### 데이터 모델

```typescript
// 현재 확인된 User 응답 모델 (GET /users/me 200 OK 기준)
interface UserProfile {
  userId: string;       // UUID
  email: string;
  nickname: string;
  isPartner: boolean;
  createdAt: string;    // ISO 8601
  // isOnboarded 필드 없음 — Open decision #1
}
```

### 엔드포인트 (확정분)

#### `GET /users/me` — 내 프로필 조회

- 접근 주체: AuthGuard (User 이상)
- Request Headers: `Authorization: Bearer {accessToken}`
- Response `200 OK`:

```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T18:05:00.789Z",
  "path": "/users/me",
  "message": "프로필 정보가 성공적으로 조회되었습니다.",
  "data": {
    "user": {
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "email": "user@example.com",
      "nickname": "토담이",
      "isPartner": false,
      "createdAt": "2026-05-24T16:55:00.000Z"
    }
  },
  "error": null
}
```

- Response `401 Unauthorized`:

```json
{
  "statusCode": 401,
  "timestamp": "2026-05-24T18:05:03.123Z",
  "path": "/users/me",
  "message": "인증 정보가 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```

- Response `404 Not Found`:

```json
{
  "statusCode": 404,
  "timestamp": "2026-05-24T18:05:05.456Z",
  "path": "/users/me",
  "message": "존재하지 않거나 탈퇴 처리된 회원입니다.",
  "data": null,
  "error": "USER_NOT_FOUND"
}
```

#### `POST /auth/login` — 이메일 로그인 (온보딩 진입점)

- 접근 주체: Guest
- Request Body:

```json
{
  "email": "user@example.com",
  "password": "Password1234!"
}
```

- Response `200 OK` — 온보딩 분기에 필요한 필드:

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "user": {
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "email": "user@example.com",
      "nickname": "토담이",
      "isPartner": false
      // isOnboarded 없음 — Open decision #1
    }
  },
  "error": null
}
```

#### `PATCH /users/me` or `POST /users/me/onboarding` — 온보딩 완료 저장 (미확정)

> **Open decision #1 해결 후 이 섹션을 채울 것.** 현재 API 명세 없음. BE 구현 착수 금지.

---

### 추론된 API 목록 (명세 조회 근거)

| 용도 | METHOD | URI | 명세 상태 |
|------|--------|-----|-----------|
| 최초 로그인 사용자 판단 | GET | `/users/me` | 확정 (스냅샷 위) |
| 로그인 완료 후 온보딩 진입 트리거 | POST | `/auth/login` | 확정 (스냅샷 위) |
| 온보딩 완료 여부 저장 | PATCH or POST | `/users/me` or `/users/me/onboarding` | **미확정 — Open decision #1** |

## Scope

- In:
  - 회원가입 직후 최초 로그인 시 온보딩 바텀시트 노출
  - 이용 유형 선택 UI (공방 예약하기 / 공방 등록하기)
  - 선택에 따른 화면 분기 처리
    - 공방 예약하기 선택 → 온보딩 시트 닫기 (메인 화면 유지)
    - 공방 등록하기 선택 → 공방 등록 폼 화면으로 이동
  - 온보딩 완료 상태 저장 (Open decision #1 결정 후 구현)
  - 이미 온보딩을 완료한 사용자의 재진입 차단 로직
  - 이용 유형 미선택(건너뛰기) 처리 — partner 권한 미부여
- Out:
  - 공방 등록 폼 자체 구현 (별도 기능 `첫 공방 등록` 플랜에서 처리)
  - 소셜(카카오/구글) 로그인 후 온보딩 처리 (동일 로직 적용 가능하나 별도 확인 필요)
  - 알림 수신 동의 수집 (별도 기능)
  - 온보딩 튜토리얼 / 서비스 소개 슬라이드 (명세에 없음)

## Plan

### BE

1. Open decision #1 결정 후 온보딩 완료 여부를 저장할 필드/엔드포인트 추가
   - `users` 테이블에 `is_onboarded boolean DEFAULT false` 컬럼 추가 (또는 별도 설계)
   - `GET /users/me` 응답에 `isOnboarded` 필드 포함
   - 온보딩 완료 시 해당 값을 `true`로 갱신하는 엔드포인트 구현
2. 엔드포인트에 AuthGuard 적용 및 본인 검증 로직 구현
3. 단위 테스트 작성 (온보딩 완료 저장, 이미 완료된 사용자 처리)

### FE

1. UI: DESIGN.md에서 온보딩 바텀시트 variant enum, size별 토큰 확보 (Open decision #3)
2. 로그인/회원가입 완료 후 `GET /users/me` 호출하여 `isOnboarded` 확인
3. `isOnboarded === false` 인 경우 온보딩 바텀시트 노출
4. 바텀시트 UI 구현 — 이용 유형 선택 버튼 2종 (공방 예약하기 / 공방 등록하기) + 건너뛰기
5. 선택에 따른 화면 분기 처리 구현
   - 공방 예약하기 → 온보딩 완료 API 호출 → 시트 닫기
   - 공방 등록하기 → 온보딩 완료 API 호출 → `/partner/stores/new` (공방 등록 폼)으로 이동
   - 건너뛰기 → 온보딩 완료 API 호출 (partner 권한 미부여) → 시트 닫기
6. 이미 `isOnboarded === true` 인 경우 바텀시트 미노출 처리
7. 네트워크 오류 시 fallback 처리 (명세: "온보딩 저장에 실패할 수 있다")
8. 통합 테스트 — 최초 로그인 진입, 재진입 차단, 각 분기 라우팅

## Out (단계별 완료물)

- API: <!-- 구현된 엔드포인트, 파일 -->
- UI: <!-- 구현된 화면, 컴포넌트 -->
- 연동: <!-- 연결 지점, 검증 결과 -->

## Risks

- **온보딩 API 미설계**: Open decision #1이 해결되지 않으면 BE/FE 모두 착수 불가. 우선순위 높음.
- **소셜 로그인 분기**: 카카오/구글 OAuth 로그인 후 온보딩 진입 경로가 이메일 로그인과 동일한지 확인 필요. 소셜 로그인 응답에도 `isOnboarded` 필드가 포함되어야 함.
- **공방 등록 폼 의존**: 온보딩에서 "공방 등록하기"를 선택 시 이동하는 `/partner/stores/new` 화면은 `첫 공방 등록` 기능 플랜과 의존성 있음. 해당 라우트가 존재해야 분기 처리 가능.

## Validation

- Tests:
  - `isOnboarded = false`인 사용자 로그인 → 바텀시트 노출 확인
  - `isOnboarded = true`인 사용자 로그인 → 바텀시트 미노출 확인
  - 공방 예약하기 선택 → 시트 닫힘, `isOnboarded = true` 저장 확인
  - 공방 등록하기 선택 → 공방 등록 폼 이동, `isOnboarded = true` 저장 확인
  - 건너뛰기 → 시트 닫힘, `isOnboarded = true` 저장, `isPartner = false` 유지 확인
  - 네트워크 오류 시 fallback 동작 확인
- Manual checks:
  - 회원가입 직후 최초 로그인 플로우 전체 수동 확인
  - 기존 사용자 재로그인 시 온보딩 미노출 확인
- Observability:
  - 온보딩 완료 저장 API 에러율 모니터링

## Decision Log

- 2026-06-02: 기능명세 DB에 "메인 온보딩"이 아닌 "온보딩"으로 등록되어 있음. 연관화면: 메인. 이 플랜은 해당 기능명세 기준으로 작성됨.
- 2026-06-02: API 명세 DB에 온보딩 전용 엔드포인트 없음. `GET /users/me` 응답에 `isOnboarded` 필드 부재. Open decision #1로 등록.

## Outcome

- Status: 미착수 (Open decision #1 해결 대기)
- Follow-up: Open decision #1 결정 후 BE 엔드포인트 명세 작성 → 이 파일 API Contract 섹션 업데이트 → 구현 착수
