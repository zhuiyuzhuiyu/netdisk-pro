# M2-M5 Evidence

## 1. commit SHA
- TBD

## 2. PR
- TBD

## 3. 功能清单
- M2: 注册/登录/JWT 鉴权（bcrypt）
- M2: 文件夹树（创建/重命名/删除/移动）
- M2: 文件上传（multipart + 本地 volume）、下载、删除、移动、重命名
- M2: 分享链接（密码 + 过期时间 + 匿名访问）
- M2: 回收站（软删除 + 恢复）
- M2: 配额统计（已用空间）
- M2: /api/health 健康检查
- M2 前端：登录/注册、网盘主页、分享管理、公共分享页

## 4. 未完成
- M4 AWS 公网部署尚未完成：当前环境无 `aws` CLI，且本机 Docker daemon 不可用导致无法在本地快速拉起 DB 容器验证联调。

## 5. 运行说明
- `cp .env.example .env`
- 启动 PostgreSQL（示例）：`docker compose up -d db`
- 执行 Prisma：`pnpm prisma:generate && pnpm prisma:push`
- 启动服务：`pnpm dev`
- 页面：`/register`、`/login`、`/drive`、`/s/:token`

## 6. 测试摘要
- `pnpm test`：PASS（1 test file, 1 test）
- `pnpm build`：PASS
- `pnpm prisma:push`：FAIL（`P1001 Can't reach database server at db:5432`）

## 7. 部署 URL
- GitHub: TBD
- Public URL: TBD

## 8. 风险回滚
- 回滚策略：以 commit SHA 为单位回滚（`git revert <sha>`），并保留 M1 基线分支可快速切回。
- 主要风险：数据库不可达时 API 返回错误；分享链接密码验证依赖 bcrypt hash 一致性；本地存储路径权限需可写。
