"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { SectionShell } from "./SectionShell";

/** Sau số lần né này, nút No biến thành nút Yes thứ hai */
export const MAX_NO_DODGES = 5;
/** Khoảng cách tối thiểu từ nút No tới mép viewport khi bay né */
const VIEWPORT_PADDING = 16;
/** Hai sự kiện trong khoảng này coi là một lần chạm (pointerenter + pointerdown cùng gesture) */
const DODGE_DEDUPE_MS = 250;

interface Step1YesNoProps {
  question: string;
  /** Caption nút No theo số lần né; phần tử cuối dành cho trạng thái "hết hàng" */
  noCaptions: string[];
  noDodgeCount: number;
  onDodge: () => void;
  onApprove: () => void;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Bước 1 — Câu hỏi Yes/No. Nút No né bằng pointerdown/pointerenter (pointerdown
 * bắn TRƯỚC click nên tap mobile cũng né được), vị trí random trong vùng an toàn
 * của viewport. Nút No không có hành vi click thật — có "trúng" cũng không sao.
 */
export function Step1YesNo({
  question,
  noCaptions,
  noDodgeCount,
  onDodge,
  onApprove,
}: Step1YesNoProps) {
  const noRef = useRef<HTMLButtonElement>(null);
  const lastDodgeAt = useRef(0);
  /** Vị trí fixed hiện tại của nút No (null = còn nằm trong layout) */
  const [noBox, setNoBox] = useState<Box | null>(null);
  /** Vị trí xuất phát để animate lần né đầu tiên */
  const [startBox, setStartBox] = useState<Box | null>(null);

  const exhausted = noDodgeCount >= MAX_NO_DODGES;
  const noScale = Math.max(0.55, 1 - noDodgeCount * 0.1);
  const yesScale = Math.min(1.3, 1 + noDodgeCount * 0.06);

  const captionsSafe = noCaptions.length >= 2 ? noCaptions : ["Không", "Option này đã hết hàng"];
  const activeCaption = captionsSafe[Math.min(noDodgeCount, captionsSafe.length - 2)];
  const exhaustedCaption = captionsSafe[captionsSafe.length - 1];

  function dodge() {
    const now = Date.now();
    if (now - lastDodgeAt.current < DODGE_DEDUPE_MS || exhausted) return;
    lastDodgeAt.current = now;

    const el = noRef.current;
    const rect = el?.getBoundingClientRect();
    const w = rect?.width ?? 120;
    const h = rect?.height ?? 48;
    if (noBox === null && rect) {
      setStartBox({ x: rect.left, y: rect.top, w, h });
    }

    // iOS toolbar co giãn → visualViewport chính xác hơn innerWidth/Height
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const maxX = Math.max(VIEWPORT_PADDING, vw - w - VIEWPORT_PADDING);
    const maxY = Math.max(VIEWPORT_PADDING, vh - h - VIEWPORT_PADDING);
    setNoBox({
      x: VIEWPORT_PADDING + Math.random() * (maxX - VIEWPORT_PADDING),
      y: VIEWPORT_PADDING + Math.random() * (maxY - VIEWPORT_PADDING),
      w,
      h,
    });
    onDodge();
  }

  function handlePointerEnter(e: ReactPointerEvent<HTMLButtonElement>) {
    // hover chỉ có nghĩa với chuột; trên touch để pointerdown xử lý
    if (e.pointerType === "mouse") dodge();
  }

  const noButtonClass =
    "rounded-full border-2 border-latte bg-cream px-7 py-3 font-display text-lg font-bold text-ink-soft";

  return (
    <SectionShell id="step-approve" eyebrow="Hạng mục 01 — Approval" title={question}>
      <div className="flex flex-wrap items-center justify-center gap-4 py-4">
        <motion.button
          onClick={onApprove}
          animate={{ scale: yesScale }}
          whileTap={{ scale: yesScale * 0.94 }}
          className="rounded-full bg-tangerine px-8 py-3.5 font-display text-lg font-bold text-cream shadow-lg shadow-tangerine/25"
        >
          Approve ✓
        </motion.button>

        {exhausted ? (
          <div className="flex flex-col items-center gap-1.5">
            <motion.button
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={onApprove}
              className="rounded-full bg-olive px-7 py-3 font-display text-lg font-bold text-cream shadow-lg shadow-olive/25"
            >
              Approve luôn ✓
            </motion.button>
            <span className="text-xs italic text-ink-soft">({exhaustedCaption})</span>
          </div>
        ) : noBox === null ? (
          <button
            ref={noRef}
            onPointerEnter={handlePointerEnter}
            onPointerDown={dodge}
            onClick={dodge}
            className={noButtonClass}
          >
            {activeCaption}
          </button>
        ) : (
          <>
            {/* giữ chỗ trong layout để nút Yes không bị xô lệch */}
            <div style={{ width: noBox.w, height: noBox.h }} aria-hidden />
            <motion.button
              ref={noRef}
              onPointerEnter={handlePointerEnter}
              onPointerDown={dodge}
              onClick={dodge}
              initial={{ x: startBox?.x ?? noBox.x, y: startBox?.y ?? noBox.y, scale: 1 }}
              animate={{ x: noBox.x, y: noBox.y, scale: noScale }}
              transition={{ type: "spring", stiffness: 480, damping: 28 }}
              className={`${noButtonClass} fixed left-0 top-0 z-50`}
            >
              {activeCaption}
            </motion.button>
          </>
        )}
      </div>
      {noDodgeCount > 0 && !exhausted && (
        <p className="text-center text-sm text-ink-soft">
          Nút này hơi khó bấm thì phải 🤔 ({noDodgeCount}/{MAX_NO_DODGES})
        </p>
      )}
    </SectionShell>
  );
}
