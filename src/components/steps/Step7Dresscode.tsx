"use client";

import Image from "next/image";
import { isOptimizableImage } from "@/lib/image-src";
import type { DresscodeConfig } from "@/lib/types";
import { SectionShell } from "./SectionShell";

interface Step7DresscodeProps {
  dresscode: DresscodeConfig;
  vibeChoices: string[];
  vibe: string | null;
  onPickVibe: (vibe: string) => void;
}

/** Bước 7 — Dresscode "Brand guidelines": mô tả + bảng màu + mood ảnh + chọn vibe */
export function Step7Dresscode({ dresscode, vibeChoices, vibe, onPickVibe }: Step7DresscodeProps) {
  return (
    <SectionShell
      id="step-dresscode"
      eyebrow="Hạng mục 07 — Brand Guidelines"
      title="Dresscode của campaign 🧥"
    >
      <p className="leading-relaxed text-ink">{dresscode.description}</p>

      {dresscode.colors.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">
            Bảng màu gợi ý
          </p>
          <div className="mt-2 flex gap-2">
            {dresscode.colors.map((color) => (
              <span
                key={color}
                title={color}
                style={{ backgroundColor: color }}
                className="h-10 w-10 rounded-full border-2 border-cream shadow-sm"
              />
            ))}
          </div>
        </div>
      )}

      {dresscode.imageUrls.length > 0 && (
        <div className="mt-4 flex snap-x gap-2 overflow-x-auto">
          {dresscode.imageUrls.map((src) => (
            <div
              key={src}
              className="relative aspect-[3/4] w-40 shrink-0 snap-center overflow-hidden rounded-2xl bg-latte"
            >
              <Image
                src={src}
                alt="Mood dresscode"
                fill
                sizes="160px"
                className="object-cover"
                unoptimized={!isOptimizableImage(src)}
              />
            </div>
          ))}
        </div>
      )}

      {vibeChoices.length > 0 && (
        <div className="mt-6">
          <p className="font-semibold text-ink">Còn em, hôm đó em thích vibe nào? ✨</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {vibeChoices.map((choice) => (
              <button
                key={choice}
                onClick={() => onPickVibe(choice)}
                aria-pressed={choice === vibe}
                className={`rounded-full px-5 py-2.5 font-display font-bold transition-colors ${
                  choice === vibe
                    ? "bg-olive text-cream shadow-md shadow-olive/25"
                    : "bg-sand text-ink hover:bg-latte"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  );
}
