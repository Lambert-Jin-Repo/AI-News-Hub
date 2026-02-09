/**
 * Typed application errors with error codes.
 * Replaces fragile string-based error detection (e.g. message.includes('quota')).
 */

export const ErrorCode = {
  // LLM errors
  SAFETY_BLOCK: 'SAFETY_BLOCK',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  RATE_LIMITED: 'RATE_LIMITED',
  LLM_EMPTY_RESPONSE: 'LLM_EMPTY_RESPONSE',
  LLM_BOTH_FAILED: 'LLM_BOTH_FAILED',

  // Digest errors
  DIGEST_EXISTS: 'DIGEST_EXISTS',
  DIGEST_NOT_FOUND: 'DIGEST_NOT_FOUND',
  INSUFFICIENT_ARTICLES: 'INSUFFICIENT_ARTICLES',

  // Database errors
  DB_FETCH_FAILED: 'DB_FETCH_FAILED',
  DB_INSERT_FAILED: 'DB_INSERT_FAILED',

  // General
  CONFIG_MISSING: 'CONFIG_MISSING',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: ErrorCodeType,
    { isRetryable = false }: { isRetryable?: boolean } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isRetryable = isRetryable;
  }

  static isSafetyBlock(error: unknown): boolean {
    return error instanceof AppError && error.code === ErrorCode.SAFETY_BLOCK;
  }

  static isQuotaOrRateLimit(error: unknown): boolean {
    return (
      error instanceof AppError &&
      (error.code === ErrorCode.QUOTA_EXCEEDED || error.code === ErrorCode.RATE_LIMITED)
    );
  }

  static isDigestExists(error: unknown): boolean {
    return error instanceof AppError && error.code === ErrorCode.DIGEST_EXISTS;
  }
}
