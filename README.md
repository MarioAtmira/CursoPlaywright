# FreeRangePW

End-to-end test suite built with [Playwright](https://playwright.dev/) and TypeScript, covering UI navigation and REST API scenarios.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| [Node.js](https://nodejs.org/) | 18 LTS |
| npm | bundled with Node.js |

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd FreeRangePW

# 2. Install Node dependencies
npm install

# 3. Install Playwright browsers
npx playwright install
```

---

## Environment setup

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

Open `.env` and set:

```
GITHUB_USER=your_github_username
GITHUB_REPO=your_repository_name
API_TOKEN=your_github_personal_access_token
```

> **Note:** `.env` is listed in `.gitignore` and will never be committed.  
> The `API_TOKEN` must have at least the `repo` scope to create issues.

---

## Running tests

### All tests (all browsers + API)
```bash
npx playwright test
```

### UI tests only
```bash
npx playwright test tests/ui/
```

### API tests only
```bash
npx playwright test tests/api/
```

### Specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Headed mode (visible browser)
```bash
npx playwright test --headed
```

### Open the HTML report after a run
```bash
npx playwright show-report
```

---

## Project structure

```
FreeRangePW/
├── src/
│   ├── page-objects/
│   │   ├── BasePage.ts              # Shared UI actions (check, uncheck, radio)
│   │   ├── FreeRangeSitePage.ts     # Main site page object
│   │   ├── AutomationSandboxPage.ts # Automation sandbox page object
│   │   └── GitHubApiPage.ts         # GitHub REST API client
│   └── repository/
│       └── elementRepository.ts     # Centralized selectors, routes and expected texts
├── tests/
│   ├── ui/
│   │   └── FreeRangeCourse.spec.ts  # UI test specs
│   └── api/
│       └── API.spec.ts              # API test specs
├── .env.example                     # Environment variable template
├── playwright.config.ts             # Playwright global configuration
├── tsconfig.json
└── package.json
```

---

## Architecture

### Page Object Model

All interaction logic lives in `src/page-objects/`, keeping specs clean and focused on business flows. Page objects never contain raw selectors — they delegate to the element repository.

### Element repository

`src/repository/elementRepository.ts` is the single source of truth for selectors, routes, and expected texts. Updating a selector in one place propagates to every test automatically.

### Screenshot strategy

Screenshots are captured **only on test failure**, at the exact point the browser state is preserved. This keeps the HTML report lean while still providing full visual context when something breaks. API tests do not capture screenshots.

### Trace

Execution traces are saved on the first retry of a failed test (`trace: 'on-first-retry'`). Open them with:

```bash
npx playwright show-trace <path-to-trace.zip>
```

---

## Browser projects

| Project | Scope | Screenshot on failure |
|---|---|---|
| `chromium` | `tests/ui/` | Yes |
| `firefox` | `tests/ui/` | Yes |
| `webkit` | `tests/ui/` | Yes |
| `API TEST` | `tests/api/` | No |
