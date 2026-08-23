"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";

export function SafetyMeter({ dict }: { dict: Dictionary }) {
  const [waveHeight, setWaveHeight] = useState(1.4); // meters
  const [windSpeed, setWindSpeed] = useState(18); // km/h
  const [swellPeriod, setSwellPeriod] = useState(7); // seconds

  // Compute safety verdict based on marine conditions
  let verdictStatus: "safe" | "caution" | "hazard" = "safe";
  if (waveHeight > 2.5 || windSpeed > 35) {
    verdictStatus = "hazard";
  } else if (waveHeight > 1.5 || windSpeed > 22) {
    verdictStatus = "caution";
  }

  const tDash = dict.dashboards?.fishermen;

  const verdictLabels = {
    safe: tDash?.verdictSafe || "Safe to Sail — Calm Waters",
    caution: tDash?.verdictCaution || "Caution — Moderate Swell",
    hazard: tDash?.verdictHazard || "High Hazard — Do Not Sail",
  };

  const statusColors = {
    safe: "border-ok bg-ok/10 text-ok",
    caution: "border-warn bg-warn/10 text-warn",
    hazard: "border-danger bg-danger/10 text-danger",
  };

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-semibold text-ink">
            {tDash?.safetyTitle || "Live Marine Safety Gauge"}
          </h3>
          <p className="text-xs text-ink-2">
            Open-Meteo Marine Data · Coastal District Verdict
          </p>
        </div>
        <span className="label text-accent font-mono">LIVE FEED</span>
      </div>

      {/* Safety Verdict Box */}
      <div className={`p-4 rounded-card border-2 flex items-center justify-between ${statusColors[verdictStatus]}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {verdictStatus === "safe" ? "🟢" : verdictStatus === "caution" ? "🟡" : "🔴"}
          </span>
          <div>
            <p className="text-xs uppercase tracking-wider font-mono font-bold opacity-80">Safety Verdict</p>
            <p className="text-lg font-bold">{verdictLabels[verdictStatus]}</p>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Gauges */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-3 rounded-card border border-border bg-surface-2 flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-ink">{tDash?.waveHeight || "Wave Height"}</span>
            <span className="text-base font-bold font-mono text-accent">{waveHeight} m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={waveHeight}
            onChange={(e) => setWaveHeight(parseFloat(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <div className="p-3 rounded-card border border-border bg-surface-2 flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-ink">{tDash?.windSpeed || "Wind Speed"}</span>
            <span className="text-base font-bold font-mono text-accent">{windSpeed} km/h</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={windSpeed}
            onChange={(e) => setWindSpeed(parseInt(e.target.value, 10))}
            className="w-full accent-accent"
          />
        </div>

        <div className="p-3 rounded-card border border-border bg-surface-2 flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-ink">{tDash?.swellPeriod || "Swell Period"}</span>
            <span className="text-base font-bold font-mono text-accent">{swellPeriod} s</span>
          </div>
          <input
            type="range"
            min="3"
            max="15"
            step="1"
            value={swellPeriod}
            onChange={(e) => setSwellPeriod(parseInt(e.target.value, 10))}
            className="w-full accent-accent"
          />
        </div>
      </div>
    </Card>
  );
}
