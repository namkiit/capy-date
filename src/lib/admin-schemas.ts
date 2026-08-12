import { z } from "zod";

/** Zod schemas validate input admin ở boundary (API routes) */

const timeSlot = z.string().regex(/^\d{2}:\d{2}$/, "Slot phải dạng HH:mm");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải dạng YYYY-MM-DD");

export const scheduleConfigSchema = z.object({
  weeksAhead: z.number().int().min(1).max(8),
  weekdaySlots: z.array(timeSlot).max(12),
  weekendSlots: z.array(timeSlot).max(12),
  busyDates: z.array(isoDate).max(200),
  dateSlotOverrides: z.record(isoDate, z.array(timeSlot).max(12)),
});

export const dresscodeConfigSchema = z.object({
  description: z.string().max(1000),
  colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu phải dạng #rrggbb")).max(8),
  imageUrls: z.array(z.string().max(1000)).max(6),
});

export const contentConfigSchema = z.object({
  siteName: z.string().min(1).max(100),
  hostName: z.string().min(1).max(100),
  guestName: z.string().min(1).max(100),
  landingIntro: z.string().max(2000),
  yesNoQuestion: z.string().min(1).max(300),
  noButtonCaptions: z.array(z.string().max(100)).min(2).max(10),
  pickupPlace: z.string().max(200),
  dresscode: dresscodeConfigSchema,
  vibeChoices: z.array(z.string().max(100)).max(6),
  allowSkipMovie: z.boolean(),
  allowSkipCafe: z.boolean(),
});

export const durationsConfigSchema = z.object({
  pickupMinutes: z.number().int().min(0).max(240),
  foodMinutes: z.number().int().min(15).max(360),
  movieMinutes: z.number().int().min(30).max(360),
  cafeMinutes: z.number().int().min(15).max(360),
});

/** PUT /api/admin/config — cho phép lưu từng phần */
export const configUpdateSchema = z.object({
  content: contentConfigSchema.optional(),
  schedule: scheduleConfigSchema.optional(),
  durations: durationsConfigSchema.optional(),
});

export const optionExtraSchema = z.object({
  trailerUrl: z.string().max(500).optional(),
  genre: z.string().max(100).optional(),
  suggestedShowtime: z.string().max(200).optional(),
});

export const optionInputSchema = z.object({
  type: z.enum(["food", "movie", "cafe"]),
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  images: z.array(z.string().min(1).max(1000)).max(6),
  priceRange: z.string().max(100).nullable(),
  address: z.string().max(300).nullable(),
  mapUrl: z.string().max(500).nullable(),
  hostNote: z.string().max(500).nullable(),
  extra: optionExtraSchema.nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export type OptionInput = z.infer<typeof optionInputSchema>;
