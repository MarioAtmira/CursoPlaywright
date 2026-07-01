import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { elementRepository } from '../repository/elementRepository';

/**
 * Page Object especifico del sandbox de automatizacion.
 *
 * Centraliza las acciones y validaciones propias de la segunda ventana
 * para no mezclar responsabilidades con la web principal.
 */
export class AutomationSandboxPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ---------------------------------------------------------------------------
  // Locators: el PO expone los elementos; la accion la elige el llamador.
  // ---------------------------------------------------------------------------

  // Locator del checkbox de pizza.
  get pizzaCheckbox(): Locator {
    return this.page.getByRole(
      elementRepository.checkboxes.pizzaCheckbox.role,
      { name: elementRepository.checkboxes.pizzaCheckbox.name }
    );
  }

  // Locator del radio button "Si".
  get radioButtonSi(): Locator {
    return this.page.getByRole(
      elementRepository.radioButtons.radioButtonSi.role,
      { name: elementRepository.radioButtons.radioButtonSi.name }
    );
  }

  // ---------------------------------------------------------------------------
  // Metodos de interaccion especificos de la pagina.
  // ---------------------------------------------------------------------------

  // Pulsa el boton dinamico del sandbox y valida que aparece el mensaje oculto.
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

  // Busca el texto de referencia en la pagina y valida que se muestre de forma visible.
  // getByText devuelve un Locator de forma sincrona; no ejecuta ninguna accion
  // en el navegador hasta que se le encadena .click(), .fill() o una asercion.
  // La linea inferior muestra unicamente como se construye el locator.
  async getByTextMethod(): Promise<void> {
    this.page.getByText(elementRepository.texts.aBoringText);

    await expect(
      this.page.getByText(elementRepository.texts.aBoringText, { exact: true })
    ).toBeVisible();
  }

  // Busca el elemento por su label asociado y rellena el campo con el valor del repositorio.
  async getByLabelMethod(): Promise<void> {
    await this.page
      .getByLabel(elementRepository.texts.aBoringText)
      .fill(elementRepository.texts.testInputValue);
    await expect(
      this.page.getByLabel(elementRepository.texts.aBoringText, { exact: true })
    ).toBeVisible();
  }
}