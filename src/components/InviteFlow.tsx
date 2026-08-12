"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mascot, type MascotExpression } from "@/components/Mascot";
import { Step0Landing } from "@/components/steps/Step0Landing";
import { Step1YesNo } from "@/components/steps/Step1YesNo";
import { Step2Schedule } from "@/components/steps/Step2Schedule";
import {
  FLOW_STORAGE_KEY,
  parseFlowState,
  sanitizeFlowState,
  type FlowState,
} from "@/lib/flow-state";
import type { DayAvailability } from "@/lib/services/schedule";
import type { ContentConfig } from "@/lib/types";

/** Sau khoảng im lặng này (ms) mascot chuyển sang ngủ */
const SLEEPY_AFTER_MS = 45_000;
/** Mascot vui trong khoảng này (ms) sau khi user bấm Yes */
const HAPPY_BURST_MS = 4_000;

interface InviteFlowProps {
  content: ContentConfig;
  /** Calendar đã tính sẵn server-side theo giờ VN */
  days: DayAvailability[];
}

/**
 * Orchestrator của user flow: quản state các bước, persist localStorage, mascot mood.
 * Component này render client-only (ssr:false qua InviteFlowLoader) nên đọc
 * localStorage thẳng trong useState initializer — không cần effect hydrate.
 */
export function InviteFlow({ content, days }: InviteFlowProps) {
  const [state, setState] = useState<FlowState>(() =>
    sanitizeFlowState(parseFlowState(window.localStorage.getItem(FLOW_STORAGE_KEY)), days)
  );

  useEffect(() => {
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const update = useCallback((patch: Partial<FlowState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // ---- mascot mood ----
  const [mood, setMood] = useState<MascotExpression>("idle");
  const happyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback(() => {
    setMood("happy");
    if (happyTimer.current) clearTimeout(happyTimer.current);
    happyTimer.current = setTimeout(() => setMood("idle"), HAPPY_BURST_MS);
  }, []);

  useEffect(() => {
    let sleepyTimer = setTimeout(() => setMood("sleepy"), SLEEPY_AFTER_MS);
    const wake = () => {
      clearTimeout(sleepyTimer);
      setMood((m) => (m === "sleepy" ? "idle" : m));
      sleepyTimer = setTimeout(() => setMood("sleepy"), SLEEPY_AFTER_MS);
    };
    window.addEventListener("pointerdown", wake);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(sleepyTimer);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  // ---- cuộn tới section mới mở ----
  const scrollTo = useCallback((id: string) => {
    // đợi section mount xong rồi mới cuộn
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleOpenBrief = useCallback(() => {
    update({ briefOpened: true });
    scrollTo("step-approve");
  }, [update, scrollTo]);

  const handleApprove = useCallback(() => {
    update({ approved: true });
    celebrate();
    scrollTo("step-schedule");
  }, [update, celebrate, scrollTo]);

  const handleNoDodge = useCallback(() => {
    setState((prev) => ({ ...prev, noDodgeCount: prev.noDodgeCount + 1 }));
  }, []);

  const handlePickDate = useCallback(
    (date: string) => {
      // đổi ngày → slot cũ vô nghĩa, reset
      update({ date, slot: null });
    },
    [update]
  );

  const handlePickSlot = useCallback(
    (slot: string) => {
      update({ slot });
      celebrate();
      scrollTo("step-food");
    },
    [update, celebrate, scrollTo]
  );

  return (
    <main className="relative flex-1 pb-24">
      <Step0Landing
        content={content}
        briefOpened={state.briefOpened}
        onOpenBrief={handleOpenBrief}
      />

      {state.briefOpened && !state.approved && (
        <Step1YesNo
          question={content.yesNoQuestion}
          noCaptions={content.noButtonCaptions}
          noDodgeCount={state.noDodgeCount}
          onDodge={handleNoDodge}
          onApprove={handleApprove}
        />
      )}

      <AnimatePresence>
        {state.approved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-xl px-5 pt-6 text-center"
          >
            <p className="font-display text-xl font-bold text-olive">
              Proposal approved 🎉 Cảm ơn {content.guestName}!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {state.approved && (
        <Step2Schedule
          days={days}
          selectedDate={state.date}
          selectedSlot={state.slot}
          onPickDate={handlePickDate}
          onPickSlot={handlePickSlot}
        />
      )}
      {/* các bước tiếp theo (quán ăn, phim, cafe...) gắn vào đây ở phase sau */}

      {/* Mascot góc màn hình — thay cho cursor trên mobile, đổi biểu cảm theo tương tác */}
      <div className="pointer-events-none fixed bottom-3 right-3 z-40 md:hidden">
        <Mascot expression={mood} className="w-20 drop-shadow-sm" />
      </div>
    </main>
  );
}
