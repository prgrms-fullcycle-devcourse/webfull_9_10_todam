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

- 🏠 [서비스 바로가기](https://todam.app) <!-- TODO: 배포 URL 연결 -->
- 🎬 [데모 영상](#) 
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

> **기간**: 2026.05.18 ~ 2026.06.18<br />
> **팀 구성**: FE 3명, BE 2명

<br />

## 📚 Documents

- [기능 요구사항](docs/requirements.md)
- [API 명세](docs/api/apispec.md)
- [시스템 아키텍처](ARCHITECTURE.md)
- [UI/디자인 규칙](DESIGN.md)
- [코드/환경 컨벤션](docs/conventions/README.md)

<br />

## 🏛️ Architecture

<img width="1594" height="1110" alt="diagram-export-2026 -6 -17 -오후-2_04_41" src="https://github.com/user-attachments/assets/c605de96-3490-4d08-ab5b-b4215ec4dfbf" />


- `web(Next.js)`은 클래스 참여자/파트너 화면을 제공하고, `api(NestJS)`는 인증·예약·작품·공방·알림 도메인을 처리합니다.
- 데이터는 `RDS(PostgreSQL)`, 큐와 인증 코드는 `Redis`, 이미지는 `S3 presigned URL` 기반 업로드로 관리합니다.
- 메일은 `AWS SES`, 웹 푸시는 `FCM`으로 발송하며, 배포는 GitHub Actions → ECR → EC2 흐름으로 진행합니다.

<br />

## 📂 Directory Structure

```text
todam/
├── apps/
│   ├── api/        # NestJS 백엔드
│   ├── web/        # Next.js 클래스 참여자·파트너 서비스
│   ├── admin/      # Vite 운영자 서비스
│   └── storybook/  # 공통 UI 문서화
├── packages/
│   ├── shared/             # 공통 enum, type, schema, 상태 계산
│   ├── ui/                 # web/admin 공통 UI 컴포넌트
│   ├── config/             # 환경변수 검증
│   ├── eslint-config/      # 공유 ESLint 설정
│   └── typescript-config/  # 공유 TypeScript 설정
├── docs/          # 요구사항, API, 실행 계획, 컨벤션 문서
├── docker/        # 로컬/배포 인프라 구성
└── scripts/       # 개발 보조 스크립트
```

<br />

## 🧠 Key Design Points

### 🔐 1. 역할별 접근 흐름 분리

사용자, 파트너, 운영자 흐름을 분리하고 각 화면에서 필요한 권한만 노출합니다. 서버에서는 인증 상태, 파트너 승인 여부, 리소스 소유권을 함께 검증해 권한 상승을 방지합니다.

### 📅 2. 예약 시점 타임슬롯 자동 생성

공방 운영시간, 예약 간격, 예약 제한, 기존 예약 수를 기준으로 예약 가능한 시간을 계산합니다. 프론트엔드는 가능한 시간만 선택지로 보여주고, 서버는 예약 생성 시점에 타임슬롯을 생성한 뒤 다시 검증해 동시 예약 시에도 정원 초과 없이 처리합니다.

### 🔄 3. 예약·작품 상태의 단일 기준

예약 상태와 작품 제작 단계는 서버에서 `displayState`로 계산해 내려줍니다. 예를 들어 제작 중 구간은 건조·초벌·유약·재벌 단계까지 서버가 결정하고, 프론트엔드는 같은 응답 값을 사용자 화면, 마이페이지, 파트너 화면에서 일관되게 렌더링합니다.

### 🔔 4. 알림과 사용자 피드백

예약 확정, 취소, 작품 상태 변경 같은 이벤트는 인앱 알림과 웹 푸시로 전달합니다. 알림 발송은 비동기로 분리해 핵심 예약·작품 흐름이 외부 발송 실패에 영향을 받지 않도록 했습니다.

### 🪪 5. 파트너 등록과 이미지 업로드

파트너는 사업자등록증과 공방 이미지를 업로드해 공방 등록을 진행합니다. 이미지는 S3 presigned URL로 직접 업로드하고, 사업자등록증은 OCR과 진위확인 API를 통해 검증합니다.

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

## 👥 Contributors

| Profile | Name | Role | Contributions |
| --- | --- | :---: | --- |
| <img src="https://github.com/nogglee.png" width="56" alt="nogglee profile" /> | <a href="https://github.com/nogglee"><nobr>이은지</nobr></a> | FE | 디자인 시스템 · FSD 설계 · 파트너 전용 기능 · 인증 · 온보딩 게이트 · 알림 FCM · PWA · CI/CD · AI 자동화 |
| <img src="https://github.com/codingguri.png" width="56" alt="codingguri profile" /> | <a href="https://github.com/codingguri"><nobr>이승훈</nobr></a> | FE | 공통 폼 · 인터랙션 UI · 로그인 · OAuth 플로우 · 온보딩 바텀시트 · 예약 시간 표기 |
| <img src="https://github.com/yundlab.png" width="56" alt="yundlab profile" /> | <a href="https://github.com/yundlab"><nobr>한윤지</nobr></a> | FE | 공통 UI · FSD 정합 · 인증 · 공방 · 예약 FE · 작품 · 리뷰 · 마이 FE · MSW→실 BE 전환 주도 |
| <img src="https://github.com/taesongxxxx.png" width="56" alt="taesongxxxx profile" /> | <a href="https://github.com/taesongxxxx"><nobr>최태성</nobr></a> | BE | DB 스키마 · 마이그레이션 · 파트너 도메인 API 전체 · 타임슬롯 · 상태 전이 · OCR · 진위확인 게이트 · BE AWS 배포 |
| <img src="https://github.com/chocofanta01.png" width="56" alt="chocofanta01 profile" /> | <a href="https://github.com/chocofanta01"><nobr>이재혁</nobr></a> | BE | API 계약 · 정합 문서화 · 회원 인증 · 소셜 OAuth · 공방 · 예약 · 작품 BE · 알림 BE 파이프라인 |
