import type { StepChoice, TimelineDurations } from "@/lib/types";

/**
 * Generate "media plan" — timeline buổi hẹn từ các lựa chọn.
 * Giờ ước tính = giờ slot + thời lượng từng hoạt động (config từ admin).
 */

export interface TimelineItem {
  /** HH:mm */
  time: string;
  /** emoji cho mốc */
  icon: string;
  label: string;
}

export interface TimelineInput {
  /** Giờ bắt đầu buổi hẹn = giờ đi chơi, HH:mm (giờ ăn = slot + activityMinutes) */
  slot: string;
  activity: StepChoice;
  food: StepChoice;
  movie: StepChoice;
  cafe: StepChoice;
  durations: TimelineDurations;
  pickupPlace: string;
}

const MINUTES_PER_DAY = 24 * 60;
const SURPRISE_PLACE_LABEL = "quán bí mật của anh 🤫";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHhmm(minutes: number): string {
  const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const m = String(wrapped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Tên hiển thị của lựa chọn; skip → null (không có mốc) */
function choiceLabel(choice: StepChoice, surpriseLabel: string): string | null {
  switch (choice.kind) {
    case "option":
      return choice.optionName;
    case "surprise":
      return surpriseLabel;
    case "skip":
      return null;
  }
}

const SURPRISE_ACTIVITY_LABEL = "hoạt động bí mật của anh 🤫";
/** Trước giờ này (tính trong ngày) bữa ăn gọi là ăn khuya chứ không phải ăn sáng */
const LATE_NIGHT_UNTIL_HOUR = 5;

/** Chữ gọi bữa ăn theo giờ ăn thực tế; nhận phút cộng dồn nên phải wrap về trong ngày */
function mealWord(mealMinutes: number): string {
  const wrapped = ((mealMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hour = wrapped / 60;
  if (hour < LATE_NIGHT_UNTIL_HOUR) return "Ăn khuya";
  if (hour < 10) return "Ăn sáng";
  if (hour < 14) return "Ăn trưa";
  if (hour < 17) return "Ăn xế";
  return "Ăn tối";
}

export function buildTimeline(input: TimelineInput): TimelineItem[] {
  const { slot, activity, food, movie, cafe, durations, pickupPlace } = input;
  const items: TimelineItem[] = [];
  const start = toMinutes(slot);

  items.push({
    time: toHhmm(start - durations.pickupMinutes),
    icon: "🛵",
    label: `Đón em tại ${pickupPlace}`,
  });

  let cursor = start;
  // activity và food không cho skip nên nhánh ?? chỉ là type-safety, không phải flow thật
  const activityName =
    choiceLabel(activity, SURPRISE_ACTIVITY_LABEL) ?? SURPRISE_ACTIVITY_LABEL;
  items.push({ time: toHhmm(cursor), icon: "🎡", label: `Đi chơi: ${activityName}` });
  cursor += durations.activityMinutes;

  const foodName = choiceLabel(food, SURPRISE_PLACE_LABEL) ?? SURPRISE_PLACE_LABEL;
  items.push({
    time: toHhmm(cursor),
    icon: "🍜",
    label: `${mealWord(cursor)} tại ${foodName}`,
  });
  cursor += durations.foodMinutes;

  const movieName = choiceLabel(movie, "phim bí mật của anh 🤫");
  if (movieName !== null) {
    items.push({ time: toHhmm(cursor), icon: "🎬", label: `Xem ${movieName}` });
    cursor += durations.movieMinutes;
  }

  const cafeName = choiceLabel(cafe, SURPRISE_PLACE_LABEL);
  if (cafeName !== null) {
    items.push({
      time: toHhmm(cursor),
      icon: "🧋",
      label: `Cafe & debrief campaign tại ${cafeName}`,
    });
    cursor += durations.cafeMinutes;
  }

  items.push({
    time: toHhmm(cursor),
    icon: "🌙",
    label: "Wrap-up — đưa em về, campaign thành công rực rỡ",
  });

  return items;
}
