# CloudDrive Pro Architecture

## Monorepo Layout
- `apps/backend`: Express API, Prisma ORM, SQLite, JWT auth, upload/share logic.
- `apps/frontend`: React + Vite + Tailwind web client.
- `packages/e2e`: Playwright end-to-end tests.
- `docs`: architecture and delivery evidence.

## Backend
- Runtime: Node.js + TypeScript + Express.
- Persistence: SQLite (`prisma/schema.prisma`) via Prisma Client.
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` with JWT bearer tokens.
- File model:
  - `FileItem` supports nested folders via self-referencing `parentId`.
  - Soft delete via `deletedAt` for recycle bin.
  - Move/rename/update endpoints under `/api/drive`.
- Upload/download:
  - Multipart upload with Multer to local disk volume (`UPLOAD_ROOT`).
  - Download streams through Express.
- Share links:
  - `ShareLink` token with optional bcrypt password hash and optional expiry.
  - Public endpoints under `/api/public/share/:token`.
- Quota stats:
  - Aggregate file sizes per user and compare to configured `MAX_QUOTA_BYTES`.
- Observability:
  - Structured request logs using `pino` + `pino-http`.
  - Health endpoint `GET /health`.

## Frontend
- React Router routes:
  - `/login`, `/register`
  - `/` authenticated drive UI
  - `/share/:token` public read-only share page
- State:
  - `AuthProvider` stores JWT/email in localStorage and validates via `/api/auth/me`.
- Drive UI:
  - Folder tree + folder scoped listing.
  - Create folder, rename, move, upload, delete, restore.
  - Share management modal for file links.

## Test Strategy
- Backend: `vitest` + `supertest` integration tests for auth/drive/share flows.
- Frontend: `vitest` + Testing Library component tests.
- E2E: Playwright for registration/login and public share flows.

## Deployment
- Docker multi-stage build compiles frontend and backend.
- Single runtime container serves API and built frontend through backend Express.
- `docker-compose.yml` persists SQLite data and uploaded files with named volumes.
