-- 007: Seed AI tools directory with 50+ real tools
-- Categories: LLM / Chat, Image Generation, Code Assistant, Audio / Video, Productivity, Research / Data

INSERT INTO tools (name, slug, description, url, category, pricing_model, tags) VALUES

-- ============================================================================
-- LLM / Chat
-- ============================================================================
('ChatGPT', 'chatgpt', 'OpenAI''s conversational AI assistant powered by GPT-4o and later models.', 'https://chat.openai.com', 'LLM / Chat', 'freemium', ARRAY['chatbot', 'writing', 'reasoning']),
('Claude', 'claude', 'Anthropic''s AI assistant focused on safety, helpfulness, and long-context understanding.', 'https://claude.ai', 'LLM / Chat', 'freemium', ARRAY['chatbot', 'writing', 'analysis']),
('Gemini', 'gemini', 'Google DeepMind''s multimodal AI model with search integration and long context.', 'https://gemini.google.com', 'LLM / Chat', 'freemium', ARRAY['chatbot', 'multimodal', 'search']),
('Perplexity', 'perplexity', 'AI-powered search engine that provides cited, conversational answers.', 'https://perplexity.ai', 'LLM / Chat', 'freemium', ARRAY['search', 'research', 'citations']),
('Mistral AI', 'mistral-ai', 'European AI lab offering open-weight and commercial LLMs for enterprise use.', 'https://mistral.ai', 'LLM / Chat', 'freemium', ARRAY['open-source', 'enterprise', 'multilingual']),
('Meta Llama', 'meta-llama', 'Meta''s open-source large language model family available for research and commercial use.', 'https://llama.meta.com', 'LLM / Chat', 'free', ARRAY['open-source', 'research', 'self-hosted']),
('DeepSeek', 'deepseek', 'Chinese AI lab producing competitive open-source models with strong reasoning capabilities.', 'https://deepseek.com', 'LLM / Chat', 'freemium', ARRAY['open-source', 'reasoning', 'coding']),
('Microsoft Copilot', 'microsoft-copilot', 'AI assistant integrated across Microsoft 365, Windows, and Edge browser.', 'https://copilot.microsoft.com', 'LLM / Chat', 'freemium', ARRAY['productivity', 'office', 'search']),
('Grok', 'grok', 'xAI''s conversational model with real-time access to X (Twitter) data.', 'https://grok.x.ai', 'LLM / Chat', 'freemium', ARRAY['chatbot', 'social-media', 'real-time']),
('Pi', 'pi', 'Inflection AI''s personal AI designed for empathetic, helpful conversations.', 'https://pi.ai', 'LLM / Chat', 'free', ARRAY['chatbot', 'personal', 'conversational']),

-- ============================================================================
-- Image Generation
-- ============================================================================
('Midjourney', 'midjourney', 'AI image generation tool known for high-quality artistic and photorealistic outputs.', 'https://midjourney.com', 'Image Generation', 'paid', ARRAY['art', 'design', 'creative']),
('DALL-E', 'dall-e', 'OpenAI''s image generation model capable of creating and editing images from text prompts.', 'https://openai.com/dall-e-3', 'Image Generation', 'freemium', ARRAY['art', 'design', 'editing']),
('Stable Diffusion', 'stable-diffusion', 'Open-source image generation model by Stability AI, runnable locally.', 'https://stability.ai', 'Image Generation', 'free', ARRAY['open-source', 'self-hosted', 'art']),
('Leonardo AI', 'leonardo-ai', 'AI platform for generating production-quality visual assets for games and creative projects.', 'https://leonardo.ai', 'Image Generation', 'freemium', ARRAY['gaming', 'design', 'creative']),
('Adobe Firefly', 'adobe-firefly', 'Adobe''s generative AI tools integrated into Creative Cloud for commercial-safe image creation.', 'https://firefly.adobe.com', 'Image Generation', 'freemium', ARRAY['design', 'commercial', 'editing']),
('Ideogram', 'ideogram', 'AI image generator with strong text rendering capabilities in generated images.', 'https://ideogram.ai', 'Image Generation', 'freemium', ARRAY['text-rendering', 'design', 'creative']),
('Flux', 'flux', 'Black Forest Labs'' open-source image generation model with high fidelity outputs.', 'https://blackforestlabs.ai', 'Image Generation', 'free', ARRAY['open-source', 'art', 'high-fidelity']),

