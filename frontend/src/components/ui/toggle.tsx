"use client";

import { cn } from "@/lib/cn";

export type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  /** Mono chip after the label, e.g. "Not wired up yet". */
  badge?: string;
  disabled?: boolean;
  id: string;
  className?: string;
};

/**
 * role="switch" rather than a checkbox: the state is applied immediately and
 * there is no form to submit. The track is a real button, so it is reachable
 * and operable by keyboard with Space/Enter for free.
 */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  badge,
  disabled = false,
  id,
  className,
}: ToggleProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <span className="min-w-0">
        <label htmlFor={id} className="block font-medium text-ink">
          {label}
          {badge ? (
            <span className="label ml-2 inline-block whitespace-nowrap align-middle">
              {badge}
            </span>
          ) : null}
        </label>
        {hint ? (
          <span id={hintId} className="mt-0.5 block text-xs text-ink-2">
            {hint}
          </span>
        ) : null}
      </span>

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={hintId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-accent bg-accent" : "border-border bg-surface-2",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "block size-4 rounded-full transition-transform duration-150",
            checked
              ? "translate-x-[1.375rem] bg-accent-ink"
              : "translate-x-[0.185rem] bg-ink-2",
          )}
        />
      </button>
    </div>
  );
}
