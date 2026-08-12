"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useEffect } from "react";
import { Mascot } from "@/components/Mascot";
import type { OptionRow } from "@/lib/db/schema";
import { isOptimizableImage } from "@/lib/image-src";

interface OptionDetailSheetProps {
  option: OptionRow;
  chooseLabel: string;
  onChoose: () => void;
  onClose: () => void;
}

/** Bottom-sheet chi tiết một option: ảnh, mô tả, giá, địa chỉ, note của host */
export function OptionDetailSheet({
  option,
  chooseLabel,
  onChoose,
  onClose,
}: OptionDetailSheetProps) {
  // khóa scroll nền khi sheet mở
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center"
    >
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85svh] w-full max-w-lg overflow-y-auto rounded-t-blob bg-cream p-5 pb-8 sm:rounded-blob"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-latte sm:hidden" />

        {option.images.length > 0 ? (
          <div className="flex snap-x gap-2 overflow-x-auto">
            {option.images.map((src) => (
              <div
                key={src}
                className="relative aspect-[4/3] w-4/5 shrink-0 snap-center overflow-hidden rounded-2xl bg-latte"
              >
                <Image
                  src={src}
                  alt={option.name}
                  fill
                  sizes="80vw"
                  className="object-cover"
                  unoptimized={!isOptimizableImage(src)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-[3/1] items-end justify-center rounded-2xl bg-latte">
            <Mascot expression="idle" className="w-28" />
          </div>
        )}

        <h3 className="mt-4 font-display text-2xl font-bold text-ink">{option.name}</h3>
        {option.extra?.genre && (
          <span className="mt-1 inline-block rounded-full bg-olive-soft px-3 py-1 text-xs font-bold text-olive">
            {option.extra.genre}
          </span>
        )}
        {option.description && (
          <p className="mt-2 leading-relaxed text-ink">{option.description}</p>
        )}

        <dl className="mt-4 space-y-2 text-sm">
          {option.priceRange && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-capy-deep">💸 Budget:</dt>
              <dd className="text-ink">{option.priceRange}</dd>
            </div>
          )}
          {option.address && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-capy-deep">📍 Địa chỉ:</dt>
              <dd className="text-ink">
                {option.address}
                {option.mapUrl && (
                  <>
                    {" · "}
                    <a
                      href={option.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-olive underline underline-offset-2"
                    >
                      Google Maps
                    </a>
                  </>
                )}
              </dd>
            </div>
          )}
          {option.extra?.suggestedShowtime && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-capy-deep">🎟️ Suất gợi ý:</dt>
              <dd className="text-ink">{option.extra.suggestedShowtime}</dd>
            </div>
          )}
          {option.extra?.trailerUrl && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-capy-deep">▶ Trailer:</dt>
              <dd>
                <a
                  href={option.extra.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-olive underline underline-offset-2"
                >
                  Xem trên YouTube
                </a>
              </dd>
            </div>
          )}
        </dl>

        {option.hostNote && (
          <p className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm italic text-capy-deep">
            💬 {option.hostNote}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="rounded-full border-2 border-latte px-6 py-3 font-display font-bold text-ink-soft"
          >
            Để xem đã
          </button>
          <button
            onClick={onChoose}
            className="flex-1 rounded-full bg-tangerine px-6 py-3 font-display text-lg font-bold text-cream shadow-lg shadow-tangerine/25 active:scale-95"
          >
            {chooseLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
