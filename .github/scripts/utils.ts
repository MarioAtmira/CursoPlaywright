/**
 * Shared utilities for all GitHub Models automation scripts.
 *
 * Centralises cross-cutting concerns — environment validation and secret
 * sanitisation — so every script has a single, consistent implementation.
 */

/**
 * Regex that matches the known GitHub token prefix patterns.
 * Used to redact tokens that might appear in error response bodies.
 */
const GITHUB_TOKEN_PATTERN = /\b(ghp|gho|ghs|ghu|github_pat)_[A-Za-z0-9_]+\b/g;

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * Reads a required environment variable and throws a descriptive error if it
 * is absent or empty.
 *
 * @param name - The environment variable name.
 * @returns The non-empty string value of the variable.
 * @throws {Error} When the variable is not set or is an empty string.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Required environment variable "${name}" is not set or is empty. ` +
        'Check the workflow configuration or your local environment.',
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Secret sanitisation
// ---------------------------------------------------------------------------

/**
 * Masks a secret value for safe output, exposing only the first and last four
 * characters so it can be identified without being reconstructed.
 *
 * @param value - The secret string to mask.
 * @returns A partially masked representation safe for logging.
 *
 * @example
 * maskSecret('ghp_AbCdEfGhIjKlMnOp'); // → 'ghp_***MnOp'
 */
export function maskSecret(value: string): string {
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

/**
 * Replaces known GitHub token patterns in an arbitrary string with the
 * literal `[REDACTED]`.
 *
 * Apply this to any external error body or server response before including
 * it in a log or error message.
 *
 * @param message - The string that may contain sensitive data.
 * @returns The sanitised string.
 */
export function sanitizeMessage(message: string): string {
  return message.replace(GITHUB_TOKEN_PATTERN, '[REDACTED]');
}
