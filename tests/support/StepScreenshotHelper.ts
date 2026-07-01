import type { Page, TestStepInfo } from '@playwright/test';

/**
 * Helper utilitario para adjuntar capturas numeradas a cada test.step.
 *
 * Cada invocacion incrementa un contador interno para que los adjuntos
 * queden ordenados como 01-, 02-, 03-, etc.
 */
export class StepScreenshotHelper {
  private counter = 1;

  // Captura una imagen de la pagina actual y la adjunta al step recibido.
  async attach(step: TestStepInfo, page: Page, label: string): Promise<void> {
    const sequence = String(this.counter).padStart(2, '0');

    await step.attach(`${sequence}-${label}`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: 'image/png',
    });

    this.counter += 1;
  }
}
