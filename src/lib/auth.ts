import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { CRON_AUTH_HEADER } from './constants';

/**
 * Verify that an incoming request carries a valid CRON_SECRET.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 *
 * @returns true if the header matches CRON_SECRET, false otherwise.
 */
export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = request.headers.get(CRON_AUTH_HEADER);
  if (!provided) return false;

  // Both values must be the same length for timingSafeEqual
  const secretBuf = Buffer.from(secret, 'utf-8');
  const providedBuf = Buffer.from(provided, 'utf-8');

  if (secretBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(secretBuf, providedBuf);
}

/**
 * Return a 401 JSON response for unauthorised cron requests.
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 },
  );
}

/**
 * Return a standardised JSON error response.
 */
export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Return a standardised JSON success response.
 */
export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status = 200,
): NextResponse {
  return NextResponse.json(data, { status });
}
