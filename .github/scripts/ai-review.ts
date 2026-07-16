/**
 * AI Code Review script.
 *
 * Reads a git diff from the file pointed to by `DIFF_FILE`, sends it to the
 * GitHub Models endpoint, then posts (or updates) the review as a comment on
 * the pull request.
 *
 * Duplicate-comment prevention: the comment body is tagged with a hidden HTML
 * marker ({@link REVIEW_MARKER}). On re-runs the existing comment is updated
 * in-place instead of creating a new one.
 *
 * Required environment variables:
 *   GITHUB_TOKEN       - auth token (provided automatically by GitHub Actions)
 *   DIFF_FILE          - path to the file containing the git diff
 *   PR_NUMBER          - pull request number (string)
 *   GITHUB_REPOSITORY  - "owner/repo" (provided automatically by GitHub Actions)
 *
 * Optional environment variables:
 *   AI_MODEL           - override the default inference model
 */

import * as fs from 'fs';
import { callModel, DEFAULT_MODEL, type Message } from './ai-client';
import { requireEnv } from './utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hidden marker injected into every review comment to allow idempotent updates. */
const REVIEW_MARKER = '<!-- ai-review-bot -->';

/** Characters above this threshold are truncated before sending to the model. */
const MAX_DIFF_CHARS = 30_000;

const SYSTEM_PROMPT = `Eres un Staff Engineer experto en TypeScript, Playwright, Calidad de Software, Seguridad, Testing E2E, GitHub Actions y Arquitectura.

Analiza este diff y realiza una revisión técnica.

Busca:

- bugs potenciales
- problemas de seguridad
- deuda técnica
- duplicación
- problemas de mantenimiento
- anti patrones
- problemas de tipado
- problemas de CI/CD
- flakiness en Playwright
- mejoras de diseño

Responde en español y usa Markdown.

Estructura:

## Resumen

## Problemas críticos

## Problemas importantes

## Problemas menores

## Recomendaciones

Si no detectas problemas relevantes indícalo explícitamente.`;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface GitHubComment {
  id: number;
  body: string;
}

/**
 * Searches the PR's issue comments for a previously posted review comment.
 * @returns The comment `id` if found, or `null` if no existing comment exists.
 */
async function findExistingReviewComment(
  token: string,
  repo: string,
  prNumber: string,
): Promise<number | null> {
  const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments?per_page=100`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    console.warn(`[ai-review] Could not fetch existing comments: HTTP ${response.status}`);
    return null;
  }

  const comments = (await response.json()) as GitHubComment[];
  const existing = comments.find(c => c.body.includes(REVIEW_MARKER));
  return existing?.id ?? null;
}

/**
 * Posts a new PR comment or patches the existing one (idempotent).
 * @param token - GitHub auth token.
 * @param repo - "owner/repo" string.
 * @param prNumber - PR number as a string.
 * @param body - Full Markdown body of the comment.
 */
async function postOrUpdateComment(
  token: string,
  repo: string,
  prNumber: string,
  body: string,
): Promise<void> {
  const existingId = await findExistingReviewComment(token, repo, prNumber);

  const url = existingId
    ? `https://api.github.com/repos/${repo}/issues/comments/${existingId}`
    : `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;

  const method = existingId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to ${method} PR comment: HTTP ${response.status}: ${text}`);
  }

  console.log(`[ai-review] Comment ${existingId ? 'updated' : 'created'} successfully.`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const token = requireEnv('GITHUB_TOKEN');
  const diffFile = requireEnv('DIFF_FILE');
  const prNumber = requireEnv('PR_NUMBER');
  const repo = requireEnv('GITHUB_REPOSITORY');
  const model = process.env['AI_MODEL'] ?? DEFAULT_MODEL;

  // Read the diff file produced by the workflow.
  const rawDiff = fs.readFileSync(diffFile, 'utf8');

  // Truncate to avoid exceeding model context limits.
  const diff =
    rawDiff.length > MAX_DIFF_CHARS
      ? `${rawDiff.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated to ${MAX_DIFF_CHARS.toLocaleString()} characters]`
      : rawDiff;

  if (!diff.trim()) {
    console.log('[ai-review] Empty diff — nothing to review.');
    return;
  }

  console.log(`[ai-review] Diff: ${diff.length} chars. Model: "${model}"`);

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `\`\`\`diff\n${diff}\n\`\`\`` },
  ];

  const review = await callModel(token, messages, { model });

  const commentBody = [
    REVIEW_MARKER,
    '## 🤖 AI Code Review',
    '',
    `> Powered by [GitHub Models](https://github.com/marketplace/models) · model: \`${model}\``,
    '',
    review,
  ].join('\n');

  await postOrUpdateComment(token, repo, prNumber, commentBody);
}

main().catch(error => {
  console.error('[ai-review] Fatal error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
