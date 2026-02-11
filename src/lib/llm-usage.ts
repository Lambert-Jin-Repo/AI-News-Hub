/**
 * In-memory daily Gemini API call counter.
 * Proactively routes to Groq before hitting the 250 RPD free-tier limit.
 * Resets automatically at UTC midnight.
 */

const DAILY_LIMIT = 230; // buffer of 20 below 250 RPD
const WARNING_THRESHOLD = 0.8; // log warning at 80%

let callCount = 0;
let lastResetDate = '';

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function resetIfNewDay(): void {
  const today = todayUTC();
  if (lastResetDate !== today) {
    callCount = 0;
    lastResetDate = today;
  }
}

/** Record a successful Gemini API call. */
export function recordGeminiCall(): void {
  resetIfNewDay();
  callCount++;
}

/** Check whether we should use Gemini (under daily limit). */
export function shouldUseGemini(): boolean {
  resetIfNewDay();
  return callCount < DAILY_LIMIT;
}

/** Check if usage has crossed the warning threshold. */
export function isNearLimit(): boolean {
  resetIfNewDay();
  return callCount >= Math.floor(DAILY_LIMIT * WARNING_THRESHOLD);
}

/** Get current usage stats. */
export function getUsageStats() {
  resetIfNewDay();
  return {
    date: lastResetDate || todayUTC(),
    geminiCalls: callCount,
    limit: DAILY_LIMIT,
    percentUsed: Math.round((callCount / DAILY_LIMIT) * 100),
    usingFallback: callCount >= DAILY_LIMIT,
  };
}
