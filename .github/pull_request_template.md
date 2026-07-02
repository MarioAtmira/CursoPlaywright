## Description

<!-- What does this PR change and why? -->

## Type of change

- [ ] New test / Page Object
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] CI / configuration

## Checklist

- [ ] All code and comments are in **English**
- [ ] New methods have a TSDoc block comment (`@param`, `@returns`, `@throws`)
- [ ] No hardcoded selectors — locators go through `elementRepository.ts`
- [ ] No hardcoded credentials — environment variables used and validated in the constructor
- [ ] No `any` types — all variables are explicitly typed
- [ ] Async calls are awaited — no fire-and-forget
- [ ] `npm run lint` passes locally with 0 errors
- [ ] New Page Objects are registered in `README.md`
- [ ] New environment variables are added to `.env.example`

## ISTQB checklist (if tests were added or modified)

- [ ] Each test validates a single behaviour
- [ ] Tests run independently — no shared mutable state between tests
- [ ] `test.describe` maps to a functional area; `test.step` maps to a test action
- [ ] No `page.waitForTimeout` — Playwright auto-wait or `expect.poll` used instead
- [ ] Proper teardown in `afterEach` / `afterAll`
