# todam

## 구조

```
todam/
├── apps/
│   ├── api/        # NestJS 백엔드 (포트 4000)
│   ├── web/        # Next.js 프론트엔드 (포트 3000)
│   └── admin/      # Next.js 어드민 (포트 3001)
├── packages/
│   ├── config/           # zod 환경변수 검증
│   ├── shared/           # 공통 타입 및 유틸리티
│   ├── ui/               # 공통 UI 컴포넌트
│   ├── eslint-config/    # 공유 ESLint 설정
│   └── typescript-config/ # 공유 TypeScript 설정
└── docker/
    ├── compose/
    │   ├── local.yml   # 로컬 인프라 (postgres, redis, minio)
    │   └── prod.yml    # 프로덕션 배포
    └── nginx/
        └── default.conf
```

## 사전 준비

- Node.js 22+
- pnpm
- Docker Desktop

## 로컬 개발 시작

### 1. 클론 및 의존성 설치

```bash
git clone https://github.com/your-org/todam.git
cd todam
pnpm install
```

### 2. 환경변수 설정

각 앱 폴더에 `.env` 파일을 생성해요.

```bash
# apps/api/.env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://todam:todam@localhost:5432/todam
JWT_SECRET=local-secret-key
```

```bash
# apps/web/.env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:80/api
```

```bash
# apps/admin/.env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:80/api
```

### 3. 인프라 실행 (postgres, redis, minio)

```bash
docker compose -f docker/compose/local.yml up -d
```

### 4. 앱 실행

```bash
pnpm --filter @todam/api dev    # API  → localhost:4000
pnpm --filter @todam/web dev    # Web  → localhost:3000
pnpm --filter @todam/admin dev  # Admin → localhost:3001
```

> 앱은 Docker 없이 로컬에서 직접 실행해요. 코드 수정이 즉시 반영되고 디버깅이 편해요.

### 인프라 종료

```bash
docker compose -f docker/compose/local.yml down

# 데이터까지 초기화
docker compose -f docker/compose/local.yml down -v
```

## 브랜치 전략

```
feature/* → dev → main
```

- `feature/*` : 기능 개발 브랜치. PR을 `dev`로 올려요.
- `dev` : 통합 브랜치. 푸시 시 CI(lint, typecheck, test)가 자동 실행돼요.
- `main` : 프로덕션 브랜치. 머지 시 EC2에 자동 배포돼요.

## 공유 패키지

| 패키지 | 역할 |
|--------|------|
| `@todam/config` | 환경변수를 zod로 검증하고 타입화 |
| `@todam/typescript-config` | 공유 tsconfig (base / nest / nextjs / react-library) |
| `@todam/eslint-config` | 공유 ESLint 설정 (base / nest / next) |
| `@todam/shared` | 공통 타입 및 유틸리티 |
| `@todam/ui` | 공통 UI 컴포넌트 |

## Git 훅

커밋/푸시 시 자동으로 실행돼요. (`husky` + `lint-staged`)

- **pre-commit** : 변경된 파일에만 ESLint + Prettier 적용
- **pre-push** : 전체 타입 체크 (`turbo typecheck`)

## 문서

| 문서 | 내용 |
|------|------|
| `local-dev-guide.md` | 로컬 개발 환경 세팅 상세 |
| `env-docker-compose-deploy.md` | 환경변수 관리 및 EC2 배포 전략 |
| `config-package-guide.md` | `@todam/config` zod 환경변수 검증 |
| `typescript-config-guide.md` | 공유 TypeScript 설정 |
| `eslint-config-guide.md` | 공유 ESLint 설정 |