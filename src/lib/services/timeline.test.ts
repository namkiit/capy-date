import { describe, expect, it } from "vitest";
import { DEFAULT_DURATIONS } from "@/lib/config-defaults";
import type { StepChoice } from "@/lib/types";
import { buildTimeline } from "./timeline";

const foodChoice: StepChoice = { kind: "option", optionId: 1, optionName: "Quán nướng ấm cúng" };
const movieChoice: StepChoice = { kind: "option", optionId: 2, optionName: "Phim rom-com" };
const cafeChoice: StepChoice = { kind: "option", optionId: 3, optionName: "Cafe sân vườn" };

function build(overrides: {
  slot?: string;
  food?: StepChoice;
  movie?: StepChoice;
  cafe?: StepChoice;
}) {
  return buildTimeline({
    slot: overrides.slot ?? "19:00",
    food: overrides.food ?? foodChoice,
    movie: overrides.movie ?? movieChoice,
    cafe: overrides.cafe ?? cafeChoice,
    durations: DEFAULT_DURATIONS,
    pickupPlace: "cổng nhà em",
  });
}

describe("buildTimeline", () => {
  it("flow đầy đủ: đón trước slot, ăn, phim, cafe, wrap-up đúng giờ cộng dồn", () => {
    const items = build({});
    expect(items.map((i) => i.time)).toEqual(["18:30", "19:00", "20:30", "22:45", "23:45"]);
    expect(items[0].label).toContain("cổng nhà em");
    expect(items[1].label).toContain("Quán nướng ấm cúng");
    expect(items[2].label).toContain("Phim rom-com");
    expect(items[3].label).toContain("Cafe sân vườn");
  });

  it("skip phim thì cafe nối ngay sau ăn", () => {
    const items = build({ movie: { kind: "skip" } });
    expect(items.map((i) => i.time)).toEqual(["18:30", "19:00", "20:30", "21:30"]);
    expect(items.some((i) => i.label.includes("phim"))).toBe(false);
  });

  it("skip cả phim lẫn cafe thì wrap-up ngay sau ăn", () => {
    const items = build({ movie: { kind: "skip" }, cafe: { kind: "skip" } });
    expect(items.map((i) => i.time)).toEqual(["18:30", "19:00", "20:30"]);
  });

  it("surprise hiển thị là bí mật, không lộ tên", () => {
    const items = build({ food: { kind: "surprise" }, movie: { kind: "surprise" } });
    expect(items[1].label).toContain("bí mật");
    expect(items[2].label).toContain("bí mật");
  });

  it("giờ ăn theo buổi: slot buổi trưa ra nhãn ăn trưa", () => {
    const items = build({ slot: "11:30" });
    expect(items[1].label).toContain("trưa");
  });

  it("cộng giờ qua nửa đêm không vỡ (23:45 -> 00:45)", () => {
    const items = build({ slot: "21:00", movie: { kind: "skip" } });
    // đón 20:30, ăn 21:00, cafe 22:30, wrap 23:30
    expect(items.map((i) => i.time)).toEqual(["20:30", "21:00", "22:30", "23:30"]);
    const late = build({ slot: "22:30" });
    // đón 22:00, ăn 22:30, phim 00:00, cafe 02:15, wrap 03:15
    expect(late.map((i) => i.time)).toEqual(["22:00", "22:30", "00:00", "02:15", "03:15"]);
  });
});
