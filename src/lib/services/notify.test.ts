import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SubmissionRow } from "@/lib/db/schema";
import { notifySubmission } from "./notify";

const sendMock = vi.hoisted(() => vi.fn());

// Resend là external service — mock ở boundary
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

function makeSubmission(payloadPatch: Record<string, unknown> = {}): SubmissionRow {
  return {
    id: 7,
    createdAt: new Date("2026-08-12T00:00:00Z"),
    payload: {
      date: "2026-08-15",
      slot: "19:00",
      activity: { kind: "option", optionId: 1, optionName: "Bowling" },
      food: { kind: "surprise" },
      movie: { kind: "skip" },
      cafe: { kind: "surprise" },
      vibe: null,
      feedback: null,
      noDodgeCount: 0,
      ...payloadPatch,
    },
  } as unknown as SubmissionRow;
}

describe("notifySubmission", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("NOTIFY_EMAIL_FROM", "from@example.com");
    vi.stubEnv("NOTIFY_EMAIL_TO", "to@example.com");
    sendMock.mockReset();
    sendMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("payload mới: email có tên hoạt động vui chơi đã chọn", async () => {
    await notifySubmission(makeSubmission());

    const html = String(sendMock.mock.calls[0][0].html);
    expect(html).toContain("Vui chơi");
    expect(html).toContain("Bowling");
  });

  it("payload cũ không có activity: không throw và hiện dấu —", async () => {
    const submission = makeSubmission();
    delete (submission.payload as { activity?: unknown }).activity;

    await expect(notifySubmission(submission)).resolves.toBeUndefined();

    const html = String(sendMock.mock.calls[0][0].html);
    expect(html).toMatch(/Vui chơi<\/td>\s*<td[^>]*>—<\/td>/);
  });
});
