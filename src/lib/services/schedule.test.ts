import { describe, expect, it } from "vitest";
import { DEFAULT_SCHEDULE } from "@/lib/config-defaults";
import type { ScheduleConfig } from "@/lib/types";
import { buildCalendar, getTodayInVietnam } from "./schedule";

/** 2026-08-12 là thứ Tư */
const TODAY = "2026-08-12";

function makeSchedule(patch: Partial<ScheduleConfig> = {}): ScheduleConfig {
  return { ...DEFAULT_SCHEDULE, ...patch };
}

describe("getTodayInVietnam", () => {
  it("trả về ngày theo giờ VN, không theo UTC", () => {
    // 18:30 UTC = 01:30 hôm sau giờ VN (+7)
    expect(getTodayInVietnam(new Date("2026-08-12T18:30:00Z"))).toBe("2026-08-13");
  });

  it("giữ nguyên ngày khi chưa qua nửa đêm giờ VN", () => {
    // 10:00 UTC = 17:00 cùng ngày giờ VN
    expect(getTodayInVietnam(new Date("2026-08-12T10:00:00Z"))).toBe("2026-08-12");
  });
});

describe("buildCalendar", () => {
  it("bắt đầu từ ngày mai và trả về đủ weeksAhead*7 ngày", () => {
    const days = buildCalendar(makeSchedule({ weeksAhead: 4 }), TODAY);
    expect(days).toHaveLength(28);
    expect(days[0].date).toBe("2026-08-13");
    expect(days[27].date).toBe("2026-09-09");
  });

  it("ngày trong tuần dùng weekdaySlots, cuối tuần dùng weekendSlots", () => {
    const schedule = makeSchedule({
      weekdaySlots: ["19:00"],
      weekendSlots: ["10:00", "15:00"],
    });
    const days = buildCalendar(schedule, TODAY);
    const thursday = days.find((d) => d.date === "2026-08-13");
    const saturday = days.find((d) => d.date === "2026-08-15");
    const sunday = days.find((d) => d.date === "2026-08-16");
    expect(thursday?.slots).toEqual(["19:00"]);
    expect(saturday?.slots).toEqual(["10:00", "15:00"]);
    expect(sunday?.slots).toEqual(["10:00", "15:00"]);
  });

  it("ngày bận bị disable và không còn slot", () => {
    const days = buildCalendar(makeSchedule({ busyDates: ["2026-08-15"] }), TODAY);
    const busy = days.find((d) => d.date === "2026-08-15");
    expect(busy?.disabled).toBe(true);
    expect(busy?.slots).toEqual([]);
  });

  it("override thay slot của ngày cụ thể, override rỗng nghĩa là bận", () => {
    const schedule = makeSchedule({
      dateSlotOverrides: {
        "2026-08-14": ["21:30"],
        "2026-08-20": [],
      },
    });
    const days = buildCalendar(schedule, TODAY);
    expect(days.find((d) => d.date === "2026-08-14")?.slots).toEqual(["21:30"]);
    const emptied = days.find((d) => d.date === "2026-08-20");
    expect(emptied?.disabled).toBe(true);
    expect(emptied?.slots).toEqual([]);
  });

  it("weekday tính đúng theo ISO (T2=1 ... CN=7)", () => {
    const days = buildCalendar(makeSchedule(), TODAY);
    expect(days.find((d) => d.date === "2026-08-13")?.isoWeekday).toBe(4); // thứ 5
    expect(days.find((d) => d.date === "2026-08-16")?.isoWeekday).toBe(7); // CN
    expect(days.find((d) => d.date === "2026-08-17")?.isoWeekday).toBe(1); // thứ 2
  });

  it("clamp weeksAhead vào khoảng 1..8 để config sai không phá UI", () => {
    expect(buildCalendar(makeSchedule({ weeksAhead: 0 }), TODAY)).toHaveLength(7);
    expect(buildCalendar(makeSchedule({ weeksAhead: 99 }), TODAY)).toHaveLength(56);
  });
});
