import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT, DEFAULT_SCHEDULE, mergeWithDefaults } from "./config-defaults";

describe("mergeWithDefaults", () => {
  it("trả về nguyên default khi DB chưa có giá trị (null)", () => {
    expect(mergeWithDefaults(DEFAULT_CONTENT, null)).toEqual(DEFAULT_CONTENT);
  });

  it("đè field từ DB lên default, giữ các field default còn thiếu", () => {
    const stored = { guestName: "Linh", yesNoQuestion: "Đi chơi hông?" };
    const merged = mergeWithDefaults(DEFAULT_CONTENT, stored);

    expect(merged.guestName).toBe("Linh");
    expect(merged.yesNoQuestion).toBe("Đi chơi hông?");
    // field không có trong DB giữ nguyên default
    expect(merged.siteName).toBe(DEFAULT_CONTENT.siteName);
    expect(merged.vibeChoices).toEqual(DEFAULT_CONTENT.vibeChoices);
  });

  it("bỏ qua giá trị DB không phải object (array/string/number)", () => {
    expect(mergeWithDefaults(DEFAULT_SCHEDULE, ["19:00"])).toEqual(DEFAULT_SCHEDULE);
    expect(mergeWithDefaults(DEFAULT_SCHEDULE, "hong hop le")).toEqual(DEFAULT_SCHEDULE);
    expect(mergeWithDefaults(DEFAULT_SCHEDULE, 42)).toEqual(DEFAULT_SCHEDULE);
  });

  it("field null trong DB đè default thành null thay vì fallback — khóa hành vi hiện tại", () => {
    const stored = { guestName: null };

    const merged = mergeWithDefaults(DEFAULT_CONTENT, stored);

    expect(merged.guestName).toBeNull();
    // field khác không có trong DB vẫn giữ default
    expect(merged.siteName).toBe(DEFAULT_CONTENT.siteName);
  });
});
