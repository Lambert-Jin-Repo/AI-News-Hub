/**
 * Quick smoke test for MiniMax M2.5 API — article summary + workflow suggestion
 * Run: node test-minimax.mjs
 */
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve('.env.local');
const envLines = readFileSync(envPath, 'utf-8').split('\n');
for (const line of envLines) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const apiKey = process.env.MINIMAX_API_KEY;
const model = process.env.MINIMAX_MODEL || 'MiniMax-M2.5';
const baseURL = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1';

if (!apiKey) {
  console.error('❌ MINIMAX_API_KEY not found in .env.local');
  process.exit(1);
}

console.log(`Using model: ${model}`);
console.log(`Base URL: ${baseURL}`);
console.log(`API key: ${apiKey.slice(0, 12)}...${apiKey.slice(-6)}\n`);
const client = new OpenAI({
  apiKey,
  baseURL,
});

function stripThink(text) {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
}

// ─── Test 1: Article Summary ─────────────────────────────────────────────────
async function testArticleSummary() {
  console.log('━━━ Test 1: Article Summary ━━━');
  const systemPrompt = `You are a Senior AI Engineer classifying and summarising news articles for a developer-focused AI news site.

Instructions:
1. Classify the article into one category: llm, agents, models, research, tools, other
2. Rate relevance to LLM/AI practitioners on a 1-10 scale
3. Extract a structured summary

Respond with ONLY valid JSON in this exact format:
{
  "classification": "llm|agents|models|research|tools|other",
  "relevance_score": 1-10,
  "tldr": "One sentence of impact",
  "key_points": ["Point 1", "Point 2"],
  "tech_stack": ["Library or API mentioned"],
  "why_it_matters": "One line of practical impact for developers"
}`;

  const article = `Title: OpenAI releases GPT-5 with native tool use
OpenAI has announced GPT-5, featuring built-in function calling, 1M token context window, and improved reasoning. The model achieves 92% on HumanEval and supports multi-modal inputs. Pricing starts at $5/1M input tokens. Available via API immediately.`;

  const start = Date.now();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: article },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const raw = completion.choices[0]?.message?.content || '';
  const text = stripThink(raw);
  const elapsed = Date.now() - start;

  console.log(`⏱️  ${elapsed}ms`);
  console.log(`Provider: minimax (${model})`);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ Valid JSON response:');
    console.log(JSON.stringify(parsed, null, 2));
    return true;
  } catch (e) {
    console.log('❌ Failed to parse JSON. Raw output:');
    console.log(text);
    return false;
  }
}

// ─── Test 2: Workflow Suggestion ─────────────────────────────────────────────
async function testWorkflowSuggest() {
  console.log('\n━━━ Test 2: Workflow Suggestion ━━━');
  const systemPrompt = `You are an expert AI workflow advisor. Given the user's goal and a list of available AI tools, generate a comprehensive, structured workflow guide.

Return ONLY valid JSON matching this EXACT schema:
{
  "title": "Short, punchy title (max 50 chars)",
  "emoji": "A single emoji",
  "description": "1-2 sentence overview (max 200 chars)",
  "tools": [
    { "name": "Tool Name", "slug": "tool-slug", "role": "What this tool does", "isExternal": false, "url": null }
  ],
  "steps": [
    { "order": 1, "title": "Step title", "description": "What to do", "toolName": "Tool Name" }
  ],
  "tips": ["Practical tip with emoji prefix"],
  "promptTemplates": [{ "label": "Template label", "prompt": "Ready-to-use prompt" }],
  "pitfalls": ["Common mistake with emoji prefix"]
}

Rules:
- tools: 2-5 tools
- steps: 3-5 steps
- tips: 2-4 actionable tips
- promptTemplates: 1-3 ready-to-use prompts
- pitfalls: 1-3 common mistakes`;

  const userContent = `Goal: Build an AI-powered blog content pipeline

Available tools:
ChatGPT (slug: chatgpt, category: LLMs)
Claude (slug: claude, category: LLMs)
Midjourney (slug: midjourney, category: Image Generation)
Notion AI (slug: notion-ai, category: Productivity)
Grammarly (slug: grammarly, category: Productivity)

External tools are allowed.`;

  const start = Date.now();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const raw = completion.choices[0]?.message?.content || '';
  const text = stripThink(raw);
  const elapsed = Date.now() - start;

  console.log(`⏱️  ${elapsed}ms`);
  console.log(`Provider: minimax (${model})`);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    const valid = parsed.title && parsed.steps?.length > 0 && parsed.tools?.length > 0;
    if (valid) {
      console.log('✅ Valid workflow response:');
      console.log(`   Title: ${parsed.emoji} ${parsed.title}`);
      console.log(`   Tools: ${parsed.tools.map(t => t.name).join(', ')}`);
      console.log(`   Steps: ${parsed.steps.length}`);
      console.log(`   Tips: ${parsed.tips?.length || 0}`);
      console.log(`   Prompts: ${parsed.promptTemplates?.length || 0}`);
      console.log(`   Pitfalls: ${parsed.pitfalls?.length || 0}`);
    } else {
      console.log('⚠️  JSON parsed but missing required fields:');
      console.log(JSON.stringify(parsed, null, 2));
    }
    return valid;
  } catch (e) {
    console.log('❌ Failed to parse JSON. Raw output:');
    console.log(text);
    return false;
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔧 MiniMax M2.5 API Smoke Test\n');
  let pass = 0;
  let fail = 0;

  try {
    (await testArticleSummary()) ? pass++ : fail++;
  } catch (e) {
    console.log(`❌ Article Summary ERRORED: ${e.message}`);
    fail++;
  }

  try {
    (await testWorkflowSuggest()) ? pass++ : fail++;
  } catch (e) {
    console.log(`❌ Workflow Suggest ERRORED: ${e.message}`);
    fail++;
  }

  console.log(`\n━━━ Results: ${pass} passed, ${fail} failed ━━━`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
