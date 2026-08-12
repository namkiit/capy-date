// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_NO_DODGES, Step1YesNo } from "./Step1YesNo";

const CAPTIONS = ["Không", "Suy nghĩ lại đi", "Option này đã hết hàng"];

function renderStep(overrides: Partial<Parameters<typeof Step1YesNo>[0]> = {}) {
  const onDodge = vi.fn();
  const onApprove = vi.fn();
  render(
    <Step1YesNo
      question="Đi chơi không?"
      noCaptions={CAPTIONS}
      noDodgeCount={0}
      onDodge={onDodge}
      onApprove={onApprove}
      {...overrides}
    />
  );
  return { onDodge, onApprove };
}

describe("Step1YesNo — nút No bay né", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("pointerdown lên nút No gọi onDodge (tap mobile né được trước khi click)", () => {
    const { onDodge } = renderStep();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Không" }));
    expect(onDodge).toHaveBeenCalledTimes(1);
  });

  it("hai sự kiện trong cửa sổ dedupe chỉ tính một lần né", () => {
    const { onDodge } = renderStep();
    const noButton = screen.getByRole("button", { name: "Không" });

    fireEvent.pointerDown(noButton);
    // pointerenter + pointerdown của cùng một gesture đến ngay sau đó
    fireEvent.pointerDown(noButton);
    expect(onDodge).toHaveBeenCalledTimes(1);

    // qua cửa sổ dedupe thì lần chạm mới được tính
    vi.setSystemTime(new Date("2026-08-12T10:00:01Z"));
    fireEvent.pointerDown(screen.getByText(CAPTIONS[0]));
    expect(onDodge).toHaveBeenCalledTimes(2);
  });

  it("đủ số lần né thì nút No biến thành nút Approve thứ hai kèm caption hết hàng", () => {
    const { onApprove, onDodge } = renderStep({ noDodgeCount: MAX_NO_DODGES });

    expect(screen.queryByText(CAPTIONS[0])).toBeNull();
    expect(screen.getByText(`(${CAPTIONS[2]})`)).toBeTruthy();

    const secondYes = screen.getByRole("button", { name: "Approve luôn ✓" });
    fireEvent.click(secondYes);
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onDodge).not.toHaveBeenCalled();
  });

  it("host cấu hình thiếu caption (dưới 2 dòng) thì fallback không vỡ", () => {
    renderStep({ noCaptions: [] });
    expect(screen.getByRole("button", { name: "Không" })).toBeTruthy();
  });

  it("nút Approve chính luôn gọi onApprove", () => {
    const { onApprove } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Approve ✓" }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });
});
