"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fades [data-reveal] blocks in as they enter the window. Content is visible by default,
 * so nothing is hidden without JavaScript, and reduced motion skips the effect entirely.
 */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
      (node) => node.getBoundingClientRect().top > window.innerHeight,
    );
    if (nodes.length === 0) return;
    for (const node of nodes) node.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "shown";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const node of nodes) observer.observe(node);
    return () => {
      observer.disconnect();
      for (const node of nodes) node.dataset.reveal = "shown";
    };
  }, [pathname]);
  return null;
}
