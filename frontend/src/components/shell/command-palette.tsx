"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { demoSteps, writeStep } from "@/lib/demo-tour";
import { modules } from "@/lib/modules";
import { localePath } from "@/lib/routes";

export function CommandPalette({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredModules = modules.filter((m) => {
    const copy = dict.modules[m.slug];
    const q = query.toLowerCase();
    return (
      copy.name.toLowerCase().includes(q) ||
      copy.description.toLowerCase().includes(q) ||
      copy.community.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-chip border border-border bg-surface text-xs text-ink-2 hover:text-ink hover:border-accent transition-colors"
        aria-label={dict.search?.placeholder || "Search (Cmd + K)"}
      >
        <SearchIcon className="w-3.5 h-3.5 text-accent" />
        <span>{dict.search?.placeholder || "Search modules... (⌘K)"}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/50 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-card border border-border bg-surface shadow-2xl p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <SearchIcon className="w-4 h-4 text-accent shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dict.search?.placeholder || "Search modules..."}
                className="w-full bg-transparent text-ink placeholder:text-ink-2 outline-none text-sm"
              />
              <kbd className="px-2 py-0.5 rounded border border-border bg-surface-2 text-xs font-mono text-ink-2">
                ESC
              </kbd>
            </div>

            {/* Dev-only: a scripted run for judges, not an end-user feature. */}
            {process.env.NODE_ENV === "development" &&
            "demo mode".includes(query.toLowerCase().trim()) ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  const steps = demoSteps(locale);
                  writeStep(0);
                  router.push(steps[0].href);
                }}
                className="flex flex-col gap-0.5 rounded-chip border border-accent p-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <span className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{dict.demo.title}</span>
                  <span className="label text-accent">{dict.demo.badge}</span>
                </span>
                <span className="text-xs text-ink-2">{dict.demo.subtitle}</span>
              </button>
            ) : null}

            <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
              {filteredModules.length === 0 ? (
                <p className="text-xs text-ink-2 p-3 text-center">
                  {dict.search?.noResults || "No matching modules found"}
                </p>
              ) : (
                filteredModules.map((m) => {
                  const copy = dict.modules[m.slug];
                  return (
                    <Link
                      key={m.slug}
                      href={localePath(locale, m.slug)}
                      onClick={() => setOpen(false)}
                      className="flex flex-col gap-0.5 p-2.5 rounded-chip hover:bg-surface-2 no-underline text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">
                          {copy.name}
                        </span>
                        <span className="label">{copy.community}</span>
                      </div>
                      <p className="text-xs text-ink-2 line-clamp-1">
                        {copy.description}
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
