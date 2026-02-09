import { supabase } from "@/lib/supabase";
import { DEFAULTS } from "@/lib/constants";
import { ToolsFeed } from "./tools-feed";

export const revalidate = 3600;

export const metadata = {
  title: "AI Tools Directory — AI News Hub",
  description:
    "Discover and compare the latest AI tools across categories like LLMs, image generation, code assistants, and more.",
};

async function getInitialTools() {
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
  const { data } = await supabase
    .from("tools")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null);

  if (!data) return [];
  const unique = [...new Set(data.map((r) => r.category as string))];
  return unique.sort();
}

export default async function ToolsPage() {
  const [tools, categories] = await Promise.all([
    getInitialTools(),
    getCategories(),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#0d1b1a] dark:text-white">
        AI Tools Directory
      </h1>
      <ToolsFeed initialTools={tools} categories={categories} />
    </main>
  );
}
