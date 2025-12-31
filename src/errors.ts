/**
 * @unbrowser/core - Error Types
 *
 * Structured error types with clear codes, messages, and recovery guidance.
 * Every error includes actionable suggestions for resolution.
 *
 * @module errors
 * @packageDocumentation
 */

/**
 * Error codes used by the Unbrowser SDK.
 *
 * @description
 * Each code represents a specific error category with a defined recovery path.
 * Use these codes in switch statements or error handling logic.
 *
 * @example
 * ```typescript
 * try {
 *   await client.browse(url);
 * } catch (error) {
 *   if (error instanceof UnbrowserError) {
 *     switch (error.code) {
 *       case 'RATE_LIMITED':
 *         await delay(error.retryAfter || 60000);
 *         break;
 *       case 'INVALID_URL':
 *         console.error('URL validation failed');
 *         break;
 *     }
 *   }
 * }
 * ```
 */
export type ErrorCode =
  // Authentication errors
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'EXPIRED_API_KEY'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'

  // Request errors
  | 'INVALID_REQUEST'
  | 'INVALID_URL'
  | 'URL_BLOCKED'
  | 'TIMEOUT'
  | 'REQUEST_ABORTED'

  // Rate limiting
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'

  // Content errors
  | 'CONTENT_NOT_FOUND'
  | 'CONTENT_BLOCKED'
  | 'CAPTCHA_DETECTED'
  | 'BOT_DETECTED'

  // Network errors
  | 'NETWORK_ERROR'
  | 'DNS_ERROR'
  | 'SSL_ERROR'
  | 'CONNECTION_REFUSED'

  // Server errors
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'SSE_ERROR'
  | 'HEALTH_CHECK_FAILED'

  // Verification errors
  | 'VERIFICATION_FAILED'
  | 'CONTENT_MISMATCH'

  // Generic
  | 'UNKNOWN_ERROR';

/**
 * Detailed guidance for recovering from an error.
 *
 * @description
 * Every error includes recovery guidance to help LLMs understand
 * how to resolve the issue without human intervention.
 */
export interface ErrorRecovery {
  /**
   * Whether the request can be retried.
   */
  canRetry: boolean;

  /**
   * Suggested delay before retrying (milliseconds).
   */
  retryAfter?: number;

  /**
   * Alternative approaches to try.
   */
  alternatives?: string[];

  /**
   * Human-readable suggestion for resolution.
   */
  suggestion: string;
}

/**
 * Error recovery guidance for each error code.
 *
 * @description
 * This mapping provides structured recovery guidance for every error type.
 * LLMs can use this to automatically determine recovery strategies.
 */
