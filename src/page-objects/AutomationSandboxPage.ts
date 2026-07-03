import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { elementRepository } from '../repository/elementRepository';

/**
 * Page Object for the Automation Sandbox page.
 *
 * Centralises the actions and assertions specific to the second tab
 * to avoid mixing responsibilities with the main website.
 */
export class AutomationSandboxPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Locator for the pizza checkbox.
   * @returns A `Locator` targeting the pizza checkbox by role and name.
   */
  get pizzaCheckbox(): Locator {
    return this.page.getByRole(
      elementRepository.checkboxes.pizzaCheckbox.role,
      { name: elementRepository.checkboxes.pizzaCheckbox.name }
    );
  }

  /**
   * Locator for the 'Si' radio button.
   * @returns A `Locator` targeting the 'Si' radio button by role and name.
   */
  get radioButtonSi(): Locator {
    return this.page.getByRole(
      elementRepository.radioButtons.radioButtonSi.role,
      { name: elementRepository.radioButtons.radioButtonSi.name }
    );
  }

  /**
   * Clicks the dynamic sandbox button and asserts the hidden message appears.
   */
  async getByRoleMethod(): Promise<void> {
    await this.page
      .getByRole(elementRepository.buttons.generateId.role, {
        name: elementRepository.buttons.generateId.name,
        exact: elementRepository.buttons.generateId.exact,
      })
      .click();

    await expect(
      this.page.locator(elementRepository.hiddenElements.generatedMessage)
    ).toContainText(elementRepository.texts.generatedMessagePartial);
  }

  /**
   * Locates the reference text on the page and asserts it is visible.
   */
  async getByTextMethod(): Promise<void> {
    this.page.getByText(elementRepository.texts.aBoringText);

    await expect(
      this.page.getByText(elementRepository.texts.aBoringText, { exact: true })
    ).toBeVisible();
  }

  /**
   * Locates the element by its associated label and fills it with the repository value.
   */
  async getByLabelMethod(): Promise<void> {
    await this.page
      .getByLabel(elementRepository.texts.aBoringText)
      .fill(elementRepository.texts.testInputValue);
    await expect(
      this.page.getByLabel(elementRepository.texts.aBoringText, { exact: true })
    ).toBeVisible();
  }
}
