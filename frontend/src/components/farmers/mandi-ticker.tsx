"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";

type MandiItem = {
  crop: string;
  cropHi: string;
  mandi: string;
  mandiHi: string;
  price: string;
  unit: string;
  change: "up" | "down" | "same";
  diff: string;
};

const SAMPLE_MANDI_RATES: MandiItem[] = [
  { crop: "Wheat (गेहूँ)", cropHi: "गेहूँ", mandi: "Khanna, PB", mandiHi: "खन्ना, पंजाब", price: "₹2,275", unit: "quintal", change: "up", diff: "+₹25" },
  { crop: "Paddy (धान)", cropHi: "धान", mandi: "Karnal, HR", mandiHi: "करनाल, हरियाणा", price: "₹2,183", unit: "quintal", change: "up", diff: "+₹15" },
  { crop: "Cotton (कपास)", cropHi: "कपास", mandi: "Rajkot, GJ", mandiHi: "राजकोट, गुजरात", price: "₹7,120", unit: "quintal", change: "down", diff: "-₹40" },
  { crop: "Potato (आलू)", cropHi: "आलू", mandi: "Agra, UP", mandiHi: "आगरा, यूपी", price: "₹1,450", unit: "quintal", change: "same", diff: "0" },
];

export function MandiTicker({ dict, isHindi }: { dict: Dictionary; isHindi?: boolean }) {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-semibold text-ink">
            {dict.dashboards?.farmers?.mandiTitle || "Live Mandi Crop Prices"}
          </h3>
          <p className="text-xs text-ink-2">
            {dict.disclaimer?.sampleLabel || "Sample live feed"} · Updated today
          </p>
        </div>
        <span className="label text-ok bg-ok/10 px-2 py-1 rounded-chip border border-ok/30">
          ● Live
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SAMPLE_MANDI_RATES.map((item) => {
          const isSelected = selectedCrop === item.crop;
          return (
            <div
              key={item.crop}
              onClick={() => setSelectedCrop(isSelected ? null : item.crop)}
              className={`p-3 rounded-card border transition-all cursor-pointer ${
                isSelected
                  ? "border-accent bg-accent-wash"
                  : "border-border bg-surface hover:border-ink-2"
              }`}
            >
              <p className="text-xs font-semibold text-ink">{isHindi ? item.cropHi : item.crop}</p>
              <p className="text-xs text-ink-2">{isHindi ? item.mandiHi : item.mandi}</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold text-ink">{item.price}</span>
                <span
                  className={`text-xs font-mono font-medium ${
                    item.change === "up"
                      ? "text-ok"
                      : item.change === "down"
                      ? "text-danger"
                      : "text-ink-2"
                  }`}
                >
                  {item.change === "up" ? "▲" : item.change === "down" ? "▼" : "▬"} {item.diff}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
