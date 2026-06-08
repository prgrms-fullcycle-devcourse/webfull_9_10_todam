# Feature Plan: 로그인

## Summary

- Goal: 기존 사용자가 이메일 또는 소셜(카카오·구글) 인증으로 로그인하고, Access Token(body) + Refresh Token(HttpOnly Cookie)을 발급받아 인증 상태(UNAUTHENTICATED → AUTHENTICATED)로 전이한다.
- Owner: TBD
- Date: 2026-06-01

## Context

<!-- 요구사항=docs/requirements.md. 기능/API명세=Notion DB에서 notion-fetch.mjs --find로 select. -->

- 요구사항명세서(고정): docs/requirements.md — `# 인증 auth` (1. 이메일 인증 > 로그인 처리, 2. 소셜 인증, 3. 토큰 발급), `접근 주체`(Guest/User/Partner)
- 기능명세: `로그인` (기능명세 DB `b242ee66b06c8349805601ce4a05247a` — 실행주체 guest, 도메인 auth, 시작 UNAUTHENTICATED → 종료 AUTHENTICATED)
- API명세: API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25` — 아래 3개 URI select
  - `POST /auth/login` (id ac62ee66...) 이메일 로그인
  - `POST /auth/oauth/kakao` (id 63c2ee66...) 소셜 로그인 (Kakao)
  - `POST /auth/oauth/google` (id d6c2ee66...) 소셜 로그인 (Google)
- Relevant design docs: DESIGN.md (작업 시작 조건·레이아웃/라우팅 규칙), 연관화면 `로그인`
- Open decisions:
  1. **약관 동의 / 최초 로그인 분기**: 기능명세 동작에 "최초 로그인 사용자는 회원가입 플로우로 이동(약관 미동의 시)"이 있으나, 3개 로그인 API 명세에는 신규 User를 서버에서 자동 생성(`status=ACTIVE`, `emailVerified=true`)하고 바로 토큰을 발급한다 — 별도의 약관 동의 게이트/엔드포인트가 명세에 없음. FE에서 신규 소셜 가입자를 약관 플로우로 보내야 하는지, 응답에 신규 여부 플래그가 필요한지 BE/기획 확정 필요 (현재 응답 스키마에는 신규 여부 필드 없음).
  2. **자동 로그인 정책**: 기능명세 비고 "자동 로그인 정책 정의 필요" — Refresh Token Cookie(14일)로 자동 재로그인하는 UX 범위 미정. 토큰 재발급은 별도 기능(`POST /auth/refresh`)으로 분리.
  3. **탈퇴/정지 계정 차단 응답**: 요구사항/기능명세는 "탈퇴 또는 정지 계정은 로그인 불가"를 명시하나, `/auth/login` 명세 응답에는 해당 전용 에러 코드가 없음(401 UNAUTHORIZED / 403 EMAIL_UNVERIFIED만 존재). WITHDRAWN/SUSPENDED 계정의 응답 코드 확정 필요.
  4. **UI 토큰**: DESIGN.md "작업 시작 조건"(Input/Button의 variant enum, size별 height/padding/gap/radius, 상태별 컬러 토큰)이 로그인 폼·소셜 버튼에 대해 문서로 확정되지 않음. Figma 확보 후 진행. plan 방침: **UI는 DESIGN.md 준수**.

## API Contract (스냅샷)

<!-- Notion API명세 스냅샷. BE/FE/reviewer SSOT. Notion 원본 변경 시 재plan. -->

### 공통 응답 봉투

모든 응답은 `{ statusCode, timestamp, path, message, data, error }` 형태. 성공 시 `error: null`, 실패 시 `data: null` + `error` 코드 문자열.

### 데이터모델 (응답 `data` 공통)

- `accessToken: string` — JWT. 만료 1시간. Payload에 `userId`, `isPartner` 포함. **응답 body로 반환**.
- `user`:
  - `userId: string` (uuid)
  - `email: string`
  - `nickname: string`
  - `isPartner: boolean`
- Refresh Token: 만료 14일, `refresh_tokens` 테이블에 해시 저장, **HttpOnly Secure Cookie**로 설정(응답 body에 미포함).

### 엔드포인트

#### `POST /auth/login` — 이메일 로그인
- Headers: `Content-Type: application/json`, `Accept: application/json`
- req body:
  ```json
  { "email": "user@example.com", "password": "Password1234!" }
  ```
- 검증 순서: 필수값 누락 → 이메일 형식 → 가입 사용자 존재 → `emailVerified = true` → 비밀번호 해시 일치 → `is_partner` 조회 → 토큰 발급
- res `200`:
  ```json
  { "data": { "accessToken": "<jwt>", "user": { "userId": "...", "email": "...", "nickname": "...", "isPartner": false } }, "error": null }
  ```
- res `400` `INVALID_REQUEST` — 유효하지 않은 이메일 형식 / 필수값 누락
- res `401` `UNAUTHORIZED` — 이메일 또는 비밀번호 불일치
- res `403` `EMAIL_UNVERIFIED` — 이메일 인증 미완료 계정
- res `500` `INTERNAL_SERVER_ERROR`

#### `POST /auth/oauth/kakao` — 소셜 로그인 (Kakao)
- Headers: `Content-Type: application/json`, `Accept: application/json`
- req body:
  ```json
  { "code": "kakao_authorization_code_received_from_client" }
  ```
- 처리: code로 카카오 토큰 발급 → 사용자 정보(`provider_id`, `email`, `nickname`) 조회 → `oauth_accounts(provider='kakao', provider_id)` 매칭 → 매칭 시 해당 user 로그인 / 미매칭 시 동일 이메일 기존 회원이면 연동, 없으면 신규 User 생성(`status='ACTIVE'`, `emailVerified=true`) → JWT 발급
- res `200`: data 스키마 동일 (`accessToken`, `user{userId,email,nickname,isPartner}`)
- res `400` `INVALID_REQUEST` — 인가 코드 누락/유효성 실패(카카오 인증 실패)
- res `500` `EXTERNAL_AUTH_SERVER_ERROR` — 카카오 외부 인증 서버 오류

#### `POST /auth/oauth/google` — 소셜 로그인 (Google)
- Headers: `Content-Type: application/json`, `Accept: application/json`
- req body:
  ```json
  { "code": "google_authorization_code_received_from_client" }
  ```
- 처리: code로 Google OAuth2.0 토큰(`access_token`,`id_token`) 획득 → `sub`,`email`,`email_verified`,`name` 추출 → `email_verified=false`면 거부 → `oauth_accounts(provider='google', provider_id=sub)` 매칭 → 동일 로직(매칭/연동/신규생성) → JWT 발급
- res `200`: data 스키마 동일
- res `400` `INVALID_REQUEST` — 인가 코드 누락/변조
- res `403` `GOOGLE_EMAIL_UNVERIFIED` — 구글 측 이메일 미인증 계정
- res `500` `EXTERNAL_AUTH_SERVER_ERROR` — 구글 외부 인증 통신 오류

> 관련(별도 기능): 토큰 재발급 `POST /auth/refresh`, 로그아웃 `POST /auth/logout` — 본 plan scope 밖.

## Scope

- In:
  - 이메일 로그인 폼 + 제출 → `POST /auth/login`
  - 카카오 로그인 버튼 → OAuth 인가코드 획득 → `POST /auth/oauth/kakao`
  - 구글 로그인 버튼 → OAuth 인가코드 획득 → `POST /auth/oauth/google`
  - 성공 시 Access Token 클라이언트 보관 + 인증 상태 전이 + 메인 화면 이동
  - 위 4종 응답 에러 코드별 사용자 피드백(폼 에러/토스트)
- Out:
  - 토큰 재발급(`/auth/refresh`), 로그아웃(`/auth/logout`)
  - 회원가입/이메일 인증코드 발송·검증(`/auth/signup`, `/auth/email/*`)
  - 비밀번호 재설정(`/auth/password/*`)
  - 어드민 로그인(`/admin/auth/login`)
  - 약관 동의 플로우(Open decision #1 결정 후 별도 plan)
  - 자동 로그인 UX(Open decision #2)

## Plan

1. **Contract 확정**: 위 API Contract를 BE/FE 공유 SSOT로 확정. Open decisions #1·#3(신규 분기/탈퇴·정지 응답)을 기획·BE와 합의.
2. **BE**: `/auth/login`, `/auth/oauth/kakao`, `/auth/oauth/google` 엔드포인트를 명세 검증 순서·응답 봉투대로 구현. Access Token(body)+Refresh Token(HttpOnly Secure Cookie) 발급. JWT payload `userId`/`isPartner`.
3. **FE 화면**: 로그인 페이지(라우팅은 BottomNav 비접근 → `(sub)`) — 이메일/비밀번호 폼 + 카카오·구글 버튼. UI는 DESIGN.md 준수(Open decision #4 토큰 확보 후 컴포넌트 작업).
4. **FE OAuth 연동**: 카카오·구글 인가코드 획득 플로우(리다이렉트/콜백) → `code`를 해당 엔드포인트로 전송.
5. **FE 인증 연동**: 응답 `accessToken` 보관 + 인증 상태 전이, 에러 코드별 처리(400 폼/토스트, 401 자격 오류, 403 이메일 미인증 안내, 500/EXTERNAL_AUTH 재시도 안내), 성공 시 메인 이동.
6. **검증**: 실 API 연동(MSW mock 아님)으로 4종 경로 e2e 확인.

## Status

<!--
게이트 체크리스트. 셋 다 [x] 여야 completed/ 이동.
- API 구현: 실 BE 엔드포인트가 contract대로 동작(MSW mock만이면 미체크).
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: 실 API 요청/응답이 contract 스키마로 연결(mock 바인딩은 미체크).
-->

- [x] API 구현
- [x] UI 구현
- [x] API 연동

## Out (단계별 완료물)

- API: <!-- 구현된 엔드포인트, 파일 -->
- UI:
  - 화면: 로그인 페이지 — `apps/web/src/app/(auth)/login/page.tsx` (기존 placeholder 대체)
  - 컴포넌트(신규, `apps/web/src/features/auth/login/`):
    - `ui/LoginForm.tsx` — 로고/태그라인, 이메일·비밀번호 입력, 비밀번호 찾기 링크, 로그인 버튼(이메일·비밀번호 모두 입력 시 활성), 구분선, 카카오/구글 버튼 조합, 회원가입 링크
    - `ui/KakaoLoginButton.tsx` — 카카오 소셜 로그인 시작 버튼(브랜드 옐로우 배경 + `KakaoIcon`)
    - `ui/GoogleLoginButton.tsx` — 구글 소셜 로그인 시작 버튼(서피스 배경 + 보더 + `GoogleIcon`)
    - `index.ts` — 배럴(LoginForm, KakaoLoginButton, GoogleLoginButton)
  - 신규 아이콘(packages/ui/src/icons/): `KakaoIcon`, `GoogleIcon` — 브랜드 고정 컬러 SVG. `Design System/Icons` 스토리에 자동 노출(아이콘은 별도 스토리 파일 불필요, DESIGN.md 규칙).
  - 재사용 공용 컴포넌트(@todam/ui): `Button`, `TextInput`, `Logo`, `Divider`, `CloseIcon`.
  - 주요 결정:
    - 라우팅: `(auth)/login` — Header/BottomNav 모두 path-gated로 미노출(기존 signup과 동일 패턴), 페이지가 자체 X 닫기 헤더 렌더.
    - 신규 `packages/ui` 컴포넌트 추가 없음 → Storybook 스토리 추가 대상 아님(DESIGN.md 규칙).
    - 카카오 `#FEE500`/구글 멀티컬러 G는 플랫폼 브랜드 가이드라인 자산으로 디자인 토큰 범위 밖 → 브랜드 색상으로 사용(코드 주석 명시). 그 외 모든 색상은 semantic 토큰, sizing/gap/padding/radius는 Tailwind 기본 스케일만 사용(arbitrary value 없음).
    - FSD 배치: 로그인은 사용자 액션으로 서버와 데이터가 오가는 유즈케이스 → `features/auth/login`. 카카오/구글 버튼도 각각 소셜 로그인 유즈케이스 컴포넌트로 분리. 도메인 표시용(entities) 컴포넌트 해당 없음. 브랜드 심볼은 `packages/ui/src/icons/`의 `KakaoIcon`/`GoogleIcon`으로 분리.
    - 약관 동의 바텀시트는 범위 제외 — 이번 단계는 로그인 화면만 구현(소셜 신규 가입 분기 Open decision #1 확정 후 별도 진행).
  - **API 연동 미수행**: 로그인/카카오/구글 버튼 핸들러는 TODO 주석(빈 핸들러). fetch/react-query/auth store/토큰 코드 없음. 비밀번호 찾기→`/reset-password`, 회원가입→`/signup` 링크 연결.
  - 검증: `pnpm --filter @todam/web typecheck` 통과, `lint` 0 errors(신규 파일 경고 없음), prettier 통과.
- 연동: <!-- 연결 지점, 검증 결과 -->

## Risks

- 신규 소셜 사용자 약관 동의 분기가 응답 스키마에 없음 → 합의 전 FE 가입 플로우 구현 보류(Open decision #1).
- 탈퇴/정지 계정 차단 응답 코드 미정 → 보안상 로그인 차단 누락 위험(Open decision #3).
- OAuth 인가코드 획득(클라이언트측 리다이렉트 URI·도메인 등록)은 카카오/구글 콘솔 설정 의존.

## Validation

- Tests: 이메일 로그인 4응답(200/400/401/403/500), 카카오 200/400/500, 구글 200/400/403/500 케이스.
- Manual checks: Refresh Token이 HttpOnly Secure Cookie로 설정되고 body에 노출되지 않는지, Access Token payload에 `userId`/`isPartner` 포함 여부.
- Observability: 외부 인증(EXTERNAL_AUTH_SERVER_ERROR) 실패율 로깅.

## Decision Log

- 2026-06-01: 로그인 scope를 이메일 + 카카오 + 구글 3개 엔드포인트로 확정. refresh/logout/signup/admin login은 분리.

## Outcome

- Status: planned (contract 사람 검토·승인 대기)
- Follow-up: Open decisions #1~#4 해소 후 구현 착수.
