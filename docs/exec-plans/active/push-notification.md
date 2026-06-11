# Feature Plan: 푸시 알림 (Web Push / FCM)

## Summary

- Goal: PWA 기반 Web Push(FCM)를 구축하고, 도메인 상태 전이 트리거에 따라 고객·파트너에게 알림을 자동 발송한다. 인앱 알림센터와 옵트아웃 설정을 포함한다.
- Owner: FE=nogglee, BE=태성
- Date: 2026-06-11 (갱신: 2026-06-11)
- Issues: #313 (부모), #314 (1단계 PWA), #315 (2단계 FCM), #316 (3단계 도메인)

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
Phase별 완료가 아니라 기능 전체가 완료돼야 체크.
-->

- [ ] API 구현
- [ ] UI 구현  <!-- Phase 1 완료. Phase 2 FE 완료(BE 대기). Phase 3 미착수. -->
- [ ] API 연동

---

## 진행 현황 (2026-06-11)

### 완료 (dev 머지됨)
- **Phase 1 PWA 기반** (#314, PR #323): manifest, SW 등록, iOS 설치 안내(useSheet 바텀시트)
- **Phase 2 contract** (#315, PR #322): `packages/shared/src/contracts/notification.ts`, `NotificationChannel.WEB_PUSH`, `notificationSettings.webPushEnabled`

### 진행 중 (PR 오픈)
- **Phase 2 FCM 연동(FE)** (#315, PR #324): firebase 초기화, getToken→토큰등록 호출, SW 백그라운드 수신/클릭, 포그라운드 토스트, 로그아웃 revoke 배선
  - Firebase 프로젝트(`todam-web`) + VAPID 발급 완료, `.env`(NEXT_PUBLIC_FIREBASE_*) 세팅 완료

### BE 대기 (태성) — Phase 2 동작 선행조건
1. `notificationSettings`에 `webPushEnabled` 컬럼 추가 + GET/PATCH `/users/me/notification-settings` 반영 (⚠️ FE와 동시 배포 — 필수 필드)
2. `POST /notifications/tokens` (userId+fcmToken upsert)
3. `DELETE /notifications/tokens/:fcmToken` (revokedAt 기록)
   - contract: `packages/shared/src/contracts/notification.ts` (RegisterNotificationTokenBody/Response 등)

### 다음 시작점
- **BE 1~3 완료 시** → PR #324 머지 + 실 연동 테스트 (임시 트리거 버튼으로 getToken→Firebase 콘솔 테스트 전송→수신 확인)
- **Phase 3 (#316)** → 인앱 알림센터(목록/읽음) + 설정 토글에 `useEnablePush()` 배선 + BE 상태전이 훅→큐→FCM Admin SDK 발송
  - Phase 3 FE는 BE 발송과 독립적으로 UI 골격 선행 가능 (Open decision #1 DESIGN.md 토큰 확인 후)

### 테스트 보류 사유
- BE 토큰 API 미구현 + `useEnablePush()` 호출 트리거 버튼 없음(Phase 3 토글에서 연결 예정)
- Web Push는 HTTPS 필수(localhost 예외). iOS는 추가로 PWA 설치 필요 → 배포 후 실기기 검증

---

## Context

- 요구사항명세서(고정): docs/requirements.md — `notification` 도메인, 연결 도메인: `reservation`, `artwork`, `store`, `partner`
- 기능명세: docs/push-notification-policy.md (Notion 대신 이 문서가 SSOT)
- API명세: 정책 문서 §7 데이터 모델 + 유즈케이스에서 추론 (Notion API명세 DB 미등록 — 아래 스냅샷이 계약 원본)
- Relevant design docs: DESIGN.md — 인앱 알림센터 UI 작업 시 variant/토큰 확보 필요 (Open decisions 참고)
- Open decisions (잔여):
  1. **인앱 알림센터 UI 토큰**: DESIGN.md에서 알림 아이템 variant enum, 읽음/미읽음 상태 토큰 확보 필요. Phase 3 시작 전 확인.
  2. **P-5(단계 정체) N일 임계값**: BE와 확정 필요. 정책 §8에서 N일 미명시. [MVP 소거 후보]

> **Resolved decisions (2026-06-11)**
> - ~~Open decision #1 (NotificationPreference vs Settings 통합)~~: **기존 `/users/me/notification-settings`로 통합**. 별도 NotificationPreference 엔티티 신설하지 않음. `/notifications/preferences` 엔드포인트 폐기.
> - ~~Open decision #2 (webPushEnabled 필드)~~: **`notificationSettings`에 `webPushEnabled` 필드 추가**로 결정. user 모듈(태성) 소유 — `packages/shared/src/contracts/user-me.ts` 스키마 변경 포함.
> - ~~Open decision (next-pwa 도입 여부)~~: **next-pwa 미도입**. 푸시-only MVP라 오프라인/프리캐싱 불필요 + firebase SW와 SW scope 충돌 위험 회피. manifest 메타 수동 관리(`public/manifest.webmanifest`), SW 수동 등록(`ServiceWorkerRegistrar`).
> - ~~인앱 알림센터 UI 토큰~~: Phase 1 안내 시트는 공용 `useSheet`/`StandardBottomSheet` 재사용으로 해결. (Phase 3 알림센터 토큰은 해당 시점 재확인)

---

## API Contract (스냅샷)

> 이 섹션이 BE/FE 공유 SSOT. Notion API명세 DB 미등록 기능이므로 planner가 정책 문서에서 직접 도출. 변경 시 이 파일 diff로 추적.

### 데이터 모델

DTO는 `packages/shared/src/contracts/` zod SSOT. feature 직접 정의 금지.

#### 기존 스키마 변경 — user-me.ts (user 모듈, 소유: 태성)

`notificationSettingsSchema`에 `webPushEnabled` 필드 추가. 이 필드가 Web Push 전체 채널 온/오프를 담당한다.

```
NotificationSettings (기존 + 신규 필드)
  id                : string
  userId            : string (uuid)
  inAppEnabled      : boolean          -- 기존
  emailEnabled      : boolean          -- 기존
  kakaoEnabled      : boolean          -- 기존
  webPushEnabled    : boolean          -- 신규 추가 (Web Push 채널 전체 온/오프)
  reservationEnabled: boolean          -- 기존
  artworkEnabled    : boolean          -- 기존
  shippingEnabled   : boolean          -- 기존
  marketingEnabled  : boolean          -- 기존 [MVP 소거 후보] Web Push 마케팅 알림
  updatedAt         : string (datetime)-- 기존
```

> 변경 파일: `packages/shared/src/contracts/user-me.ts` (59번째 줄 `notificationSettingsSchema`)
> 소유자: user 모듈 (BE=태성). FE는 스키마 확정 후 소비.
> PATCH body 확장: `patchNotificationSettingsAllFieldsBodySchema`에 `webPushEnabled: z.boolean().optional()` 추가.

#### 신규 파일 — notification.ts

```
NotificationToken
  id          : string (uuid)
  userId      : string (uuid)
  fcmToken    : string
  userAgent   : string (optional)
  createdAt   : string (datetime)
  revokedAt   : string (datetime) | null

Notification
  id              : string (uuid)
  recipientId     : string (uuid)           -- userId
  eventType       : string (enum, §4·§5 유즈케이스 코드)
  category        : 'TRANSACTION' | 'ARTWORK' | 'DELIVERY' | 'OPERATION' | 'ENGAGEMENT'
  title           : string
  body            : string
  deepLink        : string (optional)
  idempotencyKey  : string                  -- (eventType + targetId + recipientId)
  readAt          : string (datetime) | null
  createdAt       : string (datetime)

NotificationDelivery
  id             : string (uuid)
  notificationId : string (uuid)
  channel        : 'WEB_PUSH'               -- MVP 단일 채널
  status         : 'PENDING' | 'SENT' | 'FAILED'
  attempts       : number
  failedReason   : string | null
  sentAt         : string (datetime) | null
```

> `NotificationPreference` 엔티티 신설하지 않음. 카테고리별 옵트아웃은 기존 `notificationSettings`의 `artworkEnabled`/`marketingEnabled`/`reservationEnabled`/`shippingEnabled`로 대체.

### 엔드포인트

#### 기존 엔드포인트 확장 — user 모듈 (소유: 태성)

```
GET /users/me/notification-settings
  Guard: AuthGuard
  Res 200: { notificationSettings: NotificationSettings }
  변경: 응답에 webPushEnabled 필드 포함.

PATCH /users/me/notification-settings
  Guard: AuthGuard
  Req body (BE scope): {
    inAppEnabled?: boolean
    emailEnabled?: boolean
    kakaoEnabled?: boolean
    webPushEnabled?: boolean          -- 신규
    reservationEnabled?: boolean
    artworkEnabled?: boolean
    shippingEnabled?: boolean
    marketingEnabled?: boolean        -- [MVP 소거 후보]
  }
  Req body (FE scope — 마이페이지 허브): {
    webPushEnabled?: boolean          -- 신규, Web Push 전체 온/오프
    artworkEnabled?: boolean
    marketingEnabled?: boolean        -- [MVP 소거 후보]
  }
  Res 200: { notificationSettings: NotificationSettings }
  변경: webPushEnabled 필드 반영.
```

#### Phase 2 — FCM 토큰 관리 (notification 모듈)

```
POST /notifications/tokens
  Guard: AuthGuard
  Req body: { fcmToken: string; userAgent?: string }
  Res 200: { token: { id, userId, fcmToken, createdAt } }
  동작: 동일 userId + fcmToken이 존재하면 updatedAt 갱신(upsert). 신규면 생성.

DELETE /notifications/tokens/:fcmToken
  Guard: AuthGuard
  Res 204: (no body)
  동작: revokedAt 기록. 로그아웃 훅에서 호출.
```

#### Phase 3 — 인앱 알림센터

```
GET /notifications
  Guard: AuthGuard
  Query: { cursor?: string; limit?: number (default 20); unreadOnly?: boolean }
  Res 200: {
    notifications: Notification[]
    nextCursor: string | null
    unreadCount: number
  }
  동작: 본인(recipientId = me) 알림 커서 페이지네이션.

PATCH /notifications/:id/read
  Guard: AuthGuard
  Res 200: { notification: { id, readAt } }
  동작: readAt = now(). 타인 알림 접근 시 403.

PATCH /notifications/read-all
  Guard: AuthGuard
  Res 200: { updatedCount: number }
  동작: 본인 미읽음 알림 전체 readAt 일괄 갱신.
```

> **폐기**: `GET /notifications/preferences`, `PATCH /notifications/preferences` — 기존 `/users/me/notification-settings`로 통합됨.

#### 내부 발송 (FE 직접 호출 없음)

```
내부 큐 워커: BullMQ notification 큐
  - eventType, targetId, recipientId, payload
  - FCM Admin SDK → NotificationDelivery 기록
  - 멱등성 키 중복 차단
  - 재시도: 지수 백오프 최대 3회
  - 영구 실패 시 토큰 revoke
  - webPushEnabled = false인 사용자는 WEB_PUSH 채널 발송 스킵 (인앱 레코드는 항상 생성)
  - [MVP 소거 후보] quiet hours 큐 지연: 22:00~08:00 수신자 로컬 시간 기준, 긴급(TRANSACTION) 제외
```

---

## Scope

### In

- **Phase 1 (PWA 기반)**: `manifest.webmanifest`, firebase-messaging-sw.js 등록, iOS "홈화면 추가" 안내 UI
- **Phase 2 (FCM 연동)**: VAPID 키 설정, 권한 요청 + `getToken()`, `POST /notifications/tokens`, SW `onBackgroundMessage`, FCM Admin SDK 발송 파이프라인
- **Phase 2 (스키마 확장)**: `notificationSettings`에 `webPushEnabled` 추가 — user 모듈(태성) 작업
- **Phase 3 (도메인 연결)**: 상태 전이 훅 → 큐 등록 (U-1~U-3, U-5~U-9, U-11~U-14, U-15, P-1~P-2, P-4~P-9), 인앱 알림센터(목록/읽음 처리), Web Push 옵트아웃 설정 UI
- **[MVP 소거 후보]** P-5 단계 정체 알림 (N일 임계값 미확정)
- **[MVP 소거 후보]** marketingEnabled 카테고리 Web Push 발송
- **[MVP 소거 후보]** quiet hours (22:00~08:00) 큐 지연 처리
- DTO: `packages/shared/src/contracts/notification.ts` 신규 생성, `packages/shared/src/contracts/user-me.ts` `webPushEnabled` 필드 추가

### Out

- 카카오 알림톡 · 이메일 다채널
- 스케줄 리마인더 (U-4 체험 D-1, P-3 당일 요약) — 차기 (정책 §8 확정)
- 배송 실시간 추적 연동
- 마케팅/재방문 캠페인 반복 발송 (U-15 리뷰 요청 트리거는 MVP 포함, 캠페인성 반복 발송은 제외)
- AI 고객용 문구 변환 (P2)
- Admin 발송 실패 대시보드
- `NotificationPreference` 별도 엔티티 및 `/notifications/preferences` 엔드포인트 (통합 결정으로 폐기)

---

## Plan

### Phase 1 — PWA 기반 (#314)

**FE (nogglee)**

1. `apps/web/public/manifest.webmanifest` 생성
   - `name`, `short_name`, `icons` (192×192, 512×512 PNG), `display: "standalone"`, `start_url: "/"`
   - `theme_color`, `background_color`
2. `apps/web/app/layout.tsx`에 `<link rel="manifest">` 메타 추가
3. `apps/web/public/firebase-messaging-sw.js` 플레이스홀더 생성 (Phase 2에서 내용 채움)
   - `navigator.serviceWorker.register('/firebase-messaging-sw.js')` 클라 컴포넌트 `useEffect`에서 등록
4. iOS "홈화면 추가" 안내 UI
   - 조건: `navigator.userAgent`로 iOS Safari 감지 + `window.matchMedia('(display-mode: standalone)')` 미설치 확인
   - 배치: 알림 권한 요청 직전 또는 마이페이지 알림 설정 진입 시
   - DESIGN.md 안내 바텀시트/토스트 컴포넌트 재사용 (Open decision #1 확인 후 적용)
5. HTTPS 배포 확인 (Vercel 기본 충족)

**BE (태성)** — Phase 1에서 BE 작업 없음

---

### Phase 2 — FCM 연동 + 스키마 확장 (#315)

**BE (태성)**

1. `packages/shared/src/contracts/user-me.ts` — `notificationSettingsSchema`에 `webPushEnabled: z.boolean()` 추가
   - `patchNotificationSettingsAllFieldsBodySchema`에도 `webPushEnabled: z.boolean().optional()` 추가
   - 이 변경이 FE Phase 2·3 Web Push 설정 UI의 선행 조건
2. `notification` 모듈에 `NotificationToken` 엔티티 + 레포지토리 구현
3. `POST /notifications/tokens` 컨트롤러 + 유즈케이스 (upsert)
4. `DELETE /notifications/tokens/:fcmToken` 컨트롤러 + 유즈케이스 (revoke)
5. FCM Admin SDK 초기화 (`firebase-admin`, 서비스 계정 키 환경 변수)
6. BullMQ `notification` 큐 + 워커 기본 구조
   - 멱등성 키 중복 차단
   - FCM 발송 전 `notificationSettings.webPushEnabled` 확인 — false이면 WEB_PUSH 발송 스킵
   - FCM 발송 함수 (`admin.messaging().send()`)
   - 재시도 정책 (지수 백오프 3회), 영구 실패 시 토큰 revoke
7. `NotificationDelivery` 엔티티 + 결과 기록
8. `packages/shared/src/contracts/notification.ts` zod 스키마 소비 (BE도 shared zod 런타임 소비 정책 준수)

**FE (nogglee)**

1. `packages/shared/src/contracts/notification.ts` 신규 생성
   - `notificationTokenSchema`, `RegisterTokenBody`, `RegisterTokenResponse` zod 스키마
2. Firebase 프로젝트 설정
   - `.env`: `NEXT_PUBLIC_FIREBASE_*` 환경 변수 추가
   - `apps/web/src/shared/lib/firebase.ts`: Firebase app 초기화 (클라이언트 전용)
3. `apps/web/public/firebase-messaging-sw.js` 완성
   - Firebase compat SDK (`importScripts`) 사용 (App Router 번들 밖 — compat 필수)
   - `messaging.onBackgroundMessage` 핸들러: `self.registration.showNotification(title, options)`
   - `notificationclick` 이벤트: `clients.openWindow(deepLink)`
4. `apps/web/src/features/notification/` 디렉토리 신설
   - `ui/PushPermissionPrompt.tsx`: 권한 요청 버튼 + iOS 분기 안내
   - `api.ts`: `POST /notifications/tokens`, `DELETE /notifications/tokens/:token`
   - `hooks/useFcmToken.ts`: `getToken(messaging, { vapidKey })` → 서버 등록, 토큰 갱신 감지
5. 로그아웃 훅에 `DELETE /notifications/tokens/:token` 호출 추가

---

### Phase 3 — 도메인 연결 + 알림센터 (#316)

**BE (태성)**

1. `Notification` 엔티티 구현 (`idempotencyKey` unique 인덱스 포함)
2. 상태 전이 훅 → 큐 등록 연결 (각 도메인 서비스에 `NotificationQueueService` 의존 주입)
   - `reservation` 서비스: U-1(CONFIRMED), U-2/U-3(CANCELED), P-1(신규 PENDING), P-2(고객 취소)
   - `artwork` 서비스: U-5~U-9(단계 전이), U-10(정체 보정)
   - `artwork` 서비스: **[MVP 소거 후보]** P-5(단계 정체 N일) — N일 임계값 Open decision #2 해결 후
   - `reservation` 배송 처리: U-11(SHIPPED), U-12(PICKUP_READY), U-13(DELIVERED), U-14(PICKUP_DONE)
   - `store` 서비스: P-6(승인), P-7(반려), P-8(노출 중단)
   - `partner` 서비스: P-9(SUSPENDED/TERMINATED)
   - 수령 완료 후: U-15(리뷰 요청)
   - **[MVP 소거 후보]** marketingEnabled 카테고리(ENGAGEMENT) Web Push 발송
3. **[MVP 소거 후보]** 조용한 시간 정책 (22:00~08:00) 큐 지연 처리 — 긴급(TRANSACTION) 제외, 수신자 로컬 시간 기준
4. 인앱 알림센터 엔드포인트: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
5. 폴백: 푸시 권한 미허용/발송 실패 시에도 `Notification` 인앱 레코드는 항상 생성

**FE (nogglee)**

1. `packages/shared/src/contracts/notification.ts` 확장
   - `notificationSchema`, `GetNotificationsResponse`, `PatchReadResponse` zod 스키마 추가
2. 인앱 알림센터 UI (`apps/web/src/features/notification/ui/`)
   - `NotificationCenter.tsx`: 알림 목록 + 커서 페이지네이션 (Intersection Observer)
   - `NotificationItem.tsx`: 카테고리별 아이콘, 읽음/미읽음 스타일, 딥링크 라우팅
   - `UnreadBadge.tsx`: 미읽음 카운트 뱃지 (헤더 알림 아이콘에 연결)
   - DESIGN.md 토큰 적용 (Open decision #1 해결 후)
3. Web Push 옵트아웃 설정 UI (마이페이지 알림 설정)
   - "Web Push 알림" 전체 토글 → `webPushEnabled` (신규 필드, BE Phase 2 선행 필요)
   - "제작 진행 알림" 토글 → 기존 `artworkEnabled`
   - **[MVP 소거 후보]** "마케팅 알림" 토글 → 기존 `marketingEnabled`
   - 기존 `GET/PATCH /users/me/notification-settings` 재사용 (별도 preference 엔드포인트 없음)
4. React Query 훅: `useNotifications`, `useMarkRead`, `useMarkAllRead`, `useNotificationSettings`
   - `useNotificationSettings`는 기존 마이페이지 훅과 통합 검토

---

## Out (단계별 완료물)

- **Phase 1 API**: 없음 (FE 정적 파일만)
- **Phase 1 UI** (2026-06-11 완료):
  - `apps/web/public/manifest.webmanifest` — name/short_name/icons/standalone/start_url/theme_color/background_color
  - `apps/web/public/firebase-messaging-sw.js` — Phase 1 플레이스홀더 (install·activate 생명주기만, FCM 없음)
  - `apps/web/src/features/notification/ui/ServiceWorkerRegistrar.tsx` — useEffect에서 SW 등록 ('use client')
  - `apps/web/src/features/notification/ui/IosInstallBanner.tsx` — iOS Safari + 미설치 감지 → 홈화면 추가 수동 가이드 배너
  - `apps/web/src/features/notification/ui/index.ts`, `apps/web/src/features/notification/index.ts` — exports
  - `apps/web/src/app/layout.tsx` — metadata.manifest, appleWebApp, viewport.themeColor 추가 + ServiceWorkerRegistrar·IosInstallBanner 마운트
- **Phase 2 contract** (2026-06-11 완료, PR #322):
  - `packages/shared/src/contracts/notification.ts` — NotificationToken/Notification/NotificationDelivery + 토큰등록/revoke/목록/읽음 스키마
  - `packages/shared/src/enums/notification-channel.ts` — `WEB_PUSH` 추가
  - `packages/shared/src/contracts/user-me.ts` — `notificationSettings.webPushEnabled` (응답 + BE all-fields PATCH)
  - MSW mock(`apps/web/src/mocks/handlers.ts`) webPushEnabled 반영
- **Phase 2 UI/FE** (2026-06-11 완료, PR #324):
  - `apps/web/src/features/notification/model/firebase.ts` — FCM 초기화(지원환경 가드)
  - `apps/web/src/features/notification/api.ts` — registerNotificationToken(POST)/revokeNotificationToken(DELETE)
  - `apps/web/src/features/notification/model/usePush.ts` — `useEnablePush()`(gesture 트리거) + `silentReregisterPush()`
  - `apps/web/src/features/notification/model/pushToken.ts` — 토큰 로컬 보관(revoke 대상)
  - `apps/web/src/features/notification/ui/PushMessageListener.tsx` — 포그라운드 onMessage→토스트 + silent 재등록
  - `apps/web/public/firebase-messaging-sw.js` — onBackgroundMessage + notificationclick deepLink (config 하드코딩, 공개값)
  - `apps/web/src/features/auth/logout/useLogout.ts` — 로그아웃 시 revoke(best-effort)
  - `apps/web/.env.example` — NEXT_PUBLIC_FIREBASE_* 7키
  - 변경: 계획상 `useFcmToken`/`PushPermissionPrompt` 대신 `useEnablePush`/`PushMessageListener`로 구현
- **Phase 2 API (BE, 태성) — 미구현**: `POST /notifications/tokens`, `DELETE /notifications/tokens/:fcmToken`, `notificationSettings.webPushEnabled` 컬럼+엔드포인트 반영, (Phase 3) FCM Admin SDK 발송 + BullMQ 워커
- **Phase 3 API**: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, 도메인 훅 연결 (U-1~U-15, P-1~P-9)
- **Phase 3 UI**: 인앱 알림센터, Web Push 옵트아웃 토글 UI (webPushEnabled + artworkEnabled, [MVP 소거 후보] marketingEnabled)

---

## Risks

- iOS 16.4+ PWA 미설치 시 Web Push 완전 미지원 → 안내 UI 품질이 옵트인율 직결
- firebase-messaging-sw.js가 App Router 번들 밖이므로 환경 변수 접근 불가 → SW 내부에서 `self.FIREBASE_CONFIG` 패턴 또는 별도 config 파일 주입 필요
- **[MVP 소거 후보]** `next-pwa`와 firebase SW 충돌 위험 → `next-pwa` 미도입 시 manifest 메타 수동 관리 (Open decision #3)
- 멱등성 키 (eventType + targetId + recipientId) 조합이 충분한지 검토 필요 (예: 동일 artwork 단계 전이 2회 발생 시)
- `webPushEnabled` 필드 추가는 user 모듈(태성) 소유 — FE Phase 2 Web Push 설정 UI가 이 변경에 블록됨. 태성 작업 선행 필요.
- 기존 `patchNotificationSettingsBodySchema`(FE scope)가 `artworkEnabled`·`marketingEnabled` 2개만 허용 — `webPushEnabled` 추가 시 FE scope 스키마도 갱신 필요.

---

## Validation

- Tests:
  - Phase 2: FCM 토큰 upsert/revoke 유닛 테스트
  - Phase 2: `webPushEnabled = false` 수신자 발송 스킵 테스트
  - Phase 3: 멱등성 키 중복 발송 차단 테스트
  - **[MVP 소거 후보]** Phase 3: 조용한 시간 큐 지연 테스트
  - 커서 페이지네이션 경계값 테스트
- Manual checks:
  - Chrome DevTools > Application > Manifest, Service Workers 정상 등록 확인
  - Android Chrome: 알림 권한 허용 → 백그라운드 메시지 수신 확인
  - iOS Safari (16.4+): 홈화면 추가 후 권한 요청 → 푸시 수신 확인
  - 로그아웃 시 토큰 revoke 확인 (FCM 토큰 재등록 시 신규 레코드)
  - `webPushEnabled = false` 토글 후 발송 스킵 확인 (인앱 레코드는 생성되어야 함)
  - 인앱 알림센터: 미읽음 → 읽음 전환, 커서 페이지네이션 스크롤
- Observability:
  - `NotificationDelivery.status = FAILED` + `failedReason` 로깅
  - FCM 토큰 revoke 이벤트 로그
  - `webPushEnabled = false` 스킵 이벤트 로그

---

## Decision Log

- 2026-06-11: 채널 Web Push(FCM) only, iOS 16.4+ PWA 설치 전제로 확정
- 2026-06-11: DTO는 `packages/shared/src/contracts/notification.ts` zod SSOT (feature 직접 정의 금지)
- 2026-06-11: 인앱 알림센터는 항상 적재 (푸시 미수신 폴백 SSOT)
- 2026-06-11: 스케줄 알림 U-4·P-3 MVP 제외 확정 (정책 §8)
- 2026-06-11: **NotificationPreference 별도 엔티티 신설 안 함**. 기존 `notificationSettings`(user 모듈, `/users/me/notification-settings`)로 통합. `/notifications/preferences` 엔드포인트 폐기.
- 2026-06-11: **`notificationSettings`에 `webPushEnabled` 필드 추가**. 소유: user 모듈(태성). `packages/shared/src/contracts/user-me.ts:59` `notificationSettingsSchema` 변경 대상.
- 2026-06-11: quiet hours, P-5 단계 정체, marketingEnabled Web Push — 풀스펙 plan 유지, [MVP 소거 후보] 태깅
- 2026-06-11: next-pwa 미도입 확정 (firebase SW scope 충돌 회피)
- 2026-06-11: Phase 1 PWA dev 머지(#314/PR #323), Phase 2 contract dev 머지(#315/PR #322), Phase 2 FE PR #324 오픈
- 2026-06-11: Phase 2 FE는 `useEnablePush`/`PushMessageListener`로 구현(계획상 `useFcmToken`/`PushPermissionPrompt` 대체). SW config 하드코딩(env 미접근 정적파일 제약)
- 2026-06-11 (미해결): Open decision #1 (DESIGN.md 알림 UI 토큰) — Phase 3 선행, #2 (P-5 N일 임계값) — [MVP 소거 후보]

---

## Outcome

- Status (2026-06-11): Phase 1 완료(dev), Phase 2 contract 완료(dev), Phase 2 FE 완료(PR #324 오픈, BE 대기). Phase 3 미착수.
- Follow-up:
  - **태성(BE) 우선**: `POST/DELETE /notifications/tokens` + `notificationSettings.webPushEnabled` 컬럼/엔드포인트 → Phase 2 동작 잠금 해제
  - **FE**: BE 토큰 API 완료 시 PR #324 머지 + 실 연동 테스트 / Phase 3 알림센터·설정토글(useEnablePush 배선)은 DESIGN.md 토큰(Open decision #1) 확인 후 착수
  - P-5 N일 임계값 BE 결정 후 [MVP 소거 후보] 태그 해제 또는 MVP 제외 확정
