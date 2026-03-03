# CloudDrive Pro

Production-style cloud drive web app in a pnpm monorepo.

## Stack
- Backend: Node.js, TypeScript, Express, Prisma, SQLite
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Testing: Vitest, Supertest, Playwright
- Containers: Docker + docker-compose

## Monorepo Structure
- `apps/backend` API server and database schema
- `apps/frontend` React web app
- `packages/e2e` Playwright tests
- `docs` architecture and evidence

## Quick Start (Local)
1. Install dependencies:
   - `pnpm install`
2. Setup backend database:
   - `pnpm --filter @clouddrive/backend prisma:push`
   - `pnpm --filter @clouddrive/backend prisma:seed`
3. Run apps in development:
   - `pnpm --filter @clouddrive/backend dev`
   - `pnpm --filter @clouddrive/frontend dev`
4. Open:
   - Frontend: `http://localhost:5173`
   - Backend health: `http://localhost:4000/health`

Demo user from seed:
- Email: `demo@clouddrive.pro`
- Password: `Password123!`

## API Endpoints

### Health
- `GET /health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Drive (Bearer token required)
- `GET /api/drive/tree`
- `GET /api/drive/items?folderId=<id>&includeDeleted=true|false`
- `POST /api/drive/folders`
- `PATCH /api/drive/items/:itemId/rename`
- `PATCH /api/drive/items/:itemId/move`
- `DELETE /api/drive/items/:itemId`
- `POST /api/drive/items/:itemId/restore`
- `DELETE /api/drive/items/:itemId/purge`
- `POST /api/drive/upload` (multipart, `file`, optional `parentId`)
- `GET /api/drive/items/:itemId/download`
- `POST /api/drive/items/:itemId/shares`
- `GET /api/drive/items/:itemId/shares`
- `DELETE /api/drive/shares/:linkId`
- `GET /api/drive/quota`

### Public Share
- `GET /api/public/share/:token`
- `GET /api/public/share/:token/download`

## Docker Deploy
1. Build and run:
   - `docker compose up --build`
2. Access app:
   - `http://localhost:4000`

Persisted volumes:
- `clouddrive-db` for SQLite
- `clouddrive-uploads` for uploaded files

## Testing
- All tests: `pnpm test`
- Backend: `pnpm --filter @clouddrive/backend test`
- Frontend: `pnpm --filter @clouddrive/frontend test`
- E2E: `pnpm --filter @clouddrive/e2e test`

## Notes
- This setup avoids root manifest errors by including root `package.json` and `pnpm-workspace.yaml`.
- Structured logs are emitted by backend request logger (`pino-http`).
