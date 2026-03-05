import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateText } from '@/lib/llm-client';
import {
  WORKFLOW_SUGGEST_ENHANCED_PROMPT,
  buildWorkflowSuggestInput,
} from '@/lib/prompts';
import { logger } from '@/lib/logger';

// In-memory rate limiter: max 3 requests/minute per IP
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

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

function tier1Validate(parsed: Record<string, unknown>): ValidationResult {
  // Required top-level fields
  const requiredStrings = ['title', 'emoji', 'description', 'starterPrompt', 'levelUp', 'difficulty'];
  for (const field of requiredStrings) {
    if (typeof parsed[field] !== 'string' || !(parsed[field] as string).trim()) {
      return { valid: false, reason: `Missing or empty field: ${field}` };
    }
  }

  // difficulty enum
  if (!['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty as string)) {
    return { valid: false, reason: 'difficulty must be beginner, intermediate, or advanced' };
  }

  // agentTeam: 2-4 items, each with role + tool + brief
  const team = parsed.agentTeam;
  if (!Array.isArray(team) || team.length < 2 || team.length > 4) {
    return { valid: false, reason: 'agentTeam must have 2-4 items' };
  }
  for (const agent of team) {
    if (!agent.role || !agent.tool || !agent.brief) {
      return { valid: false, reason: 'Each agent must have role, tool, and brief' };
    }
  }

  // scaffold: 3-5 items, each with phase + action + output
  const scaffold = parsed.scaffold;
  if (!Array.isArray(scaffold) || scaffold.length < 3 || scaffold.length > 5) {
    return { valid: false, reason: 'scaffold must have 3-5 items' };
  }
  for (const step of scaffold) {
    if (!step.phase || !step.action || !step.output) {
      return { valid: false, reason: 'Each scaffold step must have phase, action, and output' };
    }
  }

  // starterPrompt must contain at least one [PLACEHOLDER]
  if (!/\[.+?\]/.test(parsed.starterPrompt as string)) {
    return { valid: false, reason: 'starterPrompt must contain at least one [PLACEHOLDER]' };
  }

  // keywords: 3-5 items
  const keywords = parsed.keywords;
  if (!Array.isArray(keywords) || keywords.length < 3 || keywords.length > 5) {
    return { valid: false, reason: 'keywords must have 3-5 items' };
  }

  // levelUp: 20-120 chars
  const levelUp = (parsed.levelUp as string).trim();
  if (levelUp.length < 20 || levelUp.length > 120) {
    return { valid: false, reason: `levelUp must be 20-120 chars (got ${levelUp.length})` };
  }

  return { valid: true };
}

function tier2Validate(parsed: Record<string, unknown>, goalKeywords: string[]): ValidationResult {
  const team = parsed.agentTeam as Array<Record<string, string>>;
  const scaffold = parsed.scaffold as Array<Record<string, string>>;
  const starterPrompt = parsed.starterPrompt as string;
  const keywords = parsed.keywords as string[];
  const levelUp = parsed.levelUp as string;
  const description = parsed.description as string;
  const title = parsed.title as string;

  // No field duplicates text from another field
  const fieldTexts = [title, description, starterPrompt, levelUp];
  for (let i = 0; i < fieldTexts.length; i++) {
    for (let j = i + 1; j < fieldTexts.length; j++) {
      if (fieldTexts[i] === fieldTexts[j]) {
        return { valid: false, reason: 'Duplicate text between fields' };
      }
    }
  }

  // scaffold outputs are all distinct
  const outputs = scaffold.map(s => s.output?.toLowerCase().trim());
  if (new Set(outputs).size !== outputs.length) {
    return { valid: false, reason: 'Scaffold outputs must all be distinct' };
  }

  // starterPrompt >= 80 chars
  if (starterPrompt.length < 80) {
    return { valid: false, reason: `starterPrompt must be >= 80 chars (got ${starterPrompt.length})` };
  }

  // Goal keywords appear somewhere in the response
  const fullText = JSON.stringify(parsed).toLowerCase();
  const matched = goalKeywords.some(kw => fullText.includes(kw.toLowerCase()));
  if (goalKeywords.length > 0 && !matched) {
    return { valid: false, reason: 'Response does not reference the user goal' };
  }

  // No two agents share same role AND same tool
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      if (team[i].role === team[j].role && team[i].tool === team[j].tool) {
        return { valid: false, reason: 'Two agents share the same role AND tool' };
      }
    }
  }

  return { valid: true };
}

function extractGoalKeywords(goal: string): string[] {
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'for', 'to', 'in', 'on', 'with', 'my', 'i', 'me', 'is', 'of', 'from']);
  return goal
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

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
  const validSlugs = new Set(tools.map(t => t.slug));
  const goalKeywords = extractGoalKeywords(goal);

  // Provider chain for Tier 3 retry
  const providers: Array<'minimax' | 'default'> = ['minimax', 'minimax', 'default'];
  let lastError = '';

  for (let attempt = 0; attempt < providers.length; attempt++) {
    const provider = providers[attempt];
    try {
      const result = await generateText(taskPrompt, userContent, {
        maxTokens: 2048,
        provider,
        feature: 'workflow',
      });

      // Extract JSON from response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastError = 'Non-JSON response';
        logger.warn('Workflow advisor returned non-JSON response', { provider: result.provider, attempt });
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Tier 1: Schema completeness
      const t1 = tier1Validate(parsed);
      if (!t1.valid) {
        lastError = t1.reason || 'Tier 1 validation failed';
        logger.warn('Workflow advisor Tier 1 validation failed', { reason: t1.reason, provider: result.provider, attempt });
        continue;
      }

      // Tier 2: Content quality
      const t2 = tier2Validate(parsed, goalKeywords);
      if (!t2.valid) {
        lastError = t2.reason || 'Tier 2 validation failed';
        logger.warn('Workflow advisor Tier 2 validation failed', { reason: t2.reason, provider: result.provider, attempt });
        continue;
      }

      // Enrich agentTeam with slug validation
      const enrichedTeam = (parsed.agentTeam as Array<Record<string, unknown>>).map(agent => ({
        role: agent.role as string,
        tool: agent.tool as string,
        slug: typeof agent.slug === 'string' && validSlugs.has(agent.slug) ? agent.slug : null,
        brief: agent.brief as string,
      }));

      // Enrich scaffold
      const enrichedScaffold = (parsed.scaffold as Array<Record<string, unknown>>).map(step => ({
        phase: step.phase as string,
        action: step.action as string,
        tool: step.tool as string || '',
        output: step.output as string,
      }));

      return NextResponse.json({
        advisor: {
          title: parsed.title,
          emoji: parsed.emoji || '🎯',
          description: parsed.description,
          difficulty: parsed.difficulty,
          agentTeam: enrichedTeam,
          scaffold: enrichedScaffold,
          starterPrompt: parsed.starterPrompt,
          keywords: parsed.keywords,
          levelUp: parsed.levelUp,
        },
        provider: result.provider,
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Workflow advisor attempt failed', err instanceof Error ? err : null, { attempt, provider });
    }
  }

  // All attempts failed
  logger.error('Workflow advisor exhausted all attempts', null, { lastError });
  return NextResponse.json(
    { error: "Couldn't generate a quality workflow. Try rephrasing your goal." },
    { status: 500 },
  );
}
