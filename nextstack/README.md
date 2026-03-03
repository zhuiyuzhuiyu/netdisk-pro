# CloudDrive Pro - Next Stack

## Stack
- Next.js App Router + Route Handlers
- PostgreSQL + Prisma
- JWT + bcryptjs auth
- Local volume upload storage (`STORAGE_DIR`)

## Milestones
- M0: old route frozen
- M1: baseline scaffold done
- M2: core netdisk APIs + pages done in this branch

## Run locally
1. Copy env and adjust DB/JWT:
   - `cp .env.example .env`
2. Start dependencies:
   - `docker compose up -d db`
3. Push Prisma schema and generate client:
   - `pnpm prisma:generate`
   - `pnpm prisma:push`
4. Start app:
   - `pnpm dev`

## Main pages
- `/register`
- `/login`
- `/drive`
- `/s/:token`

## Main APIs
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/POST/PATCH/DELETE /api/folders`
- `GET/PATCH/DELETE /api/files`
- `POST /api/files/upload`
- `GET /api/files/:id/download`
- `GET/POST/DELETE /api/share`
- `GET/POST /api/share/:token`
- `GET /api/share/:token/download`
- `GET /api/trash`
- `POST /api/trash/restore`
- `GET /api/quota`
- `GET /api/health`
