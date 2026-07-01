/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * Configuracion global de Playwright para el proyecto.
 *
 * Aqui se centralizan:
 * - la carpeta donde viven los tests,
 * - las opciones comunes de ejecucion,
 * - la URL base del sitio a probar,
 * - y los navegadores sobre los que se lanza la suite.
 */
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Directorio raiz desde el que Playwright descubre los tests.
  testDir: './tests',
  /* Ejecuta los tests en paralelo cuando es posible. */
  fullyParallel: true,
  /* Falla en CI si se deja un test.only por error. */
  forbidOnly: !!process.env.CI,
  /* Reintenta solo en CI para reducir falsos negativos puntuales. */
  retries: process.env.CI ? 2 : 0,
  /* En CI se limita el paralelismo para dar mas estabilidad. */
  workers: process.env.CI ? 1 : undefined,
  /* Genera el reporte HTML al finalizar la ejecucion. */
  reporter: 'html',
  /* Ajustes compartidos por todos los navegadores definidos abajo. */
  use: {
    // URL base para permitir navegaciones relativas como '/cursos'.
    baseURL: 'https://www.freerangetesters.com/',

    /* Guarda trace al reintentar tests fallidos para facilitar el debug. */
    trace: 'on-first-retry',
  },

  /* Proyectos de ejecucion por navegador. */
  projects: [
    {
      name: 'chromium',
      use: {
        // Se fuerza Chromium maximizado para trabajar en un viewport real.
        browserName: 'chromium',
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
        },
      },
    },

    {
      name: 'firefox',
      // Configuracion desktop predefinida de Playwright para Firefox.
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      // Configuracion desktop predefinida de Playwright para WebKit/Safari.
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'API TEST',
      testMatch: /.*API.spec.ts/,
      use: {
        // Se fuerza Chromium maximizado para trabajar en un viewport real.
        baseURL: 'https://api.github.com/',

        extraHTTPHeaders: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${(process.env.API_TOKEN)}`,
        },
      },
    }
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});