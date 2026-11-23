"use client";

import { useEffect, useMemo, useState } from "react";
import {
  StatusMessage,
  btnGhostCls,
  btnPrimaryCls,
  inputCls,
  labelCls,
  type AdminMessage,
} from "@/components/admin/AdminUI";
import { adminApi } from "@/lib/admin-client";
import { buildCalendar, getTodayInVietnam } from "@/lib/services/schedule";
import type { AppConfig, ScheduleConfig } from "@/lib/types";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** "19:00, 20:30" → ["19:00","20:30"] | null nếu có token sai định dạng */
function parseSlots(raw: string): string[] | null {
  const tokens = raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return tokens.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) ? tokens : null;
}

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null);
  const [weekdayStr, setWeekdayStr] = useState("");
  const [weekendStr, setWeekendStr] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [overrideStr, setOverrideStr] = useState("");
  const [message, setMessage] = useState<AdminMessage>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi<{ config: AppConfig }>("/api/admin/config")
      .then(({ config }) => {
        setSchedule(config.schedule);
        setWeekdayStr(config.schedule.weekdaySlots.join(", "));
        setWeekendStr(config.schedule.weekendSlots.join(", "));
      })
      .catch((err) =>
        setMessage({ kind: "error", text: err instanceof Error ? err.message : "Lỗi tải config" })
      );
  }, []);

  // grid ngày tính theo GIỜ VN như phía khách (buildCalendar) — host mở admin từ
  // múi giờ khác cũng không lệch ngày; chỉ lấy date/isoWeekday, trạng thái bận
  // hiển thị trực tiếp từ schedule state
  const days = useMemo(() => {
    if (!schedule) return [];
    return buildCalendar(schedule, getTodayInVietnam()).map((d) => ({
      date: d.date,
      isoWeekday: d.isoWeekday,
    }));
  }, [schedule]);

  if (!schedule) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Lịch rảnh/bận 🗓️</h1>
        <StatusMessage message={message} />
        {!message && <p className="mt-4 text-ink-soft">Đang tải...</p>}
      </div>
    );
  }

  const isBusy = (date: string) => schedule.busyDates.includes(date);
  const hasOverride = (date: string) => schedule.dateSlotOverrides[date] !== undefined;

  function selectDate(date: string) {
    setSelectedDate(date);
    setOverrideStr(schedule?.dateSlotOverrides[date]?.join(", ") ?? "");
  }

  function toggleBusy(date: string) {
    setSchedule((prev) =>
      prev === null
        ? prev
        : {
            ...prev,
            busyDates: prev.busyDates.includes(date)
              ? prev.busyDates.filter((d) => d !== date)
              : [...prev.busyDates, date],
          }
    );
  }

  function applyOverride() {
    if (selectedDate === null) return;
    const slots = parseSlots(overrideStr);
    if (slots === null) {
      setMessage({ kind: "error", text: "Slot riêng sai định dạng — dùng HH:mm, cách nhau dấu phẩy" });
      return;
    }
    setSchedule((prev) => {
      if (prev === null) return prev;
      const overrides = { ...prev.dateSlotOverrides };
      if (overrideStr.trim() === "") {
        delete overrides[selectedDate];
      } else {
        overrides[selectedDate] = slots;
      }
      return { ...prev, dateSlotOverrides: overrides };
    });
    setMessage({ kind: "ok", text: `Đã áp dụng slot riêng cho ${selectedDate} (nhớ bấm Lưu)` });
  }

  async function handleSave() {
    const weekdaySlots = parseSlots(weekdayStr);
    const weekendSlots = parseSlots(weekendStr);
    if (weekdaySlots === null || weekendSlots === null) {
      setMessage({ kind: "error", text: "Slot sai định dạng — dùng HH:mm, cách nhau dấu phẩy" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await adminApi("/api/admin/config", {
        method: "PUT",
        body: JSON.stringify({ schedule: { ...schedule, weekdaySlots, weekendSlots } }),
      });
      setMessage({ kind: "ok", text: "Đã lưu lịch ✓" });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Lưu thất bại" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Lịch rảnh/bận 🗓️</h1>
      <p className="mt-1 text-xs text-ink-soft">
        Slot là giờ bắt đầu buổi hẹn (giờ đi chơi) — giờ ăn tự cộng thêm thời lượng vui chơi.
      </p>

      <label className={labelCls}>Slot ngày thường (T2–T6)</label>
      <input value={weekdayStr} onChange={(e) => setWeekdayStr(e.target.value)} className={inputCls} placeholder="19:00, 20:00" />
      <label className={labelCls}>Slot cuối tuần (T7–CN)</label>
      <input value={weekendStr} onChange={(e) => setWeekendStr(e.target.value)} className={inputCls} placeholder="10:00, 15:00, 19:00" />
      <label className={labelCls}>Số tuần mở lịch (1–8)</label>
      <input
        type="number"
        min={1}
        max={8}
        value={schedule.weeksAhead}
        onChange={(e) =>
          setSchedule({ ...schedule, weeksAhead: Math.min(8, Math.max(1, Number(e.target.value) || 1)) })
        }
        className={`${inputCls} w-24`}
      />

      <p className={labelCls}>Bấm vào ngày để chỉnh — nền cam = bận, chấm xanh = có slot riêng</p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-1 text-center text-[11px] font-bold uppercase text-ink-soft">
            {label}
          </div>
        ))}
        {days.length > 0 &&
          Array.from({ length: days[0].isoWeekday - 1 }).map((_, i) => <div key={`blank-${i}`} aria-hidden />)}
        {days.map((day) => (
          <button
            key={day.date}
            onClick={() => selectDate(day.date)}
            className={`relative aspect-square rounded-lg text-xs font-semibold transition-colors ${
              isBusy(day.date)
                ? "bg-tangerine/70 text-cream"
                : "bg-sand text-ink hover:bg-latte"
            } ${selectedDate === day.date ? "ring-2 ring-capy-deep" : ""}`}
          >
            {Number(day.date.slice(8, 10))}
            {hasOverride(day.date) && (
              <span className="absolute bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-olive" />
            )}
          </button>
        ))}
      </div>

      {selectedDate && (
        <div className="mt-4 rounded-2xl bg-sand/70 p-4">
          <p className="font-bold text-ink">{selectedDate}</p>
          <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={isBusy(selectedDate)} onChange={() => toggleBusy(selectedDate)} />
            Ngày này bận (disable hẳn)
          </label>
          <label className={labelCls}>Slot riêng cho ngày này (trống = theo rule chung)</label>
          <div className="flex gap-2">
            <input
              value={overrideStr}
              onChange={(e) => setOverrideStr(e.target.value)}
              className={inputCls}
              placeholder="21:00, 21:30"
            />
            <button onClick={applyOverride} className={btnGhostCls}>
              Áp dụng
            </button>
          </div>
        </div>
      )}

      <StatusMessage message={message} />
      <button onClick={handleSave} disabled={saving} className={`${btnPrimaryCls} mt-4`}>
        {saving ? "Đang lưu..." : "Lưu lịch 💾"}
      </button>
    </div>
  );
}
