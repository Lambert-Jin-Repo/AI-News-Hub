import Link from "next/link";
import { Terminal, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
    return (
        <nav className="sticky top-0 z-50 w-full bg-[var(--surface)]/90 backdrop-blur-md border-b border-[#e7f3f2] dark:border-[#2A3E3C]">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <Terminal className="w-6 h-6" />
                    </div>
                    <h2 className="text-[#0d1b1a] dark:text-white text-xl font-bold tracking-tight">
                        AI News Hub
                    </h2>
                </Link>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        href="#"
                        className="text-[#0d1b1a] dark:text-gray-200 text-sm font-semibold hover:text-primary transition-colors"
                    >
                        Home
                    </Link>
                    <Link
                        href="#"
                        className="text-[#556966] dark:text-gray-300 text-sm font-medium hover:text-primary transition-colors"
                    >
                        News
                    </Link>
                    <Link
                        href="#"
                        className="text-[#556966] dark:text-gray-300 text-sm font-medium hover:text-primary transition-colors"
                    >
                        Tools
                    </Link>
                    <Link
                        href="#"
                        className="text-[#556966] dark:text-gray-300 text-sm font-medium hover:text-primary transition-colors"
                    >
                        About
                    </Link>
                </div>

                {/* Theme Toggle & CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <ThemeToggle />
                    <button className="flex items-center justify-center px-6 h-10 border border-primary text-primary hover:bg-primary hover:text-white rounded-full text-sm font-bold transition-all duration-300 cursor-pointer">
                        Subscribe
                    </button>
                </div>

                {/* Mobile Menu Icon */}
                <button className="md:hidden text-[#0d1b1a] dark:text-white">
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </nav>
    );
}
