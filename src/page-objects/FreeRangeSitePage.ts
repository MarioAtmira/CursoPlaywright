import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { elementRepository } from '../repository/elementRepository';

/**
 * Main Page Object for the Free Range Testers website.
 *
 * Encapsulates reusable actions and common assertions to keep tests
 * focused on business flows rather than technical details.
 * Generic actions (check, uncheck, radio) are inherited from BasePage.
 */
export class FreeRangeSitePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Navigates to the home page using the relative route defined in the element repository. */
  async openHome(): Promise<void> {
    await this.page.goto(elementRepository.routes.home);
  }

  /** Asserts that the home page title matches the expected value. */
  async expectHomeTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(elementRepository.titles.home);
  }

  /** Opens the Courses section from the main header. */
  async goToCourses(): Promise<void> {
    await this.headerLink(elementRepository.links.courses.name).click();
    await this.page.waitForURL(elementRepository.routes.courses);
  }

  /** Asserts that the current page corresponds to the Courses section. */
  async expectCoursesTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(elementRepository.titles.courses);
  }

  /** Opens the Resources section from the main header. */
  async goToResources(): Promise<void> {
    await this.headerLink(elementRepository.links.resources.name).click();
    await this.page.waitForURL(elementRepository.routes.resources);
  }

  /**
   * Opens the Automation Sandbox and returns the captured second tab.
   * @param context - The browser context used to intercept the new page event.
   * @returns The `Page` instance representing the newly opened Automation Sandbox tab.
   */
  async openAutomationSandbox(context: BrowserContext): Promise<Page> {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      this.page.getByRole(elementRepository.links.automationSandbox.role, {
        name: elementRepository.links.automationSandbox.name,
        exact: elementRepository.links.automationSandbox.exact,
      }).click(),
    ]);

    await newPage.waitForLoadState();
    return newPage;
  }

  /**
   * Builds the locator for a header link to avoid repeating the full chain.
   * @param name - The accessible name of the link to locate.
   * @returns A `Locator` scoped to the header container for the given link name.
   */
  private headerLink(name: string): Locator {
    return this.page
      .getByTestId(elementRepository.containers.headerTestId)
      .getByRole('link', { name, exact: true });
  }
}
