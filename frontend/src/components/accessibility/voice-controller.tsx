"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button, Card } from "@/components/ui";
import { MicIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/lib/routes";

type VoiceCommand = {
  command: string;
  commandHi: string;
  action: string;
  slug: string;
};

const COMMANDS: VoiceCommand[] = [
  { command: '"Go to Farmers" / "किसान"', commandHi: '"किसान के पास जाओ"', action: "Navigates to Farmers Module", slug: "farmers" },
  { command: '"Go to Fishermen" / "मछुआरे"', commandHi: '"मछुआरे दिखाओ"', action: "Navigates to Fishermen Safety Dashboard", slug: "fishermen" },
  { command: '"Go to Artisans" / "कारीगर"', commandHi: '"कारीगर खोलें"', action: "Navigates to Artisans Listing Generator", slug: "artisans" },
  { command: '"Check Schemes" / "सरकारी सेवाएँ"', commandHi: '"योजना पात्रता"', action: "Navigates to Public Services Eligibility Wizard", slug: "services" },
];

export function VoiceController({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [lastRecognized, setLastRecognized] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const tDash = dict.dashboards?.accessibility;
  const isHindi = locale === "hi";

  const handleCommandRoute = useCallback((text: string) => {
    const lower = text.toLowerCase();
    setLastRecognized(text);

    if (lower.includes("farmer") || lower.includes("किसान") || lower.includes("kisan")) {
      setFeedback("Navigating to Farmers Module...");
      router.push(localePath(locale, "farmers"));
    } else if (lower.includes("fisher") || lower.includes("मछुआरा") || lower.includes("machhuare")) {
      setFeedback("Navigating to Fishermen Module...");
      router.push(localePath(locale, "fishermen"));
    } else if (lower.includes("artisan") || lower.includes("कारीगर") || lower.includes("karigar")) {
      setFeedback("Navigating to Artisans Module...");
      router.push(localePath(locale, "artisans"));
    } else if (lower.includes("scheme") || lower.includes("योजना") || lower.includes("yojana") || lower.includes("service")) {
      setFeedback("Navigating to Services Module...");
      router.push(localePath(locale, "services"));
    } else {
      setFeedback(`Recognized: "${text}". Say "Farmers", "Fishermen", "Artisans", or "Schemes".`);
    }
  }, [locale, router]);

  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback("Speech recognition is not supported on this device/browser.");
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isHindi ? "hi-IN" : "en-IN";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setListening(true);
        setFeedback("Listening for voice navigation commands…");
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => {
        setListening(false);
        setFeedback("Could not hear command. Please try speaking clearly.");
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) handleCommandRoute(transcript);
      };

      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-semibold text-ink">
            {tDash?.title || "Hands-Free Voice Controller & Speech Studio"}
          </h3>
          <p className="text-xs text-ink-2">
            Speak natural voice commands in English or Hindi to navigate and operate Sahayak hands-free.
          </p>
        </div>
        <span className="label text-ok bg-ok/10 px-2 py-1 rounded-chip border border-ok/30 font-mono">
          SPEECH ACTIVE
        </span>
      </div>

      {/* Main Microphone Action Trigger */}
      <div className="flex flex-col items-center justify-center p-6 rounded-card border border-border bg-surface-2 gap-4 text-center">
        <button
          type="button"
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            listening
              ? "bg-danger text-white ring-8 ring-danger/30 animate-pulse shadow-lg scale-105"
              : "bg-accent text-accent-ink hover:bg-accent-hover shadow"
          }`}
        >
          <MicIcon className="w-8 h-8" />
        </button>

        <div>
          <p className="text-sm font-bold text-ink">
            {listening ? (tDash?.listeningActive || "Listening for spoken command...") : (tDash?.startController || "Tap Microphone & Speak Command")}
          </p>
          {feedback ? (
            <p className="text-xs font-mono font-medium text-accent mt-1 bg-surface px-3 py-1 rounded border border-border inline-block">
              {feedback}
            </p>
          ) : null}
        </div>

        {/* Visual Waveform Indicator */}
        {listening ? (
          <div className="flex items-center gap-1.5 h-6">
            <span className="w-1.5 bg-danger rounded-full animate-bounce h-full" />
            <span className="w-1.5 bg-danger rounded-full animate-bounce h-3" />
            <span className="w-1.5 bg-danger rounded-full animate-bounce h-5" />
            <span className="w-1.5 bg-danger rounded-full animate-bounce h-2" />
            <span className="w-1.5 bg-danger rounded-full animate-bounce h-4" />
          </div>
        ) : null}
      </div>

      {/* Supported Voice Commands Reference Table */}
      <div>
        <p className="label mb-2">{tDash?.voiceCommands || "Supported Spoken Navigation Commands"}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMMANDS.map((cmd) => (
            <div
              key={cmd.slug}
              onClick={() => router.push(localePath(locale, cmd.slug))}
              className="p-3 rounded-card border border-border bg-surface hover:border-accent cursor-pointer transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-mono font-bold text-ink">{isHindi ? cmd.commandHi : cmd.command}</p>
                <p className="text-[11px] text-ink-2 mt-0.5">{cmd.action}</p>
              </div>
              <span className="text-xs text-accent">→</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
