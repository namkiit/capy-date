"use client";

import { SectionShell } from "./SectionShell";

interface Step8SubmitProps {
  submitting: boolean;
  submittedAt: string | null;
  error: string | null;
  onSubmit: () => void;
  onShowCard: () => void;
}

/** Bước 8 — Sign-off: nút chốt deal + trạng thái sau khi đã submit */
export function Step8Submit({
  submitting,
  submittedAt,
  error,
  onSubmit,
  onShowCard,
}: Step8SubmitProps) {
  return (
    <SectionShell id="step-submit" eyebrow="Hạng mục 09 — Sign-off" title="Chốt deal thôi! 🤝">
      <p className="text-ink">
        Mọi hạng mục đã sẵn sàng. Bấm nút bên dưới để sign-off campaign — anh sẽ nhận được
        brief ngay lập tức 📬
      </p>

      <div className="mt-5 flex flex-col items-stretch gap-3">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-full bg-tangerine px-8 py-4 font-display text-xl font-bold text-cream shadow-lg shadow-tangerine/30 transition-transform active:scale-95 disabled:opacity-60"
        >
          {submitting
            ? "Đang gửi hồ sơ... 📨"
            : submittedAt
              ? "Chốt lại deal (đã đổi lựa chọn) 🤝"
              : "Chốt deal 🤝"}
        </button>

        {submittedAt && (
          <button
            onClick={onShowCard}
            className="rounded-full bg-olive px-8 py-3 font-display text-lg font-bold text-cream shadow-lg shadow-olive/25 active:scale-95"
          >
            Xem thiệp mời 💌
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-2xl bg-tangerine/10 px-4 py-2.5 text-sm font-semibold text-tangerine">
          {error}
        </p>
      )}
      {submittedAt && !error && (
        <p className="mt-3 text-sm font-semibold text-olive">
          Deal đã chốt ✓ — đổi ý bước nào cứ chọn lại rồi chốt lại nha.
        </p>
      )}
    </SectionShell>
  );
}