-- ============================================================================
-- Code Assistants
-- ============================================================================
('GitHub Copilot', 'github-copilot', 'AI pair programmer that suggests code completions and entire functions in your IDE.', 'https://github.com/features/copilot', 'Code Assistant', 'paid', ARRAY['coding', 'autocomplete', 'ide']),
('Cursor', 'cursor', 'AI-first code editor built on VS Code with deep model integration for code generation.', 'https://cursor.com', 'Code Assistant', 'freemium', ARRAY['editor', 'coding', 'refactoring']),
('Claude Code', 'claude-code', 'Anthropic''s agentic CLI coding tool for autonomous software engineering tasks.', 'https://docs.anthropic.com/en/docs/claude-code', 'Code Assistant', 'paid', ARRAY['cli', 'agentic', 'coding']),
('Cody', 'cody', 'Sourcegraph''s AI coding assistant with codebase-aware context and multi-repo support.', 'https://sourcegraph.com/cody', 'Code Assistant', 'freemium', ARRAY['coding', 'context', 'search']),
('Tabnine', 'tabnine', 'AI code completion tool that runs locally or in the cloud with privacy-focused design.', 'https://tabnine.com', 'Code Assistant', 'freemium', ARRAY['autocomplete', 'privacy', 'ide']),
('Windsurf', 'windsurf', 'AI-powered IDE by Codeium with agentic flows for code understanding and generation.', 'https://codeium.com/windsurf', 'Code Assistant', 'freemium', ARRAY['editor', 'agentic', 'coding']),
('Replit AI', 'replit-ai', 'AI coding features built into Replit''s collaborative online IDE.', 'https://replit.com', 'Code Assistant', 'freemium', ARRAY['cloud-ide', 'collaboration', 'prototyping']),
('Bolt.new', 'bolt-new', 'AI-powered full-stack web app builder that generates and deploys applications from prompts.', 'https://bolt.new', 'Code Assistant', 'freemium', ARRAY['web-dev', 'deployment', 'no-code']),

-- ============================================================================
-- Audio / Video
-- ============================================================================
('ElevenLabs', 'elevenlabs', 'AI voice synthesis platform for realistic text-to-speech and voice cloning.', 'https://elevenlabs.io', 'Audio / Video', 'freemium', ARRAY['tts', 'voice-cloning', 'audio']),
('Runway', 'runway', 'AI creative platform for video generation, editing, and visual effects.', 'https://runwayml.com', 'Audio / Video', 'freemium', ARRAY['video', 'editing', 'creative']),
('Synthesia', 'synthesia', 'AI video generation platform that creates presenter-led videos from text scripts.', 'https://synthesia.io', 'Audio / Video', 'paid', ARRAY['video', 'avatars', 'enterprise']),
('Descript', 'descript', 'All-in-one audio and video editor with AI transcription and text-based editing.', 'https://descript.com', 'Audio / Video', 'freemium', ARRAY['editing', 'transcription', 'podcasting']),
('Suno', 'suno', 'AI music generation platform that creates songs with vocals from text prompts.', 'https://suno.com', 'Audio / Video', 'freemium', ARRAY['music', 'creative', 'generation']),
('Udio', 'udio', 'AI music creation tool producing high-quality, genre-diverse audio tracks.', 'https://udio.com', 'Audio / Video', 'freemium', ARRAY['music', 'creative', 'generation']),
('HeyGen', 'heygen', 'AI video generation with customisable avatars for marketing and training content.', 'https://heygen.com', 'Audio / Video', 'freemium', ARRAY['video', 'avatars', 'marketing']),
('Luma Dream Machine', 'luma-dream-machine', 'AI video generation model creating high-quality, realistic video clips from text and images.', 'https://lumalabs.ai', 'Audio / Video', 'freemium', ARRAY['video', '3d', 'generation']),

