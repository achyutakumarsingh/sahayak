"use client";

import { useEffect } from "react";

const SELECTOR = "[data-glow]";

/**
 * Mounted once in the layout. Tracks the cursor over any element carrying
 * data-glow and writes its local position to --mouse-x / --mouse-y; the visual
 * itself lives in globals.css. One document listener rather than a hook per
 * component, so Card and Button stay server components and ship no JS.
 *
 * When the glow is off (coarse pointer, reduced motion) the CSS falls back to
 * a centred gradient, so hover still reads correctly without any tracking.
 */
export function PointerGlow() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let active: HTMLElement | null = null;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;
    let frame = 0;

    const clear = (el: HTMLElement | null) => {
      el?.style.removeProperty("--mouse-x");
      el?.style.removeProperty("--mouse-y");
    };

    const flush = () => {
      frame = 0;
      if (!pending) return;
      const { el, x, y } = pending;
      pending = null;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", `${x - rect.left}px`);
      el.style.setProperty("--mouse-y", `${y - rect.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      // Touch and pen would leave a glow stranded after the gesture ends.
      if (event.pointerType !== "mouse") return;

      const el = event.target as Element | null;
      const target =
        el && typeof el.closest === "function"
          ? (el.closest(SELECTOR) as HTMLElement | null)
          : null;

      if (target !== active) {
        clear(active);
        active = target;
      }

      // Reduced motion: no tracking at all. CSS swaps the radial light for a
      // flat tint, so nothing follows the cursor.
      if (!target || reduced.matches) return;

      pending = { el: target, x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      clear(active);
      active = null;
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (frame) cancelAnimationFrame(frame);
      clear(active);
    };
  }, []);

  return null;
}
