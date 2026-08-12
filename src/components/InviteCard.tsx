"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { formatFullVietnameseDate } from "@/lib/format";
import type { TimelineItem } from "@/lib/services/timeline";
import type { ContentConfig } from "@/lib/types";

interface InviteCardProps {
  content: ContentConfig;
  date: string;
  slot: string;
  timelineItems: TimelineItem[];
  vibe: string | null;
  onClose: () => void;
}

/**
 * Thiệp mời — "campaign one-pager" tổng hợp toàn bộ lựa chọn.
 * Vùng ref cardRef được render thành PNG khi bấm tải (html-to-image).
 */
export function InviteCard({ content, date, slot, timelineItems, vibe, onClose }: InviteCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    setDownloadNote(null);
    try {
      // import động — html-to-image chỉ cần khi bấm tải
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#faf6ef",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = "capy-date-invitation.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      // iOS Safari có thể chặn — hướng dẫn chụp màn hình thay thế
      console.error("Tải thiệp thất bại:", err);
      setDownloadNote("Trình duyệt không cho tải tự động 😢 Em chụp màn hình tấm thiệp giúp anh nha 📸");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-sm"
      >
        {/* ===== vùng được chụp thành ảnh ===== */}
        <div
          ref={cardRef}
          className="overflow-hidden rounded-blob border-4 border-latte bg-cream"
        >
          <div className="bg-sand px-6 pb-4 pt-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-olive">
              Campaign confirmed
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-ink">
              {content.siteName}
            </h2>
            <p className="mt-1 font-display text-sm font-bold text-capy-deep">
              {content.hostName} × {content.guestName}
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-2xl bg-tangerine/10 px-4 py-3 text-center">
              <p className="font-display text-lg font-bold text-tangerine">
                {formatFullVietnameseDate(date)}
              </p>
              <p className="text-sm font-semibold text-capy-deep">Bắt đầu lúc {slot}</p>
            </div>

            <ul className="mt-4 space-y-2">
              {timelineItems.map((item) => (
                <li key={`${item.time}-${item.label}`} className="flex gap-2.5 text-sm">
                  <span aria-hidden>{item.icon}</span>
                  <span className="font-bold text-tangerine">{item.time}</span>
                  <span className="min-w-0 flex-1 leading-snug text-ink">{item.label}</span>
                </li>
              ))}
            </ul>

            {vibe && (
              <p className="mt-4 text-center text-sm text-ink">
                Dresscode vibe: <span className="font-bold text-olive">{vibe}</span>
              </p>
            )}
            <div className="mt-2 flex justify-center gap-1.5">
              {content.dresscode.colors.map((color) => (
                <span
                  key={color}
                  style={{ backgroundColor: color }}
                  className="h-4 w-4 rounded-full border border-latte"
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Mascot expression="happy" className="w-20" />
            </div>
            <p className="pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Proposal #01 — approved 🧡
            </p>
          </div>
        </div>
        {/* ===== hết vùng chụp ===== */}

        {downloadNote && (
          <p className="mt-3 rounded-2xl bg-cream px-4 py-2.5 text-center text-sm text-capy-deep">
            {downloadNote}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="rounded-full border-2 border-cream px-6 py-3 font-display font-bold text-cream"
          >
            Đóng
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 rounded-full bg-tangerine px-6 py-3 font-display text-lg font-bold text-cream shadow-lg shadow-tangerine/30 active:scale-95 disabled:opacity-60"
          >
            {downloading ? "Đang xuất ảnh..." : "Tải thiệp về máy 📥"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
