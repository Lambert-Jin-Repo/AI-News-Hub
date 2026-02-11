/**
 * Seed script for curated AI workflows.
 *
 * Uses Gemini (via the existing LLM client) to generate workflow descriptions
 * and step labels from tool skeletons. Falls back to hand-written descriptions
 * if Gemini is unavailable.
 *
 * Run:  npx tsx scripts/seed-workflows.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateText } from '../src/lib/llm-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Workflow skeletons
// ---------------------------------------------------------------------------

interface WorkflowSkeleton {
  slug: string;
  title: string;
  cost_category: 'free' | 'paid';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  toolSlugs: string[];
  // Fallback descriptions if Gemini is unavailable
  fallbackDescription: string;
  fallbackSteps: { label: string; description: string }[];
}

const WORKFLOWS: WorkflowSkeleton[] = [
  {
    slug: 'full-stack-web-app',
    title: 'Full-Stack Web App',
    cost_category: 'paid',
    difficulty: 'intermediate',
    estimated_minutes: 120,
    toolSlugs: ['chatgpt', 'v0', 'cursor', 'vercel'],
    fallbackDescription: 'Go from idea to deployed web app using AI at every step — plan with ChatGPT, scaffold UI with v0, build with Cursor, and deploy on Vercel.',
    fallbackSteps: [
      { label: 'Plan & Architect', description: 'Use ChatGPT to brainstorm features, define your tech stack, and create a project outline.' },
      { label: 'Generate UI', description: 'Paste your spec into v0 to generate production-ready React/Next.js components.' },
      { label: 'Build & Iterate', description: 'Open the project in Cursor to add business logic, connect APIs, and refine the codebase with AI assistance.' },
      { label: 'Deploy', description: 'Push to Vercel for instant deployment with preview URLs, analytics, and edge functions.' },
    ],
  },
  {
    slug: 'ai-content-pipeline',
    title: 'AI Content Pipeline',
    cost_category: 'free',
    difficulty: 'beginner',
    estimated_minutes: 45,
    toolSlugs: ['chatgpt', 'canva-ai', 'gamma'],
    fallbackDescription: 'Create polished content from idea to presentation — draft with ChatGPT, design visuals in Canva AI, and build slides with Gamma.',
    fallbackSteps: [
      { label: 'Draft Content', description: 'Use ChatGPT to write blog posts, outlines, or marketing copy from your brief.' },
      { label: 'Design Visuals', description: 'Create matching graphics, social cards, and branded assets with Canva AI.' },
      { label: 'Build Presentation', description: 'Turn your content into polished slides or documents with Gamma\'s AI layout engine.' },
    ],
  },
  {
    slug: 'video-production',
    title: 'Video Production',
    cost_category: 'paid',
    difficulty: 'intermediate',
    estimated_minutes: 90,
    toolSlugs: ['chatgpt', 'sora', 'elevenlabs', 'heygen'],
    fallbackDescription: 'Produce professional AI videos from script to final cut — write with ChatGPT, generate footage with Sora, add voiceover via ElevenLabs, and present with HeyGen avatars.',
    fallbackSteps: [
      { label: 'Write Script', description: 'Use ChatGPT to write a video script with scene descriptions and dialogue.' },
      { label: 'Generate Footage', description: 'Feed scene descriptions to Sora to generate cinematic video clips.' },
      { label: 'Add Voiceover', description: 'Create realistic narration with ElevenLabs text-to-speech in your preferred voice.' },
      { label: 'Create Presenter', description: 'Use HeyGen to add an AI avatar presenter that lip-syncs to your script.' },
    ],
  },
  {
    slug: 'research-to-presentation',
    title: 'Research to Presentation',
    cost_category: 'free',
    difficulty: 'beginner',
    estimated_minutes: 30,
    toolSlugs: ['perplexity', 'notebooklm', 'gamma'],
    fallbackDescription: 'Turn research into a compelling presentation — gather sources with Perplexity, synthesize with NotebookLM, and present with Gamma.',
    fallbackSteps: [
      { label: 'Research', description: 'Use Perplexity to find and cite up-to-date sources on your topic.' },
      { label: 'Synthesize', description: 'Upload your sources to NotebookLM for AI-powered summaries and Q&A.' },
      { label: 'Present', description: 'Feed your synthesized notes into Gamma to auto-generate a polished slide deck.' },
    ],
  },
  {
    slug: 'automated-ai-workflows',
    title: 'Automated AI Workflows',
    cost_category: 'free',
    difficulty: 'intermediate',
    estimated_minutes: 60,
    toolSlugs: ['chatgpt', 'n8n', 'make'],
    fallbackDescription: 'Build automated pipelines that run on autopilot — design logic with ChatGPT, orchestrate with n8n, and connect external services via Make.',
    fallbackSteps: [
      { label: 'Design Logic', description: 'Use ChatGPT to plan your automation flow, define triggers, and map data transformations.' },
      { label: 'Build Pipeline', description: 'Implement the core workflow in n8n with visual nodes and AI agent capabilities.' },
      { label: 'Connect Services', description: 'Use Make to bridge any remaining integrations and add conditional routing.' },
    ],
  },
  {
    slug: 'music-audio-creation',
    title: 'Music & Audio Creation',
    cost_category: 'free',
    difficulty: 'beginner',
    estimated_minutes: 30,
    toolSlugs: ['chatgpt', 'suno', 'elevenlabs'],
    fallbackDescription: 'Create original music and audio content — write lyrics with ChatGPT, compose full tracks with Suno, and add professional narration via ElevenLabs.',
    fallbackSteps: [
      { label: 'Write Lyrics', description: 'Use ChatGPT to write song lyrics, jingles, or podcast scripts in any style.' },
      { label: 'Compose Music', description: 'Feed your lyrics to Suno to generate a full song with vocals and instruments.' },
      { label: 'Add Narration', description: 'Create intros, outros, or voiceovers with ElevenLabs\' realistic AI voices.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Gemini enrichment
// ---------------------------------------------------------------------------

interface GeminiStepResult {
  toolSlug: string;
  label: string;
  description: string;
}

interface GeminiWorkflowResult {
  description: string;
  steps: GeminiStepResult[];
}

async function enrichWithGemini(skeleton: WorkflowSkeleton): Promise<GeminiWorkflowResult | null> {
  const toolList = skeleton.toolSlugs.join(', ');
  const taskPrompt = `You are an AI workflow advisor. Given a workflow title and tool sequence, generate:
1. A concise workflow description (1-2 sentences, max 200 chars)
2. For each tool, a short label (1-3 words) and description (1 sentence, max 100 chars)

Return ONLY valid JSON matching this schema:
{
  "description": "...",
  "steps": [
    { "toolSlug": "...", "label": "...", "description": "..." }
  ]
}`;

  const userContent = `Workflow: "${skeleton.title}"\nTools in order: [${toolList}]\nDifficulty: ${skeleton.difficulty}`;

  try {
    const result = await generateText(taskPrompt, userContent, { maxTokens: 512 });
    // Extract JSON from response (may have markdown code fences)
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as GeminiWorkflowResult;

    // Validate structure
    if (!parsed.description || !Array.isArray(parsed.steps)) return null;
    if (parsed.steps.length !== skeleton.toolSlugs.length) return null;

    return parsed;
  } catch (err) {
    console.log(`  Gemini enrichment failed for "${skeleton.title}": ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== Seed AI Workflows ===\n');

  let success = 0;
  let failed = 0;

  for (const skeleton of WORKFLOWS) {
    console.log(`Processing: ${skeleton.title}...`);

    // Try Gemini enrichment
    const enriched = await enrichWithGemini(skeleton);

    const description = enriched?.description ?? skeleton.fallbackDescription;
    const stepLabels = enriched?.steps ?? skeleton.fallbackSteps.map((s, i) => ({
      toolSlug: skeleton.toolSlugs[i],
      ...s,
    }));

    const steps = skeleton.toolSlugs.map((toolSlug, i) => ({
      order: i + 1,
      toolSlug,
      label: stepLabels[i]?.label ?? `Step ${i + 1}`,
      description: stepLabels[i]?.description ?? '',
      isOptional: false,
    }));

    // Check if workflow already exists
    const { data: existing } = await supabase
      .from('workflows')
      .select('slug')
      .eq('slug', skeleton.slug)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing
      const { error } = await supabase
        .from('workflows')
        .update({
          title: skeleton.title,
          description,
          cost_category: skeleton.cost_category,
          difficulty: skeleton.difficulty,
          estimated_minutes: skeleton.estimated_minutes,
          steps,
          is_active: true,
        })
        .eq('slug', skeleton.slug);

      if (error) {
        console.log(`  FAILED [${skeleton.slug}]: ${error.message}`);
        failed++;
      } else {
        console.log(`  UPDATED [${skeleton.slug}] (already existed) — ${enriched ? 'Gemini' : 'fallback'}`);
        success++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('workflows')
        .insert({
          slug: skeleton.slug,
          title: skeleton.title,
          description,
          cost_category: skeleton.cost_category,
          difficulty: skeleton.difficulty,
          estimated_minutes: skeleton.estimated_minutes,
          steps,
          is_active: true,
        });

      if (error) {
        console.log(`  FAILED [${skeleton.slug}]: ${error.message}`);
        failed++;
      } else {
        console.log(`  INSERTED [${skeleton.slug}] — ${enriched ? 'Gemini' : 'fallback'}`);
        success++;
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  ${success} succeeded, ${failed} failed`);
  console.log(`  Total workflows: ${WORKFLOWS.length}\n`);
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
