# AI News Hub

<p align="center">
  <strong>Your daily AI briefing — automated news aggregation, LLM-powered summaries, and audio digests.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#maintenance">Maintenance</a> •
  <a href="#documentation">Documentation</a>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **News Aggregation** | Auto-fetches AI news from GNews API (2x/day) |
| **LLM Summaries** | Gemini 2.5 Flash generates structured summaries with classification |
| **Smart Classification** | Auto-categorizes: LLM, Agents, Models, Research, Tools |
| **Relevance Filtering** | Low-quality articles automatically skipped |
| **Daily Digests** | Sectioned briefings (The Big Picture, Key Releases, Worth Watching) |
| **Audio Briefings** | Google Cloud TTS podcast-style audio digests |
| **Tools Directory** | Curated AI tools with link health monitoring |
| **AI Workflows** | Curated multi-tool pipelines + AI-powered workflow suggestions |
| **Daily Word** | Daily AI/tech vocabulary with LLM-generated explanations |
| **Admin Dashboard** | LLM usage monitoring with Recharts (calls, latency, tokens, fallbacks) |

---

## Quick Start

```bash
# Clone
git clone https://github.com/Lambert-Jin-Repo/AI-News-Hub.git
cd AI-News-Hub

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your keys

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| LLM (default) | Gemini 2.5 Flash (summarise, digest, audio, daily word, tool discovery) |
| LLM (workflow) | MiniMax M2.5 (workflow suggestion only) |
| LLM (fallback) | Groq Llama 3.3 (last-resort for all chains) |
| TTS | Google Cloud Text-to-Speech (Standard-D, free tier) |
| Charts | Recharts (admin dashboard) |
| Hosting | Google Cloud Run (australia-southeast1) |
| CI/CD | GitHub Actions → Docker → Cloud Run |

---

## Deployment

### Automatic (Recommended)

Every `git push` to `main` triggers automatic deployment:

```bash
git push origin main
# Auto-deploys to Cloud Run via GitHub Actions
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `GCP_SA_KEY` | GCP service account JSON |
| `GCP_PROJECT_ID` | GCP project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `SUPABASE_SECRET_KEY` | Supabase service role key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GROQ_API_KEY` | Groq API key (fallback LLM) |
| `GNEWS_API_KEY` | GNews API key (news fetching) |
| `MINIMAX_API_KEY` | MiniMax API key (workflow suggest) |
| `MINIMAX_BASE_URL` | MiniMax endpoint URL |
| `CRON_SECRET` | Auth secret for CRON endpoints |

---

## Maintenance

Full guide: [docs/guides/maintenance.md](docs/guides/maintenance.md)

### Quick Reference

| Task | How |
|------|-----|
| **Deploy changes** | `git push origin main` |
| **Add RSS source** | Supabase → `sources` table |
| **Add AI tool** | Supabase → `tools` table |
| **View logs** | GCP Console → Cloud Run → Logs |
| **LLM usage** | `/admin/llm-usage` (admin login required) |
| **Force rebuild** | `git commit --allow-empty -m "rebuild" && git push` |

### Automated Jobs

| Job | Schedule (UTC) |
|-----|----------------|
| Fetch news | 22:00, 10:00 (6 AM / 6 PM AWST) |
| Summarise | 22:30, 10:30 (30 min after fetch) |
| Daily digest | 23:00 (7 AM AWST) |
| Daily word | 23:30 (7:30 AM AWST) |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key |
| `SUPABASE_SECRET_KEY` | Yes | Supabase service role key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (default LLM) |
| `GEMINI_MODEL` | No | Gemini model name (default: `gemini-2.5-flash`) |
| `MINIMAX_API_KEY` | No | MiniMax API key (workflow suggest) |
| `MINIMAX_BASE_URL` | No | MiniMax endpoint (default: `https://api.minimaxi.com/v1`) |
| `MINIMAX_MODEL` | No | MiniMax model (default: `MiniMax-M2.5`) |
| `GROQ_API_KEY` | No | Groq API key (fallback LLM) |
| `GNEWS_API_KEY` | Yes | GNews API key |
| `CRON_SECRET` | Yes | CRON endpoint auth |

---

## Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── api/
│   │   ├── jobs/                # CRON endpoints (fetch, summarise, digest, daily-word)
│   │   ├── admin/llm-usage/     # Admin API (usage stats)
│   │   ├── workflows/           # Workflow API (list, suggest)
│   │   └── ...                  # News, tools, health APIs
│   ├── admin/
│   │   ├── login/               # Admin login page
│   │   └── llm-usage/           # LLM usage dashboard (Recharts)
│   ├── news/                    # News feed + detail pages
│   ├── tools/                   # Tools directory + workflows
│   ├── digests/                 # Daily digests timeline
│   └── daily-words/             # Daily word page
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── cards/                   # NewsCard, ToolCard, DigestCard, WorkflowCard
│   ├── workflows/               # WorkflowShowcase, WorkflowPipeline
│   └── layout/                  # Header, Footer
├── lib/
│   ├── llm-client.ts            # Central LLM abstraction (dual chain)
│   ├── llm-logger.ts            # Async usage logging to Supabase
│   ├── prompts.ts               # All LLM prompts (provider-agnostic)
│   ├── summariser.ts            # Article classification + summarisation
│   ├── digest-generator.ts      # Daily digest + audio generation
│   ├── daily-word-generator.ts  # Daily vocabulary generation
│   ├── tool-discovery.ts        # Auto-discover tools from articles
│   ├── tts-client.ts            # Google Cloud TTS
│   ├── supabase.ts              # Supabase client + types
│   ├── supabase-server.ts       # Server-side Supabase (Route Handlers)
│   └── supabase-middleware.ts   # Proxy/middleware Supabase client
└── proxy.ts                     # Next.js 16 proxy (admin route protection)
```

---

## Cost

Designed for **~$0/month** (all free tiers):

- Cloud Run: min 0 instances, 256Mi, 1 max instance (no idle cost)
- Gemini 2.5 Flash: 250 RPD free tier (covers all default LLM tasks)
- MiniMax M2.5: Free Coding Plan (workflow suggest only)
- Groq: Free tier (fallback only)
- Google Cloud TTS: Standard-D voice (free tier, ~66K chars/mo)
- Supabase: Free tier (500MB database)
- 30-day article retention, 14-day audio retention

See [docs/architecture/cost-optimization.md](docs/architecture/cost-optimization.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Documentation Index](docs/README.md) | All docs in one place |
| [Maintenance Guide](docs/guides/maintenance.md) | Update & ops guide |
| [Cost Optimization](docs/architecture/cost-optimization.md) | Free-tier cost strategies |
| [Database Schema](docs/architecture/database-schema.md) | Table definitions and relationships |
| [Launch Checklist](docs/guides/launch-checklist.md) | Pre-launch verification |
| [Project Tracker](docs/planning/project-tracker.md) | Development progress |
| [Feature Roadmap](docs/planning/feature-update.md) | LLM provider architecture & automation roadmap |

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT
