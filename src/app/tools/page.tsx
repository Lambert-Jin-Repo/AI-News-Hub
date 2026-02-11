import { getSupabaseClient, type Workflow } from "@/lib/supabase";
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

async function getWorkflowsWithLogos(): Promise<{
  workflows: Workflow[];
  toolLogos: Record<string, string | null>;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) return { workflows: [], toolLogos: {} };

  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (!workflows || workflows.length === 0) return { workflows: [], toolLogos: {} };

  // Collect all unique tool slugs from workflow steps
  const allSlugs = new Set<string>();
  for (const w of workflows) {
    const steps = (w.steps || []) as { toolSlug: string }[];
    for (const step of steps) {
      allSlugs.add(step.toolSlug);
    }
  }

  // Fetch logos for all referenced tools in a single query
  const toolLogos: Record<string, string | null> = {};
  if (allSlugs.size > 0) {
    const { data: tools } = await supabase
      .from("tools")
      .select("slug, logo_url")
      .in("slug", [...allSlugs]);

    if (tools) {
      for (const t of tools) {
        if (t.slug) toolLogos[t.slug] = t.logo_url;
      }
    }
  }

  return { workflows: workflows as Workflow[], toolLogos };
}

export default async function ToolsPage() {
  const [tools, categories, { workflows, toolLogos }] = await Promise.all([
    getInitialTools(),
    getCategories(),
    getWorkflowsWithLogos(),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white mb-6">
        AI Tools Directory
      </h1>
      <WorkflowShowcase workflows={workflows} toolLogos={toolLogos} />
      <ToolsFeed initialTools={tools} categories={categories} />
    </main>
  );
}
