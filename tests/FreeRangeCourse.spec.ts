import { test, expect, type Page } from '@playwright/test';
import { AutomationSandboxPage } from './page-objects/AutomationSandboxPage';
import { FreeRangeSitePage } from './page-objects/FreeRangeSitePage';
import { StepScreenshotHelper } from './support/StepScreenshotHelper';

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
    // Helper para adjuntar capturas numeradas en cada step del test.
    const screenshot = new StepScreenshotHelper();

    await test.step('Open FreeRangeTesters home page', async (step) => {
      await site.openHome();
      await site.expectHomeTitle();
      await screenshot.attach(step, page, 'home');
    });

    await test.step('Go to Courses section', async (step) => {
      await site.goToCourses();
      await screenshot.attach(step, page, 'courses');
    });

    await test.step('Validate Courses page title', async (step) => {
      await site.expectCoursesTitle();
      await screenshot.attach(step, page, 'courses-title-validation');
    });
  });
});

// Suite centrada en interacciones con elementos concretos y ventanas secundarias.
test.describe('Buscamos diferentes tipos de elementos web en FreeRangeTesters', () => {

  test('Different types of webElement freeRangeTesters', async ({ page, context }) => {
    // PO de la pagina principal desde la que se navega al sandbox.
    const poFreeRange = new FreeRangeSitePage(page);
    const screenshot = new StepScreenshotHelper();

    // Referencias que se rellenan cuando se abre la segunda ventana.
    let sandboxPage: Page;
    let sandboxPO: AutomationSandboxPage;

    await test.step('Open FreeRangeTesters home page', async (step) => {
      await poFreeRange.openHome();
      await poFreeRange.expectHomeTitle();
      await screenshot.attach(step, page, 'home');
    });

    await test.step('Go to Resources section', async (step) => {
      await poFreeRange.goToResources();
      await screenshot.attach(step, page, 'resources');
    });

    await test.step('Open Automation Sandbox in new tab', async (step) => {
      // Captura la nueva ventana y crea un PO independiente para operar sobre ella.
      sandboxPage = await poFreeRange.openAutomationSandbox(context);
      sandboxPO = new AutomationSandboxPage(sandboxPage);

      await expect(sandboxPage).toHaveURL(/sandbox-automation-testing/);
      await screenshot.attach(step, sandboxPage, 'automation-sandbox');
    });

    await test.step('Click generate button in sandbox', async (step) => {
      // Ejecuta el metodo de busqueda por rol
      await sandboxPO.getByRoleMethod();
      await screenshot.attach(step, sandboxPage, 'generate-button-clicked');
    });

    await test.step('Validate boring text is visible in sandbox', async (step) => {
      // Ejecuta el metodo de busqueda por texto
      await sandboxPO.getByTextMethod();
      await screenshot.attach(step, sandboxPage, 'boring-text-validated');
    });

    await test.step('Fill input by label in sandbox', async (step) => {
      // Ejecuta el metodo de busqueda por label
      await sandboxPO.getByLabelMethod();
      await screenshot.attach(step, sandboxPage, 'input-filled-by-label');
    });

    await test.step('Click on checkbox in sandbox', async (step) => {
      // El locator lo expone el PO; la accion generica viene de BasePage.
      await sandboxPO.checkElement(sandboxPO.pizzaCheckbox);
      await screenshot.attach(step, sandboxPage, 'checkbox-clicked');
    });
    
    await test.step('Uncheck checkbox in sandbox', async (step) => {
      // El locator lo expone el PO; la accion generica viene de BasePage.
      await sandboxPO.uncheckElement(sandboxPO.pizzaCheckbox);
      await screenshot.attach(step, sandboxPage, 'checkbox-unchecked');
    });

    await test.step('Click on radio button in sandbox', async (step) => {
      // El locator lo expone el PO; la accion generica viene de BasePage.
      await sandboxPO.selectRadioButton(sandboxPO.radioButtonSi);
      await screenshot.attach(step, sandboxPage, 'radio-button-clicked');
    });
  });
});