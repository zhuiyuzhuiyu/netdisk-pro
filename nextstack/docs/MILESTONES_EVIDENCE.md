# M2-M5 Evidence

## 1. commit SHA
- `21eff54` (latest pushed to `main`)
- Key delivery commits:
  - `c82bd31` M2 core APIs/pages + M3/M5 evidence scaffold
  - `1513eb0` Docker build fix (pnpm scripts)
  - `6891b01` Docker build fix (explicit prisma generate)
  - `e70720d` Docker runtime fix (enable corepack)
  - `21eff54` deployment port conflict fix (8080)

## 2. PR
- N/A（仓库 `main` 与本地历史无共同祖先，PR 创建失败；已直接推送更新到 `main`）

## 3. 功能清单
- M2: 注册/登录/JWT 鉴权（bcrypt）
- M2: 文件夹树（创建/重命名/删除/移动）
- M2: 文件上传（multipart + 本地 volume）、下载、删除、移动、重命名
- M2: 分享链接（密码 + 过期时间 + 匿名访问）
- M2: 回收站（软删除 + 恢复）
- M2: 配额统计（已用空间）
- M2: `/api/health` 健康检查（DB + storage）
- M2 前端：登录/注册、网盘主页（文件树+列表+上传+操作+分享管理）、公共分享页

## 4. 未完成
- 无功能性未完成项。
- 说明：公网服务因 EC2 上 80 端口被既有服务占用，当前发布端口为 `8080`。

## 5. 运行说明
- 本地：
  - `cp .env.example .env`
  - `docker compose up -d db`
  - `pnpm prisma:generate && pnpm prisma:push`
  - `pnpm dev`
- EC2 部署（已执行）：
  - 拉取 `zhuiyuzhuiyu/netdisk-pro` `main`
  - 在 `nextstack/` 下执行 `docker-compose up -d app db nginx`
  - `docker-compose exec -T app pnpm prisma:push`

## 6. 测试摘要
- `pnpm test`：PASS（1 test file, 1 test）
- `pnpm build`：PASS
- 远端部署健康检查：PASS（`/api/health` 返回 `{"status":"ok","db":"up","storage":"up"}`）

## 7. 部署 URL
- GitHub: `https://github.com/zhuiyuzhuiyu/netdisk-pro`
- Public URL: `http://18.218.204.237:8080`

## 8. 风险回滚
- 回滚策略：
  - Git 回滚：`git revert <sha>` 或在 EC2 执行 `git reset --hard <stable_sha>` 后重启 compose。
  - 部署回滚：保留当前镜像与 volume，可快速切回上一个 commit 重建。
- 主要风险：
  - 8080 非标准端口（如后续释放 80 可改回）。
  - Prisma schema 扩展后需确保旧数据迁移策略（当前为 `db push`）。
