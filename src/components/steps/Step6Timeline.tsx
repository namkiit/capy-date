"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { TimelineItem } from "@/lib/services/timeline";
import { SectionShell } from "./SectionShell";

interface Step6TimelineProps {
  items: TimelineItem[];
  confirmed: boolean;
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  onConfirm: () => void;
}

/** Bước 6 — Media plan: timeline dọc generate từ các lựa chọn, kèm ô feedback */
export function Step6Timeline({
  items,
  confirmed,
  feedback,
  onFeedbackChange,
  onConfirm,
}: Step6TimelineProps) {
  const [showFeedback, setShowFeedback] = useState(feedback.length > 0);
  // draft cục bộ, chỉ lift lên state cha (persist localStorage) khi blur —
  // tránh JSON.stringify + write + re-render toàn cây mỗi phím gõ
  const [draft, setDraft] = useState(feedback);

  return (
    <SectionShell
      id="step-timeline"
      eyebrow="Hạng mục 06 — Media Plan"
      title="Timeline buổi hẹn 📋"
    >
      <ol className="relative ml-1 space-y-0">
        {items.map((item, index) => (
          <motion.li
            key={`${item.time}-${item.label}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + index * 0.12, duration: 0.4, ease: "easeOut" }}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {/* đường nối dọc */}
            {index < items.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[13px] top-7 h-full w-0.5 rounded bg-latte"
              />
            )}
            <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand text-sm">
              {item.icon}
            </span>
            <div className="pt-0.5">
              <p className="font-display text-sm font-bold text-tangerine">{item.time}</p>
              <p className="leading-snug text-ink">{item.label}</p>
            </div>
          </motion.li>
        ))}
      </ol>

      <p className="mt-4 text-xs italic text-ink-soft">
        * Giờ giấc là ước tính của agency, thực tế có thể xê dịch theo độ vui.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {!showFeedback && (
          <button
            onClick={() => setShowFeedback(true)}
            className="self-start text-sm font-semibold text-ink-soft underline-offset-2 hover:underline"
          >
            Có feedback cho media plan không? 📝
          </button>
        )}
        <AnimatePresence>
          {showFeedback && (
            <motion.textarea
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => onFeedbackChange(draft)}
              placeholder="Feedback gì cứ ghi ở đây, agency tiếp thu hết…"
              rows={3}
              maxLength={2000}
              className="w-full rounded-2xl border-2 border-latte bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-capy"
            />
          )}
        </AnimatePresence>

        <button
          onClick={onConfirm}
          disabled={confirmed}
          className={`rounded-full px-8 py-3.5 font-display text-lg font-bold transition-transform active:scale-95 ${
            confirmed
              ? "cursor-default bg-olive-soft text-olive"
              : "bg-tangerine text-cream shadow-lg shadow-tangerine/25"
          }`}
        >
          {confirmed ? "Media plan đã duyệt ✓" : "Duyệt media plan này ✅"}
        </button>
      </div>
    </SectionShell>
  );
}
