import { generateText } from './llm-client';
import { DAILY_DIGEST_PROMPT, buildDailyDigestInput } from './prompts';
import { generateSpeech } from './tts-client';
import { getAdminClient } from './supabase';

export interface DigestResult {
    digestId: string;
    summaryText: string;
    audioUrl: string | null;
    articleCount: number;
}

/**
 * Generate the daily "Today in AI" digest.
 * 1. Fetch top articles from the last 24 hours
 * 2. Generate narrative summary via LLM
 * 3. Generate audio via TTS
 * 4. Upload audio to Supabase Storage
 * 5. Insert record into daily_digests table
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

    // Fetch top articles from last 24 hours with completed summaries
    // Use published_at for freshness (with null check), fallback to fetched_at
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, ai_summary, source, published_at')
        .eq('summary_status', 'completed')
        .or(`published_at.gte.${yesterday},and(published_at.is.null,fetched_at.gte.${yesterday})`)
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(10);

    if (fetchError) {
        throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    if (!articles || articles.length === 0) {
        throw new Error('No summarised articles available for digest');
    }

    // Generate narrative summary
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

    // Generate TTS audio
    let audioUrl: string | null = null;
    try {
        const { audioBuffer, contentType } = await generateSpeech(summaryText);

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

    const { audioBuffer, contentType } = await generateSpeech(digest.summary_text);
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
