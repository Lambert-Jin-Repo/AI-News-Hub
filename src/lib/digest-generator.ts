import { generateText } from './llm-client';
import { DAILY_DIGEST_PROMPT, AUDIO_SCRIPT_PROMPT, buildDailyDigestInput, buildAudioScriptInput } from './prompts';
import { generateSpeech } from './tts-client';
import { getAdminClient } from './supabase';
import { ON_TOPIC_CATEGORIES } from './constants';

export interface DigestResult {
    digestId: string | null;
    summaryText: string | null;
    audioUrl: string | null;
    articleCount: number;
    skipped?: boolean;
}

/**
 * Generate the daily "Today in AI" digest.
 * 1. Fetch top on-topic articles from the last 24 hours (expand to 48h if low volume)
 * 2. Generate sectioned summary via LLM
 * 3. Generate podcast-style audio script via LLM
 * 4. Generate audio via TTS
 * 5. Upload audio to Supabase Storage
 * 6. Insert record into daily_digests table
 */
export async function generateDailyDigest(): Promise<DigestResult> {
    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if digest already exists for today
    const { data: existing } = await supabase
        .from('daily_digests')
        .select('id')
        .eq('digest_date', today)
        .single();

    if (existing) {
        throw new Error(`Digest already exists for ${today}`);
    }

    // Fetch on-topic articles from last 24 hours with completed summaries
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, ai_summary, source, published_at, category')
        .eq('summary_status', 'completed')
        .in('category', ON_TOPIC_CATEGORIES)
        .or(`published_at.gte.${yesterday},and(published_at.is.null,fetched_at.gte.${yesterday})`)
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(10);

    if (fetchError) {
        throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    // Low-volume handling: expand lookback to 48h
    if (!articles || articles.length < 3) {
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: expandedArticles } = await supabase
            .from('articles')
            .select('id, title, ai_summary, source, published_at, category')
            .eq('summary_status', 'completed')
            .in('category', ON_TOPIC_CATEGORIES)
            .or(`published_at.gte.${twoDaysAgo},and(published_at.is.null,fetched_at.gte.${twoDaysAgo})`)
            .order('published_at', { ascending: false, nullsFirst: false })
            .limit(10);

        if (!expandedArticles || expandedArticles.length < 3) {
            // Skip digest for today — not enough content
            return { digestId: null, summaryText: null, audioUrl: null, articleCount: 0, skipped: true };
        }
        articles = expandedArticles;
    }

    // Generate sectioned summary
    const digestInput = buildDailyDigestInput(articles);
    const llmResponse = await generateText(DAILY_DIGEST_PROMPT, digestInput);
    const summaryText = llmResponse.text;

    // Insert digest first (with pending audio status)
    const { data: digest, error: insertError } = await supabase
        .from('daily_digests')
        .insert({
            digest_date: today,
            summary_text: summaryText,
            audio_status: 'pending',
            article_ids: articles.map((a) => a.id),
        })
        .select('id')
        .single();

    if (insertError || !digest) {
        throw new Error(`Failed to create digest: ${insertError?.message}`);
    }

    // Generate TTS audio using podcast-style script
    let audioUrl: string | null = null;
    try {
        // Generate conversational podcast script for TTS (separate from written digest)
        const audioScriptInput = buildAudioScriptInput(summaryText);
        const audioScriptResponse = await generateText(AUDIO_SCRIPT_PROMPT, audioScriptInput);
        const audioScript = audioScriptResponse.text;

        // Use audioScript (not summaryText) for TTS
        const { audioBuffer, contentType } = await generateSpeech(audioScript);

        // Upload to Supabase Storage
        const fileName = `digest-${today}.mp3`;
        const { error: uploadError } = await supabase.storage
            .from('digests')
            .upload(fileName, audioBuffer, {
                contentType,
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('digests')
            .getPublicUrl(fileName);

        audioUrl = urlData.publicUrl;

        // Update digest with audio URL
        await supabase
            .from('daily_digests')
            .update({ audio_url: audioUrl, audio_status: 'completed' })
            .eq('id', digest.id);
    } catch (audioError) {
        console.error('TTS generation failed:', audioError);
        // Update audio status to failed
        await supabase
            .from('daily_digests')
            .update({ audio_status: 'failed' })
            .eq('id', digest.id);
    }

    return {
        digestId: digest.id,
        summaryText,
        audioUrl,
        articleCount: articles.length,
    };
}

/**
 * Retry TTS generation for a digest that has text but failed audio.
 */
export async function retryDigestAudio(digestId: string): Promise<string | null> {
    const supabase = getAdminClient();

    const { data: digest, error } = await supabase
        .from('daily_digests')
        .select('digest_date, summary_text, audio_status')
        .eq('id', digestId)
        .single();

    if (error || !digest) {
        throw new Error(`Digest not found: ${digestId}`);
    }

    if (digest.audio_status === 'completed') {
        throw new Error('Audio already generated for this digest');
    }

    if (!digest.summary_text) {
        throw new Error('No summary text available for TTS');
    }

    // Generate podcast script for retry too
    const audioScriptInput = buildAudioScriptInput(digest.summary_text);
    const audioScriptResponse = await generateText(AUDIO_SCRIPT_PROMPT, audioScriptInput);
    const audioScript = audioScriptResponse.text;

    const { audioBuffer, contentType } = await generateSpeech(audioScript);
    const fileName = `digest-${digest.digest_date}.mp3`;

    const { error: uploadError } = await supabase.storage
        .from('digests')
        .upload(fileName, audioBuffer, {
            contentType,
            upsert: true,
        });

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('digests')
        .getPublicUrl(fileName);

    await supabase
        .from('daily_digests')
        .update({ audio_url: urlData.publicUrl, audio_status: 'completed' })
        .eq('id', digestId);

    return urlData.publicUrl;
}
