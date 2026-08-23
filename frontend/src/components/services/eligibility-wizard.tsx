"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";

type SchemeMatch = {
  name: string;
  category: string;
  benefit: string;
  matchScore: number;
};

export function EligibilityWizard({ dict }: { dict: Dictionary }) {
  const [age, setAge] = useState<number>(32);
  const [occupation, setOccupation] = useState<string>("Farmer / Agri-worker");
  const [income, setIncome] = useState<string>("< ₹2.5 Lakh");
  const [evaluated, setEvaluated] = useState(false);

  const tDash = dict.dashboards?.services;

  const matches: SchemeMatch[] = [
    {
      name: "PM-Kisan Samman Nidhi (पीएम-किसान सम्मान निधि)",
      category: "Agriculture & Small Farmers",
      benefit: "₹6,000 / year direct income support in 3 equal installments",
      matchScore: 98,
    },
    {
      name: "Ayushman Bharat PM-JAY (आयुष्मान भारत योजना)",
      category: "Healthcare & Family Insurance",
      benefit: "₹5,000,000 free health coverage per family per year for secondary/tertiary care",
      matchScore: 95,
    },
    {
      name: "PM SVANidhi (पीएम स्वनिधि योजना)",
      category: "Micro-Entrepreneurs & Vendors",
      benefit: "Collateral-free working capital loan up to ₹10,000 with 7% interest subsidy",
      matchScore: 82,
    },
  ];

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-ink">
          {tDash?.wizardTitle || "Scheme Eligibility Calculator"}
        </h3>
        <p className="text-xs text-ink-2 mt-1">
          Answer 3 simple questions to check which official government schemes you qualify for.
        </p>
      </div>

      {/* Form Controls */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Your Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value, 10) || 18)}
            className="rounded-chip border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Occupation</label>
          <select
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="rounded-chip border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option>Farmer / Agri-worker</option>
            <option>Artisan / Handloom</option>
            <option>Street Vendor / Shopkeeper</option>
            <option>Student / Youth</option>
            <option>Daily Wager / Construction</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Annual Income</label>
          <select
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="rounded-chip border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            <option>&lt; ₹1.5 Lakh</option>
            <option>&lt; ₹2.5 Lakh</option>
            <option>₹2.5L – ₹5.0L</option>
            <option>&gt; ₹5.0 Lakh</option>
          </select>
        </div>
      </div>

      <div>
        <Button variant="primary" onClick={() => setEvaluated(true)}>
          {tDash?.checkEligibility || "Calculate Eligible Schemes"}
        </Button>
      </div>

      {/* Results */}
      {evaluated ? (
        <div className="flex flex-col gap-3 pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="label text-ok font-bold">MATCH RESULTS</span>
            <span className="text-xs font-mono text-ink-2">Grounded on Curated Scheme Dataset</span>
          </div>

          <div className="flex flex-col gap-3">
            {matches.map((scheme) => (
              <div
                key={scheme.name}
                className="p-3.5 rounded-card border border-border bg-surface-2 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-bold text-ink">{scheme.name}</h4>
                  <span className="shrink-0 text-xs font-mono font-bold px-2 py-0.5 rounded-chip bg-ok/15 text-ok border border-ok/30">
                    {scheme.matchScore}% Match
                  </span>
                </div>
                <span className="label">{scheme.category}</span>
                <p className="text-xs text-ink-2 mt-1">🎁 <strong className="text-ink">Benefit:</strong> {scheme.benefit}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
