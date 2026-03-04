import { getAdminClient } from './supabase';

export interface LLMLogEntry {
  provider: string;
  model: string;
  feature: string;
  success: boolean;
  latency_ms: number;
  tokens_in?: number;
  tokens_out?: number;
  error_type?: string;
  is_fallback: boolean;
}

/**
 * Log an LLM usage event to Supabase. Fire-and-forget — never blocks the caller.
 */
export function logLLMUsage(entry: LLMLogEntry): void {
  try {
    const supabase = getAdminClient();
    supabase
      .from('llm_usage_logs')
      .insert(entry)
      .then(({ error }) => {
        if (error) console.error('[llm-logger] Failed to log usage:', error.message);
      });
  } catch {
    // getAdminClient() may throw if env vars missing (e.g. during tests/build)
  }
}
