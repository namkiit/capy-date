"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { DayAvailability } from "@/lib/services/schedule";
import { SectionShell } from "./SectionShell";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_NAMES = [
  "",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];

const BUSY_MESSAGE = "Ngày này anh có deadline 😢 Chọn ngày khác nha!";

interface Step2ScheduleProps {
  days: DayAvailability[];
  selectedDate: string | null;
  selectedSlot: string | null;
  onPickDate: (date: string) => void;
  onPickSlot: (slot: string) => void;
}

function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10));
}

function monthOf(date: string): number {
  return Number(date.slice(5, 7));
}

/** "Thứ Năm 13/08" */
export function formatDayLabel(day: DayAvailability): string {
  return `${WEEKDAY_NAMES[day.isoWeekday]} ${day.date.slice(8, 10)}/${day.date.slice(5, 7)}`;
}

/** Bước 2 — chọn ngày trên calendar rồi chọn khung giờ của ngày đó */
export function Step2Schedule({
  days,
  selectedDate,
  selectedSlot,
  onPickDate,
  onPickSlot,
}: Step2ScheduleProps) {
  const [busyNote, setBusyNote] = useState<string | null>(null);

  // pad đầu grid để cột đầu tiên luôn là T2
  const leadingBlanks = useMemo(
    () => (days.length > 0 ? days[0].isoWeekday - 1 : 0),
    [days]
  );

  const selectedDay = days.find((d) => d.date === selectedDate) ?? null;

  const monthRange = useMemo(() => {
    if (days.length === 0) return "";
    const first = monthOf(days[0].date);
    const last = monthOf(days[days.length - 1].date);
    return first === last ? `Tháng ${first}` : `Tháng ${first} – ${last}`;
  }, [days]);

  function handleDayClick(day: DayAvailability) {
    if (day.disabled) {
      setBusyNote(BUSY_MESSAGE);
      return;
    }
    setBusyNote(null);
    onPickDate(day.date);
  }

  return (
    <SectionShell
      id="step-schedule"
      eyebrow="Hạng mục 02 — Timing"
      title="Chọn ngày giờ chạy campaign 🗓️"
    >
      <p className="text-sm text-ink-soft">
        Ngày mờ là anh kẹt deadline. {monthRange ? `(${monthRange})` : ""}
      </p>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="pb-1 text-center text-xs font-bold uppercase text-ink-soft"
          >
            {label}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} aria-hidden />
        ))}
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          const dom = dayOfMonth(day.date);
          return (
            <button
              key={day.date}
              onClick={() => handleDayClick(day)}
              title={day.disabled ? BUSY_MESSAGE : formatDayLabel(day)}
              aria-disabled={day.disabled}
              aria-pressed={isSelected}
              className={`relative aspect-square rounded-xl text-sm font-semibold transition-colors ${
                isSelected
                  ? "bg-tangerine text-cream shadow-md shadow-tangerine/30"
                  : day.disabled
                    ? "bg-sand/60 text-ink-soft/40"
                    : "bg-sand text-ink hover:bg-latte active:bg-latte"
              }`}
            >
              {dom}
              {dom === 1 && (
                <span className="absolute inset-x-0 bottom-0.5 text-[9px] font-bold text-olive">
                  T{monthOf(day.date)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {busyNote && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl bg-latte px-4 py-2.5 text-sm text-capy-deep"
          >
            {busyNote}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={selectedDay.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5"
          >
            <p className="text-sm font-semibold text-ink">
              {formatDayLabel(selectedDay)} — mấy giờ đẹp nhất? ⏰
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {selectedDay.slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onPickSlot(slot)}
                  aria-pressed={slot === selectedSlot}
                  className={`rounded-full px-5 py-2.5 font-display font-bold transition-colors ${
                    slot === selectedSlot
                      ? "bg-olive text-cream shadow-md shadow-olive/25"
                      : "bg-sand text-ink hover:bg-latte"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
