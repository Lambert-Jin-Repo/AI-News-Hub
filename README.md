# AI News Hub

> Your daily AI briefing — aggregated news, LLM-powered summaries, and audio digests.

## Features

- **📰 Automated News Aggregation** — Fetches AI news from multiple RSS sources
- **🤖 LLM-Powered Summaries** — Gemini 2.0 Flash generates structured article summaries
- **🎯 Smart Classification** — Articles auto-classified into LLM, Agents, Models, Research, Tools
- **📊 Relevance Filtering** — Low-relevance articles automatically skipped
- **📝 Daily Digests** — Sectioned briefings with The Big Picture, Key Releases, Worth Watching
- **🎧 Audio Briefings** — TTS-generated podcast-style audio via Google Cloud
- **🔧 AI Tools Directory** — Curated collection of AI tools with link health monitoring

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **LLM**: Gemini 2.0 Flash (primary), Groq (fallback)
- **TTS**: Google Cloud Text-to-Speech
- **Hosting**: Google Cloud Run
- **CDN**: Cloudflare
- **CI/CD**: GitHub Actions

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `SUPABASE_SECRET_KEY` | Yes | Supabase service role key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `CRON_SECRET` | Yes | Secret for protecting CRON endpoints |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | Path to GCP service account JSON |
| `GROQ_API_KEY` | No | Fallback LLM provider |
| `GNEWS_API_KEY` | No | Additional news source |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/jobs/           # CRON job endpoints
│   ├── news/               # News feed pages
│   └── tools/              # AI tools directory
├── components/             # React components
├── lib/                    # Core utilities
│   ├── summariser.ts       # Article classification & summarization
│   ├── digest-generator.ts # Daily digest generation
│   ├── llm-client.ts       # LLM provider abstraction
│   └── tts-client.ts       # Text-to-speech
└── __tests__/              # Test suites
```

## Cost Optimization

This project is designed to run on **~$0.80/month**:

- CRON: Fetch 2×/day, summarise every 2h
- Article limit: 20/day max
- TTS: Standard voice (free tier)
- Retention: 30 days articles, 14 days audio

See `docs/COST_OPTIMIZATION.md` for details.

## Documentation

- `IMPLEMENTATION_PLANS.md` — Detailed phase-by-phase development plans
- `PROJECT_TRACKER.md` — Task assignments and progress
- `docs/COST_OPTIMIZATION.md` — Cost reduction strategies
- `AI_News_Hub_RPD_v2.2.md` — Product requirements document

## License

MIT
