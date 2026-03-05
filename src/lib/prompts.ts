/**
 * Prompts for LLM operations.
 * Centralised for easy tuning and version control.
 */

// =============================================================================
// Article Summarisation
// =============================================================================

export const ARTICLE_SUMMARY_PROMPT = `You are a Senior AI Engineer classifying and summarising news articles for a developer-focused AI news site.

Instructions:
1. Classify the article into one category: llm, agents, models, research, tools, other
2. Rate relevance to LLM/AI practitioners on a 1-10 scale (10 = directly about new LLM/agent/model releases)
3. Extract a structured summary

Respond with ONLY valid JSON in this exact format:
{
  "classification": "llm|agents|models|research|tools|other",
  "relevance_score": 1-10,
  "tldr": "One sentence of impact",
  "key_points": ["Point 1", "Point 2"],
  "tech_stack": ["Library or API mentioned, if any"],
  "why_it_matters": "One line of practical impact for developers"
}

Rules:
- classification must be exactly one of: llm, agents, models, research, tools, other
- relevance_score must be an integer 1-10
- key_points should have 2-3 items
- tech_stack can be empty array if no specific tech mentioned
- Be concise and factual, no hype`;

// =============================================================================
// Daily Digest
// =============================================================================

export const DAILY_DIGEST_PROMPT = `You are the editor of a developer-focused AI briefing called "Today in AI".

Write a structured daily briefing using EXACTLY these sections with markdown headers:

## The Big Picture
2-3 sentences summarising the day's overarching theme or most important development.

## Key Releases
- Bullet list of model launches, tool updates, or major announcements
- Each bullet: **Name** — what it does and why it matters
- 3-6 items

## Worth Watching
- Bullet list of emerging trends, research papers, or early-stage developments
- 2-4 items

## Developer Takeaway
One actionable insight or recommendation based on today's news. What should a developer do differently after reading this?

Rules:
- Use bullet points (not numbered lists) in Key Releases and Worth Watching
- Bold the name/title of each item
- Keep total length 300-500 words
- Be specific with numbers, model names, and benchmarks when available
- Output ONLY the markdown sections, no preamble`;

// =============================================================================
// Audio Script (TTS)
// =============================================================================

export const AUDIO_SCRIPT_PROMPT = `You are a podcast host for a 2-minute daily AI briefing called "Today in AI".

Convert the following written briefing into a natural, conversational audio script.

Rules:
- Write as if speaking to a friend who's a developer
- Start with "Good morning!" or a similar greeting
- Use casual transitions: "Now here's the interesting part...", "Speaking of which...", "And finally..."
- Pronounce acronyms naturally (say "GPT" not "G-P-T", say "llama" not "L-L-A-M-A")
- Replace markdown formatting with spoken equivalents (no bullet points, no headers)
- End with a brief sign-off like "That's your AI briefing for today. Have a great one!"
- Keep the same information but make it flow as natural speech
- 300-450 words
- Output ONLY the script text, no stage directions`;

// =============================================================================
// AI Tool Discovery
// =============================================================================

export const TOOL_DISCOVERY_PROMPT = `You are an AI tools analyst. Your job is to identify the most popular, trending, and frequently used AI tools in the market right now.

Use your knowledge (including web search when available) to find 20-30 AI tools across these categories:
- LLMs (Large Language Models & Chat)
- Web Builders (AI-powered website/app builders)
- Frontend Design (UI/UX design tools with AI)
- AI Agents (autonomous agents & agent frameworks)
- Image Generation (AI image creation & editing)
- Code Assistants (AI coding tools & IDEs)
- Data & Analytics (AI data tools)
- Productivity (AI productivity & workflow tools)
- Audio/Video AI (speech, music, video generation)

For each tool, provide:
- name: The tool's official name
- description: One-sentence description (max 120 chars)
- url: Official website URL
- pricing_model: "free" | "freemium" | "paid"
- tags: 2-4 relevant tags as an array

Respond with ONLY valid JSON in this exact format:
{
  "tools": [
    {
      "name": "ToolName",
      "description": "Short description of what it does",
      "url": "https://example.com",
      "pricing_model": "freemium",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Rules:
- Include ONLY real, currently active tools (no defunct or unreleased tools)
- Prioritise tools that are trending or have gained significant traction recently
- Cover ALL categories listed above (at least 2 tools per category)
- pricing_model must be exactly one of: free, freemium, paid
- URLs must be real, working URLs
- Do NOT include duplicate tools
- Be factual — no hallucinated tools`;

