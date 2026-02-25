import { NextResponse } from 'next/server';
import { generateText } from '@/lib/llm-client';

// Revalidate this path every 24 hours (86400 seconds) to ensure it stays a 'Daily' terminology
export const revalidate = 86400;

const AI_TERMS = [
    "AI Agent",
    "Retrieval-Augmented Generation (RAG)",
    "Mixture of Experts (MoE)",
    "vibe_coding",
    "Zero-Shot Learning",
    "Few-Shot Prompting",
    "Vector Database",
    "Large Language Model (LLM)",
    "Chain of Thought (CoT)",
    "Constitutional AI",
    "Fine-Tuning",
    "Transformer Architecture",
    "Semantic Search",
    "Context Window",
    "Agentic Workflow",
    "Tool Use / Function Calling",
    "Prompt Engineering",
    "Model Weights"
];

function getDailyTerm(): string {
    // Use a predictable pseudo-random selection based on the current date
    // So multiple calls on the same day reliably request the same term
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % AI_TERMS.length;
    return AI_TERMS[index];
}

export async function GET() {
    const term = getDailyTerm();

    const prompt = `You are a hype-man educator explaining AI concepts. Define the term: "${term}". 
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

    try {
        const { text, provider } = await generateText(
            prompt,
            "Generate daily AI terminology card",
            { maxTokens: 400 } // Keep it short and snappy
        );

        return NextResponse.json({ term, content: text, provider });
    } catch (error) {
        console.error('Failed to generate daily terminology:', error);
        return NextResponse.json(
            { error: 'Failed to generate terminology' },
            { status: 500 }
        );
    }
}
