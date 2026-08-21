import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { Route } from "next";

import { cn } from "@/lib/cn";

type Variant = "primary" | "text";
type Size = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-[0.5ch] rounded-chip font-medium " +
  "no-underline transition-colors duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50";

const VARIANT: Record<Variant, string> = {
  // The fill stays on hover — it deepens rather than inverting, so the glow
  // has a solid surface to sit on and the button never looks like it changed
  // into a different control.
  primary:
    "bg-accent text-accent-ink border border-accent hover:bg-accent-hover hover:border-accent-hover",
  // The house default: text plus an arrow, no filled pill.
  text: "bg-transparent text-accent border border-transparent px-0! hover:underline underline-offset-4",
};

const SIZE: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-base px-4 py-2",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Trailing arrow. On by default for the text variant, off for primary. */
  withArrow?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsPresentation = CommonProps & {
  /**
   * Renders a non-interactive <span> with the same look. For cards whose whole
   * surface is already one stretched link — a nested button or anchor there
   * would be invalid markup and a second, redundant tab stop.
   */
  presentational: true;
  href?: never;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & { href?: never };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps | "href"> & {
    href: Route | string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsPresentation;

function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="transition-transform duration-150 group-hover:translate-x-0.5"
    >
      →
    </span>
  );
}

export function Button({
  variant = "text",
  size = "md",
  withArrow,
  className,
  children,
  ...rest
}: ButtonProps) {
  const showArrow = withArrow ?? variant === "text";
  const classes = cn("group", BASE, SIZE[size], VARIANT[variant], className);
  // "solid" tints the glow with --accent-ink, since an accent glow would be
  // invisible on the accent fill. "text" widens it past the padding-less box.
  const isPresentational = "presentational" in rest && rest.presentational;
  const glow = isPresentational
    ? undefined
    : variant === "primary"
      ? "solid"
      : "text";

  const body = (
    <>
      {children}
      {showArrow ? <Arrow /> : null}
    </>
  );

  if ("presentational" in rest && rest.presentational) {
    return (
      <span aria-hidden="true" className={classes}>
        {body}
      </span>
    );
  }

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkProps } = rest as ButtonAsLink;
    return (
      <Link href={href as Route} data-glow={glow} className={classes} {...linkProps}>
        {body}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as ButtonAsButton;
  return (
    <button type={type} data-glow={glow} className={classes} {...buttonProps}>
      {body}
    </button>
  );
}
