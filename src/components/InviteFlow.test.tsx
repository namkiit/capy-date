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

const emptyOptions = { activity: [], food: [], movie: [], cafe: [] };

/** State đầy đủ hợp lệ tới bước submit (surprise/skip nên không phụ thuộc options) */
function fullStoredState() {
  return {
    version: FLOW_STATE_VERSION,
    briefOpened: true,
    approved: true,
    noDodgeCount: 2,
    date: firstDay.date,
    slot: firstDay.slots[0],
    activity: { kind: "surprise" },
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

  it("localStorage cũ chưa có bước vui chơi → hiện bước vui chơi trước, ẩn bước ăn và nút Chốt deal", () => {
    const stored: Partial<ReturnType<typeof fullStoredState>> = fullStoredState();
    delete stored.activity;
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(stored));
    renderFlow();

    expect(screen.getByText(/Chơi gì trước/)).toBeTruthy();
    expect(screen.queryByText(/Ăn gì đây/)).toBeNull();
    expect(screen.queryByText(/Timeline buổi hẹn/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Chốt deal/ })).toBeNull();
  });

  it("bước vui chơi đứng trước bước ăn và không có nút bỏ qua", () => {
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(fullStoredState()));
    renderFlow();

    const activityHeading = screen.getByText(/Chơi gì trước/);
    const foodHeading = screen.getByText(/Ăn gì đây/);
    expect(
      activityHeading.compareDocumentPosition(foodHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.queryByText(/không đi chơi/i)).toBeNull();
  });

  it("gửi activity trong body submit", () => {
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(fullStoredState()));
    const fetchMock = vi.fn<typeof fetch>(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: /Chốt deal/ }));

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { activity: unknown };
    expect(body.activity).toEqual({ kind: "surprise" });
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

describe("InviteFlow — state cũ thiếu/hỏng activity", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
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
  });

  it("option vui chơi đã chọn bị host xóa → bước vui chơi mở lại, các bước sau ẩn", () => {
    const stored = fullStoredState();
    stored.activity = { kind: "option", optionId: 99, optionName: "Khu vui chơi đã xóa" } as never;
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(stored));
    renderFlow();

    expect(screen.getByText(/Chơi gì trước/)).toBeTruthy();
    expect(screen.queryByText(/Ăn gì đây/)).toBeNull();
    // phim/cafe đã chọn từ trước cũng phải ẩn — không nhảy cóc qua bước ăn
    expect(screen.queryByText(/Xem phim gì/)).toBeNull();
    expect(screen.queryByText(/Cafe chốt hạ/)).toBeNull();
    expect(screen.queryByText(/Timeline buổi hẹn/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Chốt deal/ })).toBeNull();
  });

  it("state cũ đã submittedAt nhưng thiếu activity → thiệp không tự mở với timeline rỗng", () => {
    const stored: Record<string, unknown> = {
      ...fullStoredState(),
      submittedAt: "2026-08-10T00:00:00.000Z",
    };
    delete stored.activity;
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(stored));
    renderFlow();

    expect(screen.queryByText(/Campaign confirmed/)).toBeNull();
  });

  it("state cũ đã duyệt + đã gửi nhưng thiếu activity: chọn vui chơi xong phải duyệt lại plan, thiệp không bật lên", () => {
    const stored: Record<string, unknown> = {
      ...fullStoredState(),
      submittedAt: "2026-08-10T00:00:00.000Z",
    };
    delete stored.activity;
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(stored));
    renderFlow();

    // options rỗng nên bước vui chơi chỉ có card surprise
    fireEvent.click(screen.getByRole("button", { name: /Để anh lên kèo bí mật/ }));

    // timeline hiện lại nhưng ở trạng thái chưa duyệt → chưa có bước chốt, thiệp không tự mở
    expect(screen.getByText(/Ăn gì đây/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Chốt deal/ })).toBeNull();
    expect(screen.queryByText(/Campaign confirmed/)).toBeNull();
  });

  it("state đầy đủ đã submittedAt → thiệp tự mở", () => {
    window.localStorage.setItem(
      FLOW_STORAGE_KEY,
      JSON.stringify({ ...fullStoredState(), submittedAt: "2026-08-10T00:00:00.000Z" })
    );
    renderFlow();

    expect(screen.getByText(/Campaign confirmed/)).toBeTruthy();
  });
});
