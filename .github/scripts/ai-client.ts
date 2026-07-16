/**
 * Reusable GitHub Models API client.
 *
 * Provides a single {@link callModel} function that wraps the GitHub Models
 * inference endpoint with typed error handling, model validation, retry logic,
 * request timeouts, and sanitised logging.
 *
 * **Authentication**
 * - GitHub Actions: `GITHUB_TOKEN` is injected automatically by the runner.
 * - Local execution: create a PAT with `models:read` scope and expose it as
 *   `GITHUB_TOKEN` before running a script.
 *
 * **Token safety**
 * The token is transmitted only in the `Authorization` request header and is
 * never written to stdout, stderr, or included in any error message.
 *
 * **Changing the model**
 * Pass a value from the {@link MODELS} catalogue to {@link callModel} via
 * `config.model`. Unknown identifiers are rejected before any network call.
 */

import { sanitizeMessage } from './utils';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Base class for all errors originating from the GitHub Models client.
 * Consumers may catch `ModelError` to handle all AI-layer failures uniformly.
 */
export class ModelError extends Error {
  /** Machine-readable code identifying the failure category. */
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ModelError';
    this.code = code;
  }
}

/**
 * Thrown when the inference endpoint returns HTTP 401 or 403.
 * Retrying is pointless — the token must be fixed before re-running.
 */
export class AuthError extends ModelError {
  constructor(status: number) {
    super(
      `Authentication failed (HTTP ${status}). ` +
        'Verify that GITHUB_TOKEN has the "models:read" permission and has not expired.',
      'AUTH_ERROR',
    );
    this.name = 'AuthError';
  }
}

/**
 * Thrown when the inference endpoint returns HTTP 429.
 * {@link retryAfterMs} reflects the `Retry-After` response header when present.
 */
export class RateLimitError extends ModelError {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(
      `GitHub Models rate limit exceeded. Suggested retry delay: ${retryAfterMs}ms.`,
      'RATE_LIMIT',
    );
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Thrown on any non-2xx HTTP status that is not 401, 403, or 429.
 * The response body is sanitised before being included in the message.
 */
export class HttpError extends ModelError {
  readonly status: number;

