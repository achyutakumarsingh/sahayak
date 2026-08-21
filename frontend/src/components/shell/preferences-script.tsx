import { PREFERENCES_KEY } from "@/lib/storage";

/**
 * Applies the saved display preferences before first paint, so large-text mode
 * does not flash in at its default size on every navigation. Kept to one
 * statement and wrapped in try/catch — it runs render-blocking in <head>.
 */
const SCRIPT = `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFERENCES_KEY,
)})||"{}");var r=document.documentElement;if(p.largeText)r.dataset.textSize="large";if(p.voiceMode)r.dataset.voice="on";}catch(e){}`;

export function PreferencesScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
