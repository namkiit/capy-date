import { describe, expect, it } from "vitest";
import {
  FLOW_STATE_VERSION,
  INITIAL_FLOW_STATE,
  parseFlowState,
} from "./flow-state";

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
