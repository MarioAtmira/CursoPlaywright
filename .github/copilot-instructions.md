# FreeRangePW — Copilot Instructions

## Language

All code, comments, test labels (`test.describe`, `test.step`), and documentation must be written in **English**.

## Documentation rules (always apply)

When adding or modifying any file in `src/`:
- Add a TSDoc block comment (`/** */`) above every new public method or property following this format:
  ```ts
  /**
   * One-sentence description of what the method does.
   * @param paramName - Description of the parameter.
   * @returns Description of the return value (omit for void).
   * @throws {Error} Condition under which the method throws (if applicable).
   */
  ```
- Update `README.md` if the change affects: project structure, environment variables, available test commands, or the browser project table.

When adding a new Page Object:
- Register it in the **Project structure** section of `README.md`.
- Ensure the constructor receives the appropriate fixture (`Page` for UI, `APIRequestContext` for API) and follows the existing pattern in `BasePage.ts` or `GitHubApiPage.ts`.

When adding a new test spec:
- It must use a Page Object — no raw Playwright API calls in the spec file.
- Place UI tests under `tests/ui/` and API tests under `tests/api/`.

When adding environment variables:
- Add them to `.env.example` with a placeholder value and a short inline comment.
- Validate them at the class boundary (constructor) and throw a descriptive error if missing.

## Code quality rules (always apply)

- No `any` types — use explicit TypeScript types at all times.
- No hardcoded selectors in Page Objects or specs — all selectors go through `elementRepository.ts`.
- No hardcoded test data — use `elementRepository.ts` for text values and `.env` for credentials.
- Async methods must always be awaited; never fire-and-forget.
- Apply the single-responsibility principle: one Page Object per page/section.
- Follow the DRY principle: extract repeated logic into `BasePage.ts` or a dedicated helper.
- Validate environment variables at the constructor boundary and throw descriptive errors if missing.

## ISTQB testing best practices (always apply)

- **Test independence**: each test must be able to run in isolation and in any order.
- **Single behaviour per test**: one test validates one scenario; split multi-behaviour tests.
- **Descriptive naming**: test names must clearly describe the expected behaviour, not the implementation.
- **Explicit assertions**: every test must contain at least one `expect()` call with a meaningful message context.
- **No hard sleeps**: use Playwright's built-in auto-wait, `waitForURL`, or `expect.poll` instead of `page.waitForTimeout`.
- **Boundary conditions**: when adding form or input tests, include at least one boundary-value case.
- **Traceability**: `test.describe` labels should map to a functional area; `test.step` labels should map to a test action.
- **Proper teardown**: use `afterEach`/`afterAll` for cleanup; never rely on test order for state reset.

## Architecture

- `src/repository/elementRepository.ts` — single source of truth for selectors, routes, titles.
- `src/page-objects/BasePage.ts` — shared generic UI actions; all UI Page Objects extend this.
- `playwright.config.ts` — central config; browser projects for UI use `screenshot: 'only-on-failure'` and `trace: 'on-first-retry'`.
