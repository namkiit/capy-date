import { z } from "zod";
import {
  createSubmission,
  getActiveOptionsGrouped,
  listSubmissions,
  type OptionsByType,
} from "@/lib/db/queries";
import type { SubmissionRow } from "@/lib/db/schema";
import { getAppConfig } from "./app-config";
import { notifySubmission } from "./notify";
import { buildCalendar, getTodayInVietnam, type DayAvailability } from "./schedule";
import {
  OPTION_TYPES,
  type OptionType,
  type StepChoice,
  type SubmissionPayload,
} from "@/lib/types";

/** Validate cấu trúc input ở boundary (API route) bằng zod */
const stepChoiceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("option"),
    optionId: z.number().int().positive(),
    optionName: z.string().min(1).max(200),
  }),
  z.object({ kind: z.literal("surprise") }),
  z.object({ kind: z.literal("skip") }),
]);

export const submissionInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date phải dạng YYYY-MM-DD"),
  slot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "slot phải dạng HH:mm (00:00–23:59)"),
  activity: stepChoiceSchema,
  food: stepChoiceSchema,
  movie: stepChoiceSchema,
  cafe: stepChoiceSchema,
  vibe: z.string().max(100).nullable(),
  feedback: z.string().max(2000),
  noDodgeCount: z.number().int().min(0).max(1000),
});

export type SubmissionInput = z.infer<typeof submissionInputSchema>;

/** Lỗi nghiệp vụ khi dữ liệu submit không khớp cấu hình hiện tại → trả 400 */
export class SubmissionValidationError extends Error {}

export interface SubmissionContext {
  days: DayAvailability[];
  /** Option active: id → loại + tên (tên lấy từ DB, không tin client) */
  optionsById: Map<number, { type: OptionType; name: string }>;
  allowSkipMovie: boolean;
  allowSkipCafe: boolean;
}

function validateChoice(
  choice: StepChoice,
  step: OptionType,
  ctx: SubmissionContext,
  allowSkip: boolean
): StepChoice {
  switch (choice.kind) {
    case "surprise":
      return choice;
    case "skip":
      if (!allowSkip) {
        throw new SubmissionValidationError(`Bước ${step} không cho phép bỏ qua`);
      }
      return choice;
    case "option": {
      const option = ctx.optionsById.get(choice.optionId);
      if (!option || option.type !== step) {
        throw new SubmissionValidationError(
          `Option ${choice.optionId} không hợp lệ cho bước ${step} (đã bị xóa/tắt?)`
        );
      }
      // lấy tên từ DB để payload lưu đúng sự thật
      return { kind: "option", optionId: choice.optionId, optionName: option.name };
    }
  }
}

/**
 * Validate nghiệp vụ theo cấu hình hiện tại (pure — test được không cần DB):
 * ngày còn trống, slot thuộc ngày, option tồn tại đúng loại, skip đúng quyền.
 */
export function validateSubmission(
  input: SubmissionInput,
  ctx: SubmissionContext
): SubmissionPayload {
  const day = ctx.days.find((d) => d.date === input.date);
  if (!day || day.disabled) {
    throw new SubmissionValidationError(
      `Ngày ${input.date} không còn trong lịch trống của host`
    );
  }
  if (!day.slots.includes(input.slot)) {
    throw new SubmissionValidationError(
      `Khung giờ ${input.slot} không thuộc ngày ${input.date}`
    );
  }

  return {
    version: 1,
    date: input.date,
    slot: input.slot,
    activity: validateChoice(input.activity, "activity", ctx, false),
    food: validateChoice(input.food, "food", ctx, false),
    movie: validateChoice(input.movie, "movie", ctx, ctx.allowSkipMovie),
    cafe: validateChoice(input.cafe, "cafe", ctx, ctx.allowSkipCafe),
    vibe: input.vibe,
    feedback: input.feedback.trim() === "" ? null : input.feedback.trim(),
    noDodgeCount: input.noDodgeCount,
  };
}

function buildContext(
  days: DayAvailability[],
  options: OptionsByType,
  allowSkipMovie: boolean,
  allowSkipCafe: boolean
): SubmissionContext {
  const optionsById = new Map<number, { type: OptionType; name: string }>();
  for (const type of OPTION_TYPES) {
    for (const row of options[type]) {
      optionsById.set(row.id, { type, name: row.name });
    }
  }
  return { days, optionsById, allowSkipMovie, allowSkipCafe };
}

/** Luồng submit đầy đủ: validate theo config hiện tại → lưu DB → notify email (không chặn) */
export async function submitInvitation(input: SubmissionInput): Promise<SubmissionRow> {
  const [config, options] = await Promise.all([getAppConfig(), getActiveOptionsGrouped()]);
  const days = buildCalendar(config.schedule, getTodayInVietnam());
  const ctx = buildContext(
    days,
    options,
    config.content.allowSkipMovie,
    config.content.allowSkipCafe
  );
  const payload = validateSubmission(input, ctx);
  const row = await createSubmission(payload);

  // notify lỗi không được làm fail request — submission đã lưu thành công
  try {
    await notifySubmission(row);
  } catch (err) {
    console.error(`Gửi email notify cho submission #${row.id} thất bại:`, err);
  }
  return row;
}

/** Danh sách submission cho trang admin (mới nhất trước) */
export async function listAllSubmissions(): Promise<SubmissionRow[]> {
  return listSubmissions();
}
