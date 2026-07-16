/**
 * Reusable GitHub Models API client.
 *
 * Provides a single {@link callModel} function that wraps the GitHub Models
 * inference endpoint with retry logic, structured logging, and strict typing.
 *
 * **Authentication**
 * - GitHub Actions: pass `GITHUB_TOKEN` automatically injected by the runner.
 * - Local execution: create a PAT with `models:read` scope and set it as
 *   `GITHUB_TOKEN` (or any env variable of your choice) before calling the script.
 *
 * **Changing the model**
 * Pass a different identifier from the {@link MODELS} catalogue to {@link callModel}
 * via the `config.model` field.
 */

/** Supported conversation roles for the chat completion API. */
export type MessageRole = 'system' | 'user' | 'assistant';

/** A single turn in a chat conversation. */
export interface Message {
  role: MessageRole;
  content: string;
}

/** Options forwarded to the model inference call. */
export interface ModelConfig {
  /** Model identifier. Falls back to {@link DEFAULT_MODEL} when omitted. */
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

/** Catalogue of models available on GitHub Models. Extend as new models are added. */
export const MODELS = {
  GPT4O_MINI: 'gpt-4o-mini',
  GPT4O: 'gpt-4o',
  PHI: 'Phi-4',
  LLAMA: 'Meta-Llama-3.1-70B-Instruct',
  MISTRAL: 'Mistral-Large-2411',
} as const;

/** Default model used by {@link callModel} when none is specified. */
export const DEFAULT_MODEL: string = MODELS.GPT4O_MINI;

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const MAX_RETRIES = 3;
/** Base delay in ms; each retry multiplies this by the attempt number. */
const BASE_RETRY_DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Awaitable sleep for exponential back-off between retries. */
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a chat completion request to the GitHub Models endpoint.
 *
 * Retries up to {@link MAX_RETRIES} times with exponential back-off before
 * propagating the error to the caller.
 *
 * @param token - Bearer token for authentication.
 * @param messages - Ordered list of messages forming the conversation context.
 * @param config - Optional model and generation parameters.
 * @returns The text content of the first choice returned by the model.
 * @throws {Error} when all retry attempts fail.
 */
export async function callModel(
  token: string,
  messages: Message[],
  config: ModelConfig = {},
): Promise<string> {
  const model = config.model ?? DEFAULT_MODEL;
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 4096;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[ai-client] model="${model}" attempt=${attempt}/${MAX_RETRIES}`);

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        const body = await response.text();
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${body}`);
      }

      const data = (await response.json()) as CompletionResponse;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Model returned an empty response.');
      }

      console.log(`[ai-client] OK — ${content.length} chars received`);
      return content;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[ai-client] Attempt ${attempt} failed: ${message}`);

      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * attempt;
        console.log(`[ai-client] Retrying in ${delay}ms…`);
        await sleep(delay);
      }
    }
  }

  const lastMessage = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `[ai-client] All ${MAX_RETRIES} attempts failed. Last error: ${lastMessage}`,
  );
}
