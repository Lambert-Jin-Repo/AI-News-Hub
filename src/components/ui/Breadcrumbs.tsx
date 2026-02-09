import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6", className)}>
            <Link
                href="/"
                className="flex items-center hover:text-primary transition-colors"
                aria-label="Home"
            >
                <Home className="w-4 h-4" />
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="w-4 h-4 mx-1 text-gray-300 dark:text-gray-600" />
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-primary transition-colors font-medium"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-900 dark:text-white font-semibold truncate max-w-[200px] sm:max-w-xs">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
