import type { ScheduleConfig } from "@/lib/types";

/**
 * Tính lịch khả dụng cho bước chọn ngày & giờ.
 * Toàn bộ là pure function trên chuỗi YYYY-MM-DD — tính toán bằng Date UTC
 * để không phụ thuộc múi giờ server (Vercel chạy UTC).
 */

/** Một ngày trên calendar cùng các slot còn chọn được */
export interface DayAvailability {
  /** YYYY-MM-DD */
  date: string;
  /** ISO weekday: T2=1 ... T7=6, CN=7 */
  isoWeekday: number;
  /** Slot giờ HH:mm chọn được trong ngày (rỗng nếu bận) */
  slots: string[];
  disabled: boolean;
}

const MIN_WEEKS = 1;
const MAX_WEEKS = 8;

/** "Hôm nay" theo múi giờ Việt Nam — server UTC lệch tới 7 tiếng nếu dùng Date trực tiếp */
export function getTodayInVietnam(now: Date = new Date()): string {
  // en-CA cho format YYYY-MM-DD sẵn
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseDateUtc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoWeekdayOf(d: Date): number {
  // getUTCDay: CN=0..T7=6 → ISO: T2=1..CN=7
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

/**
 * Dựng calendar bắt đầu từ NGÀY MAI (không cho chọn hôm nay — tránh case slot
 * trong ngày đã trôi qua), dài weeksAhead tuần.
 * Ưu tiên: busyDates > dateSlotOverrides > rule weekday/weekend.
 */
export function buildCalendar(schedule: ScheduleConfig, today: string): DayAvailability[] {
  const weeks = Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, schedule.weeksAhead));
  const busy = new Set(schedule.busyDates);
  const days: DayAvailability[] = [];

  const cursor = parseDateUtc(today);
  for (let i = 1; i <= weeks * 7; i++) {
    const d = new Date(cursor);
    d.setUTCDate(cursor.getUTCDate() + i);
    const date = formatDateUtc(d);
    const isoWeekday = isoWeekdayOf(d);

    let slots: string[];
    if (busy.has(date)) {
      slots = [];
    } else if (schedule.dateSlotOverrides[date] !== undefined) {
      slots = schedule.dateSlotOverrides[date];
    } else {
      slots = isoWeekday >= 6 ? schedule.weekendSlots : schedule.weekdaySlots;
    }

    days.push({ date, isoWeekday, slots, disabled: slots.length === 0 });
  }
  return days;
}
