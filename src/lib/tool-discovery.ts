/**
 * AI-powered tool discovery service.
 *
 * Uses MiniMax M2.5 (via the existing LLM client) to discover
 * trending AI tools across 8+ categories, categorise them, and
 * upsert them into the Supabase `tools` table.
 */

import { generateText } from './llm-client';
import {
    TOOL_DISCOVERY_PROMPT,
    TOOL_CATEGORY_PROMPT,
    buildToolDiscoveryInput,
} from './prompts';
import { getAdminClient } from './supabase';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveredTool {
    name: string;
    description: string;
    url: string;
    pricing_model: 'free' | 'freemium' | 'paid';
    tags: string[];
}

export interface CategorisedTool extends DiscoveredTool {
    category: string;
}

export interface DiscoveryResult {
    discovered: number;
    inserted: number;
    updated: number;
    deactivated: number;
    errors: string[];
}

// Valid pricing values
const VALID_PRICING = new Set(['free', 'freemium', 'paid']);

// Tag added to all auto-discovered tools so they can be managed separately
const DISCOVERY_TAG = 'ai-discovered';
const TRENDING_TAG = 'trending';

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Step 1: Discover tools via LLM
// ---------------------------------------------------------------------------

/**
 * Ask MiniMax to discover 20-30 trending AI tools.
 * Existing tool names are passed so the LLM avoids duplicates.
 */
export async function discoverTools(existingToolNames: string[]): Promise<DiscoveredTool[]> {
    const userContent = buildToolDiscoveryInput(existingToolNames);

    const result = await generateText(TOOL_DISCOVERY_PROMPT, userContent, {
        maxTokens: 4096,
    });

    // Extract JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Tool discovery returned non-JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed.tools) || parsed.tools.length === 0) {
        throw new Error('Tool discovery returned empty tools array');
    }

    // Validate and clean each tool
    const tools: DiscoveredTool[] = [];
    for (const raw of parsed.tools) {
        if (!raw.name || !raw.url) continue;

        const pricing = VALID_PRICING.has(raw.pricing_model) ? raw.pricing_model : 'freemium';

        tools.push({
            name: String(raw.name).trim(),
            description: String(raw.description || '').trim().slice(0, 200),
            url: String(raw.url).trim(),
            pricing_model: pricing as 'free' | 'freemium' | 'paid',
            tags: Array.isArray(raw.tags)
                ? raw.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
                : [],
        });
    }

    logger.info('Tool discovery completed', {
        provider: result.provider,
        rawCount: parsed.tools.length,
        validCount: tools.length,
    });

    return tools;
}

// ---------------------------------------------------------------------------
// Step 2: Categorise tools via LLM
// ---------------------------------------------------------------------------

/**
 * Use MiniMax to assign each tool a category from the fixed taxonomy.
 */
export async function categorizeTools(tools: DiscoveredTool[]): Promise<CategorisedTool[]> {
    const toolSummary = tools
        .map((t) => `- ${t.name}: ${t.description}`)
        .join('\n');

    const result = await generateText(TOOL_CATEGORY_PROMPT, toolSummary, {
        maxTokens: 2048,
    });

    // Extract JSON
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        logger.warn('Category assignment returned non-JSON, using fallback categories');
        return tools.map((t) => ({ ...t, category: 'Productivity' }));
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const categoryMap = new Map<string, string>();

    if (Array.isArray(parsed.categorised)) {
        for (const item of parsed.categorised) {
            if (item.name && item.category) {
                categoryMap.set(String(item.name).toLowerCase(), String(item.category));
            }
        }
    }

    return tools.map((tool) => ({
        ...tool,
        category: categoryMap.get(tool.name.toLowerCase()) || 'Productivity',
    }));
}

// ---------------------------------------------------------------------------
// Step 3: Upsert to Supabase
// ---------------------------------------------------------------------------

/**
 * Soft-delete old auto-discovered tools, then upsert new ones.
 *
 * - Deactivates existing tools tagged with `ai-discovered`
 * - Inserts new tools or updates existing ones matched by URL
 * - All new tools are tagged with `ai-discovered` and `trending`
 */
