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
const RATE_LIMIT = 3;
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
  const taskPrompt = WORKFLOW_SUGGEST_ENHANCED_PROMPT;
  const userContent = buildWorkflowSuggestInput(goal, toolList, allowExternal);

  try {
    const result = await generateText(taskPrompt, userContent, { maxTokens: 4096, provider: 'minimax', feature: 'workflow' });

    // Extract JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('Workflow advisor returned non-JSON response', { provider: result.provider });
      return NextResponse.json({ error: 'Could not generate workflow. Please try again.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.title || !parsed.description || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json({ error: 'Could not generate workflow. Please try again.' }, { status: 500 });
    }

    // Enrich tools with DB slug validation
    const validSlugs = new Set(tools.map(t => t.slug));
    const enrichedTools = (parsed.tools || []).map((tool: Record<string, unknown>) => ({
      name: tool.name || 'Unknown',
      slug: typeof tool.slug === 'string' && validSlugs.has(tool.slug) ? tool.slug : null,
      role: tool.role || '',
      isExternal: tool.isExternal === true || !validSlugs.has(tool.slug as string),
      url: tool.url || null,
    }));

    // Enrich steps with order
    const enrichedSteps = (parsed.steps || []).map((step: Record<string, unknown>, i: number) => ({
      order: step.order || i + 1,
      title: step.title || `Step ${i + 1}`,
      description: step.description || '',
      toolName: step.toolName || null,
    }));

    return NextResponse.json({
      advisor: {
        title: parsed.title,
        emoji: parsed.emoji || '🎯',
        description: parsed.description,
        tools: enrichedTools,
        steps: enrichedSteps,
        tips: Array.isArray(parsed.tips) ? parsed.tips : [],
        promptTemplates: Array.isArray(parsed.promptTemplates) ? parsed.promptTemplates : [],
        pitfalls: Array.isArray(parsed.pitfalls) ? parsed.pitfalls : [],
      },
      provider: result.provider,
    });
  } catch (err) {
    logger.error('Workflow advisor failed', err instanceof Error ? err : null);
    return NextResponse.json(
      { error: 'Could not generate workflow. Please try again later.' },
      { status: 503 },
    );
  }
}
