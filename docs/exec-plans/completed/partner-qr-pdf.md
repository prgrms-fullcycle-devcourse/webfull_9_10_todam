# Feature Plan: partner-qr-pdf

## Summary

- Goal: 파트너가 확정된 예약의 작품 QR 라벨을 **프론트에서 PDF로 생성·저장·인쇄**할 수 있다. QR에는 작품 상세 URL이 인코딩되어, 스캔 시 해당 작품 상세 화면(웹)으로 이동한다.
- Owner:
- Date: 2026-06-09

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
각 항목 체크 기준:
- API 구현: 실 BE(`apps/api`) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: **실 API** 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크(연동 아님).
-->

- [x] API 구현 — **신규 BE API 없음** (기존 작품상세/예약상세 API 재사용. 별도 구현 불필요)
- [x] UI 구현
- [x] API 연동

> 참고: 이 기능은 **FE 전용**이다. "API 구현" 항목은 신규 백엔드 작업이 없으므로 해당 없음 처리.
> QR/PDF 생성은 전적으로 브라우저(프론트)에서 수행한다.

## Context

- 요구사항명세서(고정): docs/requirements.md — `artwork` 7절 "QR 라벨 조회 및 출력"
- 기능명세: "QR 코드 프린트" (Notion 기능명세 DB `b242ee66b06c8349805601ce4a05247a` — 도메인: artwork, 실행주체: partner)
- API명세(참고): `GET /partner/reservations/{reservationId}/qr-label` — **본 plan에서 폐기**. 서버 PDF 생성 대신 프론트 생성으로 결정 (Decision Log 참조).
- Relevant design docs: QR 라벨 인쇄 레이아웃 DESIGN.md 존재 여부 확인 필요.
- 기존 코드 자산:
  - 작품 상세 (파트너, 구현됨): `GET /partner/artworks/:artworkId` — `apps/api/.../partner-artwork.controller.ts:108`
  - 예약 상세 (파트너, 구현됨): `GET /partner/reservations/{reservationId}` — 응답에 `artworkId`(nullable) 포함 (`packages/shared/src/contracts/reservation-detail.ts:146`)
  - QR 페이지 placeholder: `apps/web/src/app/partner/reservations/[id]/qr/page.tsx`
  - `QrToken`(`artwork:{id}:{uuid}`)이 artwork 생성 시 함께 생성되나, 본 기능은 **사용하지 않음**(파트너 전용·평문 URL 방식).

## 설계 결정 (확정)

1. **QR 데이터 포맷** → **작품 상세 URL** (`{WEB_ORIGIN}/partner/artworks/{artworkId}`). 평문 artworkId(UUID) 기반. HMAC/qrToken 미사용.
   - 근거: 파트너 전용 흐름. artworkId가 이미 UUID라 추측 불가. 데이터 보호는 QR이 아니라 랜딩 엔드포인트의 `AuthGuard + PartnerGuard`가 담당.
2. **QR 스캔 주체/대상** → **파트너**. 스캔 시 작품 상세(파트너) 화면으로 이동. 비로그인/타매장 파트너는 가드에서 차단됨.
   - 네이티브 앱 미보유 → 스캔 시 **모바일 브라우저(또는 설치된 PWA)** 로 열림. "네이티브 앱 자동 실행"은 현재 구조상 불가(별도 과제, 본 범위 제외).
3. **PDF 생성 주체** → **프론트 (브라우저)**. `qrcode`로 QR 이미지 생성 → `jsPDF`로 PDF 파일 조립·저장(다운로드/공유).
   - 근거: 서버가 PDF용으로 조립할 데이터가 없음(URL뿐). puppeteer를 소형 EC2에 얹는 비용 회피. 모바일 웹에서 PDF 파일 저장 UX는 `jsPDF`가 `window.print()`보다 일관적.
4. **예약/작품 상태 범위** → artwork(=artworkId)가 존재하는 예약만 QR 생성 가능. artwork는 예약 확정(CONFIRMED) 이상에서만 생성되므로, **예약 상세의 `artworkId`가 null이면 QR 버튼 비활성**으로 자연 강제.

## API Contract (스냅샷)

> 신규 백엔드 API 없음. 아래는 FE가 **소비**하는 기존 계약과 FE가 **생성**하는 산출물 정의.

### FE가 소비하는 기존 계약

- **예약 상세**: `GET /partner/reservations/{reservationId}` → 응답에 `artworkId: string | null` 포함 (`packages/shared/src/contracts/reservation-detail.ts`).
  - QR 페이지(`reservations/[id]/qr`)는 `reservationId`로 이 API를 호출해 `artworkId`와 라벨 표기용 정보(예약자명·프로그램명·일시 등)를 취득.
- (랜딩) **작품 상세**: `GET /partner/artworks/{artworkId}` — 스캔 후 이동되는 화면. 본 기능에서 신규 작업 없음.

### FE가 생성하는 산출물

- **QR 페이로드(문자열)**: `{WEB_ORIGIN}/partner/artworks/{artworkId}`
- **PDF**: QR 이미지 + 라벨 텍스트(예약번호/프로그램명/체험일시/예약자명 등)를 담은 단일 PDF 파일. 파일명 예: `qr-label-{artworkId}.pdf`. 브라우저 다운로드/공유로 저장.

## Scope

