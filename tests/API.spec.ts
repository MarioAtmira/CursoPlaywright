import { test, expect } from '@playwright/test';

test.describe('Pruebas de APIs', () => {
  test('API test example', async ({ request, page }) => {
    const REPO  = 'CursoPlaywright';
    const USER  = 'MarioAtmira';

    await test.step('Create a new Issue', async (step) => {
      const newIssue = await request.post(`/repos/${USER}/${REPO}/issues`, {
        data: {
          title: '[BUG] Issue created by Playwright test',
          body: 'This issue was created during an automated test run.',
        },
      });
      expect(newIssue.status()).toBe(201);

      await expect.poll(async () => {
        const issue = await request.get(`/repos/${USER}/${REPO}/issues`);
        return await issue.json();
      }, { timeout: 10000 }).toContainEqual(expect.objectContaining({
        title: '[BUG] Issue created by Playwright test',
        body: 'This issue was created during an automated test run.',
      }));
    });
  });
});
