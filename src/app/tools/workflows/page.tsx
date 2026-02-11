import { getSupabaseClient, type Workflow } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { WorkflowCard } from "@/components/cards/WorkflowCard";

export const revalidate = 3600;

export const metadata = {
  title: "AI Workflows — AI News Hub",
  description:
    "Curated AI tool workflows and pipelines. Learn how to combine tools like ChatGPT, Cursor, Sora, and more into productive workflows.",
};

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

  const allSlugs = new Set<string>();
  for (const w of workflows) {
    const steps = (w.steps || []) as { toolSlug: string }[];
    for (const step of steps) {
      allSlugs.add(step.toolSlug);
    }
  }

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

export default async function WorkflowsPage() {
  const { workflows, toolLogos } = await getWorkflowsWithLogos();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Tools", href: "/tools" },
          { label: "Workflows" },
        ]}
        className="mb-8"
      />

      <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white mb-2">
        AI Workflows
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Curated pipelines that combine AI tools into productive workflows.
      </p>

      {workflows.length === 0 ? (
        <p className="text-center py-12 text-gray-400">
          No workflows available yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((w) => (
            <WorkflowCard
              key={w.id}
              slug={w.slug}
              title={w.title}
              description={w.description}
              costCategory={w.cost_category}
              difficulty={w.difficulty}
              estimatedMinutes={w.estimated_minutes}
              steps={w.steps}
              toolLogos={toolLogos}
            />
          ))}
        </div>
      )}
    </main>
  );
}
