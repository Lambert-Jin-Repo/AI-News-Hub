"use client";

import { useState, useCallback } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, []);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5" />
          Share
        </>
      )}
    </button>
  );
}