-- ============================================================================
-- Productivity
-- ============================================================================
('Notion AI', 'notion-ai', 'AI features integrated into Notion for writing, summarising, and organising notes.', 'https://notion.so/product/ai', 'Productivity', 'paid', ARRAY['writing', 'notes', 'workspace']),
('Jasper', 'jasper', 'AI marketing platform for generating brand-consistent content at scale.', 'https://jasper.ai', 'Productivity', 'paid', ARRAY['marketing', 'copywriting', 'brand']),
('Copy.ai', 'copy-ai', 'AI copywriting tool for generating marketing copy, emails, and social media content.', 'https://copy.ai', 'Productivity', 'freemium', ARRAY['copywriting', 'marketing', 'automation']),
('Otter.ai', 'otter-ai', 'AI meeting assistant that transcribes, summarises, and extracts action items from conversations.', 'https://otter.ai', 'Productivity', 'freemium', ARRAY['transcription', 'meetings', 'notes']),
('Grammarly', 'grammarly', 'AI writing assistant for grammar, clarity, tone, and style improvements.', 'https://grammarly.com', 'Productivity', 'freemium', ARRAY['writing', 'grammar', 'editing']),
('Gamma', 'gamma', 'AI-powered presentation and document builder that creates slides from text prompts.', 'https://gamma.app', 'Productivity', 'freemium', ARRAY['presentations', 'slides', 'design']),
('Tome', 'tome', 'AI storytelling tool for creating presentations and narratives from prompts.', 'https://tome.app', 'Productivity', 'freemium', ARRAY['presentations', 'storytelling', 'design']),
('Mem', 'mem', 'AI-powered note-taking app that self-organises and surfaces relevant information.', 'https://mem.ai', 'Productivity', 'freemium', ARRAY['notes', 'organisation', 'search']),
('Reclaim.ai', 'reclaim-ai', 'AI scheduling assistant that automatically optimises your calendar and protects focus time.', 'https://reclaim.ai', 'Productivity', 'freemium', ARRAY['calendar', 'scheduling', 'productivity']),

-- ============================================================================
-- Research / Data
-- ============================================================================
('Elicit', 'elicit', 'AI research assistant that helps find, summarise, and extract data from academic papers.', 'https://elicit.com', 'Research / Data', 'freemium', ARRAY['research', 'papers', 'analysis']),
('Consensus', 'consensus', 'AI-powered academic search engine that extracts findings from scientific papers.', 'https://consensus.app', 'Research / Data', 'freemium', ARRAY['research', 'science', 'citations']),
('Semantic Scholar', 'semantic-scholar', 'AI-powered research tool by AI2 for finding and understanding scientific literature.', 'https://semanticscholar.org', 'Research / Data', 'free', ARRAY['research', 'papers', 'open-access']),
('NotebookLM', 'notebooklm', 'Google''s AI research notebook that generates insights and audio overviews from uploaded documents.', 'https://notebooklm.google.com', 'Research / Data', 'free', ARRAY['research', 'documents', 'audio']),
('Wolfram Alpha', 'wolfram-alpha', 'Computational knowledge engine for mathematics, science, and data analysis.', 'https://wolframalpha.com', 'Research / Data', 'freemium', ARRAY['math', 'computation', 'data']),
('Scite', 'scite', 'AI citation analysis tool showing how papers have been cited — supported, contrasted, or mentioned.', 'https://scite.ai', 'Research / Data', 'paid', ARRAY['citations', 'research', 'analysis']),
('Connected Papers', 'connected-papers', 'Visual tool for exploring academic paper connections and building literature graphs.', 'https://connectedpapers.com', 'Research / Data', 'freemium', ARRAY['research', 'visualisation', 'papers']),
('Julius AI', 'julius-ai', 'AI data analyst that generates charts, runs statistics, and answers questions about your data.', 'https://julius.ai', 'Research / Data', 'freemium', ARRAY['data-analysis', 'charts', 'statistics'])

ON CONFLICT DO NOTHING;
