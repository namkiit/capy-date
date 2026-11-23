import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DURATIONS } from "@/lib/config-defaults";
import { getConfigValue } from "@/lib/db/queries";
import { getAppConfig } from "./app-config";

// DB là boundary — mock queries, giữ nguyên merge + zod thật
vi.mock("@/lib/db/queries", () => ({
  getConfigValue: vi.fn(),
  setConfigValue: vi.fn(),
}));

function stubConfig(values: Record<string, unknown>) {
  vi.mocked(getConfigValue).mockImplementation(async (key: string) => values[key] ?? null);
}

describe("getAppConfig — durations", () => {
  beforeEach(() => {
    vi.mocked(getConfigValue).mockReset();
  });

  it("durations cũ trong DB thiếu activityMinutes: lấy default cho activity, giữ giá trị host đã chỉnh", () => {
    stubConfig({
      durations: { pickupMinutes: 45, foodMinutes: 100, movieMinutes: 120, cafeMinutes: 30 },
    });

    return getAppConfig().then(({ durations }) => {
      expect(durations).toEqual({
        pickupMinutes: 45,
        activityMinutes: DEFAULT_DURATIONS.activityMinutes,
        foodMinutes: 100,
        movieMinutes: 120,
        cafeMinutes: 30,
      });
    });
  });

  it("bảng config trống: durations là default đầy đủ gồm activityMinutes", async () => {
    stubConfig({});

    const { durations } = await getAppConfig();

    expect(durations).toEqual(DEFAULT_DURATIONS);
  });
});
