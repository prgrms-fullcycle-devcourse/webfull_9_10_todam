FROM node:22-alpine AS base

RUN corepack enable

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web

RUN pnpm --filter @todam/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@todam/web", "start"]
