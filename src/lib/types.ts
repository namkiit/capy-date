/** Domain models dùng chung toàn app — không dùng any, model tường minh */

/**
 * Các loại option, theo thứ tự bước chọn trong buổi hẹn: chơi → ăn → phim → cafe.
 * Kiểu suy từ mảng nên thêm loại mới chỉ sửa một chỗ (zod, drizzle, admin cùng dùng mảng này).
 */
export const OPTION_TYPES = ["activity", "food", "movie", "cafe"] as const;

export type OptionType = (typeof OPTION_TYPES)[number];

/** Thông tin bổ sung riêng theo loại option (hiện chỉ phim dùng) */
export interface OptionExtra {
  trailerUrl?: string;
  genre?: string;
  suggestedShowtime?: string;
}

/** Lựa chọn của khách cho một bước: option cụ thể, nhờ host surprise, hoặc bỏ qua */
export type StepChoice =
  | { kind: "option"; optionId: number; optionName: string }
  | { kind: "surprise" }
  | { kind: "skip" };

/** Payload lưu vào bảng submissions (jsonb) — version để đổi schema không vỡ dữ liệu cũ */
export interface SubmissionPayload {
  version: 1;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm — giờ bắt đầu buổi hẹn (giờ đi chơi) */
  slot: string;
  /**
   * Hoạt động vui chơi. Optional vì submission lưu trước khi có bước này không có field;
   * submission mới luôn có (schema ở /api/submit bắt buộc).
   */
  activity?: StepChoice;
  food: StepChoice;
  movie: StepChoice;
  cafe: StepChoice;
  vibe: string | null;
  feedback: string | null;
  /** Số lần bấm hụt nút No — lưu cho vui, hiện trong admin */
  noDodgeCount: number;
}

/** Cấu hình lịch rảnh/bận — lưu ở config key "schedule" */
export interface ScheduleConfig {
  /** Số tuần hiển thị trên calendar tính từ hôm nay */
  weeksAhead: number;
  /** Slot giờ HH:mm cho T2–T6 */
  weekdaySlots: string[];
  /** Slot giờ HH:mm cho T7–CN */
  weekendSlots: string[];
  /** Ngày bận (disable hẳn), YYYY-MM-DD */
  busyDates: string[];
  /** Override slot cho từng ngày cụ thể; mảng rỗng = ngày đó bận */
  dateSlotOverrides: Record<string, string[]>;
}

/** Thời lượng từng hoạt động (phút) để generate timeline — config key "durations" */
export interface TimelineDurations {
  pickupMinutes: number;
  activityMinutes: number;
  foodMinutes: number;
  movieMinutes: number;
  cafeMinutes: number;
}

export interface DresscodeConfig {
  description: string;
  /** Bảng màu gợi ý, mã hex */
  colors: string[];
  imageUrls: string[];
}

/** Câu chữ + nội dung chính của site — config key "content" */
export interface ContentConfig {
  siteName: string;
  hostName: string;
  guestName: string;
  landingIntro: string;
  yesNoQuestion: string;
  /** Caption nút No đổi theo số lần né, phần tử cuối dùng khi nút biến mất */
  noButtonCaptions: string[];
  pickupPlace: string;
  dresscode: DresscodeConfig;
  /** Lựa chọn vibe ở bước dresscode */
  vibeChoices: string[];
  allowSkipMovie: boolean;
  allowSkipCafe: boolean;
}

/** Toàn bộ config đã resolve (DB value đè lên default trong code) */
export interface AppConfig {
  content: ContentConfig;
  schedule: ScheduleConfig;
  durations: TimelineDurations;
}