- In (FE):
  - 라이브러리 추가: `qrcode`(또는 `react-qr-code`), `jspdf`
  - 예약/작품 화면에 "QR PDF 저장" 진입점 (artworkId 있을 때만 활성)
  - `apps/web/src/app/partner/reservations/[id]/qr/page.tsx` 구현:
    - 예약 상세 API 호출 → `artworkId` 및 라벨 표기 정보 취득
    - `artworkId`로 작품상세 URL 생성 → QR 이미지 렌더
    - 라벨 레이아웃 구성 → `jsPDF`로 PDF 조립 → 저장(다운로드/공유)
  - artwork 미생성(`artworkId === null`) 예약 처리: QR 버튼 비활성/안내
  - 모바일 웹 저장 UX 확인 (iOS Safari / Android Chrome)
- Out:
  - 신규 백엔드 API (서버 PDF 생성) — **폐기**
  - QR 스캔 → 네이티브 앱 자동 실행 (Universal/App Links) — 네이티브 앱 부재로 별도 과제
  - 일괄 출력 (여러 예약 합본 PDF) — MVP 이후. 필요 시 예약 목록 응답에 `artworkId` 추가 BE 작업 동반(`packages/shared/src/contracts/reservation-calendar.ts`).
  - HMAC/qrToken 기반 비인증 접근 토큰 — 미사용

## Plan

### FE

1. `apps/web`에 `qrcode`(또는 `react-qr-code`), `jspdf` 설치.
2. 환경변수/상수로 `WEB_ORIGIN`(작품상세 URL prefix) 확보.
3. 예약 상세 화면에 "QR PDF 저장" 버튼/진입점 추가 — `artworkId`가 있을 때만 활성.
4. `partner/reservations/[id]/qr/page.tsx` 구현:
   a. `reservationId`로 예약 상세 조회(`@tanstack/react-query`) → `artworkId`, 라벨 표기 정보 취득
   b. `artworkId === null`이면 "아직 작품이 생성되지 않은 예약" 안내 후 종료
   c. 작품상세 URL = `${WEB_ORIGIN}/partner/artworks/${artworkId}` 생성
   d. `qrcode`로 URL → QR 이미지(dataURL/canvas)
   e. 라벨 미리보기 렌더 (DESIGN.md 준수)
   f. "PDF 저장" → `jsPDF`로 QR 이미지 + 텍스트 배치 → `doc.save("qr-label-{artworkId}.pdf")`
5. MSW mock: 예약 상세(`GET /partner/reservations/:id`) 핸들러에 `artworkId` 포함 응답 확인/보강.

### 연동

6. 실 API 연결 — 예약 상세에서 실제 `artworkId` 수신 확인 (MSW 제거).
7. 수동 검증: 파트너 계정 → CONFIRMED 예약 → QR PDF 저장 → 인쇄 → **출력물 QR을 휴대폰 카메라로 스캔 → 작품상세 URL 열림(로그인 시 상세 표시, 비로그인/타매장 차단)** 확인.

## Out (단계별 완료물)

- API: 신규 없음 (기존 예약상세 `artworkId`·작품상세 재사용)
- UI: QR PDF 페이지(`reservations/[id]/qr`), 예약 상세 "QR PDF 저장" 진입점, 라벨 레이아웃
- 연동: 실 예약상세 API에서 `artworkId` 수신 → QR/PDF 생성 → 스캔 라운드트립 검증

## Risks

- **모바일 PDF 저장 UX 편차**: iOS Safari는 `jsPDF` 저장 시 공유시트 경유 등 단계가 기기별로 다름. 실기기 검증 필요.
- **`artworkId` 가용성**: 예약 상세에는 있으나(예약 목록엔 없음), 일괄 출력 확장 시 목록 응답 스키마 보강 필요.
- **스캔→앱 진입 기대 불일치**: 사용자가 "네이티브 앱 실행"을 기대할 수 있으나 현 구조는 브라우저/PWA 진입까지만 가능. 범위 합의됨.
- **라벨 디자인 스펙 부재**: DESIGN.md 미확보 시 라벨 레이아웃 임시 구성 후 후속 조정.

## Validation

- Tests:
  - FE 단위: URL 조립 함수(artworkId → 작품상세 URL), `artworkId === null` 분기 처리.
  - FE 컴포넌트: QR 페이지가 예약상세 응답으로 QR/미리보기를 렌더하는지.
- Manual checks:
  - 파트너 계정 → CONFIRMED 예약 → "QR PDF 저장" 활성 확인
  - artwork 미생성(PENDING) 예약 → 버튼 비활성/안내 확인
  - PDF에 QR + 예약번호·프로그램명·체험일시·예약자명 정확 표기 확인
  - PDF 저장(모바일 Safari/Chrome) 동작 확인
  - 출력물 QR 스캔 → 작품상세 URL 열림 / 비로그인·타매장 차단 확인
- Observability: (해당 없음 — 클라이언트 전용)

## Decision Log

- 2026-06-09: plan 초안 작성 (Open decision 4건).
- 2026-06-09: 사람 검토 후 결정 확정 —
  - QR 데이터 = 작품상세 URL(artworkId 기반, 평문). qrToken/HMAC 미사용.
  - QR 대상 = 파트너 작품상세 화면. 보안은 랜딩 엔드포인트 가드가 담당.
  - PDF 생성 = **프론트(`jsPDF`+`qrcode`)**. 서버 PDF 엔드포인트(`GET .../qr-label`) **폐기** → 신규 BE 작업 없음, FE 전용 기능으로 전환.
  - 스캔 시 브라우저/PWA로 열림. 네이티브 앱 자동 실행은 앱 부재로 범위 제외.
  - artworkId null이면 QR 생성 불가(버튼 비활성)로 상태 범위 자연 강제.

## Outcome

- Status: 완료 (FE 구현·실 API 연동 완료, reviewer drift 0)
- Follow-up: 모바일 실기기 PDF 저장 UX + 출력물 QR 스캔 라운드트립 수동 검증(plan Validation 참고). 일괄 출력은 MVP 이후.
