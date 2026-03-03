import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command:
        'cd ../../apps/backend && DATABASE_URL="file:./e2e.db" JWT_SECRET="e2e-secret" UPLOAD_ROOT="./uploads-e2e" pnpm prisma:push && DATABASE_URL="file:./e2e.db" JWT_SECRET="e2e-secret" UPLOAD_ROOT="./uploads-e2e" pnpm dev',
      port: 4000,
      reuseExistingServer: true
    },
    {
      command: 'cd ../../apps/frontend && VITE_API_BASE="http://localhost:4000" pnpm dev --host 0.0.0.0 --port 5173',
      port: 5173,
      reuseExistingServer: true
    }
  ]
});