export async function upsertDiscoveredTools(tools: CategorisedTool[]): Promise<DiscoveryResult> {
    const admin = getAdminClient();
    const errors: string[] = [];

    // Step 3a: Deactivate old auto-discovered tools
    const { data: oldTools, error: fetchError } = await admin
        .from('tools')
        .select('id')
        .eq('is_active', true)
        .contains('tags', [DISCOVERY_TAG]);

    if (fetchError) {
        logger.warn('Failed to fetch old discovered tools', { error: fetchError.message });
    }

    let deactivated = 0;
    if (oldTools && oldTools.length > 0) {
        const oldIds = oldTools.map((t) => t.id);
        const { error: deactivateError } = await admin
            .from('tools')
            .update({ is_active: false })
            .in('id', oldIds);

        if (deactivateError) {
            errors.push(`Deactivation failed: ${deactivateError.message}`);
        } else {
            deactivated = oldIds.length;
        }
    }

    // Step 3b: Upsert new tools
    let inserted = 0;
    let updated = 0;

    for (const tool of tools) {
        const slug = toSlug(tool.name);
        const tags = [...new Set([DISCOVERY_TAG, TRENDING_TAG, ...tool.tags])];

        // Check if tool already exists by URL (to avoid re-inserting manually curated tools)
        const { data: existing } = await admin
            .from('tools')
            .select('id, tags')
            .eq('url', tool.url)
            .limit(1);

        if (existing && existing.length > 0) {
            // Update existing tool — re-activate and refresh data
            const existingTags: string[] = existing[0].tags || [];
            const mergedTags = [...new Set([...existingTags, DISCOVERY_TAG, TRENDING_TAG])];

            const { error: updateError } = await admin
                .from('tools')
                .update({
                    description: tool.description,
                    category: tool.category,
                    pricing_model: tool.pricing_model,
                    tags: mergedTags,
                    is_active: true,
                    date_added: new Date().toISOString(),
                })
                .eq('id', existing[0].id);

            if (updateError) {
                errors.push(`Update failed for ${tool.name}: ${updateError.message}`);
            } else {
                updated++;
            }
        } else {
            // Insert new tool
            const { error: insertError } = await admin
                .from('tools')
                .insert({
                    name: tool.name,
                    slug,
                    description: tool.description,
                    url: tool.url,
                    category: tool.category,
                    pricing_model: tool.pricing_model,
                    tags,
                    is_active: true,
                    date_added: new Date().toISOString(),
                });

            if (insertError) {
                // Slug conflict — try with a unique suffix
                if (insertError.code === '23505') {
                    const uniqueSlug = `${slug}-${Date.now().toString(36).slice(-4)}`;
                    const { error: retryError } = await admin
                        .from('tools')
                        .insert({
                            name: tool.name,
                            slug: uniqueSlug,
                            description: tool.description,
                            url: tool.url,
                            category: tool.category,
                            pricing_model: tool.pricing_model,
                            tags,
                            is_active: true,
                            date_added: new Date().toISOString(),
                        });

                    if (retryError) {
                        errors.push(`Insert failed for ${tool.name}: ${retryError.message}`);
                    } else {
                        inserted++;
                    }
                } else {
                    errors.push(`Insert failed for ${tool.name}: ${insertError.message}`);
                }
            } else {
                inserted++;
            }
        }
    }

    logger.info('Tool upsert completed', { inserted, updated, deactivated, errors: errors.length });

    return {
        discovered: tools.length,
        inserted,
        updated,
        deactivated,
        errors,
    };
}

// ---------------------------------------------------------------------------
// Full pipeline
// ---------------------------------------------------------------------------

/**
 * Run the complete tool discovery pipeline:
 * 1. Fetch existing tool names from DB
 * 2. Discover new tools via MiniMax
 * 3. Categorise them via MiniMax
 * 4. Upsert to Supabase
 */
export async function runToolDiscovery(): Promise<DiscoveryResult> {
    const admin = getAdminClient();

    // Get existing tool names for deduplication
    const { data: existingTools } = await admin
        .from('tools')
        .select('name')
        .eq('is_active', true);

    const existingNames = (existingTools || []).map((t) => t.name);

    // Step 1: Discover
    const rawTools = await discoverTools(existingNames);

    // Step 2: Categorise
    const categorised = await categorizeTools(rawTools);

    // Step 3: Upsert
    return upsertDiscoveredTools(categorised);
}
