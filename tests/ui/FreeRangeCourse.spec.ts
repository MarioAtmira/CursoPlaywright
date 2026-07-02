import { test, expect, type Page } from '@playwright/test';
import { AutomationSandboxPage } from '../../src/page-objects/AutomationSandboxPage';
import { FreeRangeSitePage } from '../../src/page-objects/FreeRangeSitePage';

// Explicit context close after each test. Playwright usually handles this
// automatically, but it is defined here for clarity.
test.afterEach(async ({ context }) => {
  await context.close();
});

// Suite focused on validating basic navigation through the main website.
test.describe('Navigate the FreeRangeTesters website', () => {
  test('Navigate to freeRangeTesters', async ({ page }) => {
    // Main Page Object to encapsulate reusable site actions.
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

// Suite focused on interacting with specific elements and secondary windows.
test.describe('Interact with different web element types on FreeRangeTesters', () => {

  test('Different types of webElement freeRangeTesters', async ({ page, context }) => {
    // Page Object for the main site, used to navigate to the sandbox.
    const poFreeRange = new FreeRangeSitePage(page);

    // References populated once the second tab is opened.
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
      // Captures the new tab and creates an independent Page Object for it.
      sandboxPage = await poFreeRange.openAutomationSandbox(context);
      sandboxPO = new AutomationSandboxPage(sandboxPage);

      await expect(sandboxPage).toHaveURL(/sandbox-automation-testing/);
    });

    await test.step('Click generate button in sandbox', async () => {
      // Uses the getByRole locator strategy.
      await sandboxPO.getByRoleMethod();
    });

    await test.step('Validate boring text is visible in sandbox', async () => {
      // Uses the getByText locator strategy.
      await sandboxPO.getByTextMethod();
    });

    await test.step('Fill input by label in sandbox', async () => {
      // Uses the getByLabel locator strategy.
      await sandboxPO.getByLabelMethod();
    });

    await test.step('Click on checkbox in sandbox', async () => {
      // Locator exposed by the Page Object; generic action inherited from BasePage.
      await sandboxPO.checkElement(sandboxPO.pizzaCheckbox);
    });
    
    await test.step('Uncheck checkbox in sandbox', async () => {
      // Locator exposed by the Page Object; generic action inherited from BasePage.
      await sandboxPO.uncheckElement(sandboxPO.pizzaCheckbox);
    });

    await test.step('Click on radio button in sandbox', async () => {
      // Locator exposed by the Page Object; generic action inherited from BasePage.
      await sandboxPO.selectRadioButton(sandboxPO.radioButtonSi);
    });
  });
});
