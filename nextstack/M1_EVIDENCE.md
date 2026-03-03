# M1 Evidence (Next.js 强制栈)

## 代码证据
- Next.js App Router: `app/`
- Route Handlers: `app/api/**/route.ts`
- PostgreSQL Prisma schema: `prisma/schema.prisma`
- S3 client: `lib/s3.ts`
- EC2/Nginx/Compose skeleton: `docker-compose.yml`, `ops/nginx.conf`

## 验证命令
- `pnpm install`
- `pnpm build`
- `pnpm test`

## 当前状态
- M1: 架构与骨架完成，M2功能实现进行中。
