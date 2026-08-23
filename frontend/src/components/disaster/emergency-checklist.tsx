"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";

type ChecklistItem = {
  id: string;
  label: string;
  labelHi: string;
  hint: string;
  hintHi: string;
};

const ITEMS: ChecklistItem[] = [
  { id: "water", label: "Drinking Water (10L)", labelHi: "पीने का पानी (10 लीटर)", hint: "Store in sealed containers for at least 3 days", hintHi: "कम से कम 3 दिनों के लिए बंद डिब्बों में रखें" },
  { id: "food", label: "Dry Rations & Medicines", labelHi: "सूखा राशन एवं दवाएँ", hint: "Biscuits, puffed rice, essential prescription meds", hintHi: "बिस्कुट, चूड़ा, आवश्यक दवाएँ" },
  { id: "torch", label: "Battery Torch & Power Bank", labelHi: "टॉर्च एवं पावर बैंक", hint: "Keep phone fully charged and extra batteries dry", hintHi: "फ़ोन पूरा चार्ज रखें और अतिरिक्त बैटरी सूखी रखें" },
  { id: "docs", label: "Waterproof Document Bag", labelHi: "वाटरप्रूफ दस्तावेज़ थैला", hint: "Aadhaar, Ration Card, Bank passbooks in plastic pouch", hintHi: "आधार, राशन कार्ड, बैंक पासबुक प्लास्टिक की थैली में" },
  { id: "firstaid", label: "First Aid Kit & Antiseptic", labelHi: "प्राथमिक चिकित्सा किट एवं एंटीसेप्टिक", hint: "Bandages, ORS sachets, Dettol/Savlon, cotton", hintHi: "पट्टी, ओआरएस पैकेट, डेटॉल/सेवलॉन, रुई" },
  { id: "radio", label: "Transistor Radio / Emergency Numbers", labelHi: "रेडियो / आपातकालीन नंबर", hint: "Keep 1070 (State) and 1077 (District) numbers noted", hintHi: "1070 (राज्य) और 1077 (ज़िला) नंबर नोट रखें" },
];

export function EmergencyChecklist({ dict, isHindi }: { dict: Dictionary; isHindi?: boolean }) {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sahayak_disaster_checklist");
      if (stored) setCheckedMap(JSON.parse(stored));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleItem = (id: string) => {
    const updated = { ...checkedMap, [id]: !checkedMap[id] };
    setCheckedMap(updated);
    try {
      localStorage.setItem("sahayak_disaster_checklist", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const completedCount = Object.values(checkedMap).filter(Boolean).length;
  const tDash = dict.dashboards?.disaster;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-semibold text-ink">
            {tDash?.emergencyKit || "Offline Emergency Kit Checklist"}
          </h3>
          <p className="text-xs text-ink-2">
            Saved on this device for offline viewing during emergencies.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-accent bg-accent-wash px-2.5 py-1 rounded-chip border border-accent/30">
          {completedCount} / {ITEMS.length} {tDash?.completed || "ready"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item) => {
          const isChecked = !!checkedMap[item.id];
          return (
            <label
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3 rounded-card border transition-all cursor-pointer flex items-start gap-3 ${
                isChecked
                  ? "border-ok bg-ok/10 text-ink"
                  : "border-border bg-surface hover:border-ink-2"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}}
                className="mt-0.5 h-4 w-4 accent-ok rounded cursor-pointer shrink-0"
              />
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs font-semibold ${isChecked ? "text-ok line-through" : "text-ink"}`}>
                  {isHindi ? item.labelHi : item.label}
                </span>
                <span className="text-[11px] text-ink-2">
                  {isHindi ? item.hintHi : item.hint}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
