"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = "/placeholders/news-placeholder.svg",
  className,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
          className
        )}
      >
        <Image
          src={fallbackSrc}
          alt={alt}
          className="opacity-50"
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
        />
      )}
      <Image
        src={src}
        alt={alt}
        className={cn(className, !loaded && "opacity-0")}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
}
