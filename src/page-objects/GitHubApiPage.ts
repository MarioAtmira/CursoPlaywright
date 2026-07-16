import { expect, type APIRequestContext } from '@playwright/test';

/**
 * Page Object for the GitHub REST API.
 *
 * Encapsulates HTTP calls and their assertions, keeping specs clean
 * and centralising all API access logic in a single place.
 *
 * Required environment variables: GH_USER, GH_REPO, API_TOKEN.
 */
export class GitHubApiPage {
  private readonly user: string;
  private readonly repo: string;

  constructor(private readonly request: APIRequestContext) {
    const user = process.env.GH_USER;
    const repo = process.env.GH_REPO;

    if (!user || !repo) {
      throw new Error(
        'Environment variables GH_USER and GH_REPO are required. ' +
        'Copy .env.example to .env and fill in the values.'
      );
    }

    this.user = user;
    this.repo = repo;
  }

  /**
   * Creates an issue and verifies it appears in the repository issue list.
   * @param title - The title of the issue to create.
   * @param body - The body text of the issue to create.
   * @returns The issue number assigned by GitHub.
   * @throws {Error} if the API returns a non-201 status or the issue does not appear within the poll timeout.
   */
  async createIssue(title: string, body: string): Promise<number> {
    const response = await this.request.post(`/repos/${this.user}/${this.repo}/issues`, {
      data: { title, body },
    });
    expect(response.status()).toBe(201);

    const created = await response.json() as { number: number };

    await expect.poll(async () => {
      const issues = await this.request.get(`/repos/${this.user}/${this.repo}/issues`);
      return await issues.json();
    }, { timeout: 10000 }).toContainEqual(expect.objectContaining({ title, body }));

    return created.number;
  }

  /**
   * Closes an existing issue by its number.
   * @param issueNumber - The number of the issue to close.
   * @throws {Error} if the API returns a non-200 status.
   */
  async closeIssue(issueNumber: number): Promise<void> {
    const response = await this.request.patch(
      `/repos/${this.user}/${this.repo}/issues/${issueNumber}`,
      { data: { state: 'closed' } },
    );
    expect(response.status()).toBe(200);
  }
}
