import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "advice" | "sample";

const TONE: Record<Tone, { border: string; accent: string }> = {
  // Scheme, eligibility and medical-adjacent output.
  advice: { border: "border-warn/45", accent: "text-warn" },
  // Mock data shown in the demo — must never read as live.
  sample: { border: "border-info/45", accent: "text-info" },
};

export type DisclaimerProps = {
  tone?: Tone;
  /** Mono eyebrow, e.g. "Please verify" or "Sample data". */
  label: string;
  children: ReactNode;
  /** Where the answer came from, rendered as mono metadata. */
  source?: string;
  className?: string;
};

/**
 * Required on every screen that gives scheme, eligibility or
 * medical-adjacent advice, and on every screen showing mock data.
 * Bordered rather than tinted, so it stays legible in both themes and in
 * high-contrast mode.
 */
export function Disclaimer({
  tone = "advice",
  label,
  children,
  source,
  className,
}: DisclaimerProps) {
  return (
    <aside
      role="note"
      aria-label={label}
      className={cn(
        "rounded-card border border-l-3 bg-surface-2 p-4",
        TONE[tone].border,
        className,
      )}
    >
      <p className={cn("label", TONE[tone].accent)}>{label}</p>
      <div className="mt-1.5 text-ink-2">{children}</div>
      {source ? <p className="meta mt-2">{source}</p> : null}
    </aside>
  );
}
