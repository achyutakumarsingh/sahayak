import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-8",
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
  /** Adds a hover/focus-within border shift. Use for cards that link somewhere. */
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
      className={cn(
        "rounded-card border border-border",
        TONE[tone],
        PADDING[padding],
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
