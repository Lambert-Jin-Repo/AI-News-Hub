"use client";

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

            <style jsx>{`
                /* Robot bounce animations */
                .robot-bounce-left {
                    animation: bounceLeft 0.8s ease-in-out infinite alternate;
                }
                .robot-bounce-right {
                    animation: bounceRight 0.8s ease-in-out infinite alternate;
                }

                @keyframes bounceLeft {
                    0% { transform: translateX(0) rotate(-5deg); }
                    100% { transform: translateX(14px) rotate(10deg); }
                }
                @keyframes bounceRight {
                    0% { transform: translateX(0) rotate(5deg); }
                    100% { transform: translateX(-14px) rotate(-10deg); }
                }

                /* Punch effects */
                .punch-right {
                    animation: punchFlash 0.8s ease-in-out infinite;
                }
                .punch-left {
                    animation: punchFlash 0.8s ease-in-out 0.4s infinite;
                }

                @keyframes punchFlash {
                    0%, 40%, 100% { opacity: 0; transform: scale(0.5); }
                    50%, 70% { opacity: 1; transform: scale(1.2); }
                }

                /* Center sparks */
                .sparks-pulse {
                    animation: sparksGlow 1.6s ease-in-out infinite;
                }
                @keyframes sparksGlow {
                    0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(0.8); }
                    50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
                }

                .spark-1 { animation: sparkBounce 0.6s ease infinite alternate; }
                .spark-2 { animation: sparkBounce 0.6s ease 0.2s infinite alternate; }
                .spark-3 { animation: sparkBounce 0.6s ease 0.4s infinite alternate; }

                @keyframes sparkBounce {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-8px); }
                }

                /* Flying bits float upward */
                .bit-float-1 { animation: floatUp 2s ease-in-out infinite; }
                .bit-float-2 { animation: floatUp 2s ease-in-out 0.5s infinite; }
                .bit-float-3 { animation: floatUp 2s ease-in-out 1s infinite; }

                @keyframes floatUp {
                    0%   { opacity: 0; transform: translateY(20px) rotate(0deg); }
                    30%  { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-30px) rotate(180deg); }
                }

                /* Loading dots animation */
                .loading-dots {
                    animation: dotsFlicker 1.5s steps(4) infinite;
                    display: inline-block;
                    width: 1.5em;
                    text-align: left;
                    overflow: hidden;
                    vertical-align: bottom;
                }

                @keyframes dotsFlicker {
                    0%   { width: 0; }
                    25%  { width: 0.5em; }
                    50%  { width: 1em; }
                    75%  { width: 1.5em; }
                    100% { width: 0; }
                }
            `}</style>
        </div>
    );
}
