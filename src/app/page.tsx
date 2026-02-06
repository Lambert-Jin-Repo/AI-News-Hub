import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/cards/NewsCard";
import {
  PlayCircle,
  Share2,
  Headphones,
  Play,
  ArrowRight,
  FileText,
  Hammer,
  Mail,
  Bot,
  Cpu,
  Brain,
  Gavel,
  Code,
  ShieldAlert,
} from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      <Header />

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hero Left: Daily Briefing */}
          <div className="lg:col-span-8 bg-surface-light dark:bg-surface-dark rounded-[16px] shadow-soft p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                <div className="pulse-dot"></div>
                <span className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                  Live Updates
                </span>
              </div>
              <span className="text-[#4c9a93] text-sm font-medium">
                October 24, 2023
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0d1b1a] dark:text-white leading-[1.15] mb-6">
              Your Daily <span className="text-primary">AI Briefing</span>
            </h1>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-4">
              <p className="text-lg leading-relaxed">
                Today&apos;s top story involves a significant leap in multimodal
                models. Major labs have released benchmarks showing a 40%
                efficiency gain in reasoning tasks, signaling a shift away from
                pure parameter scaling towards architectural optimization.
              </p>
              <p className="text-base leading-relaxed opacity-90">
                In regulatory news, the EU AI Act continues to spark debate over
                open-source liabilities, while Silicon Valley sees a surge in
                &apos;vertical AI&apos; startups focusing on legal and medical
                applications.
              </p>
              <p className="text-base leading-relaxed opacity-90">
                Meanwhile, hardware constraints are easing as new dedicated
                inference chips hit the market, potentially lowering the cost of
                running LLMs locally by half within the next quarter.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all cursor-pointer">
                <PlayCircle className="w-5 h-5" />
                Read Full Digest
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>

          {/* Hero Right: Audio & Featured */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Audio Player Card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-[16px] shadow-soft p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    12:45 MIN
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0d1b1a] dark:text-white mb-1">
                  Today&apos;s Audio Briefing
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Listen to the key highlights on the go.
                </p>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <button className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/25 hover:scale-105 transition-transform cursor-pointer">
                  <Play className="w-6 h-6 fill-current" />
                </button>
                <div className="flex items-center gap-1 h-8 flex-1">
                  <div
                    className="waveform-bar"
                    style={{ animationDelay: "0.1s", height: "15px" }}
                  ></div>
                  <div
                    className="waveform-bar"
                    style={{ animationDelay: "0.3s", height: "25px" }}
                  ></div>
                  <div
                    className="waveform-bar"
                    style={{ animationDelay: "0.5s", height: "10px" }}
                  ></div>
                  <div
                    className="waveform-bar"
                    style={{ animationDelay: "0.2s", height: "30px" }}
                  ></div>
                  <div
                    className="waveform-bar"
                    style={{ animationDelay: "0.4s", height: "18px" }}
                  ></div>
                  <div
                    className="waveform-bar"
                    style={{ animationDelay: "0.1s", height: "22px" }}
                  ></div>
                  <div
                    className="waveform-bar"
                    style={{ animationDelay: "0.6s", height: "12px" }}
                  ></div>
                  <div
                    className="waveform-bar"
                    style={{ animationDelay: "0.3s", height: "28px" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Featured Tool Card */}
            <div className="bg-[#102220] rounded-[16px] shadow-soft p-6 flex flex-col justify-center relative overflow-hidden group cursor-pointer">
              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 size-32 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-full backdrop-blur-sm border border-white/5">
                    FEATURED
                  </span>
                  <ArrowRight className="text-primary w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Browse AI Tools
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Discover the latest productivity apps and models.
                </p>
                <div className="flex -space-x-3">
                  {/* Avatars would go here, using placeholders for now */}
                  <div className="size-8 rounded-full border-2 border-[#102220] bg-gray-500"></div>
                  <div className="size-8 rounded-full border-2 border-[#102220] bg-gray-400"></div>
                  <div className="size-8 rounded-full border-2 border-[#102220] bg-gray-300"></div>
                  <div className="size-8 rounded-full border-2 border-[#102220] bg-gray-700 text-white text-[10px] font-bold flex items-center justify-center">
                    +45
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-[16px] shadow-soft py-6 px-8 flex flex-col md:flex-row justify-around items-center gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
          <div className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start">
            <div className="p-3 bg-accent/10 rounded-full text-accent">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d1b1a] dark:text-white">
                150+
              </p>
              <p className="text-sm font-medium text-gray-500">
                Articles Scanned
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start pt-6 md:pt-0">
            <div className="p-3 bg-accent/10 rounded-full text-accent">
              <Hammer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d1b1a] dark:text-white">
                45+
              </p>
              <p className="text-sm font-medium text-gray-500">
                New AI Tools
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 w-full md:w-auto justify-center md:justify-start pt-6 md:pt-0">
            <div className="p-3 bg-accent/10 rounded-full text-accent">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0d1b1a] dark:text-white">
                7
              </p>
              <p className="text-sm font-medium text-gray-500">
                Daily Briefings
              </p>
            </div>
          </div>
        </div>

        {/* Latest Headlines */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0d1b1a] dark:text-white">
              Latest Headlines
            </h2>
            <a
              href="#"
              className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              View Archive
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NewsCard
              source="TechCrunch"
              timeAgo="2h ago"
              title="OpenAI Announces GPT-5 Developer Preview"
              description="The new model promises enhanced reasoning capabilities and reduced hallucination rates for enterprise applications."
              icon={<Bot className="w-8 h-8 text-indigo-500" />}
              iconBgInfo="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700"
            />
            <NewsCard
              source="Wired"
              timeAgo="4h ago"
              title="Nvidia Unveils Next-Gen Inference Chip"
              description="The H200 chip aims to slash LLM running costs by 50% while doubling memory bandwidth for larger models."
              icon={<Cpu className="w-8 h-8 text-emerald-500" />}
              iconBgInfo="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700"
            />
            <NewsCard
              source="The Verge"
              timeAgo="5h ago"
              title="DeepMind Solves Protein Folding Anomaly"
              description="AlphaFold 3 cracks a decades-old biological problem, potentially accelerating drug discovery for rare diseases."
              icon={<Brain className="w-8 h-8 text-purple-500" />}
              iconBgInfo="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700"
            />
            <NewsCard
              source="Reuters"
              timeAgo="6h ago"
              title="EU AI Act Enters Final Negotiation Phase"
              description="Lawmakers debate stringent requirements for foundational models and exemptions for open-source research."
              icon={<Gavel className="w-8 h-8 text-orange-500" />}
              iconBgInfo="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-700"
            />
            <NewsCard
              source="GitHub Blog"
              timeAgo="8h ago"
              title="Copilot X Adds Voice Coding Features"
              description="Developers can now control their IDE entirely through voice commands, a boon for accessibility."
              icon={<Code className="w-8 h-8 text-cyan-500" />}
              iconBgInfo="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700"
            />
            <NewsCard
              source="Ars Technica"
              timeAgo="10h ago"
              title="Prompt Injection Vulnerability Found"
              description="Researchers demonstrate how hidden text on websites can manipulate AI assistants into leaking private data."
              icon={<ShieldAlert className="w-8 h-8 text-rose-500" />}
              iconBgInfo="bg-gradient-to-br from-rose-50 to-red-50 dark:from-gray-800 dark:to-gray-700"
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
