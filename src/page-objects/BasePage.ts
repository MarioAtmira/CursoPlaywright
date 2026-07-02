import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Base class centralising generic reusable actions for all Page Objects.
 *
 * Any Page Object extending this class inherits the common interaction
 * methods (check, uncheck, radio) without re-implementing them.
 * The caller is responsible for providing the Locator to act on.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Scrolls the element into the viewport for stable interaction.
   * @param locator - The locator of the element to scroll into view.
   */
  protected async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
  }

  /**
   * Checks a checkable element and asserts it is checked.
   * @param locator - The locator of the element to check.
   */
  async checkElement(locator: Locator): Promise<void> {
    await this.scrollToElement(locator);
    await locator.check();
    await expect(locator).toBeChecked();
  }

  /**
   * Unchecks a checkable element and asserts it is unchecked.
   * @param locator - The locator of the element to uncheck.
   */
  async uncheckElement(locator: Locator): Promise<void> {
    await this.scrollToElement(locator);
    await locator.uncheck();
    await expect(locator).not.toBeChecked();
  }

  /**
   * Selects a radio button and asserts it is selected.
   * @param locator - The locator of the radio button to select.
   */
  async selectRadioButton(locator: Locator): Promise<void> {
    await this.scrollToElement(locator);
    await locator.check();
    await expect(locator).toBeChecked();
  }
}
