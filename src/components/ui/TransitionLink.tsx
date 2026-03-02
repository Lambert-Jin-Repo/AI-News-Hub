"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

type TransitionLinkProps = ComponentProps<typeof Link>;

export function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    const url = typeof href === "string" ? href : href.pathname ?? "/";

    if ("startViewTransition" in document) {
      (document as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        router.push(url);
      });
    } else {
      router.push(url);
    }
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
