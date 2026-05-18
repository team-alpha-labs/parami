# syntax=docker/dockerfile:1
# Cloud Run 배포용 Next.js 16 멀티스테이지 Dockerfile
# - next.config.ts에 output: 'standalone' 필수 (최소 실행 파일만 복사)
# - 빌드 시 NEXT_PUBLIC_* 환경변수가 컴파일에 박힘 → runtime env로는 못 바꿈

# ─── 1) Dependencies ──────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ─── 2) Build ─────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_TOSS_CLIENT_KEY는 빌드 타임에 박혀야 클라이언트 번들로 나감
# Cloud Run 배포 시 --build-env-vars로 주입 또는 cloudbuild.yaml에 정의
ARG NEXT_PUBLIC_TOSS_CLIENT_KEY
ENV NEXT_PUBLIC_TOSS_CLIENT_KEY=$NEXT_PUBLIC_TOSS_CLIENT_KEY

RUN npm run build

# ─── 3) Runtime ───────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
# Cloud Run은 PORT 환경변수로 포트 지정 (기본 8080)

# 보안: root 대신 non-root 유저로 실행
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
