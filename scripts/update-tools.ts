/**
 * One-time script to curate the AI Tools directory.
 *
 * - Deactivates 20 niche / less-popular tools
 * - Updates 30 existing tools (descriptions, URLs, categories, tags)
 * - Inserts 13 new popular tools
 *
 * Run:  npx tsx scripts/update-tools.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Step 1: Deactivate 20 niche tools
// ---------------------------------------------------------------------------
const DEACTIVATE_SLUGS = [
  // LLM / Chat removals
  'pi',
  'mistral-ai',
  'meta-llama',
  // Code Assistant removals
  'cody',
  'tabnine',
  // Image Generation removals
  'ideogram',
  // Video Generation removals
  'luma-dream-machine',
  'descript',
  // Productivity removals
  'copy-ai',
  'otter-ai',
  'tome',
  'mem',
  'reclaim-ai',
  // Research / Data removals (entire category)
  'elicit',
  'consensus',
  'semantic-scholar',
  'wolfram-alpha',
  'scite',
  'connected-papers',
  'julius-ai',
];

// ---------------------------------------------------------------------------
// Step 2: Upsert existing tools with updated data
// ---------------------------------------------------------------------------
interface ToolUpdate {
  slug: string;
  data: Record<string, unknown>;
}

const TOOL_UPDATES: ToolUpdate[] = [
  // ── LLM / Chat ──────────────────────────────────────────────
  {
    slug: 'chatgpt',
    data: {
      description:
        'OpenAI\'s flagship conversational AI. Supports GPT-4o, web browsing, image generation, code execution, and custom GPTs for any task.',
      url: 'https://chatgpt.com',
      category: 'LLM / Chat',
      tags: ['chatbot', 'gpt-4o', 'openai', 'assistant'],
    },
  },
  {
    slug: 'claude',
    data: {
      description:
        'Anthropic\'s AI assistant known for long-context reasoning, safe responses, and strong coding ability. Available via web, API, and Claude Code CLI.',
      category: 'LLM / Chat',
      tags: ['chatbot', 'anthropic', 'reasoning', 'coding'],
    },
  },
  {
    slug: 'gemini',
    data: {
      description:
        'Google\'s multimodal AI assistant. Integrates with Search, Gmail, Docs, and YouTube with a 1M+ token context window.',
      category: 'LLM / Chat',
      tags: ['chatbot', 'google', 'multimodal', 'search'],
    },
  },
  {
    slug: 'grok',
    data: {
      description:
        'xAI\'s conversational AI with real-time X (Twitter) integration, image understanding, and an unfiltered personality.',
      url: 'https://grok.com',
      category: 'LLM / Chat',
      tags: ['chatbot', 'xai', 'real-time', 'twitter'],
    },
  },
  {
    slug: 'microsoft-copilot',
    data: {
      description:
        'Microsoft\'s AI assistant built into Windows, Edge, and Microsoft 365. Powered by GPT-4o with enterprise security.',
      category: 'LLM / Chat',
      tags: ['chatbot', 'microsoft', 'office', 'enterprise'],
    },
  },
  {
    slug: 'perplexity',
    data: {
      description:
        'AI-powered answer engine that searches the web in real time and provides cited, up-to-date responses with source links.',
      category: 'LLM / Chat',
      tags: ['search', 'research', 'citations', 'answer-engine'],
    },
  },
  {
    slug: 'deepseek',
    data: {
      description:
        'Open-weight AI lab from China offering DeepSeek-V3 and R1 reasoning models. Competitive performance at a fraction of the cost.',
      category: 'LLM / Chat',
      tags: ['chatbot', 'open-source', 'reasoning', 'affordable'],
    },
  },

  // ── Code Assistant ──────────────────────────────────────────
  {
    slug: 'github-copilot',
    data: {
      description:
        'AI pair programmer from GitHub. Autocompletes code, answers questions in chat, and reviews PRs across every major IDE. Free tier available.',
      pricing_model: 'freemium',
      category: 'Code Assistant',
      tags: ['coding', 'github', 'autocomplete', 'ide'],
    },
  },
  {
    slug: 'cursor',
    data: {
      description:
        'AI-native code editor built on VS Code. Features multi-file editing, codebase-aware chat, and agentic coding with frontier models.',
      category: 'Code Assistant',
      tags: ['coding', 'editor', 'ai-native', 'refactoring'],
    },
  },
  {
    slug: 'windsurf',
    data: {
      description:
        'Agentic IDE by Codeium (formerly OpenAI-backed). Combines AI autocomplete, chat, and autonomous multi-step coding actions.',
      url: 'https://windsurf.com',
      category: 'Code Assistant',
      tags: ['coding', 'ide', 'agentic', 'autocomplete'],
    },
  },
  {
    slug: 'claude-code',
    data: {
      description:
        'Anthropic\'s CLI tool for agentic coding. Runs in your terminal, reads your codebase, edits files, and executes commands autonomously.',
      category: 'Code Assistant',
      tags: ['coding', 'cli', 'agentic', 'anthropic'],
    },
  },
  {
    slug: 'replit-ai',
    data: {
      description:
        'Browser-based IDE with an AI agent that builds, deploys, and hosts full-stack apps from natural language prompts.',
      category: 'Code Assistant',
      tags: ['coding', 'browser-ide', 'deployment', 'full-stack'],
    },
  },
  {
    slug: 'bolt-new',
    data: {
      description:
        'In-browser AI dev environment by StackBlitz. Generates, runs, and deploys full-stack web apps from a single prompt.',
      category: 'Code Assistant',
      tags: ['coding', 'browser-ide', 'full-stack', 'stackblitz'],
    },
  },

  // ── Image Generation ────────────────────────────────────────
  {
    slug: 'midjourney',
    data: {
      description:
        'Industry-leading AI image generator known for stunning artistic quality. Accessible via Discord and the web app.',
      category: 'Image Generation',
      tags: ['image', 'art', 'creative', 'discord'],
    },
  },
  {
    slug: 'dall-e',
    data: {
      description:
        'OpenAI\'s image generation model integrated into ChatGPT. Creates photorealistic and artistic images from text descriptions.',
      category: 'Image Generation',
      tags: ['image', 'openai', 'text-to-image', 'creative'],
    },
  },
  {
    slug: 'flux',
    data: {
      description:
        'Black Forest Labs\' open-weight image model. Fast, high-quality generations with excellent prompt adherence and photorealism.',
      pricing_model: 'freemium',
      category: 'Image Generation',
      tags: ['image', 'open-source', 'photorealistic', 'fast'],
    },
  },
  {
    slug: 'stable-diffusion',
    data: {
      description:
        'Open-source image generation framework by Stability AI. Run locally for free or use via cloud APIs. Huge community ecosystem.',
      category: 'Image Generation',
      tags: ['image', 'open-source', 'local', 'community'],
    },
  },
  {
    slug: 'adobe-firefly',
    data: {
      description:
        'Adobe\'s commercially safe AI image generator. Trained on licensed content, integrated into Photoshop, Illustrator, and Express.',
      category: 'Image Generation',
      tags: ['image', 'adobe', 'commercial', 'design'],
    },
  },
  {
    slug: 'leonardo-ai',
    data: {
      description:
        'AI creative platform specializing in game assets, concept art, and design. Offers fine-tuned models and real-time canvas.',
      category: 'Image Generation',
      tags: ['image', 'game-art', 'design', 'creative'],
    },
  },

  // ── Video Generation (moved from Audio / Video) ─────────────
  {
    slug: 'runway',
    data: {
      description:
        'Pioneer in AI video generation. Gen-3 Alpha creates cinematic clips from text or images with advanced motion controls.',
      category: 'Video Generation',
      tags: ['video', 'cinematic', 'gen-3', 'creative'],
    },
  },
  {
    slug: 'heygen',
    data: {
      description:
        'AI video platform for creating professional talking-head videos with realistic avatars, lip-sync, and multilingual translation.',
      category: 'Video Generation',
      tags: ['video', 'avatar', 'talking-head', 'translation'],
    },
  },
  {
    slug: 'synthesia',
    data: {
      description:
        'Enterprise AI video platform. Create training and marketing videos with 230+ AI avatars in 140+ languages — no camera needed.',
      category: 'Video Generation',
      tags: ['video', 'enterprise', 'avatar', 'training'],
    },
  },

  // ── Audio / Music (moved from Audio / Video) ────────────────
  {
    slug: 'elevenlabs',
    data: {
      description:
        'Leading AI voice platform for text-to-speech, voice cloning, and dubbing. Ultra-realistic voices in 30+ languages.',
      category: 'Audio / Music',
      tags: ['audio', 'tts', 'voice-cloning', 'dubbing'],
    },
  },
  {
    slug: 'suno',
    data: {
      description:
        'AI music generator that creates full songs with vocals and instruments from text prompts. Multiple genres and styles.',
      category: 'Audio / Music',
      tags: ['music', 'ai-music', 'vocals', 'composition'],
    },
  },
  {
    slug: 'udio',
    data: {
      description:
        'AI music creation platform producing studio-quality tracks with realistic vocals. Strong at complex arrangements and lyrics.',
      category: 'Audio / Music',
      tags: ['music', 'ai-music', 'studio-quality', 'lyrics'],
    },
  },

  // ── Productivity ────────────────────────────────────────────
  {
    slug: 'notion-ai',
    data: {
      description:
        'AI writing and knowledge assistant built into Notion. Summarizes pages, generates content, answers questions across your workspace.',
      category: 'Productivity',
      tags: ['writing', 'notes', 'workspace', 'knowledge'],
    },
  },
  {
    slug: 'grammarly',
    data: {
      description:
        'AI writing assistant for grammar, tone, and clarity. Works across email, docs, and browsers with enterprise-grade privacy.',
      category: 'Productivity',
      tags: ['writing', 'grammar', 'tone', 'browser-extension'],
    },
  },
  {
    slug: 'jasper',
    data: {
      description:
        'Enterprise AI content platform for marketing teams. Generates on-brand copy, ads, and campaigns at scale.',
      category: 'Productivity',
      tags: ['writing', 'marketing', 'content', 'enterprise'],
    },
  },
  {
    slug: 'notebooklm',
    data: {
      description:
        'Google\'s AI research assistant. Upload sources and get instant summaries, Q&A, and even AI-generated podcast discussions.',
      category: 'Productivity',
      tags: ['research', 'notes', 'google', 'podcast'],
    },
  },
  {
    slug: 'gamma',
    data: {
      description:
        'AI presentation and document builder. Creates polished slides, docs, and webpages from prompts with smart layouts.',
      category: 'Productivity',
      tags: ['presentations', 'slides', 'documents', 'design'],
    },
  },
];

// ---------------------------------------------------------------------------
// Step 3: Insert 13 new tools
// ---------------------------------------------------------------------------
interface NewTool {
  name: string;
  slug: string;
  description: string;
  url: string;
  category: string;
  pricing_model: 'free' | 'freemium' | 'paid';
  tags: string[];
  is_active: boolean;
}

const NEW_TOOLS: NewTool[] = [
  // Code Assistant
  {
    name: 'v0',
    slug: 'v0',
    description:
      'Vercel\'s AI-powered app builder for Next.js and React. Generates production-ready UI components from natural language prompts.',
    url: 'https://v0.dev',
    category: 'Code Assistant',
    pricing_model: 'freemium',
    tags: ['coding', 'nextjs', 'react', 'ui-generation'],
    is_active: true,
  },
  {
    name: 'Lovable',
    slug: 'lovable',
    description:
      'Full-stack AI app builder that generates, deploys, and iterates on web applications from conversational prompts.',
    url: 'https://lovable.dev',
    category: 'Code Assistant',
    pricing_model: 'freemium',
    tags: ['coding', 'full-stack', 'app-builder', 'deployment'],
    is_active: true,
  },

  // Image Generation
  {
    name: 'Canva AI',
    slug: 'canva-ai',
    description:
      'All-in-one design platform with AI-powered image generation, background removal, Magic Write, and brand-consistent templates.',
    url: 'https://www.canva.com',
    category: 'Image Generation',
    pricing_model: 'freemium',
    tags: ['image', 'design', 'templates', 'branding'],
    is_active: true,
  },

  // Video Generation
  {
    name: 'Sora',
    slug: 'sora',
    description:
      'OpenAI\'s cinematic video generator that creates realistic, high-fidelity video clips from text and image prompts.',
    url: 'https://sora.com',
    category: 'Video Generation',
    pricing_model: 'freemium',
    tags: ['video', 'openai', 'cinematic', 'text-to-video'],
    is_active: true,
  },
  {
    name: 'Kling',
    slug: 'kling',
    description:
      'Cost-efficient AI video generator by Kuaishou. Produces cinematic quality clips with strong motion and physics understanding.',
    url: 'https://klingai.com',
    category: 'Video Generation',
    pricing_model: 'freemium',
    tags: ['video', 'cinematic', 'affordable', 'text-to-video'],
    is_active: true,
  },
  {
    name: 'Pika',
    slug: 'pika',
    description:
      'AI video creation tool for quick social media clips. Simple interface for text-to-video, image-to-video, and video editing.',
    url: 'https://pika.art',
    category: 'Video Generation',
    pricing_model: 'freemium',
    tags: ['video', 'social-media', 'quick', 'editing'],
    is_active: true,
  },

  // AI Agents (all new)
  {
    name: 'Manus',
    slug: 'manus',
    description:
      'Autonomous general-purpose AI agent that completes complex tasks end-to-end: research, coding, data analysis, and more.',
    url: 'https://manus.im',
    category: 'AI Agents',
    pricing_model: 'freemium',
    tags: ['agent', 'autonomous', 'multi-task', 'research'],
    is_active: true,
  },
  {
    name: 'Devin',
    slug: 'devin',
    description:
      'Cognition\'s AI software engineering agent. Autonomously plans, codes, debugs, and deploys — handling full development workflows.',
    url: 'https://devin.ai',
    category: 'AI Agents',
    pricing_model: 'paid',
    tags: ['agent', 'coding', 'autonomous', 'software-engineering'],
    is_active: true,
  },
  {
    name: 'Zapier',
    slug: 'zapier',
    description:
      'Automation platform connecting 7,000+ apps with AI-powered agents. Build workflows with natural language — no code required.',
    url: 'https://zapier.com',
    category: 'AI Agents',
    pricing_model: 'freemium',
    tags: ['automation', 'workflow', 'integrations', 'no-code'],
    is_active: true,
  },
  {
    name: 'Make',
    slug: 'make',
    description:
      'Visual workflow automation platform with AI capabilities. Connect apps, transform data, and build complex automations with drag-and-drop.',
    url: 'https://www.make.com',
    category: 'AI Agents',
    pricing_model: 'freemium',
    tags: ['automation', 'workflow', 'visual', 'integrations'],
    is_active: true,
  },
  {
    name: 'n8n',
    slug: 'n8n',
    description:
      'Open-source workflow automation with AI agent capabilities. Self-hostable, extensible, and integrates with 400+ services.',
    url: 'https://n8n.io',
    category: 'AI Agents',
    pricing_model: 'freemium',
    tags: ['automation', 'open-source', 'self-hosted', 'workflow'],
    is_active: true,
  },

  // Platforms / Hosting (all new)
  {
    name: 'Hugging Face',
    slug: 'hugging-face',
    description:
      'The largest open-source AI model hub. Host, share, and deploy ML models, datasets, and Spaces with a thriving community.',
    url: 'https://huggingface.co',
    category: 'Platforms / Hosting',
    pricing_model: 'freemium',
    tags: ['models', 'open-source', 'hub', 'community'],
    is_active: true,
  },
  {
    name: 'Vercel',
    slug: 'vercel',
    description:
      'Frontend cloud platform with the AI SDK for building AI-powered apps. Deploy Next.js, React, and AI features with zero config.',
    url: 'https://vercel.com',
    category: 'Platforms / Hosting',
    pricing_model: 'freemium',
    tags: ['hosting', 'nextjs', 'ai-sdk', 'deployment'],
    is_active: true,
  },
  {
    name: 'Replicate',
    slug: 'replicate',
    description:
      'Serverless AI inference platform. Run open-source models via API — Flux, Llama, Whisper, and thousands more with pay-per-use pricing.',
    url: 'https://replicate.com',
    category: 'Platforms / Hosting',
    pricing_model: 'paid',
    tags: ['inference', 'api', 'serverless', 'models'],
    is_active: true,
  },
  {
    name: 'OpenRouter',
    slug: 'openrouter',
    description:
      'Unified API gateway for 200+ AI models from OpenAI, Anthropic, Google, and open-source providers. Single API key, best pricing.',
    url: 'https://openrouter.ai',
    category: 'Platforms / Hosting',
    pricing_model: 'paid',
    tags: ['api', 'gateway', 'multi-model', 'routing'],
    is_active: true,
  },
];

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n=== AI Tools Directory Update ===\n');

  // Step 1: Deactivate niche tools
  console.log(`Step 1: Deactivating ${DEACTIVATE_SLUGS.length} niche tools...`);
  const { error: deactivateError, count: deactivateCount } = await supabase
    .from('tools')
    .update({ is_active: false })
    .in('slug', DEACTIVATE_SLUGS);

  if (deactivateError) {
    console.log(`  FAILED: ${deactivateError.message}`);
  } else {
    console.log(`  Done — ${deactivateCount ?? 'unknown'} rows updated`);
  }

  // Step 2: Update existing tools
  console.log(`\nStep 2: Updating ${TOOL_UPDATES.length} existing tools...`);
  let updateSuccess = 0;
  let updateFailed = 0;

  for (const tool of TOOL_UPDATES) {
    const { error } = await supabase
      .from('tools')
      .update(tool.data)
      .eq('slug', tool.slug);

    if (error) {
      console.log(`  FAILED [${tool.slug}]: ${error.message}`);
      updateFailed++;
    } else {
      updateSuccess++;
    }
  }
  console.log(`  Done — ${updateSuccess} updated, ${updateFailed} failed`);

  // Step 3: Insert new tools
  console.log(`\nStep 3: Inserting ${NEW_TOOLS.length} new tools...`);

  // Use individual upserts to handle conflicts gracefully
  let insertSuccess = 0;
  let insertSkipped = 0;
  let insertFailed = 0;

  for (const tool of NEW_TOOLS) {
    // Check if slug already exists
    const { data: existing } = await supabase
      .from('tools')
      .select('slug')
      .eq('slug', tool.slug)
      .limit(1);

    if (existing && existing.length > 0) {
      // Tool already exists — update it instead
      const { error } = await supabase
        .from('tools')
        .update({
          name: tool.name,
          description: tool.description,
          url: tool.url,
          category: tool.category,
          pricing_model: tool.pricing_model,
          tags: tool.tags,
          is_active: true,
        })
        .eq('slug', tool.slug);

      if (error) {
        console.log(`  FAILED [${tool.slug}]: ${error.message}`);
        insertFailed++;
      } else {
        console.log(`  UPDATED [${tool.slug}] (already existed)`);
        insertSkipped++;
      }
      continue;
    }

    const { error } = await supabase
      .from('tools')
      .insert(tool);

    if (error) {
      console.log(`  FAILED [${tool.slug}]: ${error.message}`);
      insertFailed++;
    } else {
      insertSuccess++;
    }
  }
  console.log(`  Done — ${insertSuccess} inserted, ${insertSkipped} updated, ${insertFailed} failed`);

  // Summary
  console.log('\n=== Summary ===');

  const { count: activeCount } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: totalCount } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true });

  // Get category breakdown
  const { data: catData } = await supabase
    .from('tools')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null);

  const catCounts: Record<string, number> = {};
  if (catData) {
    for (const row of catData) {
      const cat = row.category as string;
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    }
  }

  console.log(`Active tools: ${activeCount}  (total in DB: ${totalCount})`);
  console.log('\nCategory breakdown:');
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log('\nUpdate complete!\n');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