export const ERROR_RECOVERY: Record<ErrorCode, ErrorRecovery> = {
  // Authentication
  MISSING_API_KEY: {
    canRetry: false,
    suggestion: 'Provide an API key in the config. Get one at https://unbrowser.ai/dashboard',
    alternatives: ['Check environment variable UNBROWSER_API_KEY'],
  },
  INVALID_API_KEY: {
    canRetry: false,
    suggestion: 'API key must start with "ub_live_" (production) or "ub_test_" (testing)',
    alternatives: ['Generate a new API key at https://unbrowser.ai/dashboard'],
  },
  EXPIRED_API_KEY: {
    canRetry: false,
    suggestion: 'Generate a new API key at https://unbrowser.ai/dashboard',
  },
  UNAUTHORIZED: {
    canRetry: false,
    suggestion: 'Check that your API key is valid and has not been revoked',
  },
  FORBIDDEN: {
    canRetry: false,
    suggestion: 'Your plan may not have access to this feature. Check your plan limits.',
    alternatives: ['Upgrade plan at https://unbrowser.ai/pricing'],
  },

  // Request errors
  INVALID_REQUEST: {
    canRetry: false,
    suggestion: 'Check the request parameters against the API documentation',
  },
  INVALID_URL: {
    canRetry: false,
    suggestion: 'Ensure the URL is valid and includes the protocol (https://)',
    alternatives: ['Validate URL format before making request'],
  },
  URL_BLOCKED: {
    canRetry: false,
    suggestion: 'This URL is blocked for safety reasons. Use a different URL.',
  },
  TIMEOUT: {
    canRetry: true,
    retryAfter: 5000,
    suggestion: 'Request timed out. Try again with a longer timeout or simpler page.',
    alternatives: ['Increase timeout option', 'Use maxLatencyMs to skip slow tiers'],
  },
  REQUEST_ABORTED: {
    canRetry: true,
    suggestion: 'Request was cancelled. Retry if needed.',
  },

  // Rate limiting
  RATE_LIMITED: {
    canRetry: true,
    retryAfter: 60000,
    suggestion: 'Too many requests. Wait before retrying.',
    alternatives: ['Use batch() for multiple URLs', 'Implement request queuing'],
  },
  QUOTA_EXCEEDED: {
    canRetry: false,
    suggestion: 'Monthly quota exceeded. Upgrade plan or wait for quota reset.',
    alternatives: ['Check usage at https://unbrowser.ai/dashboard', 'Upgrade plan'],
  },

  // Content errors
  CONTENT_NOT_FOUND: {
    canRetry: false,
    suggestion: 'The page returned a 404 error. Check if the URL is correct.',
    alternatives: ['Try the domain homepage', 'Search for the content elsewhere'],
  },
  CONTENT_BLOCKED: {
    canRetry: true,
    retryAfter: 30000,
    suggestion: 'Content was blocked by the target site. Try with different options.',
    alternatives: ['Enable stealth mode', 'Use a session', 'Try a different time'],
  },
  CAPTCHA_DETECTED: {
    canRetry: true,
    retryAfter: 60000,
    suggestion: 'CAPTCHA detected. The site may be rate-limiting requests.',
    alternatives: ['Use a session', 'Reduce request frequency', 'Enable stealth mode'],
  },
  BOT_DETECTED: {
    canRetry: true,
    retryAfter: 60000,
    suggestion: 'Bot detection triggered. Try enabling stealth mode.',
    alternatives: ['Use debug.visible to troubleshoot', 'Try with slower request rate'],
  },

  // Network errors
  NETWORK_ERROR: {
    canRetry: true,
    retryAfter: 5000,
    suggestion: 'Network connection failed. Check internet connectivity.',
  },
  DNS_ERROR: {
    canRetry: true,
    retryAfter: 5000,
    suggestion: 'DNS lookup failed. The domain may not exist or DNS may be down.',
    alternatives: ['Verify domain name spelling', 'Try using IP address if known'],
  },
  SSL_ERROR: {
    canRetry: false,
    suggestion: 'SSL certificate error. The site may have an invalid certificate.',
  },
  CONNECTION_REFUSED: {
    canRetry: true,
    retryAfter: 30000,
    suggestion: 'Connection refused. The server may be down or blocking requests.',
  },

  // Server errors
  INTERNAL_ERROR: {
    canRetry: true,
    retryAfter: 10000,
    suggestion: 'Internal server error. This is a temporary issue, please retry.',
  },
  SERVICE_UNAVAILABLE: {
    canRetry: true,
    retryAfter: 30000,
    suggestion: 'Service temporarily unavailable. Please retry later.',
    alternatives: ['Check https://status.unbrowser.ai for service status'],
  },
  SSE_ERROR: {
    canRetry: true,
    retryAfter: 5000,
    suggestion: 'Server-sent events connection failed. Retry the request.',
    alternatives: ['Use browse() instead of browseWithProgress()'],
  },
  HEALTH_CHECK_FAILED: {
    canRetry: true,
    retryAfter: 30000,
    suggestion: 'Health check failed. The API may be experiencing issues.',
    alternatives: ['Check https://status.unbrowser.ai for service status'],
  },

  // Verification errors
  VERIFICATION_FAILED: {
    canRetry: true,
    suggestion: 'Content verification failed. The extracted content may be incomplete.',
    alternatives: ['Try with verify.mode: "thorough"', 'Use waitForSelector option'],
  },
  CONTENT_MISMATCH: {
    canRetry: true,
    suggestion: 'Extracted content does not match expected format.',
    alternatives: ['Review the page structure', 'Update selectors'],
  },

  // Generic
  UNKNOWN_ERROR: {
    canRetry: true,
    retryAfter: 5000,
    suggestion: 'An unexpected error occurred. Please retry.',
    alternatives: ['Check the error message for details', 'Contact support if persistent'],
  },
};

/**
 * Structured error class for the Unbrowser SDK.
 *
 * @description
 * All SDK errors are instances of this class. Each error includes:
 * - A unique error code for programmatic handling
 * - A human-readable message
 * - Recovery guidance with retry information
 *
 * @example
 * ```typescript
 * try {
 *   await client.browse(url);
 * } catch (error) {
 *   if (error instanceof UnbrowserError) {
 *     console.log(`Error: ${error.code} - ${error.message}`);
 *
 *     // Check if we can retry
 *     if (error.recovery.canRetry) {
 *       console.log(`Retry in ${error.recovery.retryAfter}ms`);
 *       console.log(`Suggestion: ${error.recovery.suggestion}`);
 *     }
 *
 *     // Try alternatives
 *     for (const alt of error.recovery.alternatives || []) {
 *       console.log(`Alternative: ${alt}`);
 *     }
 *   }
 * }
 * ```
 */
export class UnbrowserError extends Error {
  /**
   * Unique error code for this error type.
   * Use this for programmatic error handling.
   */
  readonly code: ErrorCode;

