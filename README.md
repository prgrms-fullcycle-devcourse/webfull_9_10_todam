<img width="1680" height="320" alt="NotionCover" src="https://github.com/user-attachments/assets/3bb70bc7-6f13-41d3-990f-e7fed0705569" />

<div align="left">

<h1>
  <img src="https://github.com/user-attachments/assets/6634b73f-a5eb-4a1b-9b86-75089a4bde5b" width="72" alt="todam logo" align="center" />
  토담 - <strong>공방 원데이 클래스 예약 플랫폼</strong>
</h1>

![License](https://img.shields.io/badge/license-MIT-blue)

도자기, 가죽공예처럼 오프라인 원데이 클래스를 운영하는 공방과<br />
클래스를 찾고 예약하는 수강생을 연결하는 서비스입니다.

</div>

<br />

## 🧩 Quick Link

- 🏠 [서비스 바로가기](#) <!-- TODO: 배포 URL 연결 -->
- 🎬 [데모 영상](#) <!-- TODO: 시연 영상/노션 링크 (없으면 줄 삭제) -->
- 📚 [전체 문서 보기](#-documents)

<br />

## 👋 Introduction

<!-- TODO: 서비스 화면 스크린샷 3~4장을 추가하세요. -->
<p align="center">
  <!-- <img src="docs/assets/screen-home.png" width="23%" alt="홈 화면" /> -->
  <!-- <img src="docs/assets/screen-reservation.png" width="23%" alt="예약 화면" /> -->
  <!-- <img src="docs/assets/screen-partner.png" width="23%" alt="파트너 관리 화면" /> -->
  <!-- <img src="docs/assets/screen-admin.png" width="23%" alt="관리자 화면" /> -->
  <em>서비스 주요 화면 스크린샷 자리</em>
</p>

todam은 수강생, 파트너, 운영자를 위한 세 가지 흐름을 제공합니다.

- **수강생**: 공방 및 클래스 탐색, 예약 신청, 작품 진행 상황 조회, 리뷰 작성
- **파트너**: 공방 및 클래스 등록, 예약/일정 관리, 작품 진행 관리, 사업자 인증
- **운영자**: 파트너 승인, 공방 검수, 신고 처리, 서비스 운영 관리

> **기간**: TODO: 2026.MM ~ 2026.MM<br />
> **팀 구성**: TODO: Frontend N명, Backend N명

<br />

## 📚 Documents

- [기능 요구사항](docs/requirements.md)
- [API 명세](docs/api/apispec.md)
- [시스템 아키텍처](ARCHITECTURE.md)
- [UI/디자인 규칙](DESIGN.md)
- [코드/환경 컨벤션](docs/conventions/README.md)
- [푸시 알림 정책](docs/push-notification-policy.md)

<br />

## 🏛️ Architecture

<img width="1594" height="1110" alt="diagram-export-2026 -6 -17 -오후-2_04_41" src="https://github.com/user-attachments/assets/c605de96-3490-4d08-ab5b-b4215ec4dfbf" />


- 같은 트랜잭션에서 함께 성공해야 하는 작업은 `api`에서 동기 처리합니다.
- 알림, 이미지 후처리, 외부 API 호출처럼 실패 재시도와 지연 처리가 필요한 작업은 BullMQ 기반 큐로 분리합니다.
- 예약과 작품의 상태 전이는 도메인 레이어에서만 수행하고, 프론트엔드는 백엔드가 계산한 `displayState`를 사용합니다.

<br />

## 📂 Directory Structure

```text
todam/
├── apps/
│   ├── api/        # NestJS 백엔드
│   ├── web/        # Next.js 수강생 서비스
│   ├── admin/      # Next.js 운영자 서비스
│   └── storybook/  # 공통 UI 문서화
├── packages/
│   ├── shared/             # 공통 enum, type, schema, 상태 계산
│   ├── ui/                 # web/admin 공통 UI 컴포넌트
│   ├── config/             # 환경변수 검증
│   ├── eslint-config/      # 공유 ESLint 설정
│   └── typescript-config/  # 공유 TypeScript 설정
├── docs/          # 요구사항, API, 실행 계획, 컨벤션 문서
├── docker/        # 로컬 인프라 구성
└── scripts/       # 개발 보조 스크립트
```

`apps/api`는 도메인 단위 모듈로 나뉩니다.

```text
auth · user · partner · store · program · timeslot
reservation · artwork · review · notification · policy · admin
```

<br />

## 🧠 Key Design Points

### 🔐 1. Capability 기반 접근 제어

`Guest / User / Partner / Admin`을 단일 role enum으로만 판단하지 않고, 인증 여부와 capability 조합으로 권한을 확인합니다. 파트너 API는 capability 검증 후 대상 공방 소유권을 별도로 확인해 권한 상승을 방지합니다.

```ts
@UseGuards(AuthGuard)
@UseGuards(AuthGuard, PartnerGuard)
@UseGuards(AdminGuard)
```

### 🔄 2. 상태 전이 규칙의 도메인 레이어 집중

예약과 작품 상태는 Controller나 Repository에서 직접 변경하지 않고, 도메인 레이어의 상태 전이 규칙을 통해 변경합니다. 사용자에게 노출되는 상태 문구는 프론트엔드가 추측하지 않도록 백엔드에서 계산합니다.

### 📅 3. 예약 슬롯 모델 단순화

예약 불가를 표현하기 위한 별도 `BlockedSlot` 테이블을 두지 않고, 타임슬롯의 status로 예약 가능 여부를 표현합니다. 캘린더에서는 정원이 찬 슬롯을 자동으로 비활성화합니다.

### 🪪 4. 사업자 인증 게이트

파트너 가입 시 사업자등록증 이미지를 Google Vision OCR로 읽고, 국세청 진위확인 API를 통해 사업자 정보를 검증합니다.

<br />

## 🖥️ Tech Stack

**Common**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)

**Frontend**

![Next.js](https://img.shields.io/badge/Next.js%2016-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?logo=react&logoColor=black)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-FF4154?logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-433E38?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?logo=tailwindcss&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?logo=storybook&logoColor=white)

**Backend**

![NestJS](https://img.shields.io/badge/NestJS%2011-E0234E?logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma%207-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-E0234E?logo=redis&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)

**Infra & External**

![AWS EC2](https://img.shields.io/badge/EC2-FF9900?logo=amazonec2&logoColor=white)
![AWS S3](https://img.shields.io/badge/S3-569A31?logo=amazons3&logoColor=white)
![AWS SES](https://img.shields.io/badge/SES-DD344C?logo=amazonsimpleemailservice&logoColor=white)
![Amazon RDS](https://img.shields.io/badge/RDS-527FFF?logo=amazonrds&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=white)
![Google Vision](https://img.shields.io/badge/Cloud%20Vision-4285F4?logo=googlecloud&logoColor=white)
![Firebase](https://img.shields.io/badge/FCM-FFCA28?logo=firebase&logoColor=black)

<br />

## 🗄️ Database Schema

<img width="3757" height="2445" alt="todam (9)" src="https://github.com/user-attachments/assets/fd3a40b8-c035-4299-98db-c953383ed283" />

> 사용자는 공방과 클래스를 탐색해 예약을 생성하고, 예약 이후 작품 제작 상태, 배송, 리뷰, 알림 데이터가 연결됩니다.  
> 파트너는 공방과 클래스 운영 정보, 예약 가능 시간, 사업자 인증 정보, 작품 제작 진행 상태를 관리합니다.

<br />

## 🌿 Collaboration

```text
feature/* -> dev -> main
```

- `feature/*`: 기능 개발 브랜치입니다. Pull Request는 `dev` 브랜치로 올립니다.
- `dev`: 통합 브랜치입니다. CI에서 lint, typecheck, test를 검증합니다.
- `main`: 프로덕션 브랜치입니다. 머지 후 배포가 진행됩니다.

pre-commit에서는 ESLint와 Prettier를 실행하고, pre-push에서는 전체 타입 체크를 수행합니다.

<br />

## 👥 Contributors

<!-- TODO: 팀원 GitHub 아이디, 이름, 담당 영역으로 교체하세요. -->
| Profile | Name | Role | Contributions |
| --- | --- | --- | --- |
| <img src="https://github.com/ID1.png" width="56" alt="ID1 profile" /> | [이름1](https://github.com/ID1) | Backend | 인증/토큰(JWT, refresh), OAuth, capability 기반 접근 제어 |
| <img src="https://github.com/ID2.png" width="56" alt="ID2 profile" /> | [이름2](https://github.com/ID2) | Backend | 예약/작품 도메인, 상태 전이, QR 토큰, 알림 큐(BullMQ) |
| <img src="https://github.com/ID3.png" width="56" alt="ID3 profile" /> | [이름3](https://github.com/ID3) | Frontend | 공방/클래스 탐색, 예약 캘린더, 작품 진행 조회 화면 |
| <img src="https://github.com/ID4.png" width="56" alt="ID4 profile" /> | [이름4](https://github.com/ID4) | Frontend | 공통 UI/디자인 시스템(Storybook), 파트너/운영자 화면 |
| <img src="https://github.com/ID5.png" width="56" alt="ID5 profile" /> | [이름5](https://github.com/ID5) | TODO: 파트 | TODO: 담당 도메인 · 주요 기여 |
