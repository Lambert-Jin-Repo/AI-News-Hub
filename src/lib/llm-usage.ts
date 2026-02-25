/**
 * LLM provider health and status tracking.
 *
 * With MiniMax Coding Plan (unlimited tokens, resets every 5hr),
 * there's no need for RPD tracking. This module provides simple
 * health checks and provider status reporting.
 */

import { logger } from './logger';

/** Which LLM provider is currently active. */
let activeProvider: 'minimax' | 'groq' = 'minimax';
let lastHealthCheck: string | null = null;
let consecutiveFailures = 0;

/**
 * Check MiniMax API connectivity by verifying the API key is set.
 * Returns true if MiniMax is configured and available.
 */
export function isMiniMaxConfigured(): boolean {
  return !!process.env.MINIMAX_API_KEY;
}

/**
 * Record a successful call to update provider status.
 */
export function recordSuccess(provider: 'minimax' | 'groq'): void {
  activeProvider = provider;
  lastHealthCheck = new Date().toISOString();
  if (provider === 'minimax') {
    consecutiveFailures = 0;
  }
}

/**
 * Record a failed MiniMax call.
 */
export function recordFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= 3) {
    logger.warn('MiniMax has failed 3+ times consecutively, Groq is primary');
    activeProvider = 'groq';
  }
}

/**
 * Get current provider status.
 */
export function getUsageStats() {
  return {
    activeProvider,
    miniMaxConfigured: isMiniMaxConfigured(),
    consecutiveFailures,
    lastHealthCheck: lastHealthCheck || 'none',
  };
}
