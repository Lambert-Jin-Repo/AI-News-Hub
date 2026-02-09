"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps extends Omit<ImageProps, "onError" | "loading"> {
  fallbackSrc?: string;
  /** Image loading strategy: 'lazy' (default) or 'eager' */
  loading?: "lazy" | "eager";
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = "/placeholders/news-placeholder.svg",
  className,
  loading = "lazy",
  priority = false,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Priority images should not use loading="lazy"
  const effectiveLoading = priority ? undefined : loading;

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
          className
        )}
        role="img"
        aria-label={alt}
      >
        <Image
          src={fallbackSrc}
          alt={alt}
          className="opacity-50"
          loading={effectiveLoading}
          priority={priority}
          {...props}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {!loaded && (
        <div
          className={cn(
            "absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-inherit",
            className
          )}
          aria-hidden="true"
        />
      )}
      <Image
        src={src}
        alt={alt}
        className={cn(className, !loaded && "opacity-0")}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading={effectiveLoading}
        priority={priority}
        {...props}
      />
    </div>
  );
}

