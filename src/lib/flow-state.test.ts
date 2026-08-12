import { describe, expect, it } from "vitest";
import {
  FLOW_STATE_VERSION,
  INITIAL_FLOW_STATE,
  parseFlowState,
  sanitizeFlowState,
  type FlowState,
} from "./flow-state";
import type { DayAvailability } from "./services/schedule";

describe("parseFlowState", () => {
  it("trả về initial khi localStorage trống", () => {
    expect(parseFlowState(null)).toEqual(INITIAL_FLOW_STATE);
  });

  it("khôi phục state hợp lệ và merge field còn thiếu", () => {
    const stored = JSON.stringify({
      version: FLOW_STATE_VERSION,
      approved: true,
      date: "2026-08-15",
      // thiếu các field khác — giả lập state cũ cùng version nhưng ít field hơn
    });
    const state = parseFlowState(stored);
    expect(state.approved).toBe(true);
    expect(state.date).toBe("2026-08-15");
    expect(state.slot).toBeNull();
    expect(state.feedback).toBe("");
  });

  it("reset khi sai version", () => {
    const stored = JSON.stringify({ version: 999, approved: true });
    expect(parseFlowState(stored)).toEqual(INITIAL_FLOW_STATE);
  });

  it("reset khi JSON hỏng hoặc không phải object", () => {
    expect(parseFlowState("{oops")).toEqual(INITIAL_FLOW_STATE);
    expect(parseFlowState('"a string"')).toEqual(INITIAL_FLOW_STATE);
    expect(parseFlowState("[1,2]")).toEqual(INITIAL_FLOW_STATE);
  });
});

describe("sanitizeFlowState", () => {
  const days: DayAvailability[] = [
    { date: "2026-08-13", isoWeekday: 4, slots: ["19:00", "20:00"], disabled: false },
    { date: "2026-08-14", isoWeekday: 5, slots: [], disabled: true },
  ];

  function stateWith(patch: Partial<FlowState>): FlowState {
    return { ...INITIAL_FLOW_STATE, ...patch };
  }

  it("giữ nguyên khi ngày + giờ vẫn hợp lệ", () => {
    const state = stateWith({ date: "2026-08-13", slot: "19:00" });
    expect(sanitizeFlowState(state, days)).toEqual(state);
  });

  it("bỏ ngày và giờ khi ngày không còn trong calendar hoặc đã bận", () => {
    const gone = sanitizeFlowState(stateWith({ date: "2026-08-01", slot: "19:00" }), days);
    expect(gone.date).toBeNull();
    expect(gone.slot).toBeNull();

    const busy = sanitizeFlowState(stateWith({ date: "2026-08-14", slot: "19:00" }), days);
    expect(busy.date).toBeNull();
    expect(busy.slot).toBeNull();
  });

  it("chỉ bỏ giờ khi ngày còn hợp lệ nhưng slot đã bị đổi", () => {
    const state = sanitizeFlowState(stateWith({ date: "2026-08-13", slot: "21:00" }), days);
    expect(state.date).toBe("2026-08-13");
    expect(state.slot).toBeNull();
  });
});
