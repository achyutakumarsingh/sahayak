/**
 * Scripted walkthrough for judging. Dev-only.
 *
 * Each step is a real URL with a `demo` parameter that the module component
 * picks up and acts on — the Farmers step runs the actual ONNX classifier on a
 * bundled sample photo rather than displaying a canned result, so what a judge
 * sees is the real pipeline.
 */
export const DEMO_PARAM = "demo";
export const DEMO_STATE_KEY = "sahayak.demoStep";

/** Auto-advance delay. Any key also advances immediately. */
export const STEP_MS = 2800;

export type DemoStep = {
  /** Path relative to the locale root, or an absolute locale path. */
  href: string;
  captionKey: "demoFarmers" | "demoServices" | "demoHindi" | "demoEnglish";
};

export function demoSteps(locale: string): DemoStep[] {
  const other = locale === "hi" ? "en" : "hi";
  return [
    { href: `/${locale}/farmers?${DEMO_PARAM}=diagnose`, captionKey: "demoFarmers" },
    { href: `/${locale}/services?${DEMO_PARAM}=ask`, captionKey: "demoServices" },
    { href: `/${other}/services?${DEMO_PARAM}=ask`, captionKey: "demoHindi" },
    { href: `/${locale}/services`, captionKey: "demoEnglish" },
  ];
}

export function readStep(): number | null {
  try {
    const raw = window.sessionStorage.getItem(DEMO_STATE_KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

export function writeStep(index: number | null): void {
  try {
    if (index === null) window.sessionStorage.removeItem(DEMO_STATE_KEY);
    else window.sessionStorage.setItem(DEMO_STATE_KEY, String(index));
  } catch {
    /* the tour just will not survive navigation */
  }
}
