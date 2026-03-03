import { expect, test } from '@playwright/test';

test('register/login renders drive home', async ({ page }) => {
  const email = `user${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.getByPlaceholder('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByRole('heading', { name: 'My Drive' })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test('public share page resolves metadata with password', async ({ page, request }) => {
  const email = `share${Date.now()}@example.com`;

  const register = await request.post('http://localhost:4000/api/auth/register', {
    data: { email, password: 'Password123!' }
  });
  expect(register.ok()).toBeTruthy();

  const login = await request.post('http://localhost:4000/api/auth/login', {
    data: { email, password: 'Password123!' }
  });
  const loginBody = await login.json();

  const upload = await request.post('http://localhost:4000/api/drive/upload', {
    headers: { Authorization: `Bearer ${loginBody.token}` },
    multipart: {
      file: {
        name: 'shared.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('shared data')
      }
    }
  });
  const uploadBody = await upload.json();

  const share = await request.post(`http://localhost:4000/api/drive/items/${uploadBody.id}/shares`, {
    headers: { Authorization: `Bearer ${loginBody.token}` },
    data: { password: '1234' }
  });
  const shareBody = await share.json();

  await page.goto(`/share/${shareBody.token}`);
  await page.getByPlaceholder('Password (optional)').fill('1234');
  await page.getByRole('button', { name: 'Load' }).click();

  await expect(page.getByText('shared.txt')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download' })).toBeVisible();
});
