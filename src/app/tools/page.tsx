import { getSupabaseClient } from "@/lib/supabase";
import { DEFAULTS } from "@/lib/constants";
import { ToolsFeed } from "./tools-feed";
import { WorkflowShowcase } from "@/components/workflows/WorkflowShowcase";

export const revalidate = 3600; // 1 hour — tools change infrequently

export const metadata = {
  title: "AI Tools Directory — AI News Hub",
  description:
    "Discover and compare the latest AI tools across categories like LLMs, image generation, code assistants, and more.",
};

async function getInitialTools() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("tools")
    .select(
      "id, name, slug, description, url, category, pricing_model, tags, logo_url, date_added"
    )
    .eq("is_active", true)
    .order("date_added", { ascending: false, nullsFirst: false })
    .limit(DEFAULTS.TOOLS_PER_PAGE);

  return data || [];
}

async function getCategories() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("tools")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null);

  if (!data) return [];
  const unique = [...new Set(data.map((r) => r.category as string))];
  return unique.sort();
}

async function getToolLogos(): Promise<Record<string, string | null>> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  const { data } = await supabase
    .from("tools")
    .select("slug, logo_url")
    .eq("is_active", true);

  const logos: Record<string, string | null> = {};
  if (data) {
    for (const t of data) {
      if (t.slug) logos[t.slug] = t.logo_url;
    }
  }
  return logos;
}

export default async function ToolsPage() {
  const [tools, categories, toolLogos] = await Promise.all([
    getInitialTools(),
    getCategories(),
    getToolLogos(),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white mb-6">
        AI Tools Directory
      </h1>
      <WorkflowShowcase toolLogos={toolLogos} />
      <ToolsFeed initialTools={tools} categories={categories} />
    </main>
  );
}
