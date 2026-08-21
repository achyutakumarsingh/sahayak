import type { Dictionary } from "@/i18n/get-dictionary";

export function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-auto border-t border-hairline">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <p className="meta">{dict.home.eyebrow}</p>
        <p className="meta">{dict.home.moduleCount}</p>
      </div>
    </footer>
  );
}
