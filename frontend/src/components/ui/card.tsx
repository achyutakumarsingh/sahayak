import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

// Token-driven so large-text mode scales padding along with type.
const PADDING = {
  none: "",
  sm: "pad-sm",
  md: "pad-md",
  lg: "pad-lg",
} as const;

const TONE = {
  surface: "bg-surface",
  sunken: "bg-surface-2",
  bare: "bg-transparent",
} as const;

export type CardProps<T extends ElementType = "div"> = {
  as?: T;
  padding?: keyof typeof PADDING;
  tone?: keyof typeof TONE;
  /**
   * Marks the card as a link/action target: hover + focus-within border shift
   * and the cursor-tracking glow. Static cards and panels stay flat.
   */
  interactive?: boolean;
  children?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/**
 * Flat card: 1px border, 8px radius, no box-shadow — not on hover, not ever.
 * Depth is expressed with the surface tokens instead.
 */
export function Card<T extends ElementType = "div">({
  as,
  padding = "md",
  tone = "surface",
  interactive = false,
  className,
  children,
  ...rest
}: CardProps<T>) {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      data-glow={interactive ? "surface" : undefined}
      className={cn(
        "rounded-card border border-border",
        TONE[tone],
        PADDING[padding],
        // The border shift is the real hover signal; the glow only decorates it.
        interactive &&
          "transition-colors duration-150 hover:border-ink-2 focus-within:border-accent",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
