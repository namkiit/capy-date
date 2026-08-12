"use client";

import { AnimatePresence } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { Mascot } from "@/components/Mascot";
import { OptionDetailSheet } from "@/components/OptionDetailSheet";
import type { OptionRow } from "@/lib/db/schema";
import { isOptimizableImage } from "@/lib/image-src";
import type { StepChoice } from "@/lib/types";

interface OptionPickerProps {
  options: OptionRow[];
  choice: StepChoice | null;
  /** Nhãn nút chọn trong sheet chi tiết, VD "Chọn quán này 🤝" */
  chooseLabel: string;
  surpriseLabel: string;
  /** null = bước này không cho skip */
  skipLabel: string | null;
  onChoose: (choice: StepChoice) => void;
}

/**
 * Picker dùng chung cho 3 bước ăn/phim/cafe: grid card + card surprise,
 * bấm card mở bottom-sheet chi tiết, chọn trong sheet. Có thể skip nếu cho phép.
 */
export function OptionPicker({
  options,
  choice,
  chooseLabel,
  surpriseLabel,
  skipLabel,
  onChoose,
}: OptionPickerProps) {
  const [detail, setDetail] = useState<OptionRow | null>(null);

  const selectedId = choice?.kind === "option" ? choice.optionId : null;

  function chooseOption(option: OptionRow) {
    onChoose({ kind: "option", optionId: option.id, optionName: option.name });
    setDetail(null);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <button
              key={option.id}
              onClick={() => setDetail(option)}
              className={`relative overflow-hidden rounded-2xl bg-sand text-left transition-shadow ${
                isSelected ? "ring-3 ring-tangerine shadow-lg shadow-tangerine/20" : "hover:shadow-md"
              }`}
            >
              {isSelected && (
                <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-tangerine text-sm font-bold text-cream">
                  ✓
                </span>
              )}
              <div className="relative aspect-[4/3] bg-latte">
                {option.images.length > 0 ? (
                  <Image
                    src={option.images[0]}
                    alt={option.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 280px"
                    className="object-cover"
                    unoptimized={!isOptimizableImage(option.images[0])}
                  />
                ) : (
                  <div className="flex h-full items-end justify-center">
                    <Mascot expression="idle" className="w-20" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-display font-bold leading-snug text-ink">{option.name}</p>
                {option.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                    {option.description}
                  </p>
                )}
                {option.priceRange && (
                  <p className="mt-1.5 text-xs font-semibold text-capy-deep">
                    💸 {option.priceRange}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {/* card surprise — chọn ngay không cần sheet */}
        <button
          onClick={() => onChoose({ kind: "surprise" })}
          className={`flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-3 text-center transition-colors ${
            choice?.kind === "surprise"
              ? "border-tangerine bg-tangerine/10 ring-3 ring-tangerine"
              : "border-capy/50 bg-cream hover:bg-sand"
          }`}
        >
          <span className="font-display text-4xl">🎲</span>
          <span className="font-display font-bold leading-snug text-capy-deep">
            {surpriseLabel}
          </span>
          {choice?.kind === "surprise" && (
            <span className="text-xs font-semibold text-tangerine">Đã chọn ✓</span>
          )}
        </button>
      </div>

      {skipLabel && (
        <button
          onClick={() => onChoose({ kind: "skip" })}
          className={`mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
            choice?.kind === "skip"
              ? "bg-olive-soft text-olive"
              : "bg-transparent text-ink-soft underline-offset-2 hover:underline"
          }`}
        >
          {choice?.kind === "skip" ? `${skipLabel} ✓` : skipLabel}
        </button>
      )}

      <AnimatePresence>
        {detail && (
          <OptionDetailSheet
            option={detail}
            chooseLabel={chooseLabel}
            onChoose={() => chooseOption(detail)}
            onClose={() => setDetail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
