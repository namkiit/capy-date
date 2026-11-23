import { describe, expect, it } from "vitest";
import { DEFAULT_DURATIONS } from "@/lib/config-defaults";
import type { StepChoice } from "@/lib/types";
import { buildTimeline } from "./timeline";

const activityChoice: StepChoice = { kind: "option", optionId: 4, optionName: "Workshop làm gốm" };
const foodChoice: StepChoice = { kind: "option", optionId: 1, optionName: "Quán nướng ấm cúng" };
const movieChoice: StepChoice = { kind: "option", optionId: 2, optionName: "Phim rom-com" };
const cafeChoice: StepChoice = { kind: "option", optionId: 3, optionName: "Cafe sân vườn" };

function build(overrides: {
  slot?: string;
  activity?: StepChoice;
  food?: StepChoice;
  movie?: StepChoice;
  cafe?: StepChoice;
}) {
  return buildTimeline({
    slot: overrides.slot ?? "19:00",
    activity: overrides.activity ?? activityChoice,
    food: overrides.food ?? foodChoice,
    movie: overrides.movie ?? movieChoice,
    cafe: overrides.cafe ?? cafeChoice,
    durations: DEFAULT_DURATIONS,
    pickupPlace: "cổng nhà em",
  });
}

describe("buildTimeline", () => {
  it("flow đầy đủ: đón trước slot, chơi, ăn, phim, cafe, wrap-up đúng giờ cộng dồn", () => {
    const items = build({});
    // đón 18:30, chơi 19:00 (+90), ăn 20:30 (+90), phim 22:00 (+135), cafe 00:15 (+60), wrap 01:15
    expect(items.map((i) => i.time)).toEqual([
      "18:30",
      "19:00",
      "20:30",
      "22:00",
      "00:15",
      "01:15",
    ]);
    expect(items[0].label).toContain("cổng nhà em");
    expect(items[1].label).toContain("Workshop làm gốm");
    expect(items[2].label).toContain("Quán nướng ấm cúng");
    expect(items[3].label).toContain("Phim rom-com");
    expect(items[4].label).toContain("Cafe sân vườn");
  });

  it("slot là giờ bắt đầu đi chơi — mốc vui chơi đứng trước mốc ăn", () => {
    const items = build({});
    expect(items[1].icon).toBe("🎡");
    expect(items[1].time).toBe("19:00");
    expect(items[2].icon).toBe("🍜");
  });

  it("skip phim thì cafe nối ngay sau ăn", () => {
    const items = build({ movie: { kind: "skip" } });
    expect(items.map((i) => i.time)).toEqual(["18:30", "19:00", "20:30", "22:00", "23:00"]);
    expect(items.some((i) => i.label.includes("phim"))).toBe(false);
  });

  it("skip cả phim lẫn cafe thì wrap-up ngay sau ăn", () => {
    const items = build({ movie: { kind: "skip" }, cafe: { kind: "skip" } });
    expect(items.map((i) => i.time)).toEqual(["18:30", "19:00", "20:30", "22:00"]);
  });

  it("surprise hiển thị là bí mật, không lộ tên", () => {
    const items = build({
      activity: { kind: "surprise" },
      food: { kind: "surprise" },
      movie: { kind: "surprise" },
    });
    expect(items[1].label).toContain("bí mật");
    expect(items[2].label).toContain("bí mật");
    expect(items[3].label).toContain("bí mật");
  });

  it("chữ bữa ăn tính theo giờ ăn thực tế (slot + thời lượng vui chơi), không theo slot", () => {
    // slot 10:00 → ăn 11:30
    expect(build({ slot: "10:00" })[2].label).toContain("Ăn trưa");
    // slot 16:00 (nếu tính theo slot sẽ ra "Ăn xế") → ăn 17:30
    expect(build({ slot: "16:00" })[2].label).toContain("Ăn tối");
    // slot 07:00 → ăn 08:30
    expect(build({ slot: "07:00" })[2].label).toContain("Ăn sáng");
  });

  it("giờ ăn rơi qua nửa đêm thì ra nhãn ăn khuya, không phải ăn sáng", () => {
    // slot 23:00 → ăn 00:30
    const items = build({ slot: "23:00" });
    expect(items[2].time).toBe("00:30");
    expect(items[2].label).toContain("Ăn khuya");
  });

  it("cộng giờ qua nửa đêm không vỡ", () => {
    const items = build({ slot: "21:00", movie: { kind: "skip" } });
    // đón 20:30, chơi 21:00, ăn 22:30, cafe 00:00, wrap 01:00
    expect(items.map((i) => i.time)).toEqual(["20:30", "21:00", "22:30", "00:00", "01:00"]);
    const late = build({ slot: "22:30" });
    // đón 22:00, chơi 22:30, ăn 00:00, phim 01:30, cafe 03:45, wrap 04:45
    expect(late.map((i) => i.time)).toEqual(["22:00", "22:30", "00:00", "01:30", "03:45", "04:45"]);
  });

  it("durations toàn 0 thì mọi mốc trùng giờ slot, không throw", () => {
    const items = buildTimeline({
      slot: "19:00",
      activity: activityChoice,
      food: foodChoice,
      movie: movieChoice,
      cafe: cafeChoice,
      durations: {
        pickupMinutes: 0,
        activityMinutes: 0,
        foodMinutes: 0,
        movieMinutes: 0,
        cafeMinutes: 0,
      },
      pickupPlace: "cổng nhà em",
    });

    expect(items).toHaveLength(6);
    expect(items.every((i) => i.time === "19:00")).toBe(true);
  });
});
