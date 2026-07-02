import { test } from '@playwright/test';
import { GitHubApiPage } from '../../src/page-objects/GitHubApiPage';

test.describe('API Tests', () => {
  test('API test example', async ({ request }) => {
    const github = new GitHubApiPage(request);

    await test.step('Create a new Issue', async () => {
      await github.createIssue(
        '[BUG] Issue created by Playwright test',
        'This issue was created during an automated test run.',
      );
    });
  });
});
