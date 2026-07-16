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
GH_USER=your_github_username
GH_REPO=your_repository_name
API_TOKEN=your_github_personal_access_token
```

> **Note:** `.env` is listed in `.gitignore` and will never be committed.  
> The `API_TOKEN` must have at least the `repo` scope to create and close issues.

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

> **Note:** Traces are disabled for the `API TEST` project. Trace files capture full request/response data including `Authorization` headers; persisting them to disk would expose the `API_TOKEN` at rest.

---

## Browser projects

| Project | Scope | Screenshot on failure |
|---|---|---|
| `chromium` | `tests/ui/` | Yes |
| `firefox` | `tests/ui/` | Yes |
| `webkit` | `tests/ui/` | Yes |
| `API TEST` | `tests/api/` | No |

---

## External dependency notice

The UI tests target **[https://www.freerangetesters.com](https://www.freerangetesters.com)**, a publicly accessible website operated by a third party.

- **No SLA or uptime guarantee** is provided for this environment. Outages, maintenance windows, or content changes made by the site owner can cause UI tests to fail in CI without any change to this repository.
- **Content and layout changes** (renamed links, updated copy, restructured pages) may require selector or assertion updates.
- **This dependency is intentional.** The project is designed for educational and demonstration purposes. Using a real, publicly accessible site showcases realistic Playwright patterns rather than a mocked environment.

If you fork this project for a production CI pipeline, consider replacing the external target with a locally served application or a staging environment you control.

---

## Security: GitHub token

### Required environment variables

| Variable | Purpose |
|---|---|
| `GH_USER` | GitHub username or organisation that owns the test repository |
| `GH_REPO` | Name of the repository where test issues are created |
| `API_TOKEN` | GitHub Personal Access Token (PAT) used to authenticate API calls |

### Recommended token permissions

Create a **fine-grained Personal Access Token** (preferred) or a classic PAT with the minimum required scopes:

| Permission | Reason |
|---|---|
| `issues: read & write` | Create and close issues during test runs |

**Do not grant additional scopes** (e.g. `admin`, `delete_repo`, `workflows`). Following the principle of least privilege limits the blast radius if the token is ever leaked.

### Token hygiene rules

- **Never commit the token** to the repository. `.env` is in `.gitignore`; keep it that way.
- **Store the token as a GitHub Actions secret** (`API_TOKEN`) and reference it only via `${{ secrets.API_TOKEN }}`.
- **Rotate the token** if it is accidentally exposed.
- **Scope the token** to the test repository only — avoid creating a token with access to all repositories in your account.
- This token is used **exclusively for automated test execution** and should not be shared with other tools or services.

---

## AI Automation

This project integrates [GitHub Models](https://github.com/marketplace/models) to automate engineering tasks directly inside GitHub Actions — without any dependency on GitHub Copilot.

### What is GitHub Models?

GitHub Models provides access to best-in-class LLMs (GPT-4o, Phi, Llama, Mistral, and others) through a unified REST API authenticated with a standard `GITHUB_TOKEN`. No third-party API keys are required in CI.

Inference endpoint: `https://models.inference.ai.azure.com/chat/completions`

### AI automations in this project

| Workflow | Trigger | Purpose |
|---|---|---|
| `ai-review.yml` | Every PR to `main` | Automatic code review posted as a PR comment |
| `ai-docs.yml` | Manual (`workflow_dispatch`) | Documentation generation — opens a PR with the result |

### Reusable AI client

All model interactions are centralised in `.github/scripts/ai-client.ts`. Any future automation can import `callModel()` from this module without duplicating HTTP or retry logic.

Available models (configurable at call time):

| Constant | Model identifier |
|---|---|
| `MODELS.GPT4O_MINI` | `gpt-4o-mini` *(default)* |
| `MODELS.GPT4O` | `gpt-4o` |
| `MODELS.PHI` | `Phi-4` |
| `MODELS.LLAMA` | `Meta-Llama-3.1-70B-Instruct` |
| `MODELS.MISTRAL` | `Mistral-Large-2411` |

### Running AI Code Review

The review runs automatically on every pull request targeting `main`. No manual steps required.

To change the model, edit the `AI_MODEL` env variable in `.github/workflows/ai-review.yml`.

### Running AI Documentation Generator

Trigger the workflow manually from the **Actions** tab:

1. Go to **Actions → AI Documentation Generator**.
2. Click **Run workflow**.
3. Select a model (defaults to `gpt-4o-mini`).
4. The workflow generates `docs/ai-generated.md` and opens a PR for review.

> The workflow **never pushes directly to `main`**. A human must review and merge the generated PR.

### Running scripts locally

Set a GitHub PAT with `models:read` scope as `GITHUB_TOKEN`, then:

```bash
# Documentation generator
GITHUB_TOKEN=ghp_… \
DOCS_OUTPUT_FILE=docs/ai-generated.md \
npx tsx .github/scripts/ai-docs.ts

# Code review (requires a diff file)
git diff main...HEAD > /tmp/my.diff
GITHUB_TOKEN=ghp_… \
DIFF_FILE=/tmp/my.diff \
PR_NUMBER=123 \
GITHUB_REPOSITORY=owner/repo \
npx tsx .github/scripts/ai-review.ts
```

### Required permissions

| Permission | Scope | Reason |
|---|---|---|
| `models: read` | `GITHUB_TOKEN` | Access the inference endpoint |
| `contents: read` | `GITHUB_TOKEN` | Checkout code (review workflow) |
| `contents: write` | `GITHUB_TOKEN` | Push generated branch (docs workflow) |
| `pull-requests: write` | `GITHUB_TOKEN` | Post review comments / open PR |

### Known limitations

- **Context window**: diffs and source files are truncated to 30 000 / 50 000 characters respectively to stay within model limits.
- **Rate limits**: GitHub Models enforces per-token rate limits. High-frequency CI usage may encounter throttling; the client retries up to 3 times with exponential back-off.
- **Model availability**: model identifiers may change as GitHub Models evolves. Update `MODELS` in `ai-client.ts` if a model is retired or renamed.
- **Non-determinism**: AI output varies between runs. Generated documentation and reviews should always be reviewed by a human before being acted upon.
