"use client";

import { AnimatePresence, motion } from "motion/react";
import { Mascot } from "@/components/Mascot";
import type { ContentConfig } from "@/lib/types";

interface Step0LandingProps {
  content: ContentConfig;
  briefOpened: boolean;
  onOpenBrief: () => void;
}

/** Bước 0 — Landing hero kiểu proposal gửi client */
export function Step0Landing({ content, briefOpened, onOpenBrief }: Step0LandingProps) {
  // tách dấu hỏi cuối tên site để lắc riêng — tên do host đặt nên có thể không có "?"
  const [, titleHead = content.siteName, titleMark = ""] =
    content.siteName.match(/^(.*[^?])(\?+)$/) ?? [];

  return (
    <section className="mx-auto flex min-h-[88svh] w-full max-w-xl flex-col items-center justify-center px-5 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* bồng bềnh nhẹ để hero không đứng chết một chỗ */}
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Mascot expression="idle" alive className="mx-auto w-40 sm:w-48" />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-olive"
      >
        Proposal #01 — Confidential
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-2 font-display text-5xl font-bold text-ink sm:text-6xl"
      >
        {titleHead}
        {titleMark && (
          <motion.span
            className="inline-block origin-bottom-left"
            animate={{ rotate: [0, -16, 13, -7, 3, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 2.2,
              ease: "easeInOut",
            }}
          >
            {titleMark}
          </motion.span>
        )}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 rounded-blob bg-sand px-6 py-5 text-left"
      >
        <p className="font-semibold text-capy-deep">Gửi {content.guestName} 💌</p>
        <p className="mt-2 leading-relaxed text-ink">{content.landingIntro}</p>
        <p className="mt-3 text-right text-sm italic text-ink-soft">— {content.hostName}</p>
      </motion.div>

      <AnimatePresence>
        {!briefOpened && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.45 }}
            onClick={onOpenBrief}
            className="mt-8 rounded-full bg-tangerine font-display text-lg font-bold text-cream shadow-lg shadow-tangerine/25"
          >
            {/* lớp trong tự pulse để mời gọi; tách khỏi nút ngoài để không đụng animation vào/ra */}
            <motion.span
              className="block px-8 py-3.5"
              animate={{ scale: [1, 1.045, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              whileTap={{ scale: 0.95 }}
            >
              Xem brief 📋
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
