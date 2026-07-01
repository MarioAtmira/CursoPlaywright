import { expect, type BrowserContext, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { elementRepository } from '../repository/elementRepository';

/**
 * Page Object principal del sitio de Free Range Testers.
 *
 * Encapsula acciones reutilizables y validaciones comunes para mantener
 * los tests enfocados en el flujo de negocio y no en los detalles tecnicos.
 * Las acciones genericas (check, uncheck, radio) se heredan de BasePage.
 */
export class FreeRangeSitePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Navega a la pagina principal usando la ruta relativa definida en el repositorio.
  async openHome(): Promise<void> {
    await this.page.goto(elementRepository.routes.home);
  }

  // Verifica que el titulo de la home coincide con el esperado.
  async expectHomeTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(elementRepository.titles.home);
  }

  // Abre la seccion de cursos desde el header principal.
  async goToCourses(): Promise<void> {
    await this.headerLink(elementRepository.links.courses.name).click();
    await this.page.waitForURL(elementRepository.routes.courses);
  }

  // Valida que la pagina actual corresponde a la seccion de cursos.
  async expectCoursesTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(elementRepository.titles.courses);
  }

  // Abre la seccion de recursos desde el header principal.
  async goToResources(): Promise<void> {
    await this.headerLink(elementRepository.links.resources.name).click();
    await this.page.waitForURL(elementRepository.routes.resources);
  }

  // Abre el sandbox de automatizacion y devuelve la segunda ventana capturada.
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

  // Construye el locator de un enlace del header para evitar repetir la cadena completa.
  private headerLink(name: string) {
    return this.page
      .getByTestId(elementRepository.containers.headerTestId)
      .getByRole('link', { name, exact: true });
  }
}
