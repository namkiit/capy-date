import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SCHEDULE } from "@/lib/config-defaults";
import { buildCalendar, getTodayInVietnam } from "@/lib/services/schedule";
import type { SubmissionPayload } from "@/lib/types";

// Mock tầng data + notify — test route và luồng service không cần DB thật
vi.mock("@/lib/db/queries", () => ({
  getConfigValue: vi.fn(async () => null), // config trống → dùng default
  setConfigValue: vi.fn(async () => {}),
  getActiveOptionsGrouped: vi.fn(async () => ({ food: [], movie: [], cafe: [] })),
  createSubmission: vi.fn(async (payload: SubmissionPayload) => ({
    id: 7,
    payload,
    createdAt: new Date(),
  })),
  listSubmissions: vi.fn(async () => []),
}));
vi.mock("@/lib/services/notify", () => ({ notifySubmission: vi.fn(async () => {}) }));

import { POST } from "./route";

const days = buildCalendar(DEFAULT_SCHEDULE, getTodayInVietnam());
const validDay = days.find((d) => !d.disabled);
if (!validDay) throw new Error("Không có ngày khả dụng cho test");

function makeRequest(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function validInput() {
  return {
    date: validDay?.date,
    slot: validDay?.slots[0],
    food: { kind: "surprise" },
    movie: { kind: "skip" }, // DEFAULT_CONTENT cho phép skip phim
    cafe: { kind: "surprise" },
    vibe: "Casual thoải mái",
    feedback: "",
    noDodgeCount: 3,
  };
}

// mỗi test một IP riêng để không dẫm rate limit của nhau (bucket là module state)
let ipCounter = 0;
let ip = "";

describe("POST /api/submit", () => {
  beforeEach(() => {
    ipCounter += 1;
    ip = `10.0.0.${ipCounter}`;
  });

  it("payload hợp lệ → 200 kèm id, submission được lưu", async () => {
    const res = await POST(makeRequest(validInput(), ip));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; id: number };
    expect(data.ok).toBe(true);
    expect(data.id).toBe(7);
  });

  it("body không phải JSON → 400", async () => {
    const res = await POST(makeRequest("{oops", ip));
    expect(res.status).toBe(400);
  });

  it("payload sai cấu trúc → 400 và có log cho host debug", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await POST(makeRequest({ hello: "world" }, ip));
    expect(res.status).toBe(400);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("ngày không còn trong lịch → 400 với message nghiệp vụ", async () => {
    const res = await POST(makeRequest({ ...validInput(), date: "2020-01-01" }, ip));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("2020-01-01");
  });

  it("vượt hạn mức trong 1 phút → 429", async () => {
    for (let i = 0; i < 10; i++) {
      await POST(makeRequest(validInput(), ip));
    }
    const res = await POST(makeRequest(validInput(), ip));
    expect(res.status).toBe(429);
  });
});
