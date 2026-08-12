import { describe, expect, it } from "vitest";
import {
  FLOW_STATE_VERSION,
  INITIAL_FLOW_STATE,
  parseFlowState,
  sanitizeChoices,
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

  it("field thừa không có trong FlowState không phá vỡ việc parse", () => {
    const stored = JSON.stringify({
      version: FLOW_STATE_VERSION,
      approved: true,
      date: "2026-08-15",
      unknownFieldFromOlderVersion: "giá trị lạ",
    });

    const state = parseFlowState(stored);

    expect(state.approved).toBe(true);
    expect(state.date).toBe("2026-08-15");
    expect(state.slot).toBeNull();
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

  it("mất ngày/slot thì media plan đã duyệt phải duyệt lại (timelineConfirmed reset)", () => {
    const dateGone = sanitizeFlowState(
      stateWith({ date: "2026-08-01", slot: "19:00", timelineConfirmed: true }),
      days
    );
    expect(dateGone.timelineConfirmed).toBe(false);

    const slotGone = sanitizeFlowState(
      stateWith({ date: "2026-08-13", slot: "21:00", timelineConfirmed: true }),
      days
    );
    expect(slotGone.timelineConfirmed).toBe(false);

    // ngày + giờ còn hợp lệ → giữ nguyên trạng thái đã duyệt
    const intact = sanitizeFlowState(
      stateWith({ date: "2026-08-13", slot: "19:00", timelineConfirmed: true }),
      days
    );
    expect(intact.timelineConfirmed).toBe(true);
  });
});

describe("sanitizeChoices", () => {
  const ctx = {
    activeIds: { food: [1, 2], movie: [10], cafe: [20] },
    allowSkipMovie: true,
    allowSkipCafe: false,
  };

  function stateWith(patch: Partial<FlowState>): FlowState {
    return { ...INITIAL_FLOW_STATE, ...patch };
  }

  it("giữ lựa chọn còn hợp lệ (option active, surprise, skip được phép)", () => {
    const state = stateWith({
      food: { kind: "option", optionId: 1, optionName: "Quán nướng" },
      movie: { kind: "skip" },
      cafe: { kind: "surprise" },
    });
    expect(sanitizeChoices(state, ctx)).toEqual(state);
  });

  it("bỏ lựa chọn trỏ tới option đã bị xóa/tắt", () => {
    const state = stateWith({
      food: { kind: "option", optionId: 99, optionName: "Quán đã xóa" },
    });
    expect(sanitizeChoices(state, ctx).food).toBeNull();
  });

  it("bỏ skip khi config không còn cho phép skip", () => {
    const state = stateWith({ cafe: { kind: "skip" } });
    expect(sanitizeChoices(state, ctx).cafe).toBeNull();
  });

  it("option bị xóa thì timelineConfirmed reset về false, còn nguyên vẹn thì giữ", () => {
    const lost = sanitizeChoices(
      stateWith({
        food: { kind: "option", optionId: 99, optionName: "Quán đã xóa" },
        timelineConfirmed: true,
      }),
      ctx
    );
    expect(lost.timelineConfirmed).toBe(false);

    const intact = sanitizeChoices(
      stateWith({
        food: { kind: "option", optionId: 1, optionName: "Quán nướng" },
        movie: { kind: "skip" },
        cafe: { kind: "surprise" },
        timelineConfirmed: true,
      }),
      ctx
    );
    expect(intact.timelineConfirmed).toBe(true);
  });
});

describe("sanitizeFlowState + sanitizeChoices kết hợp", () => {
  const days: DayAvailability[] = [
    { date: "2026-08-13", isoWeekday: 4, slots: ["19:00"], disabled: false },
  ];
  const ctx = {
    activeIds: { food: [1], movie: [10], cafe: [20] },
    allowSkipMovie: true,
    allowSkipCafe: false,
  };

  it("dọn sạch cả ngày hỏng lẫn option hỏng khi xảy ra đồng thời", () => {
    const state: FlowState = {
      ...INITIAL_FLOW_STATE,
      date: "2026-08-01", // không còn trong calendar
      slot: "19:00",
      food: { kind: "option", optionId: 99, optionName: "Quán đã xóa" }, // option hỏng
      movie: { kind: "skip" }, // allowSkipMovie true — hợp lệ
      cafe: { kind: "skip" }, // allowSkipCafe false — hỏng
    };

    const sanitized = sanitizeChoices(sanitizeFlowState(state, days), ctx);

    expect(sanitized.date).toBeNull();
    expect(sanitized.slot).toBeNull();
    expect(sanitized.food).toBeNull();
    expect(sanitized.movie).toEqual({ kind: "skip" });
    expect(sanitized.cafe).toBeNull();
  });
});
