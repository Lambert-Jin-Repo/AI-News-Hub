import { NextResponse } from 'next/server';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  checks: {
    env: { status: 'ok' | 'missing'; missing?: string[] };
    database?: { status: 'ok' | 'error'; message?: string };
  };
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'CRON_SECRET',
  'GEMINI_API_KEY',
];

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const missingEnv = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);

  const envCheck: HealthCheck['checks']['env'] =
    missingEnv.length === 0
      ? { status: 'ok' }
      : { status: 'missing', missing: missingEnv };

  // Database check — only if supabase client exists
  let dbCheck: HealthCheck['checks']['database'] | undefined;
  try {
    // Dynamic import so this doesn't fail when supabase.ts doesn't exist yet
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase.from('articles').select('id').limit(1);
    dbCheck = error
      ? { status: 'error', message: error.message }
      : { status: 'ok' };
  } catch {
    // supabase.ts doesn't exist yet — skip DB check
    dbCheck = undefined;
  }

  const overallStatus: HealthCheck['status'] =
    envCheck.status === 'missing' || dbCheck?.status === 'error'
      ? 'degraded'
      : 'ok';

  const health: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      env: envCheck,
      ...(dbCheck && { database: dbCheck }),
    },
  };

  const statusCode = overallStatus === 'ok' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
