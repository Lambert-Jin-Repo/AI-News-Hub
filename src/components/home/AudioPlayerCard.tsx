"use client";

import { useState, useRef, useEffect } from "react";
import { Headphones, Play, Pause } from "lucide-react";

interface AudioPlayerCardProps {
    digest: { audio_url?: string | null; audio_status?: string | null } | null;
}

export function AudioPlayerCard({ digest }: AudioPlayerCardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sync state when native audio controls are used
    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audioEl.addEventListener("play", handlePlay);
        audioEl.addEventListener("pause", handlePause);

        return () => {
            audioEl.removeEventListener("play", handlePlay);
            audioEl.removeEventListener("pause", handlePause);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    return (
        <div className="bg-[var(--surface)] text-[var(--foreground)] rounded-xl border border-[var(--border)] p-6 flex flex-col justify-between min-h-[220px] relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-xl"></div>
            <div>
                <div className="flex items-start justify-between mb-2">
                    <div className="bg-primary/10 p-2 rounded-md text-primary">
                        <Headphones className="w-5 h-5" />
                    </div>
                    {digest?.audio_status === "completed" && (
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Audio Ready
                        </span>
                    )}
                </div>
                <h3 className="text-lg font-bold mb-1">Today&apos;s Audio Briefing</h3>
                <p className="text-sm text-muted-foreground">
                    {digest?.audio_url
                        ? "Listen to the key highlights on the go."
                        : "Audio briefing not yet available."}
                </p>
            </div>

            <div className="flex items-center gap-4 mt-6">
                {digest?.audio_url ? (
                    <>
                        <audio ref={audioRef} className="hidden" src={digest.audio_url} preload="metadata" />
                        <button
                            onClick={togglePlay}
                            className="size-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#102220]"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 fill-current" />
                            ) : (
                                <Play className="w-6 h-6 fill-current translate-x-0.5" />
                            )}
                        </button>
                        <div className="flex items-center gap-1 h-8 flex-1">
                            {[15, 25, 10, 30, 18, 22, 12, 28].map((height, i) => (
                                <div
                                    key={i}
                                    className="waveform-bar"
                                    style={{
                                        animationDelay: `${i * 0.1}s`,
                                        height: `${height}px`,
                                        animationPlayState: isPlaying ? "running" : "paused",
                                    }}
                                ></div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            disabled
                            className="size-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center cursor-not-allowed"
                        >
                            <Play className="w-6 h-6 fill-current translate-x-0.5 opacity-50" />
                        </button>
                        <div className="flex items-center gap-1 h-8 flex-1 opacity-50">
                            {[15, 25, 10, 30, 18, 22, 12, 28].map((height, i) => (
                                <div
                                    key={i}
                                    className="waveform-bar"
                                    style={{
                                        animationDelay: `${i * 0.1}s`,
                                        height: `${height}px`,
                                        animationPlayState: "paused",
                                    }}
                                ></div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
