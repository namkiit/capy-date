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
  /** Giờ bắt đầu (giờ ăn), HH:mm */
  slot: string;
  food: StepChoice;
  movie: StepChoice;
  cafe: StepChoice;
  durations: TimelineDurations;
  pickupPlace: string;
}

const MINUTES_PER_DAY = 24 * 60;

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

function mealWord(slotMinutes: number): string {
  const hour = slotMinutes / 60;
  if (hour < 10) return "Ăn sáng";
  if (hour < 14) return "Ăn trưa";
  if (hour < 17) return "Ăn xế";
  return "Ăn tối";
}

export function buildTimeline(input: TimelineInput): TimelineItem[] {
  const { slot, food, movie, cafe, durations, pickupPlace } = input;
  const items: TimelineItem[] = [];
  const start = toMinutes(slot);

  items.push({
    time: toHhmm(start - durations.pickupMinutes),
    icon: "🛵",
    label: `Đón em tại ${pickupPlace}`,
  });

  let cursor = start;
  const foodName = choiceLabel(food, "quán bí mật của anh 🤫");
  items.push({
    time: toHhmm(cursor),
    icon: "🍜",
    label: `${mealWord(start)} tại ${foodName ?? "quán bí mật của anh 🤫"}`,
  });
  cursor += durations.foodMinutes;

  const movieName = choiceLabel(movie, "phim bí mật của anh 🤫");
  if (movieName !== null) {
    items.push({ time: toHhmm(cursor), icon: "🎬", label: `Xem ${movieName}` });
    cursor += durations.movieMinutes;
  }

  const cafeName = choiceLabel(cafe, "quán bí mật của anh 🤫");
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
