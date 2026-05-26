FROM node:22-alpine AS base

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api

RUN pnpm --filter @todam/api prisma generate
RUN pnpm --filter @todam/api build

EXPOSE 4000

CMD ["pnpm", "--filter", "@todam/api", "start"]