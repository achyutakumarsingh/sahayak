import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Level = "h1" | "h2" | "h3";

const TITLE_SIZE: Record<Level, string> = {
  h1: "text-2xl",
  h2: "text-xl",
  h3: "text-lg",
};

export type SectionHeaderProps = {
  /** Rendered as a mono slash-number eyebrow, e.g. 1 -> /01 */
  index?: number;
  /** Free-text eyebrow, used when there is no number. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Trailing slot — a Button or StatusDot sits well here. */
  action?: ReactNode;
  as?: Level;
  id?: string;
  className?: string;
};

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  action,
  as = "h2",
  id,
  className,
}: SectionHeaderProps) {
  const Heading = as;
  const number = index === undefined ? null : `/${String(index).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-3",
        className,
      )}
    >
      <div className="min-w-0">
        {number || eyebrow ? (
          <p className="label flex items-center gap-2">
            {number ? (
              <span className="text-accent tabular-nums">{number}</span>
            ) : null}
            {eyebrow ? <span>{eyebrow}</span> : null}
          </p>
        ) : null}

        <Heading
          id={id}
          className={cn(
            "mt-1.5 font-semibold tracking-tight text-ink",
            TITLE_SIZE[as],
          )}
        >
          {title}
        </Heading>

        {description ? (
          <p className="mt-1.5 max-w-2xl text-ink-2">{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
