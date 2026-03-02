"use client";

import { useState } from "react";
import Link from "next/link";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { usePathname } from "next/navigation";
import { Terminal, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ParadigmSwitcher } from "@/components/ui/ParadigmSwitcher";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/tools", label: "Tools" },
  { href: "/digests", label: "Digests" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)]" style={{ background: `var(--surface)`, backdropFilter: `blur(var(--backdrop-blur, 12px))`, opacity: 0.95 }}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <Terminal className="w-6 h-6" />
          </div>
          <h2 className="text-[var(--foreground)] text-xl font-bold tracking-tight">
            AI News Hub
          </h2>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <TransitionLink
              key={link.label}
              href={link.href}
              className={
                isActive(link.href)
                  ? "text-[var(--foreground)] text-sm font-semibold hover:text-primary transition-colors"
                  : "text-[var(--muted-foreground)] text-sm font-medium hover:text-primary transition-colors"
              }
            >
              {link.label}
            </TransitionLink>
          ))}
        </div>

        {/* Desktop: Theme Toggle + Paradigm Switcher */}
        <div className="hidden md:flex items-center gap-2">
          <ParadigmSwitcher />
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[var(--foreground)] p-2 cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <TransitionLink
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={
                  isActive(link.href)
                    ? "block py-3 text-[var(--foreground)] font-semibold hover:text-primary transition-colors"
                    : "block py-3 text-[var(--muted-foreground)] font-medium hover:text-primary transition-colors"
                }
              >
                {link.label}
              </TransitionLink>
            ))}
            <div className="pt-3 border-t border-[var(--border)] flex items-center gap-3">
              <ParadigmSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
