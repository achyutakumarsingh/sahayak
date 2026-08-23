"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { Dictionary } from "@/i18n/get-dictionary";

type NcertExcerpt = {
  classLevel: string;
  subject: string;
  chapter: string;
  chapterHi: string;
  excerpt: string;
  excerptHi: string;
  pageRef: string;
  sampleQuestion: string;
  sampleQuestionHi: string;
  aiExplanation: string;
  aiExplanationHi: string;
};

const NCERT_TOPICS: NcertExcerpt[] = [
  {
    classLevel: "Class 7",
    subject: "Science",
    chapter: "Chapter 1: Nutrition in Plants",
    chapterHi: "अध्याय 1: पादपों में पोषण",
    excerpt: "Chlorophyll captures the energy of the sunlight. This energy is used to synthesise (prepare) food from carbon dioxide and water. Since the synthesis of food occurs in the presence of sunlight, it is called photosynthesis.",
    excerptHi: "क्लोरोफिल सूर्य के प्रकाश की ऊर्जा को ग्रहण करता है। इस ऊर्जा का उपयोग कार्बन डाइऑक्साइड एवं जल से भोजन के संश्लेषण (निर्माण) में होता है। चूँकि भोजन का संश्लेषण सूर्य के प्रकाश की उपस्थिति में होता है, इसलिए इसे प्रकाश-संश्लेषण कहते हैं।",
    pageRef: "NCERT Class 7 Science, Chapter 1, Page 3",
    sampleQuestion: "Why are green leaves called the food factories of plants?",
    sampleQuestionHi: "हरी पत्तियों को पादपों की खाद्य फ़ैक्टरियाँ क्यों कहा जाता है?",
    aiExplanation: "Step 1: Leaves contain green pigment called chlorophyll.\nStep 2: Chlorophyll absorbs solar energy from sunlight.\nStep 3: Carbon dioxide (from air) and water (from roots) react in the leaf to produce glucose and oxygen gas.\n\nConclusion: Because all food synthesis takes place inside leaves, they are called food factories.",
    aiExplanationHi: "चरण 1: पत्तियों में क्लोरोफिल नामक हरा वर्णक होता है।\nचरण 2: क्लोरोफिल सूर्य के प्रकाश से सौर ऊर्जा अवशोषित करता है।\nचरण 3: हवा से कार्बन डाइऑक्साइड और जड़ों से पानी मिलकर ग्लूकोज और ऑक्सीजन बनाते हैं।\n\nनिष्कर्ष: चूँकि भोजन का सारा निर्माण पत्तियों में होता है, इसलिए इन्हें खाद्य फ़ैक्टरियाँ कहते हैं।",
  },
  {
    classLevel: "Class 8",
    subject: "Mathematics",
    chapter: "Chapter 2: Linear Equations in One Variable",
    chapterHi: "अध्याय 2: एक चर वाले रैखिक समीकरण",
    excerpt: "An algebraic equation is an equality involving variables. It has an equal sign (=). The expression on the left of the equal sign is the Left Hand Side (LHS) and the expression on the right is the Right Hand Side (RHS).",
    excerptHi: "एक बीजीय समीकरण चरों से युक्त एक समता होती है। इसमें एक बराबर (=) का चिह्न होता है। बराबर के बाएँ पक्ष के व्यंजक को वाम पक्ष (LHS) और दाएँ पक्ष के व्यंजक को दक्षिण पक्ष (RHS) कहते हैं।",
    pageRef: "NCERT Class 8 Mathematics, Chapter 2, Page 21",
    sampleQuestion: "Solve: 2x - 3 = 7",
    sampleQuestionHi: "हल करें: 2x - 3 = 7",
    aiExplanation: "Step 1: Transpose -3 from LHS to RHS (change sign from minus to plus):\n   2x = 7 + 3\n   2x = 10\n\nStep 2: Divide both sides by 2:\n   x = 10 / 2\n   x = 5\n\nVerification: 2(5) - 3 = 10 - 3 = 7 (LHS = RHS ✔)",
    aiExplanationHi: "चरण 1: -3 को बाएँ पक्ष से दाएँ पक्ष में बदलें (चिह्न ऋण से धन में बदलेगा):\n   2x = 7 + 3\n   2x = 10\n\nचरण 2: दोनों पक्षों को 2 से भाग दें:\n   x = 10 / 2\n   x = 5\n\nजाँच: 2(5) - 3 = 10 - 3 = 7 (LHS = RHS ✔)",
  },
];

export function NcertViewer({ dict, isHindi }: { dict: Dictionary; isHindi?: boolean }) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState<boolean>(true);

  const topic = NCERT_TOPICS[selectedIdx];
  const tDash = dict.dashboards?.education;

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-semibold text-ink">
            {tDash?.title || "NCERT Science & Math Doubt Tutor"}
          </h3>
          <p className="text-xs text-ink-2">
            Grounded strictly on official NCERT textbook chapters with page citations.
          </p>
        </div>
        <span className="label text-accent bg-accent-wash px-2 py-1 rounded-chip border border-accent/30 font-mono">
          NCERT CITATION
        </span>
      </div>

      {/* Class / Subject Selection Pills */}
      <div className="flex flex-wrap gap-2">
        {NCERT_TOPICS.map((t, idx) => (
          <button
            key={t.chapter}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`px-3 py-1.5 rounded-chip border text-xs font-medium transition-colors ${
              selectedIdx === idx
                ? "bg-accent text-accent-ink border-accent font-semibold"
                : "border-border bg-surface text-ink hover:bg-surface-2"
            }`}
          >
            📚 {t.classLevel} {t.subject} — {isHindi ? t.chapterHi : t.chapter}
          </button>
        ))}
      </div>

      {/* Cited Excerpt + AI Tutor Explanation Split View */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Textbook Cited Excerpt */}
        <div className="p-4 rounded-card border border-border bg-surface-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="label font-mono text-accent">TEXTBOOK EXCERPT</span>
            <span className="text-[11px] font-mono text-ink-2">{topic.pageRef}</span>
          </div>
          <h4 className="text-sm font-bold text-ink">{isHindi ? topic.chapterHi : topic.chapter}</h4>
          <blockquote className="text-xs text-ink italic border-l-2 border-accent pl-3 py-1 bg-surface/50 rounded-r">
            "{isHindi ? topic.excerptHi : topic.excerpt}"
          </blockquote>
          <div className="mt-auto pt-2 border-t border-border/60">
            <p className="text-xs font-semibold text-ink">Target Doubt Question:</p>
            <p className="text-xs text-accent font-medium mt-0.5">{isHindi ? topic.sampleQuestionHi : topic.sampleQuestion}</p>
          </div>
        </div>

        {/* Step-by-Step AI Explanation */}
        <div className="p-4 rounded-card border border-border bg-surface flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="label font-mono text-ok">STEP-BY-STEP TUTOR SOLUTION</span>
            <span className="text-[11px] font-mono text-ok font-bold">✔ Grounded</span>
          </div>

          <div className="whitespace-pre-line text-xs leading-relaxed text-ink font-mono bg-surface-2 p-3 rounded border border-border">
            {isHindi ? topic.aiExplanationHi : topic.aiExplanation}
          </div>

          <div className="mt-auto pt-2 text-[11px] text-ink-2 font-mono flex items-center justify-between">
            <span>Citation: {topic.pageRef}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
