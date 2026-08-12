import { describe, expect, it } from "vitest";
import { optionInputSchema, scheduleConfigSchema } from "./admin-schemas";
import type { OptionInput } from "./admin-schemas";

const baseSchedule = {
  weeksAhead: 4,
  weekdaySlots: ["19:00"],
  weekendSlots: ["10:00", "23:59"],
  busyDates: [],
  dateSlotOverrides: {},
};

const baseOption: OptionInput = {
  type: "food",
  name: "Quán test",
  description: "",
  images: [],
  priceRange: null,
  address: null,
  mapUrl: null,
  hostNote: null,
  extra: null,
  isActive: true,
  sortOrder: 0,
};

describe("scheduleConfigSchema — regex giờ chặt", () => {
  it("chấp nhận giờ hợp lệ 00:00–23:59", () => {
    expect(scheduleConfigSchema.safeParse(baseSchedule).success).toBe(true);
    expect(
      scheduleConfigSchema.safeParse({ ...baseSchedule, weekdaySlots: ["00:00"] }).success
    ).toBe(true);
  });

  it("từ chối giờ không tồn tại (99:99, 24:00, 19:60)", () => {
    for (const bad of ["99:99", "24:00", "19:60"]) {
      const result = scheduleConfigSchema.safeParse({
        ...baseSchedule,
        weekdaySlots: [bad],
      });
      expect(result.success).toBe(false);
    }
  });
});

describe("optionInputSchema — URL chỉ nhận https", () => {
  it("chấp nhận https://", () => {
    const result = optionInputSchema.safeParse({
      ...baseOption,
      mapUrl: "https://maps.google.com/abc",
      images: ["https://example.com/anh.jpg"],
    });
    expect(result.success).toBe(true);
  });

  it("từ chối javascript: và http:", () => {
    expect(
      optionInputSchema.safeParse({ ...baseOption, mapUrl: "javascript:alert(1)" }).success
    ).toBe(false);
    expect(
      optionInputSchema.safeParse({ ...baseOption, images: ["http://example.com/a.jpg"] })
        .success
    ).toBe(false);
    expect(
      optionInputSchema.safeParse({
        ...baseOption,
        type: "movie",
        extra: { trailerUrl: "javascript:alert(1)" },
      }).success
    ).toBe(false);
  });
});