  constructor(status: number, statusText: string, sanitizedBody: string) {
    super(`HTTP ${status} ${statusText}: ${sanitizedBody}`, 'HTTP_ERROR');
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Thrown when the model response is structurally invalid — missing choices,
 * missing content, or a non-JSON body.
 */
export class InvalidResponseError extends ModelError {
  constructor(reason: string) {
    super(`Model returned an invalid response: ${reason}`, 'INVALID_RESPONSE');
    this.name = 'InvalidResponseError';
  }
}

/**
 * Thrown when the request is aborted because the model did not respond within
 * {@link FETCH_TIMEOUT_MS} milliseconds.
 */
export class TimeoutError extends ModelError {
  constructor() {
    super(
      `Model request timed out after ${FETCH_TIMEOUT_MS / 1000}s. The inference endpoint may be under load.`,
      'TIMEOUT',
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Thrown when `config.model` is not present in the {@link MODELS} catalogue.
 * Prevents requests with arbitrary or misspelled model identifiers.
 */
export class ModelValidationError extends ModelError {
  constructor(model: string) {
    const allowed = Object.values(MODELS).join(', ');
    super(
      `"${model}" is not an allowed model identifier. ` +
        `Allowed values: ${allowed}`,
      'INVALID_MODEL',
    );
    this.name = 'ModelValidationError';
  }
}

// ---------------------------------------------------------------------------
// Model catalogue
// ---------------------------------------------------------------------------

/** Catalogue of models available on GitHub Models. Extend as new models are added. */
export const MODELS = {
  GPT4O_MINI: 'gpt-4o-mini',
  GPT4O: 'gpt-4o',
  PHI: 'Phi-4',
  LLAMA: 'Meta-Llama-3.1-70B-Instruct',
  MISTRAL: 'Mistral-Large-2411',
} as const;

/** Union of all valid model identifier strings. */
export type ModelName = (typeof MODELS)[keyof typeof MODELS];

/** Default model used by {@link callModel} when none is specified. */
export const DEFAULT_MODEL: ModelName = MODELS.GPT4O_MINI;

/** Immutable set of permitted model identifiers for O(1) validation. */
const ALLOWED_MODELS: ReadonlySet<string> = new Set(Object.values(MODELS));

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Supported conversation roles for the chat completion API. */
export type MessageRole = 'system' | 'user' | 'assistant';

/** A single turn in a chat conversation. */
export interface Message {
  role: MessageRole;
  content: string;
}

/** Options forwarded to the model inference call. */
export interface ModelConfig {
  /**
   * Model identifier. Must be a value from the {@link MODELS} catalogue.
   * Falls back to {@link DEFAULT_MODEL} when omitted.
   */
  model?: string;
  /**
   * Sampling temperature (0–2).
   * Lower values produce more deterministic output; higher values more creative.
   * Defaults to `0.7`.
   */
  temperature?: number;
  /**
   * Maximum tokens the model may return.
   * Defaults to `4096`.
   */
  maxTokens?: number;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const MAX_RETRIES = 3;
/** Base delay in ms — multiplied by the attempt number for linear back-off. */
const BASE_RETRY_DELAY_MS = 1500;
/** Request-level timeout. The fetch is aborted if no response arrives in time. */
const FETCH_TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Awaitable sleep for back-off between retries. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Shape of a successful response from the inference endpoint. */
interface CompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Validates that `model` is in the allowed catalogue.
 * @throws {ModelValidationError} if the model is not recognised.
 */
function validateModel(model: string): ModelName {
  if (!ALLOWED_MODELS.has(model)) {
    throw new ModelValidationError(model);
  }
  return model as ModelName;
}

/**
 * Returns `true` if the error is transient and the request should be retried.
 * Auth errors and model-validation errors are permanent — no retry is useful.
 */
function shouldRetry(error: unknown): boolean {
  if (error instanceof AuthError) return false;
  if (error instanceof ModelValidationError) return false;
  // Retry on rate-limit, HTTP 5xx, timeouts, and network failures.
  return true;
}

/** Extracts a safe, single-line error message from an unknown thrown value. */
function extractMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a chat completion request to the GitHub Models endpoint.
 *
 * - Validates the model against the {@link MODELS} whitelist before calling.
 * - Aborts the request after {@link FETCH_TIMEOUT_MS} milliseconds.
 * - Retries up to {@link MAX_RETRIES} times for transient failures, honouring
 *   `Retry-After` headers on rate-limit responses.
 * - Never logs or surfaces the bearer token.
 *
 * @param token - Bearer token for authentication (never logged).
 * @param messages - Ordered list of messages forming the conversation context.
 * @param config - Optional model and generation parameters.
 * @returns The text content of the first choice returned by the model.
 * @throws {ModelValidationError} When `config.model` is not in the catalogue.
 * @throws {AuthError} When the endpoint returns HTTP 401 or 403.
 * @throws {RateLimitError} When the endpoint returns HTTP 429.
 * @throws {HttpError} When the endpoint returns any other non-2xx status.
 * @throws {InvalidResponseError} When the response body is malformed.
 * @throws {TimeoutError} When no response arrives within the timeout window.
 * @throws {ModelError} When all retry attempts are exhausted.
 */
export async function callModel(
  token: string,
  messages: Message[],
  config: ModelConfig = {},
): Promise<string> {
  const model = validateModel(config.model ?? DEFAULT_MODEL);
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 4096;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[ai-client] model="${model}" attempt=${attempt}/${MAX_RETRIES}`);

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'Content-Type': 'application/json',
          // Token transmitted here only — never echoed to any log or error.
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        // Sanitise the response body before including it in any error message.
        const rawBody = await response.text();
        const body = sanitizeMessage(rawBody);

        if (response.status === 401 || response.status === 403) {
          throw new AuthError(response.status);
        }

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterMs = retryAfterHeader
            ? parseInt(retryAfterHeader, 10) * 1000
            : BASE_RETRY_DELAY_MS;
          throw new RateLimitError(retryAfterMs);
        }

        throw new HttpError(response.status, response.statusText, body);
      }

      // Parse the response — catch malformed JSON explicitly.
      let data: CompletionResponse;
      try {
        data = (await response.json()) as CompletionResponse;
      } catch {
        throw new InvalidResponseError('Response body is not valid JSON.');
      }

      if (!data.choices || data.choices.length === 0) {
        throw new InvalidResponseError('Response contains no choices.');
      }

      const content = data.choices[0]?.message?.content;
      if (typeof content !== 'string' || content.trim() === '') {
        throw new InvalidResponseError('First choice has no text content.');
      }

      console.log(`[ai-client] OK — ${content.length} chars received`);
      return content;
    } catch (error) {
      // Re-classify abort/timeout signals as TimeoutError.
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        const timeout = new TimeoutError();
        lastError = timeout;
        console.error(`[ai-client] Attempt ${attempt} timed out`);
      } else {
        lastError = error;
        console.error(`[ai-client] Attempt ${attempt} failed: ${extractMessage(error)}`);
      }

      // Non-transient errors are propagated immediately — no retry is useful.
      if (!shouldRetry(lastError)) throw lastError;

      if (attempt >= MAX_RETRIES) break;

      const delay =
        lastError instanceof RateLimitError
          ? Math.max(lastError.retryAfterMs, BASE_RETRY_DELAY_MS * attempt)
          : BASE_RETRY_DELAY_MS * attempt;

      console.log(`[ai-client] Retrying in ${delay}ms…`);
      await sleep(delay);
    }
  }

  throw new ModelError(
    `All ${MAX_RETRIES} attempts failed. Last error: ${extractMessage(lastError)}`,
    'MAX_RETRIES_EXCEEDED',
  );
}
