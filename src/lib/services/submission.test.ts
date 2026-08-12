import { describe, expect, it } from "vitest";
import type { DayAvailability } from "./schedule";
import {
  SubmissionValidationError,
  validateSubmission,
  type SubmissionContext,
  type SubmissionInput,
} from "./submission";

const days: DayAvailability[] = [
  { date: "2026-08-15", isoWeekday: 6, slots: ["10:00", "19:00"], disabled: false },
  { date: "2026-08-16", isoWeekday: 7, slots: [], disabled: true },
];

const ctx: SubmissionContext = {
  days,
  optionsById: new Map([
    [1, { type: "food", name: "Quán nướng ấm cúng" }],
    [10, { type: "movie", name: "Phim rom-com" }],
    [20, { type: "cafe", name: "Cafe sân vườn" }],
  ]),
  allowSkipMovie: true,
  allowSkipCafe: false,
};

function makeInput(patch: Partial<SubmissionInput> = {}): SubmissionInput {
  return {
    date: "2026-08-15",
    slot: "19:00",
    food: { kind: "option", optionId: 1, optionName: "tên client gửi lên" },
    movie: { kind: "skip" },
    cafe: { kind: "option", optionId: 20, optionName: "Cafe sân vườn" },
    vibe: "Hơi xinh một chút",
    feedback: "",
    noDodgeCount: 3,
    ...patch,
  };
}

describe("validateSubmission", () => {
  it("payload hợp lệ: trả về version 1 và lấy tên option từ DB thay vì tin client", () => {
    const payload = validateSubmission(makeInput(), ctx);
    expect(payload.version).toBe(1);
    expect(payload.food).toEqual({
      kind: "option",
      optionId: 1,
      optionName: "Quán nướng ấm cúng",
    });
  });

  it("ngày không có trong calendar hoặc đã bận → lỗi", () => {
    expect(() => validateSubmission(makeInput({ date: "2026-01-01" }), ctx)).toThrow(
      SubmissionValidationError
    );
    expect(() => validateSubmission(makeInput({ date: "2026-08-16" }), ctx)).toThrow(
      SubmissionValidationError
    );
  });

  it("slot không thuộc ngày đã chọn → lỗi", () => {
    expect(() => validateSubmission(makeInput({ slot: "23:00" }), ctx)).toThrow(
      SubmissionValidationError
    );
  });

  it("option không tồn tại hoặc sai loại → lỗi", () => {
    expect(() =>
      validateSubmission(
        makeInput({ food: { kind: "option", optionId: 99, optionName: "x" } }),
        ctx
      )
    ).toThrow(SubmissionValidationError);
    // dùng id của cafe cho bước food
    expect(() =>
      validateSubmission(
        makeInput({ food: { kind: "option", optionId: 20, optionName: "x" } }),
        ctx
      )
    ).toThrow(SubmissionValidationError);
  });

  it("food không được skip; movie/cafe skip theo config", () => {
    expect(() => validateSubmission(makeInput({ food: { kind: "skip" } }), ctx)).toThrow(
      SubmissionValidationError
    );
    // cafe không cho skip theo ctx
    expect(() => validateSubmission(makeInput({ cafe: { kind: "skip" } }), ctx)).toThrow(
      SubmissionValidationError
    );
    // movie skip hợp lệ
    expect(() => validateSubmission(makeInput(), ctx)).not.toThrow();
  });

  it("surprise luôn hợp lệ cho cả 3 bước", () => {
    const payload = validateSubmission(
      makeInput({
        food: { kind: "surprise" },
        movie: { kind: "surprise" },
        cafe: { kind: "surprise" },
      }),
      ctx
    );
    expect(payload.food.kind).toBe("surprise");
  });
});
