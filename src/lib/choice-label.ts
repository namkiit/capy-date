import type { StepChoice } from "./types";

/** Mô tả lựa chọn một bước dạng text — dùng cho email notify và trang admin */
export function describeChoice(choice: StepChoice): string {
  switch (choice.kind) {
    case "option":
      return choice.optionName;
    case "surprise":
      return "🎲 Surprise — nhờ host chọn";
    case "skip":
      return "— (bỏ qua)";
  }
}
