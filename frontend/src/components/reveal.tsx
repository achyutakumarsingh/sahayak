"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Fade + short upward slide when the element scrolls into view.
 *
 * The pending attribute is written after mount rather than during render, so
 * with JavaScript off the content is simply visible instead of stuck at
 * opacity 0. Reduced motion skips the animation entirely.
 */
export function Reveal({
  children,
  delay = 0,
  as,
  className,
}: {
  children: ReactNode;
  /** Stagger between siblings, in ms. */
  delay?: number;
  /** Render as something other than a div — "li" inside a list, for example. */
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    let settled = false;
    const show = () => {
      if (settled) return;
      settled = true;
      node.dataset.reveal = "in";
    };

    node.dataset.reveal = "pending";
    node.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(node);

    // Already on screen at mount: reveal on the next frame rather than waiting
    // for the observer, which will not fire for something that never crosses
    // the boundary.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      requestAnimationFrame(show);
    }

    // Last resort. If the observer never delivers — a background tab, a
    // browser that throttles it — content must not stay at opacity 0 forever.
    const failsafe = window.setTimeout(show, 1200 + delay);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [delay]);

  const Component = (as ?? "div") as ElementType;

  return (
    <Component ref={ref} className={cn(className)}>
      {children}
    </Component>
  );
}
