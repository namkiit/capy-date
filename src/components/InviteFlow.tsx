"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InviteCard } from "@/components/InviteCard";
import { Mascot, type MascotExpression } from "@/components/Mascot";
import { OptionPicker } from "@/components/OptionPicker";
import { Step0Landing } from "@/components/steps/Step0Landing";
import { Step1YesNo } from "@/components/steps/Step1YesNo";
import { Step2Schedule } from "@/components/steps/Step2Schedule";
import { Step6Timeline } from "@/components/steps/Step6Timeline";
import { Step7Dresscode } from "@/components/steps/Step7Dresscode";
import { Step8Submit } from "@/components/steps/Step8Submit";
import { SectionShell } from "@/components/steps/SectionShell";
import { fireCelebration } from "@/lib/confetti";
import type { OptionsByType } from "@/lib/db/queries";
import { buildTimeline } from "@/lib/services/timeline";
import {
  readStoredFlowState,
  sanitizeChoices,
  sanitizeFlowState,
  writeStoredFlowState,
  type FlowState,
} from "@/lib/flow-state";
import type { DayAvailability } from "@/lib/services/schedule";
import type { ContentConfig, StepChoice, TimelineDurations } from "@/lib/types";

/** Sau khoảng im lặng này (ms) mascot chuyển sang ngủ */
const SLEEPY_AFTER_MS = 45_000;
/** Mascot vui trong khoảng này (ms) sau khi user bấm Yes */
const HAPPY_BURST_MS = 4_000;

interface InviteFlowProps {
  content: ContentConfig;
  /** Calendar đã tính sẵn server-side theo giờ VN */
  days: DayAvailability[];
  options: OptionsByType;
  durations: TimelineDurations;
}

/**
 * Orchestrator của user flow: quản state các bước, persist localStorage, mascot mood.
 * Component này render client-only (ssr:false qua InviteFlowLoader) nên đọc
 * localStorage thẳng trong useState initializer — không cần effect hydrate.
 */
export function InviteFlow({ content, days, options, durations }: InviteFlowProps) {
  const [state, setState] = useState<FlowState>(() =>
    sanitizeChoices(sanitizeFlowState(readStoredFlowState(), days), {
      activeIds: {
        food: options.food.map((o) => o.id),
        movie: options.movie.map((o) => o.id),
        cafe: options.cafe.map((o) => o.id),
      },
      allowSkipMovie: content.allowSkipMovie,
      allowSkipCafe: content.allowSkipCafe,
    })
  );

  useEffect(() => {
    writeStoredFlowState(state);
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
      // đổi ngày → slot cũ vô nghĩa; media plan đã duyệt cũng phải duyệt lại
      // (không reset thì các bước sau vẫn hiện trong khi slot đã trống)
      update({ date, slot: null, timelineConfirmed: false });
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
        // đọc state ngoài updater — side effect trong updater không an toàn
        // (React được phép gọi lại updater trong StrictMode/concurrent render).
        // Chỉ tự cuộn khi chọn lần đầu, đổi lựa chọn sau đó không kéo user đi.
        if (state[field] === null) scrollTo(nextSectionId);
        setState((prev) => ({ ...prev, [field]: choice }));
      },
    [state, scrollTo]
  );

  const handleConfirmTimeline = useCallback(() => {
    update({ timelineConfirmed: true });
    scrollTo("step-dresscode");
  }, [update, scrollTo]);

  const handlePickVibe = useCallback(
    (vibe: string) => {
      update({ vibe });
      scrollTo("step-submit");
    },
    [update, scrollTo]
  );

  const handleFeedbackChange = useCallback(
    (feedback: string) => update({ feedback }),
    [update]
  );

  // ---- submit ----
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // mở lại site sau khi đã chốt deal → hiện thẳng thiệp
  const [cardOpen, setCardOpen] = useState(() => state.submittedAt !== null);
  // guard double-tap bằng ref: state `submitting` trong closure có thể stale
  const submitInFlight = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submitInFlight.current) return;

    // State có thể thiếu dữ liệu dù nút submit đang hiện (host vừa đổi config).
    // Không bao giờ return im lặng — báo lỗi và cuộn tới bước còn thiếu.
    const reportMissing = (sectionId: string) => {
      setSubmitError(
        "Có bước bị thiếu lựa chọn (lịch vừa được cập nhật 😅) — kéo lên chọn lại giúp anh nha"
      );
      scrollTo(sectionId);
    };
    const { date, slot, food, movie, cafe } = state;
    if (date === null || slot === null) return reportMissing("step-schedule");
    if (food === null) return reportMissing("step-food");
    if (movie === null) return reportMissing("step-movie");
    if (cafe === null) return reportMissing("step-cafe");

    submitInFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          slot,
          food,
          movie,
          cafe,
          vibe: state.vibe,
          feedback: state.feedback,
          noDodgeCount: state.noDodgeCount,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setSubmitError(data.error ?? "Gửi không thành công, thử lại nha 🥲");
        return;
      }
      update({ submittedAt: new Date().toISOString() });
      celebrate();
      void fireCelebration();
      setCardOpen(true);
    } catch {
      setSubmitError("Không kết nối được server — kiểm tra mạng rồi thử lại nha 🥲");
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  }, [state, update, celebrate, scrollTo]);

  const allChosen = state.slot !== null && state.food !== null && state.movie !== null && state.cafe !== null;

  const timelineItems = useMemo(() => {
    if (!allChosen || state.slot === null || !state.food || !state.movie || !state.cafe) {
      return [];
    }
    return buildTimeline({
      slot: state.slot,
      food: state.food,
      movie: state.movie,
      cafe: state.cafe,
      durations,
      pickupPlace: content.pickupPlace,
    });
  }, [allChosen, state.slot, state.food, state.movie, state.cafe, durations, content.pickupPlace]);

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
      {allChosen && (
        <Step6Timeline
          items={timelineItems}
          confirmed={state.timelineConfirmed}
          feedback={state.feedback}
          onFeedbackChange={handleFeedbackChange}
          onConfirm={handleConfirmTimeline}
        />
      )}

      {state.timelineConfirmed && (
        <Step7Dresscode
          dresscode={content.dresscode}
          vibeChoices={content.vibeChoices}
          vibe={state.vibe}
          onPickVibe={handlePickVibe}
        />
      )}

      {state.timelineConfirmed && state.vibe !== null && (
        <Step8Submit
          submitting={submitting}
          submittedAt={state.submittedAt}
          error={submitError}
          onSubmit={handleSubmit}
          onShowCard={() => setCardOpen(true)}
        />
      )}

      <AnimatePresence>
        {cardOpen && state.date && state.slot && (
          <InviteCard
            content={content}
            date={state.date}
            slot={state.slot}
            timelineItems={timelineItems}
            vibe={state.vibe}
            onClose={() => setCardOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mascot góc màn hình — thay cho cursor trên mobile, đổi biểu cảm theo tương tác */}
      <div className="pointer-events-none fixed bottom-3 right-3 z-40 md:hidden">
        <Mascot expression={mood} className="w-20 drop-shadow-sm" />
      </div>
    </main>
  );
}
