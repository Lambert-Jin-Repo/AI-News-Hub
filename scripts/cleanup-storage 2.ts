#!/usr/bin/env npx tsx
/**
 * Storage Cleanup Script
 * 
 * This script performs two cleanup operations:
 * 1. Archives articles older than 90 days (sets is_archived = true)
 * 2. Deletes audio files from digests bucket older than 30 days
 * 
 * Run: npx tsx scripts/cleanup-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

// Environment validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SECRET_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

const ARTICLE_ARCHIVE_DAYS = 90;
const AUDIO_DELETE_DAYS = 30;
const DIGESTS_BUCKET = 'digests';

interface CleanupResult {
    articlesArchived: number;
    audioFilesDeleted: number;
    errors: string[];
}

async function archiveOldArticles(): Promise<{ count: number; error?: string }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ARTICLE_ARCHIVE_DAYS);

    console.log(`Archiving articles older than ${cutoffDate.toISOString()}...`);

    const { data, error } = await supabase
        .from('articles')
        .update({ is_archived: true })
        .lt('published_at', cutoffDate.toISOString())
        .eq('is_archived', false)
        .select('id');

    if (error) {
        return { count: 0, error: error.message };
    }

    return { count: data?.length ?? 0 };
}

async function deleteOldAudioFiles(): Promise<{ count: number; error?: string }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUDIO_DELETE_DAYS);

    console.log(`Deleting audio files older than ${cutoffDate.toISOString()}...`);

    try {
        // List all files in the digests bucket
        const { data: files, error: listError } = await supabase.storage
            .from(DIGESTS_BUCKET)
            .list('', { limit: 1000 });

        if (listError) {
            return { count: 0, error: listError.message };
        }

        if (!files || files.length === 0) {
            console.log('No audio files found in digests bucket');
            return { count: 0 };
        }

        // Filter files older than cutoff date
        const filesToDelete = files.filter((file) => {
            if (!file.created_at) return false;
            const fileDate = new Date(file.created_at);
            return fileDate < cutoffDate;
        });

        if (filesToDelete.length === 0) {
            console.log('No old audio files to delete');
            return { count: 0 };
        }

        // Delete old files
        const pathsToDelete = filesToDelete.map((file) => file.name);
        const { error: deleteError } = await supabase.storage
            .from(DIGESTS_BUCKET)
            .remove(pathsToDelete);

        if (deleteError) {
            return { count: 0, error: deleteError.message };
        }

        return { count: pathsToDelete.length };
    } catch (err) {
        return { count: 0, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

async function main(): Promise<void> {
    console.log('='.repeat(60));
    console.log('Storage Cleanup Script');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    const result: CleanupResult = {
        articlesArchived: 0,
        audioFilesDeleted: 0,
        errors: [],
    };

    // Archive old articles
    const articleResult = await archiveOldArticles();
    result.articlesArchived = articleResult.count;
    if (articleResult.error) {
        result.errors.push(`Article archival: ${articleResult.error}`);
    }
    console.log(`✓ Archived ${result.articlesArchived} articles`);

    // Delete old audio files
    const audioResult = await deleteOldAudioFiles();
    result.audioFilesDeleted = audioResult.count;
    if (audioResult.error) {
        result.errors.push(`Audio deletion: ${audioResult.error}`);
    }
    console.log(`✓ Deleted ${result.audioFilesDeleted} audio files`);

    // Summary
    console.log('='.repeat(60));
    console.log('Cleanup Summary:');
    console.log(`  Articles archived: ${result.articlesArchived}`);
    console.log(`  Audio files deleted: ${result.audioFilesDeleted}`);

    if (result.errors.length > 0) {
        console.log('\nErrors encountered:');
        result.errors.forEach((err) => console.log(`  - ${err}`));
        process.exit(1);
    }

    console.log('\n✓ Cleanup completed successfully');
    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
