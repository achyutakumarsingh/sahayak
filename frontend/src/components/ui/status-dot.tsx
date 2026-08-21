import { cn } from "@/lib/cn";

export type StatusTone = "ok" | "warn" | "danger" | "info" | "neutral";

const TONE: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-ink-2",
};

export type StatusDotProps = {
  tone?: StatusTone;
  label: string;
  /** Slow pulse for live/loading states. Respects prefers-reduced-motion. */
  pulse?: boolean;
  className?: string;
};

/**
 * The label carries the meaning — colour is only reinforcement, so the
 * component still reads correctly for colour-blind and screen-reader users.
 */
export function StatusDot({
  tone = "neutral",
  label,
  pulse = false,
  className,
}: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "size-2 shrink-0 rounded-full",
          TONE[tone],
          pulse && "animate-pulse",
        )}
      />
      <span className="meta text-ink">{label}</span>
    </span>
  );
}