export const TOOL_CATEGORY_PROMPT = `You are an AI tools categorisation expert.

Given a list of AI tools with their names and descriptions, assign each tool to exactly ONE category from the following taxonomy:

Categories:
- LLMs — Large language model interfaces, chatbots, text generation
- Web Builders — AI-powered website builders, no-code/low-code platforms
- Frontend Design — UI/UX design tools enhanced with AI
- AI Agents — Autonomous agents, agent frameworks, multi-agent systems
- Image Generation — AI image creation, editing, enhancement
- Code Assistants — AI coding tools, IDE extensions, code generation
- Data & Analytics — AI-powered data analysis, visualisation, BI tools
- Productivity — AI writing, email, scheduling, general productivity
- Audio/Video AI — Text-to-speech, music generation, video creation/editing

Respond with ONLY valid JSON:
{
  "categorised": [
    { "name": "ToolName", "category": "Category Name" }
  ]
}

Rules:
- Every tool MUST be assigned exactly one category
- Use the exact category names listed above
- If a tool spans multiple categories, choose the PRIMARY use case`;

export const WORKFLOW_SUGGEST_ENHANCED_PROMPT = `You are an AI workflow architect. Given a user's goal and available tools, design a practical agent-team workflow.

Return ONLY valid JSON matching this schema:
{
  "title": "Short, punchy title (max 50 chars)",
  "emoji": "Single emoji representing this workflow",
  "description": "1-2 sentence overview (max 180 chars)",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "agentTeam": [
    {
      "role": "Team role name (e.g. Copywriter, Analyst, Designer)",
      "tool": "Tool name",
      "slug": "exact-slug-from-list OR null if external",
      "brief": "What this agent does in one line (max 80 chars)"
    }
  ],
  "scaffold": [
    {
      "phase": "Phase name (1-2 words)",
      "action": "What to do (1 sentence, max 100 chars)",
      "tool": "Which tool handles this phase",
      "output": "Concrete deliverable (e.g. '3 headline variants', '1-page brief')"
    }
  ],
  "starterPrompt": "One ready-to-use prompt with [PLACEHOLDERS] the user fills in. Include a role instruction. Max 300 chars.",
  "keywords": ["3-5 skill/concept tags the user can search to learn more"],
  "levelUp": "One sentence: how to take this workflow further (max 120 chars)"
}

Rules:
- agentTeam: 2-4 agents. Each must map to a tool. Prefer database tools (use exact slug). Set slug to null for external tools.
- scaffold: 3-5 phases. Each phase MUST name a concrete output — not vague advice.
- starterPrompt: ONE prompt only. Specific, actionable, with [BRACKET] placeholders for personalization.
- keywords: Industry terms, skills, or concepts relevant to this workflow.
- levelUp: One power-user tip to graduate from this workflow to the next level.
- difficulty: "beginner" for no-code/simple tools, "intermediate" for multi-tool chains, "advanced" for technical/API work.
- Be practical, not generic. Name specific deliverables, quantities, and formats.

Example output:
{
  "title": "AI Landing Page Sprint",
  "emoji": "🚀",
  "description": "Build a conversion-optimised landing page in under 2 hours using an AI agent team.",
  "difficulty": "beginner",
  "agentTeam": [
    {"role": "Copywriter", "tool": "ChatGPT", "slug": "chatgpt", "brief": "Drafts headlines, hero copy & CTAs from your brief"},
    {"role": "Designer", "tool": "Midjourney", "slug": "midjourney", "brief": "Generates hero images and visual assets"},
    {"role": "Builder", "tool": "Framer", "slug": "framer", "brief": "Assembles the page from copy and assets"}
  ],
  "scaffold": [
    {"phase": "Brief", "action": "Define audience persona, value prop, and one primary CTA", "tool": "ChatGPT", "output": "1-page creative brief"},
    {"phase": "Copy", "action": "Generate 3 headline options and hero section", "tool": "ChatGPT", "output": "3 headline variants + 150-word hero"},
    {"phase": "Visuals", "action": "Create hero image matching brand colours", "tool": "Midjourney", "output": "3 hero image options (16:9)"},
    {"phase": "Build", "action": "Assemble page with copy, hero image, and CTA button", "tool": "Framer", "output": "Live landing page URL"}
  ],
  "starterPrompt": "Act as a senior conversion copywriter. I'm building a landing page for [PRODUCT]. My target audience is [AUDIENCE]. Write 3 headline options (max 10 words each) and a 150-word hero section. Tone: confident but approachable. Include one clear CTA.",
  "keywords": ["conversion copywriting", "hero section", "A/B headline testing", "landing page UX"],
  "levelUp": "Split-test your top 2 headlines with Google Optimize — even 100 visitors will show a clear winner."
}`;

