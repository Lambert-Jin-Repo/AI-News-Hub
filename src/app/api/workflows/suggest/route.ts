import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateText } from '@/lib/llm-client';
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
  try {
    const body = await request.json();
    goal = typeof body.goal === 'string' ? body.goal.trim() : '';
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

  const taskPrompt = `You are an AI workflow advisor. Given the user's goal and a list of available AI tools, suggest a 3-5 step workflow using ONLY tools from the provided list.

Return ONLY valid JSON matching this schema:
{
  "title": "Short workflow title (max 50 chars)",
  "description": "1-2 sentence description of the workflow (max 200 chars)",
  "steps": [
    {
      "toolSlug": "exact-slug-from-list",
      "label": "Short label (1-3 words)",
      "description": "What to do with this tool (1 sentence, max 100 chars)",
      "isOptional": false
    }
  ]
}

Rules:
- Use 3-5 steps only
- Every toolSlug MUST exactly match a slug from the available tools list
- Each step should logically lead to the next
- Mark truly optional steps with isOptional: true
- Keep it practical and actionable`;

  const userContent = `Goal: "${goal}"\n\nAvailable tools:\n${toolList}`;

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

    // Validate all tool slugs exist
    const validSlugs = new Set(tools.map(t => t.slug));
    const invalidSteps = parsed.steps.filter((s: { toolSlug: string }) => !validSlugs.has(s.toolSlug));
    if (invalidSteps.length > 0) {
      logger.warn('Workflow suggestion contained invalid tool slugs', {
        invalid: invalidSteps.map((s: { toolSlug: string }) => s.toolSlug),
      });
      // Filter out invalid steps rather than failing entirely
      parsed.steps = parsed.steps.filter((s: { toolSlug: string }) => validSlugs.has(s.toolSlug));
      if (parsed.steps.length === 0) {
        return NextResponse.json({ error: 'Could not generate workflow. Please try again.' }, { status: 500 });
      }
    }

    // Add order numbers
    parsed.steps = parsed.steps.map((step: Record<string, unknown>, i: number) => ({
      ...step,
      order: i + 1,
    }));

    return NextResponse.json({
      workflow: {
        title: parsed.title,
        description: parsed.description,
        steps: parsed.steps,
        cost_category: null, // AI-suggested, not curated
        difficulty: null,
        estimated_minutes: null,
      },
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
