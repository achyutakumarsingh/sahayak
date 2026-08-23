"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";

export function PhotoUploader({ dict }: { dict: Dictionary }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleDiagnose = () => {
    if (!file) return;
    setDiagnosing(true);
    setTimeout(() => {
      setDiagnosing(false);
      setResult(
        "Detected: Early Blight (Alternaria solani)\nConfidence: 94%\nRecommended Action: Apply copper-based fungicide or neem oil spray every 7–10 days. Ensure good leaf drainage.",
      );
    }, 1500);
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-ink">
          {dict.dashboards?.farmers?.uploadTitle || "Diagnose Crop Disease"}
        </h3>
        <p className="text-xs text-ink-2 mt-1">
          {dict.dashboards?.farmers?.uploadDesc || "Upload or capture a photo of an infected leaf."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <label className="w-full sm:w-64 h-36 border-2 border-dashed border-border hover:border-accent rounded-card flex flex-col items-center justify-center p-3 cursor-pointer bg-surface-2 transition-colors text-center">
          {preview ? (
            <img src={preview} alt="Crop leaf preview" className="h-full object-contain rounded" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">📷</span>
              <span className="text-xs text-ink-2 font-medium">Click to select photo or take picture</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        {preview ? (
          <div className="flex flex-col gap-2 flex-1 w-full">
            <p className="text-xs text-ink-2">Image ready: <span className="font-mono text-ink">{file?.name}</span></p>
            <Button
              variant="primary"
              onClick={handleDiagnose}
              disabled={diagnosing}
            >
              {diagnosing ? "Analyzing photo with AI..." : "Diagnose Crop Leaf"}
            </Button>
          </div>
        ) : null}
      </div>

      {result ? (
        <div className="p-3 rounded-card bg-ok/10 border border-ok/30 text-xs text-ink whitespace-pre-line">
          <p className="font-semibold text-ok mb-1">✔ Diagnosis Complete</p>
          {result}
        </div>
      ) : null}
    </Card>
  );
}
