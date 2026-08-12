import type { DayAvailability } from "./services/schedule";
import type { OptionType, StepChoice } from "./types";

/**
 * State của user flow, persist vào localStorage để reload không mất lựa chọn.
 * Đổi cấu trúc state → tăng FLOW_STATE_VERSION, state cũ sai version sẽ bị reset sạch.
 */

export const FLOW_STATE_VERSION = 1 as const;
export const FLOW_STORAGE_KEY = "capy-date-flow";

export interface FlowState {
  version: typeof FLOW_STATE_VERSION;
  /** Đã bấm "Xem brief" ở landing */
  briefOpened: boolean;
  /** Đã bấm Yes/Approve */
  approved: boolean;
  /** Số lần bấm hụt nút No */
  noDodgeCount: number;
  /** YYYY-MM-DD */
  date: string | null;
  /** HH:mm */
  slot: string | null;
  food: StepChoice | null;
  movie: StepChoice | null;
  cafe: StepChoice | null;
  /** Đã duyệt media plan (bước timeline) */
  timelineConfirmed: boolean;
  vibe: string | null;
  feedback: string;
  /** ISO datetime của lần submit thành công gần nhất */
  submittedAt: string | null;
}

export const INITIAL_FLOW_STATE: FlowState = {
  version: FLOW_STATE_VERSION,
  briefOpened: false,
  approved: false,
  noDodgeCount: 0,
  date: null,
  slot: null,
  food: null,
  movie: null,
  cafe: null,
  timelineConfirmed: false,
  vibe: null,
  feedback: "",
  submittedAt: null,
};

/**
 * Đọc/ghi localStorage có try/catch — Safari "Block All Cookies" hoặc một số
 * in-app browser (Messenger/Zalo) chặn storage sẽ throw; khi đó chạy tiếp với
 * state trong RAM (mất resume, không mất cả site).
 */
export function readStoredFlowState(): FlowState {
  try {
    return parseFlowState(window.localStorage.getItem(FLOW_STORAGE_KEY));
  } catch {
    return INITIAL_FLOW_STATE;
  }
}

export function writeStoredFlowState(state: FlowState): void {
  try {
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage bị chặn/đầy — bỏ qua, không phá flow
  }
}

/**
 * Parse state từ localStorage: JSON hỏng hoặc sai version → reset về initial.
 * Merge lên initial để field mới thêm vào code không bị thiếu với state cũ cùng version.
 */
export function parseFlowState(raw: string | null): FlowState {
  if (raw === null) return INITIAL_FLOW_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      (parsed as { version?: unknown }).version === FLOW_STATE_VERSION
    ) {
      return { ...INITIAL_FLOW_STATE, ...(parsed as Partial<FlowState>) };
    }
  } catch {
    // JSON hỏng — coi như chưa có state
  }
  return INITIAL_FLOW_STATE;
}

/**
 * Đối chiếu state khôi phục với calendar hiện tại: ngày đã chọn không còn
 * hợp lệ (quá khứ / host vừa đánh bận / đổi rule) → bỏ ngày + giờ; giờ không
 * còn trong danh sách slot của ngày → bỏ giờ.
 */
export function sanitizeFlowState(state: FlowState, days: DayAvailability[]): FlowState {
  if (state.date === null) return state;
  const day = days.find((d) => d.date === state.date);
  if (!day || day.disabled) {
    // mất ngày → media plan cũ vô nghĩa, phải duyệt lại (nếu không các bước sau
    // vẫn hiển thị và nút submit thành nút chết)
    return { ...state, date: null, slot: null, timelineConfirmed: false };
  }
  if (state.slot !== null && !day.slots.includes(state.slot)) {
    return { ...state, slot: null, timelineConfirmed: false };
  }
  return state;
}

interface ChoiceContext {
  /** Danh sách id option đang active theo loại */
  activeIds: Record<OptionType, number[]>;
  allowSkipMovie: boolean;
  allowSkipCafe: boolean;
}

function sanitizeChoice(
  choice: StepChoice | null,
  activeIds: number[],
  allowSkip: boolean
): StepChoice | null {
  if (choice === null) return null;
  if (choice.kind === "option" && !activeIds.includes(choice.optionId)) return null;
  if (choice.kind === "skip" && !allowSkip) return null;
  return choice;
}

/**
 * Đối chiếu lựa chọn quán/phim/cafe đã lưu với dữ liệu hiện tại:
 * option bị host xóa/tắt → bỏ lựa chọn; skip không còn được phép → bỏ.
 */
export function sanitizeChoices(state: FlowState, ctx: ChoiceContext): FlowState {
  const food = sanitizeChoice(state.food, ctx.activeIds.food, false);
  const movie = sanitizeChoice(state.movie, ctx.activeIds.movie, ctx.allowSkipMovie);
  const cafe = sanitizeChoice(state.cafe, ctx.activeIds.cafe, ctx.allowSkipCafe);
  // mất lựa chọn nào đó → media plan đã duyệt không còn đúng, bắt duyệt lại
  const lostChoice =
    (state.food !== null && food === null) ||
    (state.movie !== null && movie === null) ||
    (state.cafe !== null && cafe === null);
  return {
    ...state,
    food,
    movie,
    cafe,
    timelineConfirmed: lostChoice ? false : state.timelineConfirmed,
  };
}
