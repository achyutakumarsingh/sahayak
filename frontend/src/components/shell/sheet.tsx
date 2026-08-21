"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Bottom sheet for the mobile nav. Uses <dialog> so the browser supplies the
 * modal semantics, focus trapping and Escape handling rather than us
 * re-implementing them badly.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-label={title}
      // Clicking the ::backdrop reports the dialog itself as the target.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto w-full max-w-none rounded-t-card border border-border bg-surface p-0 text-ink",
        "backdrop:bg-black/40 sm:mx-auto sm:mb-auto sm:mt-[10vh] sm:max-w-md sm:rounded-card",
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border pad-md">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-chip px-2 py-1 text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
          <span className="sr-only">{closeLabel}</span>
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto pad-md">{children}</div>
    </dialog>
  );
}
