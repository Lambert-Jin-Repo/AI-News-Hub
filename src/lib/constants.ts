// Application-wide constants

export const APP_NAME = 'AI News Hub';
export const APP_DESCRIPTION =
  'Automated AI news aggregation with AI-generated summaries and a curated tools directory.';

// Summary status values used in the articles table
export const SUMMARY_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED_SAFETY: 'failed_safety',
  FAILED_QUOTA: 'failed_quota',
  SKIPPED: 'skipped',
} as const;

export type SummaryStatus =
  (typeof SUMMARY_STATUS)[keyof typeof SUMMARY_STATUS];

// Audio status values used in the daily_digests table
export const AUDIO_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type AudioStatus = (typeof AUDIO_STATUS)[keyof typeof AUDIO_STATUS];

// Pricing model values used in the tools table
export const PRICING_MODEL = {
  FREE: 'free',
  FREEMIUM: 'freemium',
  PAID: 'paid',
} as const;

export type PricingModel =
  (typeof PRICING_MODEL)[keyof typeof PRICING_MODEL];

// Source types used in the sources table
export const SOURCE_TYPE = {
  RSS: 'rss',
  API: 'api',
} as const;

export type SourceType = (typeof SOURCE_TYPE)[keyof typeof SOURCE_TYPE];

// Defaults
export const DEFAULTS = {
  ARTICLES_PER_PAGE: 20,
  SUMMARISE_BATCH_SIZE: 10,
  DIGEST_ARTICLE_COUNT: 10,
  DIGEST_WORD_TARGET: 400,
  ARTICLE_MAX_AGE_DAYS: 90,
  AUDIO_MAX_AGE_DAYS: 30,
  TOOL_CHECK_FAIL_THRESHOLD: 2,
} as const;

// HTTP headers used for cron job auth
export const CRON_AUTH_HEADER = 'x-cron-secret';
