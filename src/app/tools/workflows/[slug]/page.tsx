import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";
import { getSupabaseClient, type Workflow, type WorkflowStep } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

interface WorkflowDetailProps {
  params: Promise<{ slug: string }>;
}

const costColors = {
  free: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const difficultyColors = {
  beginner: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  intermediate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

async function getWorkflowBySlug(slug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("workflows")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return data as Workflow | null;
}

async function getToolDetails(slugs: string[]) {
  const supabase = getSupabaseClient();
  if (!supabase || slugs.length === 0) return {};

  const { data } = await supabase
    .from("tools")
    .select("slug, name, logo_url, url, category, description")
    .in("slug", slugs);

  const map: Record<string, {
    name: string;
    logo_url: string | null;
    url: string | null;
    category: string | null;
    description: string | null;
  }> = {};

  if (data) {
    for (const t of data) {
      if (t.slug) map[t.slug] = t;
    }
  }

  return map;
}

export async function generateMetadata({ params }: WorkflowDetailProps) {
  const { slug } = await params;
  const workflow = await getWorkflowBySlug(slug);

  if (!workflow) {
    return { title: "Workflow Not Found — AI News Hub" };
  }

  return {
    title: `${workflow.title} Workflow — AI News Hub`,
    description: workflow.description || `Step-by-step AI workflow: ${workflow.title}`,
  };
}

export default async function WorkflowDetailPage({ params }: WorkflowDetailProps) {
  const { slug } = await params;
  const workflow = await getWorkflowBySlug(slug);

  if (!workflow) {
    notFound();
  }

  const steps = (workflow.steps || []) as WorkflowStep[];
  const toolSlugs = steps.map(s => s.toolSlug);
  const toolDetails = await getToolDetails(toolSlugs);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Tools", href: "/tools" },
          { label: "Workflows", href: "/tools/workflows" },
          { label: workflow.title },
        ]}
        className="mb-8"
      />

      {/* Header card */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 shadow-soft mb-8">
        <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white mb-2">
          {workflow.title}
        </h1>

        {workflow.description && (
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {workflow.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={cn("text-xs font-bold px-3 py-1 rounded-full uppercase", costColors[workflow.cost_category])}>
            {workflow.cost_category}
          </span>
          <span className={cn("text-xs font-bold px-3 py-1 rounded-full uppercase", difficultyColors[workflow.difficulty])}>
            {workflow.difficulty}
          </span>
          {workflow.estimated_minutes && (
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{workflow.estimated_minutes} min
            </span>
          )}
          <span className="text-sm text-gray-400">
            {steps.length} steps
          </span>
        </div>
      </div>

      {/* Vertical stepper */}
      <section>
        <h2 className="text-xl font-bold text-[#0d1b1a] dark:text-white mb-6">
          Steps
        </h2>
        <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-4 pl-8 space-y-8">
          {steps.map((step) => {
            const tool = toolDetails[step.toolSlug];
            return (
              <div key={step.order} className="relative">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute -left-[41px] top-2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 shadow-sm",
                  step.isOptional
                    ? "bg-gray-300 dark:bg-gray-600"
                    : "bg-primary"
                )} />

                {/* Step number */}
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Step {step.order}
                  {step.isOptional && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">(Optional)</span>
                  )}
                </p>

                {/* Step card */}
                <div className={cn(
                  "bg-[var(--surface)] rounded-xl p-4 shadow-soft border border-transparent",
                  step.isOptional && "opacity-75 border-dashed border-gray-200 dark:border-gray-700"
                )}>
                  <div className="flex gap-4 items-start">
                    {/* Tool logo */}
                    <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {tool?.logo_url ? (
                        <SafeImage
                          src={tool.logo_url}
                          alt={tool.name || step.label}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover"
                          fallbackSrc="/placeholders/tool-placeholder.svg"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-400">
                          {step.label.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#0d1b1a] dark:text-white">
                          {step.label}
                        </h3>
                        {tool && (
                          <span className="text-xs text-gray-400">
                            using {tool.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {step.description}
                      </p>

                      {/* Link to tool */}
                      <div className="mt-3">
                        <Link
                          href={`/tools/${step.toolSlug}`}
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline no-underline"
                        >
                          View {tool?.name || step.toolSlug}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
