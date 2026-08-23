"use client";

import { usePreferences } from "@/components/providers";
import { Toggle } from "@/components/ui/toggle";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

/**
 * The two persistent display settings. Both are stored on the device and
 * re-applied before first paint by PreferencesScript.
 */
export function AccessibilityMenu({
  dict,
  className,
}: {
  dict: Dictionary;
  className?: string;
}) {
  const { preferences, setPreference } = usePreferences();

  // React hydrates with the server snapshot (both off) and re-renders with the
  // stored values, so there is no mismatch here. The inline script has already
  // applied the visual state, so nothing flashes either.
  const { largeText, voiceMode } = preferences;

  return (
    <section aria-labelledby="a11y-heading" className={cn("flex flex-col gap-4", className)}>
      <div>
        <h2 id="a11y-heading" className="label">
          {dict.a11y.title}
        </h2>
        <p className="mt-1 text-xs text-ink-2">{dict.a11y.summary}</p>
      </div>

      <Toggle
        id="pref-large-text"
        checked={largeText}
        onChange={(next) => setPreference("largeText", next)}
        label={dict.a11y.largeText}
        hint={dict.a11y.largeTextHint}
      />

      <Toggle
        id="pref-voice-mode"
        checked={voiceMode}
        onChange={(next) => setPreference("voiceMode", next)}
        label={dict.a11y.voiceMode}
        hint={dict.a11y.voiceModeHint}
        badge="Active"
      />

      {voiceMode ? (
        <p role="status" className="rounded-card border border-ok/45 bg-ok/10 p-3 text-xs text-ink">
          ✔ Voice mode is enabled. Use microphone & listen controls in chat modules for speech input & audio playback.
        </p>
      ) : null}
    </section>
  );
}
