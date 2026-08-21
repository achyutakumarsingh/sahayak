"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reads the resolved value of a CSS variable from its own position in the
 * tree, so it always reports what the nearest themed ancestor actually
 * computed. No hard-coded hex list to drift out of sync with globals.css.
 */
export function TokenSwatch({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      if (!ref.current) return;
      const raw = getComputedStyle(ref.current).getPropertyValue(name).trim();
      setValue(raw ? raw.toUpperCase() : null);
    };

    read();
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, [name]);

  return (
    <div className="flex items-center gap-3">
      <span
        ref={ref}
        aria-hidden="true"
        className="size-9 shrink-0 rounded-chip border border-border"
        style={{ background: `var(${name})` }}
      />
      <span className="min-w-0">
        <span className="meta block truncate text-ink">{name}</span>
        <span className="meta block text-ink-2">{value ?? "—"}</span>
      </span>
    </div>
  );
}
