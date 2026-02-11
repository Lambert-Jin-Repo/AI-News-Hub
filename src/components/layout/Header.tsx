"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                isActive(link.href)
                  ? "text-[#0d1b1a] dark:text-gray-200 text-sm font-semibold hover:text-primary transition-colors"
                  : "text-[#556966] dark:text-gray-300 text-sm font-medium hover:text-primary transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop: Theme Toggle */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#0d1b1a] dark:text-white p-2 cursor-pointer"
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
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-[var(--surface)]">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={
                  isActive(link.href)
                    ? "block py-3 text-[#0d1b1a] dark:text-white font-semibold hover:text-primary transition-colors"
                    : "block py-3 text-[#556966] dark:text-gray-300 font-medium hover:text-primary transition-colors"
                }
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
