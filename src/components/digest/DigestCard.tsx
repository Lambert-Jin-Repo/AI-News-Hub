"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DigestCardProps {
    date: string;
    summaryText: string;
    audioUrl?: string | null;
    className?: string;
}

export function DigestCard({
    date,
    summaryText,
    audioUrl,
    className,
}: DigestCardProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Format date for display
    const displayDate = new Date(date).toLocaleDateString("en-AU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Handle play/pause
    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            setIsLoading(true);
            audioRef.current.play();
        }
    };

    // Handle mute
    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !audioRef.current.muted;
        setIsMuted(!isMuted);
    };

    // Handle audio events
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => {
            setIsPlaying(true);
            setIsLoading(false);
        };
        const onPause = () => setIsPlaying(false);
        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };
        const onTimeUpdate = () => {
            setProgress((audio.currentTime / audio.duration) * 100 || 0);
            setCurrentTime(audio.currentTime);
        };
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
        };
        const onWaiting = () => setIsLoading(true);
        const onCanPlay = () => setIsLoading(false);

        audio.addEventListener("play", onPlay);
        audio.addEventListener("pause", onPause);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("waiting", onWaiting);
        audio.addEventListener("canplay", onCanPlay);

        return () => {
            audio.removeEventListener("play", onPlay);
            audio.removeEventListener("pause", onPause);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("waiting", onWaiting);
            audio.removeEventListener("canplay", onCanPlay);
        };
    }, []);

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div
            className={cn(
                "bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-[#0d1b1a] dark:text-white">
                        Today in AI
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {displayDate}
                    </p>
                </div>
                {audioUrl && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            🎧 Audio Available
                        </span>
                    </div>
                )}
            </div>

            {/* Summary Text */}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 line-clamp-4">
                {summaryText}
            </p>

            {/* Audio Player */}
            {audioUrl && (
                <div className="bg-[var(--surface)] rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <audio ref={audioRef} src={audioUrl} preload="metadata" />

                    <div className="flex items-center gap-4">
                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            disabled={isLoading}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isPlaying ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5 ml-0.5" />
                            )}
                        </button>

                        {/* Progress Bar */}
                        <div className="flex-1">
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-100"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>
                                    {formatTime(currentTime)}
                                </span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Mute Button */}
                        <button
                            onClick={toggleMute}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            {isMuted ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
