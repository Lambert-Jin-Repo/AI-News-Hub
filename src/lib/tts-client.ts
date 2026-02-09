import textToSpeech from '@google-cloud/text-to-speech';
import { preprocessForTTS } from './tts-preprocessor';

type TTSClient = InstanceType<typeof textToSpeech.TextToSpeechClient>;

// Lazy-initialized client to avoid crash on import when credentials missing
let _client: TTSClient | null = null;

function getClient(): TTSClient {
    if (!_client) {
        _client = new textToSpeech.TextToSpeechClient();
    }
    return _client;
}

export interface TTSResult {
    audioBuffer: Buffer;
    contentType: string;
}

/**
 * Generate speech audio from text using Google Cloud TTS.
 * Uses Standard voice (free tier: 1M chars/month).
 * 
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to
 * a GCP service account JSON file with Text-to-Speech API enabled.
 */
export async function generateSpeech(text: string): Promise<TTSResult> {
    // Pre-process text for better TTS output
    const processedText = preprocessForTTS(text);

    const client = getClient();
    const [response] = await client.synthesizeSpeech({
        input: { text: processedText },
        voice: {
            languageCode: 'en-US',
            name: 'en-US-Standard-D', // Male voice, good for news
            ssmlGender: 'MALE',
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0,
        },
    });

    if (!response.audioContent) {
        throw new Error('TTS returned no audio content');
    }

    const audioBuffer = Buffer.isBuffer(response.audioContent)
        ? response.audioContent
        : Buffer.from(response.audioContent);

    return {
        audioBuffer,
        contentType: 'audio/mpeg',
    };
}
