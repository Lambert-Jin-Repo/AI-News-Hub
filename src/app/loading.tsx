import { Terminal } from "lucide-react";

export default function HomeLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]">
      <div className="loading-fade-in flex flex-col items-center gap-5">
        {/* Logo with spinner ring */}
        <div className="relative flex items-center justify-center size-20">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
            <Terminal className="w-6 h-6" />
          </div>
        </div>

        {/* Brand name */}
        <p className="text-lg font-bold text-[var(--foreground)] tracking-tight">
          AI News Hub
        </p>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5">
          <span className="loading-dot" />
          <span className="loading-dot" style={{ animationDelay: "0.16s" }} />
          <span className="loading-dot" style={{ animationDelay: "0.32s" }} />
        </div>
      </div>
    </div>
  );
}
