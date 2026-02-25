import { NextResponse } from 'next/server';
import { verifyCronAuth, unauthorizedResponse } from '@/lib/auth';
import { getUsageStats } from '@/lib/llm-usage';

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return unauthorizedResponse();
  }

  return NextResponse.json(getUsageStats());
}
