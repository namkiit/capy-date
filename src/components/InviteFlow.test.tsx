// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONTENT, DEFAULT_DURATIONS, DEFAULT_SCHEDULE } from "@/lib/config-defaults";
import { FLOW_STORAGE_KEY, FLOW_STATE_VERSION } from "@/lib/flow-state";
import { buildCalendar } from "@/lib/services/schedule";
import { InviteFlow } from "./InviteFlow";

// confetti import canvas (không có trong jsdom) — mock hẳn module
vi.mock("@/lib/confetti", () => ({ fireCelebration: vi.fn(async () => {}) }));

const days = buildCalendar(DEFAULT_SCHEDULE, "2026-08-12");
// DEFAULT_SCHEDULE luôn có slot mọi ngày nên phần tử đầu chắc chắn khả dụng
const firstDay = days[0];

const emptyOptions = { food: [], movie: [], cafe: [] };

/** State đầy đủ hợp lệ tới bước submit (surprise/skip nên không phụ thuộc options) */
function fullStoredState() {
  return {
    version: FLOW_STATE_VERSION,
    briefOpened: true,
    approved: true,
    noDodgeCount: 2,
    date: firstDay.date,
    slot: firstDay.slots[0],
    food: { kind: "surprise" },
    movie: { kind: "skip" },
    cafe: { kind: "surprise" },
    timelineConfirmed: true,
    vibe: "Casual thoải mái",
    feedback: "",
    submittedAt: null,
  };
}

function renderFlow() {
  return render(
    <InviteFlow
      content={DEFAULT_CONTENT}
      days={days}
      options={emptyOptions}
      durations={DEFAULT_DURATIONS}
    />
  );
}

describe("InviteFlow — gating và double submit", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    // motion cần matchMedia (prefers-reduced-motion) — jsdom không có
    if (!window.matchMedia) {
      window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;
    }
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("state đầy đủ hợp lệ thì nút Chốt deal hiển thị", () => {
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(fullStoredState()));
    renderFlow();
    expect(screen.getByRole("button", { name: /Chốt deal/ })).toBeTruthy();
  });

  it("option đã chọn bị host xóa → sanitize ẩn các bước sau, không còn nút Chốt deal chết", () => {
    const stored = fullStoredState();
    stored.food = { kind: "option", optionId: 99, optionName: "Quán đã xóa" } as never;
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(stored));
    renderFlow();

    // bước ăn mở lại để chọn, các bước sau (timeline/dresscode/submit) ẩn đi
    expect(screen.getByText(/Ăn gì đây/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Chốt deal/ })).toBeNull();
    expect(screen.queryByText(/Timeline buổi hẹn/)).toBeNull();
  });

  it("double click nút Chốt deal chỉ bắn một request", () => {
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(fullStoredState()));
    // fetch treo vô hạn để mô phỏng request đang bay
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    renderFlow();
    const submitButton = screen.getByRole("button", { name: /Chốt deal/ });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
