import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ChevronRight } from "lucide-react";
import { getSupabaseClient, type Workflow, type WorkflowStep } from "@/lib/supabase";
import { SafeImage } from "@/components/ui/SafeImage";
import { ToolCard } from "@/components/cards/ToolCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

interface ToolDetailProps {
  params: Promise<{ slug: string }>;
}

const pricingBadgeColors: Record<string, string> = {
  free: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  freemium:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

async function getToolBySlug(slug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("tools")
    .select(
      "id, name, slug, description, url, category, pricing_model, tags, logo_url, date_added"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return data;
}

async function getRelatedTools(toolId: string, category: string | null) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("tools")
    .select(
      "id, name, slug, description, url, category, pricing_model, tags, logo_url, date_added"
    )
    .eq("is_active", true)
    .neq("id", toolId)
    .order("date_added", { ascending: false, nullsFirst: false })
    .limit(4);

  if (category) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return data || [];
}

async function getWorkflowsContainingTool(toolSlug: string): Promise<Workflow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  // Query workflows where the steps JSONB array contains this tool slug
  const { data } = await supabase
    .from("workflows")
    .select("*")
    .eq("is_active", true)
    .contains("steps", [{ toolSlug }] as unknown as string);

  return (data as Workflow[]) || [];
}

export async function generateMetadata({ params }: ToolDetailProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    return { title: "Tool Not Found — AI News Hub" };
  }

  return {
    title: `${tool.name} — AI Tools Directory — AI News Hub`,
    description:
      tool.description || `Learn about ${tool.name} on AI News Hub.`,
  };
}

export default async function ToolDetailPage({ params }: ToolDetailProps) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const [relatedTools, toolWorkflows] = await Promise.all([
    getRelatedTools(tool.id, tool.category),
    getWorkflowsContainingTool(slug),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Tools", href: "/tools" }, { label: tool.name }]} className="mb-8" />

      {/* Tool header */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 shadow-soft mb-8">
        <div className="flex gap-5 items-start">
          {/* Logo */}
          <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {tool.logo_url ? (
              <SafeImage
                src={tool.logo_url}
                alt={`${tool.name} logo`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                fallbackSrc="/placeholders/tool-placeholder.svg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                {tool.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white mb-2">
              {tool.name}
            </h1>

            {/* Category and pricing badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {tool.category && (
                <span className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  {tool.category}
                </span>
              )}
              <span
                className={cn(
                  "text-xs font-bold px-3 py-1 rounded-full uppercase",
                  pricingBadgeColors[tool.pricing_model] || ""
                )}
              >
                {tool.pricing_model}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {tool.description && (
          <div className="mt-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {tool.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {tool.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Visit website button */}
        {tool.url && (
          <div className="mt-6">
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors no-underline"
            >
              Visit Website
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Used in Workflows */}
      {toolWorkflows.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#0d1b1a] dark:text-white mb-4">
            Used in Workflows
          </h2>
          <div className="space-y-3">
            {toolWorkflows.map((w) => (
              <Link
                key={w.id}
                href={`/tools/workflows/${w.slug}`}
                className="flex items-center justify-between gap-3 bg-[var(--surface)] rounded-xl p-4 shadow-soft hover:shadow-soft-hover transition-all border border-transparent hover:border-primary/20 group no-underline"
              >
                <div>
                  <h3 className="font-bold text-[#0d1b1a] dark:text-white group-hover:text-primary transition-colors text-sm">
                    {w.title}
                  </h3>
                  {w.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {w.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-[#0d1b1a] dark:text-white mb-4">
            Related Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedTools.map((related) => (
              <ToolCard
                key={related.id}
                name={related.name}
                slug={related.slug}
                description={related.description}
                url={related.url || "#"}
                category={related.category || "Uncategorized"}
                pricingModel={related.pricing_model}
                tags={related.tags || []}
                logoUrl={related.logo_url}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
