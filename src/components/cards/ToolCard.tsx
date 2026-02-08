import { ExternalLink } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

export type PricingModel = "free" | "freemium" | "paid";

export interface ToolCardProps {
  name: string;
  description: string | null;
  url: string;
  category: string;
  pricingModel: PricingModel;
  tags: string[];
  logoUrl: string | null;
  className?: string;
}

const pricingBadgeColors: Record<PricingModel, string> = {
  free: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  freemium:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export function ToolCard({
  name,
  description,
  url,
  category,
  pricingModel,
  tags,
  logoUrl,
  className,
}: ToolCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block bg-[var(--surface)] rounded-2xl p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 border border-transparent hover:border-primary/20 group no-underline",
        className
      )}
    >
      <div className="flex gap-4">
        {/* Logo */}
        <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          {logoUrl ? (
            <SafeImage
              src={logoUrl}
              alt={`${name} logo`}
              width={64}
              height={64}
              className="object-cover"
              fallbackSrc="/placeholders/tool-placeholder.svg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
              {name.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[#0d1b1a] dark:text-white group-hover:text-primary transition-colors truncate">
              {name}
            </h3>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary shrink-0 mt-0.5" />
          </div>

          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {category}
            </span>
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full uppercase",
                pricingBadgeColors[pricingModel]
              )}
            >
              {pricingModel}
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
