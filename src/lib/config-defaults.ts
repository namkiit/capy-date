import type {
  AppConfig,
  ContentConfig,
  ScheduleConfig,
  TimelineDurations,
} from "@/lib/types";

/**
 * Default config trong code — site chạy được ngay cả khi bảng config trống.
 * Giá trị thật do host chỉnh qua admin panel, lưu vào DB và đè lên default.
 */

export const DEFAULT_CONTENT: ContentConfig = {
  siteName: "Capy Date?",
  hostName: "Anh",
  guestName: "Em",
  landingIntro:
    "Phòng Marketing của trái tim anh xin gửi proposal cho campaign sắp tới. Brief chi tiết bên dưới, mong được em approve trước deadline 😌",
  yesNoQuestion: "Em có duyệt proposal đi chơi với anh không?",
  noButtonCaptions: [
    "Không",
    "Chắc là không...",
    "Suy nghĩ lại đi 🥺",
    "KPI tháng này của anh đó",
    "Nút này sắp hết hàng",
    "Option này đã hết hàng",
  ],
  pickupPlace: "địa điểm hẹn trước",
  dresscode: {
    description:
      "Brand guidelines của buổi hẹn: tông ấm dễ chịu — kem, be, nâu nhạt. Mặc gì em thấy thoải mái là đạt KPI rồi.",
    colors: ["#F5EFE6", "#E8DCC8", "#B08968", "#8A9A5B"],
    imageUrls: [],
  },
  vibeChoices: ["Casual thoải mái", "Hơi xinh một chút", "Tùy hứng ngày đó"],
  allowSkipMovie: true,
  allowSkipCafe: true,
};

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  weeksAhead: 4,
  weekdaySlots: ["19:00", "20:00"],
  weekendSlots: ["10:00", "15:00", "19:00"],
  busyDates: [],
  dateSlotOverrides: {},
};

export const DEFAULT_DURATIONS: TimelineDurations = {
  pickupMinutes: 30,
  foodMinutes: 90,
  movieMinutes: 135,
  cafeMinutes: 60,
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  content: DEFAULT_CONTENT,
  schedule: DEFAULT_SCHEDULE,
  durations: DEFAULT_DURATIONS,
};

/**
 * Merge giá trị lưu trong DB lên default (shallow theo field cấp 1).
 * Admin luôn lưu nguyên object nên chỉ cần shallow merge — mục đích chính là
 * forward-compat: thêm field mới vào code thì bản ghi DB cũ không làm thiếu field.
 */
export function mergeWithDefaults<T extends object>(defaults: T, stored: unknown): T {
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) {
    return defaults;
  }
  return { ...defaults, ...(stored as Partial<T>) };
}
