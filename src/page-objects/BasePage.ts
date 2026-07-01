import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Clase base que centraliza acciones genericas reutilizables por cualquier Page Object.
 *
 * Al extender esta clase, un Page Object hereda los metodos de interaccion
 * comunes (check, uncheck, radio) sin necesidad de reimplementarlos.
 * El llamador es responsable de proporcionar el Locator sobre el que actuar.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  // Lleva el elemento al viewport para poder interactuar de forma estable.
  protected async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
  }

  // Marca un elemento checkeable y valida que queda marcado.
  async checkElement(locator: Locator): Promise<void> {
    await this.scrollToElement(locator);
    await locator.check();
    await expect(locator).toBeChecked();
  }

  // Desmarca un elemento checkeable y valida que queda sin marcar.
  async uncheckElement(locator: Locator): Promise<void> {
    await this.scrollToElement(locator);
    await locator.uncheck();
    await expect(locator).not.toBeChecked();
  }

  // Selecciona un radio button y valida que queda seleccionado.
  async selectRadioButton(locator: Locator): Promise<void> {
    await this.scrollToElement(locator);
    await locator.check();
    await expect(locator).toBeChecked();
  }
}
