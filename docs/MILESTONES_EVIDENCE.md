# Milestones Evidence

## Milestone 1: Workspace Bootstrap
- Command:
  - `pnpm install`
- Output:
  - Attempt 1 failed due sandbox cache permission:
    - `EPERM: operation not permitted, mkdir '/Users/zyh/.cache/node/corepack/...`
  - Attempt 2 with writable Corepack cache:
    - `COREPACK_HOME=/tmp/corepack pnpm install`
    - Failed due network DNS restriction:
    - `getaddrinfo ENOTFOUND registry.npmjs.org`

## Milestone 2: Prisma Setup
- Command:
  - `pnpm --filter @clouddrive/backend prisma:push`
  - `pnpm --filter @clouddrive/backend prisma:seed`
- Output:
  - Blocked because dependencies could not be installed (`pnpm install` failed with `ENOTFOUND registry.npmjs.org`).

## Milestone 3: Backend Tests
- Command:
  - `pnpm --filter @clouddrive/backend test`
- Output:
  - Blocked because dependencies could not be installed (`pnpm install` failed with `ENOTFOUND registry.npmjs.org`).

## Milestone 4: Frontend Tests
- Command:
  - `pnpm --filter @clouddrive/frontend test`
- Output:
  - Blocked because dependencies could not be installed (`pnpm install` failed with `ENOTFOUND registry.npmjs.org`).

## Milestone 5: E2E Tests
- Command:
  - `pnpm --filter @clouddrive/e2e test`
- Output:
  - Blocked because dependencies could not be installed (`pnpm install` failed with `ENOTFOUND registry.npmjs.org`).

## Milestone 6: Lint
- Command:
  - `pnpm lint`
- Output:
  - Blocked because dependencies could not be installed (`pnpm install` failed with `ENOTFOUND registry.npmjs.org`).
