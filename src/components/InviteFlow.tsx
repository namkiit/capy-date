"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mascot, type MascotExpression } from "@/components/Mascot";
import { OptionPicker } from "@/components/OptionPicker";
import { Step0Landing } from "@/components/steps/Step0Landing";
import { Step1YesNo } from "@/components/steps/Step1YesNo";
import { Step2Schedule } from "@/components/steps/Step2Schedule";
import { SectionShell } from "@/components/steps/SectionShell";
import type { OptionsByType } from "@/lib/db/queries";
import {
  FLOW_STORAGE_KEY,
  parseFlowState,
  sanitizeChoices,
  sanitizeFlowState,
  type FlowState,
} from "@/lib/flow-state";
import type { DayAvailability } from "@/lib/services/schedule";
import type { ContentConfig, StepChoice } from "@/lib/types";

/** Sau khoảng im lặng này (ms) mascot chuyển sang ngủ */
const SLEEPY_AFTER_MS = 45_000;
/** Mascot vui trong khoảng này (ms) sau khi user bấm Yes */
const HAPPY_BURST_MS = 4_000;

interface InviteFlowProps {
  content: ContentConfig;
  /** Calendar đã tính sẵn server-side theo giờ VN */
  days: DayAvailability[];
  options: OptionsByType;
}

/**
 * Orchestrator của user flow: quản state các bước, persist localStorage, mascot mood.
 * Component này render client-only (ssr:false qua InviteFlowLoader) nên đọc
 * localStorage thẳng trong useState initializer — không cần effect hydrate.
 */
export function InviteFlow({ content, days, options }: InviteFlowProps) {
  const [state, setState] = useState<FlowState>(() =>
    sanitizeChoices(
      sanitizeFlowState(parseFlowState(window.localStorage.getItem(FLOW_STORAGE_KEY)), days),
      {
        activeIds: {
          food: options.food.map((o) => o.id),
          movie: options.movie.map((o) => o.id),
          cafe: options.cafe.map((o) => o.id),
        },
        allowSkipMovie: content.allowSkipMovie,
        allowSkipCafe: content.allowSkipCafe,
      }
    )
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

  const handleChoose = useCallback(
    (field: "food" | "movie" | "cafe", nextSectionId: string) =>
      (choice: StepChoice) => {
        setState((prev) => {
          // chỉ tự cuộn khi chọn lần đầu — đổi lựa chọn sau đó không kéo user đi
          if (prev[field] === null) scrollTo(nextSectionId);
          return { ...prev, [field]: choice };
        });
      },
    [scrollTo]
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

      {state.slot !== null && (
        <SectionShell id="step-food" eyebrow="Hạng mục 03 — Dining" title="Ăn gì đây? 🍜">
          <OptionPicker
            options={options.food}
            choice={state.food}
            chooseLabel="Chọn quán này 🤝"
            surpriseLabel="Làm em ngạc nhiên đi 🎲"
            skipLabel={null}
            onChoose={handleChoose("food", "step-movie")}
          />
        </SectionShell>
      )}

      {state.food !== null && (
        <SectionShell
          id="step-movie"
          eyebrow="Hạng mục 04 — Entertainment"
          title="Xem phim gì? 🎬"
        >
          <OptionPicker
            options={options.movie}
            choice={state.movie}
            chooseLabel="Chốt phim này 🎬"
            surpriseLabel="Để anh chọn phim bí mật 🎲"
            skipLabel={content.allowSkipMovie ? "Hôm đó không xem phim cũng được" : null}
            onChoose={handleChoose("movie", "step-cafe")}
          />
        </SectionShell>
      )}

      {state.movie !== null && (
        <SectionShell id="step-cafe" eyebrow="Hạng mục 05 — Chill" title="Cafe chốt hạ 🧋">
          <OptionPicker
            options={options.cafe}
            choice={state.cafe}
            chooseLabel="Chọn quán này 🧋"
            surpriseLabel="Quán bí mật của anh 🎲"
            skipLabel={content.allowSkipCafe ? "Hôm đó bỏ qua cafe cũng được" : null}
            onChoose={handleChoose("cafe", "step-timeline")}
          />
        </SectionShell>
      )}
      {/* các bước tiếp theo (timeline, dresscode, submit) gắn vào đây ở phase sau */}

      {/* Mascot góc màn hình — thay cho cursor trên mobile, đổi biểu cảm theo tương tác */}
      <div className="pointer-events-none fixed bottom-3 right-3 z-40 md:hidden">
        <Mascot expression={mood} className="w-20 drop-shadow-sm" />
      </div>
    </main>
  );
}