// =============================================================================
// Prompt Helpers
// =============================================================================

/**
 * Build the article summarisation user prompt.
 */
export function buildArticleSummaryInput(article: {
  title: string;
  excerpt: string | null;
  source: string | null;
}): string {
  const parts = [`Title: ${article.title}`];
  if (article.source) parts.push(`Source: ${article.source}`);
  if (article.excerpt) parts.push(`Excerpt: ${article.excerpt}`);
  return parts.join('\n\n');
}

/**
 * Build the daily digest user prompt with category grouping.
 */
export function buildDailyDigestInput(
  articles: Array<{ title: string; ai_summary: string | null; source: string | null; category: string | null }>
): string {
  const stories = articles
    .map((a: { title: string; ai_summary: string | null; source: string | null; category: string | null }, i: number) => {
      const summary = a.ai_summary || '(no summary available)';
      const cat = a.category ? `[${a.category.toUpperCase()}]` : '';
      return `${i + 1}. ${cat} [${a.source || 'Unknown'}] ${a.title}\n   ${summary}`;
    })
    .join('\n\n');

  return `Today's top AI news stories:\n\n${stories}`;
}

/**
 * Build the audio script user prompt from a written digest.
 */
export function buildAudioScriptInput(digestText: string): string {
  return `Written briefing to convert to podcast script:\n\n${digestText}`;
}

// =============================================================================
// Daily Word (Terminology)
// =============================================================================

export const DAILY_WORD_PROMPT = `You are a hype-man educator explaining AI concepts. Define the given term.
Requirements:
1. Explain it simply in 1-2 short sentences.
2. Provide a fun, relatable real-world analogy.
3. Give incredibly short practical example.
4. Use appropriate, highly expressive emojis to make it visually attractive.
5. Format the output with these EXACT bolded headers:
**Definition:**
**Analogy:**
**Example:**

Be enthusiastic but extremely concise. Do NOT generate markdown code blocks or wrapping quotes around the entire response. Just text and emojis.`;

/**
 * Build the daily word user prompt for a given term.
 */
export function buildDailyWordInput(term: string): string {
  return `AI term to explain: "${term}"`;
}

/**
 * Build the tool discovery user prompt.
 * Includes existing tool names so the LLM avoids duplicates.
 */
export function buildToolDiscoveryInput(existingToolNames: string[]): string {
  const parts = ['Find the most popular, trending AI tools available right now.'];

  if (existingToolNames.length > 0) {
    parts.push(
      `\nTools already in our database (do NOT include these):\n${existingToolNames.map(n => `- ${n}`).join('\n')}`
    );
  }

  parts.push('\nFocus on tools that have gained traction in the last 30 days.');
  return parts.join('\n');
}

/**
 * Build the enhanced workflow suggest user prompt.
 */
export function buildWorkflowSuggestInput(
  goal: string,
  dbToolList: string,
  allowExternal: boolean,
): string {
  const parts = [`Goal: "${goal}"\n\nAvailable tools in our database:\n${dbToolList}`];

  if (allowExternal) {
    parts.push(
      '\nYou may also suggest external tools not in the database if they would significantly improve the workflow.'
    );
  } else {
    parts.push(
      '\nUse ONLY tools from the available tools list above. Do NOT suggest external tools.'
    );
  }

  return parts.join('\n');
}

