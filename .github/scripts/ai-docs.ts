/**
 * AI Documentation Generator script.
 *
 * Reads all TypeScript source files under `src/` and `tests/`, sends them to
 * the GitHub Models endpoint, and writes the generated Markdown documentation
 * to the path specified by `DOCS_OUTPUT_FILE`.
 *
 * The workflow is responsible for creating a branch and opening a PR with the
 * generated file — this script only handles model interaction and file output.
 *
 * Required environment variables:
 *   GITHUB_TOKEN      - auth token (provided automatically by GitHub Actions)
 *   DOCS_OUTPUT_FILE  - path where the generated Markdown file will be written
 *
 * Optional environment variables:
 *   AI_MODEL          - override the default inference model
 */

import * as fs from 'fs';
import * as path from 'path';
import { callModel, DEFAULT_MODEL, type Message } from './ai-client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Source directories to scan for TypeScript files. */
const SOURCE_DIRS = ['src', 'tests'];

/** Character limit sent to the model (prevents context overflow). */
const MAX_SOURCE_CHARS = 50_000;

const SYSTEM_PROMPT = `You are a Staff QA Automation Engineer expert in Playwright, TypeScript, and software testing.

Analyze the provided TypeScript source code and generate technical documentation in English using Markdown.

Generate the following sections in order:

## Test Summary
For each .spec.ts file describe:
- Test name
- Purpose / what behaviour is validated
- Steps / flow validated
- Relevant dependencies (Page Objects, helpers used)

## Page Objects
For each Page Object describe:
- Responsibility
- Public methods and their purpose
- Exposed locators (getter properties)

## Architecture Overview
Describe:
- Project folder structure and responsibilities
- Architectural patterns in use (POM, Repository, Base class inheritance)
- Data flow between layers (spec → Page Object → BasePage → elementRepository)

## Missing JSDoc
List public methods or properties that lack TSDoc comments and suggest the appropriate comment.

Rules:
- Do NOT overwrite existing useful documentation — only add what is missing.
- Be concise but complete.
- Use clear, maintainable Markdown.
- Respond entirely in English.`;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Recursively reads all `.ts` files under `dir` and appends their content to
 * `chunks` until the total character budget is exhausted.
 *
 * @param dir - Absolute path to the directory to scan.
 * @param rootDir - Repository root (used for computing relative paths).
 * @param chunks - Accumulator array of formatted file blocks.
 * @param budget - Remaining character budget (mutated via the returned value).
 * @returns Remaining character budget after processing the directory.
 */
function collectSourceFiles(
  dir: string,
  rootDir: string,
  chunks: string[],
  budget: number,
): number {
  if (budget <= 0 || !fs.existsSync(dir)) return budget;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (budget <= 0) break;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      budget = collectSourceFiles(fullPath, rootDir, chunks, budget);
    } else if (entry.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const relative = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      const block = `\n### File: ${relative}\n\`\`\`typescript\n${content}\n\`\`\``;
      chunks.push(block);
      budget -= content.length;
    }
  }

  return budget;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const token = requireEnv('GITHUB_TOKEN');
  const outputFile = requireEnv('DOCS_OUTPUT_FILE');
  const model = process.env['AI_MODEL'] ?? DEFAULT_MODEL;

  const rootDir = process.cwd();
  console.log(`[ai-docs] Root: ${rootDir}`);
  console.log(`[ai-docs] Output: ${outputFile}`);

  // Collect source files up to the character budget.
  const chunks: string[] = [];
  let remaining = MAX_SOURCE_CHARS;

  for (const dir of SOURCE_DIRS) {
    remaining = collectSourceFiles(path.join(rootDir, dir), rootDir, chunks, remaining);
  }

  if (chunks.length === 0) {
    console.log('[ai-docs] No TypeScript source files found. Exiting.');
    return;
  }

  const sourceCode = chunks.join('\n');
  const truncated = remaining <= 0;

  console.log(
    `[ai-docs] ${chunks.length} file(s) collected — ${sourceCode.length} chars` +
    (truncated ? ' (budget reached, some files may be omitted)' : ''),
  );
  console.log(`[ai-docs] Sending to model "${model}"…`);

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: sourceCode },
  ];

  const generatedDocs = await callModel(token, messages, { model, maxTokens: 8192 });

  // Prepend a header with generation metadata.
  const timestamp = new Date().toISOString();
  const header = [
    '<!-- This file is auto-generated by the AI Documentation workflow. -->',
    '<!-- Do not edit manually — changes will be overwritten on the next run. -->',
    '',
    `# AI-Generated Documentation`,
    '',
    `> Generated on ${timestamp} using model \`${model}\`.`,
    '',
  ].join('\n');

  const outputContent = header + generatedDocs;

  // Ensure the output directory exists.
  fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
  fs.writeFileSync(outputFile, outputContent, 'utf8');

  console.log(`[ai-docs] Documentation written to: ${outputFile}`);
}

main().catch(error => {
  console.error('[ai-docs] Fatal error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
