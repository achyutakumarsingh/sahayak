"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";

type DistrictAlertData = {
  name: string;
  nameHi: string;
  hazard: string;
  hazardHi: string;
  severity: "high" | "medium" | "low";
  advisory: string;
  advisoryHi: string;
};

const DISTRICT_ALERTS: DistrictAlertData[] = [
  {
    name: "Puri (Coastal Odisha)",
    nameHi: "पुरी (तटीय ओडिशा)",
    hazard: "Cyclone Warning — Category 2 Swell",
    hazardHi: "चक्रवात चेतावनी — श्रेणी 2 स्वेल",
    severity: "high",
    advisory: "Coastal wind gusts reaching 65 km/h. Fishermen advised not to venture into sea. Move to cyclone shelters.",
    advisoryHi: "तटीय हवा की गति 65 किमी/घंटा तक। मछुआरों को समुद्र में न जाने की सलाह। चक्रवात आश्रय स्थलों में जाएँ।",
  },
  {
    name: "Balasore (Odisha)",
    nameHi: "बालेश्वर (ओडिशा)",
    hazard: "Heavy Rainfall & Flash Flood Risk",
    hazardHi: "भारी वर्षा एवं अचानक बाढ़ का ख़तरा",
    severity: "medium",
    advisory: "River Subarnarekha water level rising. Keep livestock on high ground and pack emergency bags.",
    advisoryHi: "सुवर्णरेखा नदी का जलस्तर बढ़ रहा है। मवेशियों को ऊँचे स्थान पर रखें और आपातकालीन बैग तैयार रखें।",
  },
  {
    name: "Patna (Bihar)",
    nameHi: "पटना (बिहार)",
    hazard: "Ganga Water Level Rise — Alert Level 1",
    hazardHi: "गंगा जलस्तर वृद्धि — चेतावनी स्तर 1",
    severity: "medium",
    advisory: "Low-lying diara areas experiencing inundation. Disaster teams deployed in Danapur block.",
    advisoryHi: "निचले दियारा क्षेत्रों में जलभराव। दानापुर प्रखंड में आपदा राहत दल तैनात।",
  },
  {
    name: "Sundarbans (West Bengal)",
    nameHi: "सुंदरबन (पश्चिम बंगाल)",
    hazard: "High Ocean Tide & Tidal Surge",
    hazardHi: "ऊँची समुद्री ज्वार एवं ज्वारीय लहरें",
    severity: "high",
    advisory: "Embankment breach vulnerability near Gosaba. Follow Block Development Officer advisories.",
    advisoryHi: "गोसाबा के पास तटबंध टूटने की आशंका। प्रखंड विकास अधिकारी की सलाह का पालन करें।",
  },
];

export function DistrictAlert({ dict, isHindi }: { dict: Dictionary; isHindi?: boolean }) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const current = DISTRICT_ALERTS[selectedIdx];

  const tDash = dict.dashboards?.disaster;

  const severityColors = {
    high: "bg-danger/10 text-danger border-danger/40",
    medium: "bg-warn/10 text-warn border-warn/40",
    low: "bg-ok/10 text-ok border-ok/40",
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-semibold text-ink">
            {tDash?.title || "District Hazard Alert & Preparedness Checklist"}
          </h3>
          <p className="text-xs text-ink-2">
            {dict.disclaimer?.sampleLabel || "Sample live alert data"} · Emergency Helpline: 1070 / 112
          </p>
        </div>
        <span className="label text-danger bg-danger/10 px-2 py-1 rounded-chip border border-danger/30 font-mono">
          ● ALERT MONITOR
        </span>
      </div>

      {/* District Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink">
          {tDash?.selectDistrict || "Select District"}
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {DISTRICT_ALERTS.map((d, idx) => (
            <button
              key={d.name}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`p-2.5 rounded-chip border text-left text-xs transition-colors ${
                selectedIdx === idx
                  ? "border-accent bg-accent-wash font-semibold text-ink"
                  : "border-border bg-surface text-ink-2 hover:border-ink-2"
              }`}
            >
              <div className="font-semibold text-ink">{isHindi ? d.nameHi : d.name}</div>
              <div className="text-[10px] font-mono text-ink-2 mt-0.5">{d.severity.toUpperCase()} ALERT</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Alert Display Box */}
      <div className={`p-4 rounded-card border-2 flex flex-col gap-2 ${severityColors[current.severity]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h4 className="text-sm font-bold">{isHindi ? current.hazardHi : current.hazard}</h4>
          </div>
          <span className="label uppercase font-mono px-2 py-0.5 rounded bg-surface border border-current">
            {current.severity} Priority
          </span>
        </div>
        <p className="text-xs leading-relaxed mt-1 font-medium">{isHindi ? current.advisoryHi : current.advisory}</p>
      </div>
    </Card>
  );
}
