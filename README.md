# AI News Hub

<p align="center">
  <strong>Your daily AI briefing — automated news aggregation, LLM-powered summaries, and audio digests.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#maintenance">Maintenance</a> •
  <a href="#documentation">Documentation</a>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| 📰 **News Aggregation** | Auto-fetches AI news from RSS sources (2×/day) |
| 🤖 **LLM Summaries** | Gemini 2.0 Flash generates structured summaries |
| 🎯 **Smart Classification** | Auto-categorizes: LLM, Agents, Models, Research, Tools |
| 📊 **Relevance Filtering** | Low-quality articles automatically skipped |
| 📝 **Daily Digests** | Sectioned briefings (The Big Picture, Key Releases, Worth Watching) |
| 🎧 **Audio Briefings** | TTS-generated podcast-style audio |
| 🔧 **Tools Directory** | Curated AI tools with link health monitoring |

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
| LLM | MiniMax M2.5 (primary), Groq (fallback) |
| TTS | Google Cloud Text-to-Speech |
| Hosting | Google Cloud Run |
| CI/CD | GitHub Actions |

---

## Deployment

### Automatic (Recommended)

Every `git push` to `main` triggers automatic deployment:

```bash
git add -A
git commit -m "your changes"
git push origin main
# ✅ Auto-deploys to Cloud Run
```

### Manual

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for manual deployment steps.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `GCP_SA_KEY` | GCP service account JSON |
| `GCP_PROJECT_ID` | GCP project ID |
| `CRON_SECRET` | Auth secret for CRON endpoints |

---

## Maintenance

📖 **Full guide:** [MAINTENANCE.md](MAINTENANCE.md)

### Quick Reference

| Task | How |
|------|-----|
| **Deploy changes** | `git push origin main` |
| **Add RSS source** | Supabase → `sources` table |
| **Add AI tool** | Supabase → `tools` table |
| **View logs** | GCP Console → Cloud Run → Logs |
| **Force rebuild** | `git commit --allow-empty -m "rebuild" && git push` |

### Automated Jobs

| Job | Schedule (UTC) |
|-----|----------------|
| Fetch news | 22:00, 10:00 (6 AM / 6 PM AWST) |
| Summarise | 22:30, 10:30 (30 min after fetch) |
| Daily digest | 23:00 (7 AM AWST) |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SECRET_KEY` | ✅ | Supabase service role key |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `CRON_SECRET` | ✅ | CRON endpoint auth |
| `GROQ_API_KEY` | ❌ | Fallback LLM |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/jobs/           # CRON endpoints
│   ├── news/               # News feed
│   └── tools/              # Tools directory
├── components/             # React components
├── lib/                    # Core utilities
│   ├── summariser.ts       # LLM classification
│   ├── digest-generator.ts # Daily digest
│   └── tts-client.ts       # Audio generation
└── __tests__/              # Tests
```

---

## Cost

Designed for **~$0.80/month**:

- ✅ Cloud Run: min 0 instances (no idle cost)
- ✅ 256Mi memory, 1 max instance
- ✅ Article limit: 20/day
- ✅ TTS: Standard voice (free tier)
- ✅ Retention: 30 days articles, 14 days audio

See [docs/COST_OPTIMIZATION.md](docs/COST_OPTIMIZATION.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Documentation Index](docs/README.md) | All docs in one place |
| [Maintenance Guide](docs/guides/maintenance.md) | Update & ops guide |
| [Cost Optimization](docs/architecture/cost-optimization.md) | Free-tier cost strategies |
| [Launch Checklist](docs/guides/launch-checklist.md) | Pre-launch verification |
| [Project Tracker](docs/planning/project-tracker.md) | Development progress |
| [Feature Roadmap](docs/planning/feature-update.md) | MiniMax migration & AI automation |

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