  /**
   * Recovery guidance including retry information and suggestions.
   * LLMs should use this to determine next steps.
   */
  readonly recovery: ErrorRecovery;

  /**
   * HTTP status code if this error came from an HTTP response.
   */
  readonly statusCode?: number;

  /**
   * Original error if this wraps another error.
   */
  readonly cause?: Error;

  /**
   * Additional context about the error.
   */
  readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      cause?: Error;
      context?: Record<string, unknown>;
      customRecovery?: Partial<ErrorRecovery>;
    }
  ) {
    super(message);
    this.name = 'UnbrowserError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.cause = options?.cause;
    this.context = options?.context;

    // Merge default recovery with any custom recovery info
    this.recovery = {
      ...ERROR_RECOVERY[code],
      ...options?.customRecovery,
    };

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, UnbrowserError.prototype);
  }

  /**
   * Create an error from an HTTP response.
   *
   * @example
   * ```typescript
   * const error = UnbrowserError.fromResponse(response, await response.json());
   * throw error;
   * ```
   */
  static fromResponse(
    response: { status: number; statusText: string },
    body?: { error?: { code?: string; message?: string } }
  ): UnbrowserError {
    const code = (body?.error?.code as ErrorCode) || 'UNKNOWN_ERROR';
    const message = body?.error?.message || response.statusText || 'Request failed';

    return new UnbrowserError(code, message, {
      statusCode: response.status,
    });
  }

  /**
   * Check if this error is retryable.
   *
   * @example
   * ```typescript
   * if (error.isRetryable()) {
   *   await delay(error.getRetryDelay());
   *   // retry request
   * }
   * ```
   */
  isRetryable(): boolean {
    return this.recovery.canRetry;
  }

  /**
   * Get the suggested retry delay in milliseconds.
   *
   * @returns Retry delay or 0 if not retryable.
   */
  getRetryDelay(): number {
    return this.recovery.retryAfter || 0;
  }

  /**
   * Get a formatted error string suitable for logging.
   *
   * @example
   * ```typescript
   * console.error(error.toDetailedString());
   * // Output:
   * // UnbrowserError [RATE_LIMITED]: Too many requests (429)
   * // Suggestion: Too many requests. Wait before retrying.
   * // Alternatives:
   * //   - Use batch() for multiple URLs
   * //   - Implement request queuing
   * // Retry after: 60000ms
   * ```
   */
  toDetailedString(): string {
    const lines = [
      `UnbrowserError [${this.code}]: ${this.message}${this.statusCode ? ` (${this.statusCode})` : ''}`,
      `Suggestion: ${this.recovery.suggestion}`,
    ];

    if (this.recovery.alternatives?.length) {
      lines.push('Alternatives:');
      for (const alt of this.recovery.alternatives) {
        lines.push(`  - ${alt}`);
      }
    }

    if (this.recovery.canRetry && this.recovery.retryAfter) {
      lines.push(`Retry after: ${this.recovery.retryAfter}ms`);
    }

    if (this.context) {
      lines.push(`Context: ${JSON.stringify(this.context)}`);
    }

    return lines.join('\n');
  }

  /**
   * Convert error to a plain object for serialization.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      recovery: this.recovery,
      context: this.context,
    };
  }
}

/**
 * Type guard to check if an error is an UnbrowserError.
 *
 * @example
 * ```typescript
 * try {
 *   await client.browse(url);
 * } catch (error) {
 *   if (isUnbrowserError(error)) {
 *     console.log(error.code); // TypeScript knows this is ErrorCode
 *   }
 * }
 * ```
 */
export function isUnbrowserError(error: unknown): error is UnbrowserError {
  return error instanceof UnbrowserError;
}

/**
 * Type guard to check if an error is retryable.
 *
 * @example
 * ```typescript
 * if (isRetryableError(error)) {
 *   await delay(error.getRetryDelay());
 *   // retry
 * }
 * ```
 */
export function isRetryableError(error: unknown): error is UnbrowserError {
  return isUnbrowserError(error) && error.isRetryable();
}

/**
 * Create a rate limit error with custom retry delay.
 */
export function rateLimitError(retryAfter: number): UnbrowserError {
  return new UnbrowserError('RATE_LIMITED', 'Rate limit exceeded', {
    statusCode: 429,
    customRecovery: { retryAfter },
  });
}

/**
 * Create a timeout error with custom message.
 */
export function timeoutError(timeoutMs: number, url?: string): UnbrowserError {
  const message = url
    ? `Request to ${url} timed out after ${timeoutMs}ms`
    : `Request timed out after ${timeoutMs}ms`;

  return new UnbrowserError('TIMEOUT', message, {
    context: { timeoutMs, url },
  });
}
