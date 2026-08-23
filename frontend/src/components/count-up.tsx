"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 420;

/** Ease-out cubic — fast at the start, settles without overshooting. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Counts from zero to `value` the first time a number is shown. Later changes
 * to `value` are rendered directly — a counter that re-animates every poll
 * reads as a glitch rather than as life.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const animated = useRef(false);

  useEffect(() => {
    let frame = 0;
    let start = 0;

    // Everything happens inside rAF: nothing sets state synchronously in the
    // effect body, and the first painted value still matches what the server
    // rendered.
    const step = (now: number) => {
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / DURATION);
      setShown(Math.round(easeOut(progress) * value));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame((now) => {
      const skip =
        animated.current ||
        value <= 0 ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      animated.current = true;

      if (skip) {
        setShown(value);
        return;
      }
      step(now);
    });

    return () => cancelAnimationFrame(frame);
  }, [value]);

  // The final value is always in the accessibility tree, so a screen reader
  // never reads out the intermediate ticks.
  return (
    <span className={className}>
      <span aria-hidden="true">{shown.toLocaleString("en-IN")}</span>
      <span className="sr-only">{value.toLocaleString("en-IN")}</span>
    </span>
  );
}
