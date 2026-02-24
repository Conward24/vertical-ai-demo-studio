/**
 * Retry an async Replicate call when the failure looks like temporary capacity
 * (e.g. "high demand", E003, throttling). Uses exponential backoff.
 */
const RETRYABLE_PATTERNS = [
  /high\s+demand/i,
  /E003/i,
  /unavailable/i,
  /throttl/i,
  /try\s+again\s+later/i,
  /503/,
  /502/,
];

function isRetryableError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e ?? "");
  return RETRYABLE_PATTERNS.some((p) => p.test(message));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ReplicateRetryOptions {
  /** Number of retries after the first attempt (default 3 = 4 total attempts). */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default 2000). */
  initialDelayMs?: number;
  /** Multiplier for delay after each retry (default 2). */
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<ReplicateRetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
};

/**
 * Runs `fn()`. If it throws and the error looks like Replicate capacity/throttling,
 * waits with exponential backoff and retries up to maxRetries times.
 * Non-retryable errors (e.g. invalid input) are thrown immediately.
 */
export async function withReplicateRetry<T>(
  fn: () => Promise<T>,
  options: ReplicateRetryOptions = {}
): Promise<T> {
  const { maxRetries, initialDelayMs, backoffMultiplier } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt === maxRetries || !isRetryableError(e)) {
        throw e;
      }
      const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt);
      await sleep(delayMs);
    }
  }
  throw lastError;
}
