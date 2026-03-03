FROM node:20-bookworm AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/e2e/package.json packages/e2e/package.json

RUN pnpm install --frozen-lockfile=false

COPY . .

RUN pnpm --filter @clouddrive/backend prisma:generate
RUN pnpm --filter @clouddrive/frontend build
RUN pnpm --filter @clouddrive/backend build

FROM node:20-bookworm AS runtime
WORKDIR /app
RUN corepack enable

COPY --from=builder /app /app

EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL="file:./dev.db"
ENV JWT_SECRET="change-me"
ENV UPLOAD_ROOT="./uploads"
ENV FRONTEND_DIST="../frontend/dist"

CMD ["sh", "-c", "cd apps/backend && pnpm prisma:push && pnpm start"]
