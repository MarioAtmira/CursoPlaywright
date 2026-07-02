import { test, expect, type Page } from '@playwright/test';
import { AutomationSandboxPage } from '../../src/page-objects/AutomationSandboxPage';
import { FreeRangeSitePage } from '../../src/page-objects/FreeRangeSitePage';

// Cierre explicito del contexto tras cada test. Playwright suele gestionarlo
// automaticamente, pero aqui queda definido de forma explicita.
test.afterEach(async ({ context }) => {
  await context.close();
});

// Suite orientada a validar la navegacion basica por el sitio principal.
test.describe('Entrar a la pagina de FreeRangeTesters y navegar por ella', () => {
  test('Navigate to freeRangeTesters', async ({ page }) => {
    // Page Object principal para encapsular acciones reutilizables del sitio.
    const site = new FreeRangeSitePage(page);

    await test.step('Open FreeRangeTesters home page', async () => {
      await site.openHome();
      await site.expectHomeTitle();
    });

    await test.step('Go to Courses section', async () => {
      await site.goToCourses();
    });

    await test.step('Validate Courses page title', async () => {
      await site.expectCoursesTitle();
    });
  });
});

// Suite centrada en interacciones con elementos concretos y ventanas secundarias.
test.describe('Buscamos diferentes tipos de elementos web en FreeRangeTesters', () => {

  test('Different types of webElement freeRangeTesters', async ({ page, context }) => {
    // PO de la pagina principal desde la que se navega al sandbox.
    const poFreeRange = new FreeRangeSitePage(page);

    // Referencias que se rellenan cuando se abre la segunda ventana.
    let sandboxPage: Page;
    let sandboxPO: AutomationSandboxPage;

    await test.step('Open FreeRangeTesters home page', async () => {
      await poFreeRange.openHome();
      await poFreeRange.expectHomeTitle();
    });

    await test.step('Go to Resources section', async () => {
      await poFreeRange.goToResources();
    });

    await test.step('Open Automation Sandbox in new tab', async () => {
      // Captura la nueva ventana y crea un PO independiente para operar sobre ella.
      sandboxPage = await poFreeRange.openAutomationSandbox(context);
      sandboxPO = new AutomationSandboxPage(sandboxPage);

      await expect(sandboxPage).toHaveURL(/sandbox-automation-testing/);
    });

    await test.step('Click generate button in sandbox', async () => {
      // Ejecuta el metodo de busqueda por rol
      await sandboxPO.getByRoleMethod();
    });

    await test.step('Validate boring text is visible in sandbox', async () => {
      // Ejecuta el metodo de busqueda por texto
      await sandboxPO.getByTextMethod();
    });

    await test.step('Fill input by label in sandbox', async () => {
      // Ejecuta el metodo de busqueda por label
      await sandboxPO.getByLabelMethod();
    });

    await test.step('Click on checkbox in sandbox', async () => {
      // El locator lo expone el PO; la accion generica viene de BasePage.
      await sandboxPO.checkElement(sandboxPO.pizzaCheckbox);
    });
    
    await test.step('Uncheck checkbox in sandbox', async () => {
      // El locator lo expone el PO; la accion generica viene de BasePage.
      await sandboxPO.uncheckElement(sandboxPO.pizzaCheckbox);
    });

    await test.step('Click on radio button in sandbox', async () => {
      // El locator lo expone el PO; la accion generica viene de BasePage.
      await sandboxPO.selectRadioButton(sandboxPO.radioButtonSi);
    });
  });
});
