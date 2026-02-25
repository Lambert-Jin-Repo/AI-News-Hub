import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateText } from '@/lib/llm-client';
import {
  WORKFLOW_SUGGEST_ENHANCED_PROMPT,
  buildWorkflowSuggestInput,
} from '@/lib/prompts';
import { logger } from '@/lib/logger';

// In-memory rate limiter: max 10 requests/minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Cache active tools in memory (refreshed every 10 minutes)
let cachedTools: { slug: string; name: string; category: string | null }[] = [];
let toolsCacheExpiry = 0;

async function getActiveTools() {
  if (Date.now() < toolsCacheExpiry && cachedTools.length > 0) {
    return cachedTools;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('tools')
    .select('slug, name, category')
    .eq('is_active', true);

  cachedTools = data || [];
  toolsCacheExpiry = Date.now() + 10 * 60 * 1000;
  return cachedTools;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      { status: 429 },
    );
  }

  // Parse and validate input
  let goal: string;
  let allowExternal: boolean;
  try {
    const body = await request.json();
    goal = typeof body.goal === 'string' ? body.goal.trim() : '';
    allowExternal = body.allowExternal !== false; // defaults to true
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!goal) {
    return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
  }

  if (goal.length > 200) {
    return NextResponse.json({ error: 'Goal must be 200 characters or less' }, { status: 400 });
  }

  // Get available tools
  const tools = await getActiveTools();
  if (tools.length === 0) {
    return NextResponse.json({ error: 'No tools available' }, { status: 503 });
  }

  const toolList = tools.map(t => `${t.name} (slug: ${t.slug}, category: ${t.category || 'uncategorized'})`).join('\n');

  // Use enhanced prompt that supports external tool recommendations
  const taskPrompt = WORKFLOW_SUGGEST_ENHANCED_PROMPT;
  const userContent = buildWorkflowSuggestInput(goal, toolList, allowExternal);

  try {
    const result = await generateText(taskPrompt, userContent, { maxTokens: 1024 });

    // Extract JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('Workflow suggestion returned non-JSON response', { provider: result.provider });
      return NextResponse.json({ error: 'Could not generate workflow. Please try again.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsed.title || !parsed.description || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json({ error: 'Could not generate workflow. Please try again.' }, { status: 500 });
    }

    // Separate database tools from external recommendations
    const validSlugs = new Set(tools.map(t => t.slug));
    const dbSteps: Array<Record<string, unknown>> = [];
    const externalSteps: Array<Record<string, unknown>> = [];

    for (const step of parsed.steps) {
      const isExternal = step.isExternal === true || String(step.toolSlug).startsWith('external:');

      if (isExternal) {
        externalSteps.push({
          ...step,
          isExternal: true,
        });
      } else if (validSlugs.has(step.toolSlug)) {
        dbSteps.push({
          ...step,
          isExternal: false,
        });
      } else {
        // Invalid slug — treat as external if allowExternal, otherwise skip
        if (allowExternal) {
          externalSteps.push({
            ...step,
            toolSlug: `external:${step.toolSlug}`,
            isExternal: true,
          });
        } else {
          logger.warn('Workflow suggestion contained invalid tool slug', { slug: step.toolSlug });
        }
      }
    }

    // All steps combined
    const allSteps = [...dbSteps, ...externalSteps];
    if (allSteps.length === 0) {
      return NextResponse.json({ error: 'Could not generate workflow. Please try again.' }, { status: 500 });
    }

    // Add order numbers
    const orderedSteps = allSteps.map((step, i) => ({
      ...step,
      order: i + 1,
    }));

    // Extract external tool details
    const externalTools = Array.isArray(parsed.externalTools) ? parsed.externalTools : [];

    return NextResponse.json({
      workflow: {
        title: parsed.title,
        description: parsed.description,
        steps: orderedSteps,
        cost_category: null, // AI-suggested, not curated
        difficulty: null,
        estimated_minutes: null,
      },
      externalTools,
      provider: result.provider,
    });
  } catch (err) {
    logger.error('Workflow suggestion failed', err instanceof Error ? err : null);
    return NextResponse.json(
      { error: 'Could not generate workflow. Please try again later.' },
      { status: 503 },
    );
  }
}
