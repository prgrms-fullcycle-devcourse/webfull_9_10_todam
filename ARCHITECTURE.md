# Architecture

이 문서는 `todam` 모노레포의 시스템 경계, 앱/패키지 구조, 도메인 모듈 기준을 정의한다.
상세 요구사항과 상태 전이는 기능 명세서를 기준으로 확인한다.

## System Boundary

- 인증, 토큰, 세션
- 파트너 capability
- 공방, 클래스, 예약, 작품, 리뷰
- 알림, 이미지 후처리
- 운영자 검수와 제재

## Monorepo Shape

```text
apps/
  api/       # NestJS API 서버
  web/       # Next.js 사용자 서비스
  worker/    # queue, batch, scheduler
  admin/     # Next.js 관리자 서비스

packages/
  shared/    # 공통 enum, type, schema, 상태 계산
  ui/        # web/admin 공통 UI
  config/    # 환경 변수와 실행 설정
```

앱은 실행 단위이고, 패키지는 공유 단위다. 도메인 규칙은 특정 앱에 중복 구현하지 않고 `api` 또는 `shared`에 위치시킨다.

## App Responsibilities

- `apps/api`
  - 인증과 도메인 API
  - 상태 전이와 트랜잭션
  - 큐 작업 등록
- `apps/web`
  - 고객용 화면
  - 공방 조회, 예약, 작품 진행 조회, 리뷰
- `apps/worker`
  - 알림 발송
  - 이미지 후처리
  - 지연 작업과 스케줄러
- `apps/admin`
  - 운영자 인증
  - 파트너 승인, 공방 검수, 제재

## Backend Modules

NestJS는 도메인 중심 모듈로 구성한다.

```text
apps/api/src/
  common/
  config/
  database/
  modules/
    auth/
    users/
    partners/
    stores/
    classes/
    reservations/
    artworks/
    reviews/
    notifications/
    admin/
```

도메인은 화면이나 API 경로가 아니라 비즈니스 개념 기준으로 나눈다.

## Access Model

역할 enum 대신 인증 여부와 capability 조합으로 접근을 판단한다.

- `Guest`: 비인증 사용자
- `User`: 인증된 사용자
- `Partner`: `Partner.status = APPROVED`인 User
- `Admin`: 별도 인증 파이프라인을 통과한 운영자

```ts
@UseGuards(AuthGuard)
@UseGuards(AuthGuard, PartnerGuard)
@UseGuards(AdminGuard)
```

Partner API는 capability 검증 후 대상 공방 소유권을 반드시 별도로 검증한다.

## Module Shape

각 백엔드 도메인 모듈은 아래 구조를 기본으로 가진다.

```text
reservations/
  reservations.module.ts
  reservations.controller.ts
  reservations.service.ts
  dto/
  entities/
  repositories/
  domain/
```

- `Controller`: HTTP 요청/응답, 입력 검증, Service 호출
- `Service`: 유스케이스, 트랜잭션, 도메인 흐름 제어
- `Domain`: 상태 전이, 비즈니스 규칙, displayState 계산
- `Repository`: DB 접근 추상화

## Event Policy

같은 트랜잭션에서 함께 성공해야 하는 작업은 `api` Service에서 동기 처리한다.

- 예약 확정 시 작품 생성
- 작품 생성 시 QR 토큰 발급
- 예약 취소 시 작품 취소
- 파트너 정지 시 공방/클래스 상태 전이

외부 API, 알림, 이미지 처리, 지연 작업은 이벤트와 큐를 통해 `worker`에서 처리한다.

## Decision Policy

- 구조 기준은 도메인이다.
- 앱은 실행 책임, 패키지는 공유 책임을 가진다.
- 상태 전이는 Controller나 Repository에서 수행하지 않는다.
- 고객 노출 상태 문구는 백엔드가 계산해 반환한다.
- Admin 인증은 User 인증과 분리한다.

## Build Order

1. `shared` 공통 enum, type, 상태 계산
2. `api` Auth, User, Partner, Store
3. `api` Class, Reservation, Artwork
4. `worker` Notification, Image jobs
5. `web` 고객 핵심 플로우
6. `admin` 검수와 제재 플로우
