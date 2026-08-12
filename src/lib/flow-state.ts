import type { DayAvailability } from "./services/schedule";
import type { StepChoice } from "./types";

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
  vibe: null,
  feedback: "",
  submittedAt: null,
};

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
    return { ...state, date: null, slot: null };
  }
  if (state.slot !== null && !day.slots.includes(state.slot)) {
    return { ...state, slot: null };
  }
  return state;
}
