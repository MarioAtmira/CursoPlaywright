import { test, expect } from '@playwright/test';
import { GitHubApiPage } from '../../src/page-objects/GitHubApiPage';

test.describe('API Tests', () => {
  test('API test example', async ({ request }) => {
    const github = new GitHubApiPage(request);
    let issueNumber: number;

    await test.step('Create a new Issue', async () => {
      issueNumber = await github.createIssue(
        '[BUG] Issue created by Playwright test',
        'This issue was created during an automated test run.',
      );
      expect(issueNumber).toBeGreaterThan(0);
    });

    await test.step('Close the created Issue (teardown)', async () => {
      await github.closeIssue(issueNumber);
    });
  });
});
