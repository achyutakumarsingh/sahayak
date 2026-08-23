"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";

export function ListingCanvas({ dict }: { dict: Dictionary }) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [listing, setListing] = useState<{
    title: string;
    description: string;
    priceBand: string;
    tags: string[];
  } | null>(null);

  const tDash = dict.dashboards?.artisans;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setListing(null);
      setCopied(false);
    }
  };

  const generateListing = () => {
    if (!photoPreview) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setListing({
        title: "Handcrafted Terracotta Earthen Planter (हस्तनिर्मित मिट्टी का गमला)",
        description:
          "Authentic terracotta planter handcrafted by traditional village artisans using natural clay. Eco-friendly, porous design for root aeration.",
        priceBand: "₹350 – ₹450 per unit",
        tags: ["#Handmade", "#Terracotta", "#ArtisansOfIndia", "#EcoFriendly", "#VocalForLocal"],
      });
    }, 1200);
  };

  const handleShareWhatsApp = () => {
    if (!listing) return;
    const text = `🛍️ *${listing.title}*\n\n${listing.description}\n\n💰 *Price:* ${listing.priceBand}\n\n🏷️ ${listing.tags.join(" ")}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCopyListing = () => {
    if (!listing) return;
    const text = `${listing.title}\n\n${listing.description}\n\nPrice: ${listing.priceBand}\n\n${listing.tags.join(" ")}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-ink">
          {tDash?.canvasTitle || "Product Catalog & AI Listing Generator"}
        </h3>
        <p className="text-xs text-ink-2 mt-1">
          Upload craft photo to generate a listing title, description, fair price band and tags.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Photo Upload Area */}
        <div className="flex flex-col gap-3">
          <label className="h-52 border-2 border-dashed border-border hover:border-accent rounded-card flex flex-col items-center justify-center p-3 cursor-pointer bg-surface-2 transition-colors text-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Artisan craft preview" className="h-full object-contain rounded" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">🏺</span>
                <span className="text-xs font-semibold text-ink">Upload Product Craft Photo</span>
                <span className="text-xs text-ink-2">Tap to take photo or choose file</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </label>

          {photoPreview ? (
            <Button variant="primary" onClick={generateListing} disabled={generating}>
              {generating ? "Generating AI Listing..." : "Generate Product Listing"}
            </Button>
          ) : null}
        </div>

        {/* AI Listing Output Canvas */}
        <div className="flex flex-col gap-3 p-4 rounded-card border border-border bg-surface-2 min-h-52">
          {listing ? (
            <>
              <div className="flex justify-between items-start">
                <span className="label text-accent font-mono">AI GENERATED LISTING</span>
                <span className="text-xs text-ok font-semibold">✔ Ready to Share</span>
              </div>
              <h4 className="text-base font-bold text-ink">{listing.title}</h4>
              <p className="text-xs text-ink-2">{listing.description}</p>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-xs font-semibold text-ink">Fair Price Band: </span>
                <span className="text-xs font-mono font-bold text-accent">{listing.priceBand}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {listing.tags.map((t) => (
                  <span key={t} className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border text-ink-2">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
                <Button variant="primary" size="sm" onClick={handleShareWhatsApp} withArrow={false}>
                  💬 {tDash?.shareWhatsapp || "Share to WhatsApp"}
                </Button>
                <Button variant="text" size="sm" onClick={handleCopyListing} withArrow={false}>
                  {copied ? (tDash?.copied || "Copied!") : "Copy Text"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <span className="text-2xl opacity-40">✨</span>
              <p className="text-xs text-ink-2 mt-2">
                Upload a product photo on the left and click Generate to build your product listing.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
