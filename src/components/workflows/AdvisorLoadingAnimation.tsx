"use client";

import "./advisor-loading.css";

/**
 * A fun CSS-animated loading component showing two little robots
 * battling it out while the AI generates the workflow.
 */
export function AdvisorLoadingAnimation() {
    return (
        <div className="flex flex-col items-center py-8 select-none">
            {/* Arena */}
            <div className="relative w-64 h-36 mb-4">
                {/* Ground line */}
                <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gray-200 dark:bg-gray-700 rounded-full" />

                {/* Left robot */}
                <div className="absolute bottom-2 left-6 robot-left">
                    <div className="flex flex-col items-center">
                        {/* Punch effect */}
                        <div className="punch-right text-lg absolute -right-6 top-2 opacity-0">💥</div>
                        {/* Body */}
                        <div className="text-4xl robot-bounce-left">🤖</div>
                        <span className="text-[10px] font-bold text-primary mt-1 uppercase tracking-wider">MiniMax</span>
                    </div>
                </div>

                {/* Sparks in center */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sparks-pulse">
                    <div className="flex gap-1">
                        <span className="text-sm spark-1">⚡</span>
                        <span className="text-lg spark-2">💫</span>
                        <span className="text-sm spark-3">✨</span>
                    </div>
                </div>

                {/* Right robot */}
                <div className="absolute bottom-2 right-6 robot-right">
                    <div className="flex flex-col items-center">
                        {/* Punch effect */}
                        <div className="punch-left text-lg absolute -left-6 top-2 opacity-0">💥</div>
                        {/* Body */}
                        <div className="text-4xl robot-bounce-right">🧠</div>
                        <span className="text-[10px] font-bold text-amber-500 mt-1 uppercase tracking-wider">Ideas</span>
                    </div>
                </div>

                {/* Flying bits */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flying-bits">
                    <div className="flex gap-3">
                        <span className="text-xs bit-float-1">⚙️</span>
                        <span className="text-xs bit-float-2">🔧</span>
                        <span className="text-xs bit-float-3">💡</span>
                    </div>
                </div>
            </div>

            {/* Status text */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="loading-text font-medium">AI is crafting your workflow</span>
                <span className="loading-dots">...</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center max-w-xs">
                🚀 Our Agent API is experiencing high traffic — this may take 10-20 seconds. Hang tight!
            </p>
        </div>
    );
}
