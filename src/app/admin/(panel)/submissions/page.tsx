"use client";

import { useEffect, useState } from "react";
import { StatusMessage, cardCls, type AdminMessage } from "@/components/admin/AdminUI";
import { adminApi } from "@/lib/admin-client";
import { describeChoice } from "@/lib/choice-label";
import type { SubmissionRow } from "@/lib/db/schema";
import { formatFullVietnameseDate } from "@/lib/format";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[] | null>(null);
  const [message, setMessage] = useState<AdminMessage>(null);

  useEffect(() => {
    adminApi<{ submissions: SubmissionRow[] }>("/api/admin/submissions")
      .then((data) => setSubmissions(data.submissions))
      .catch((err) =>
        setMessage({ kind: "error", text: err instanceof Error ? err.message : "Lỗi tải dữ liệu" })
      );
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Submissions 💌</h1>
      <StatusMessage message={message} />

      {submissions === null && !message && <p className="mt-4 text-ink-soft">Đang tải...</p>}
      {submissions?.length === 0 && (
        <p className="mt-4 text-ink-soft">Chưa có submission nào — chờ nàng bấm nút thôi 🤞</p>
      )}

      <div className="mt-4 space-y-3">
        {submissions?.map((sub) => (
          <div key={sub.id} className={cardCls}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-display text-lg font-bold text-tangerine">
                {formatFullVietnameseDate(sub.payload.date)} — {sub.payload.slot}
              </p>
              <span className="shrink-0 text-xs text-ink-soft">
                #{sub.id} · {new Date(sub.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <dl className="mt-2 space-y-1 text-sm text-ink">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 font-bold text-capy-deep">🍜 Ăn</dt>
                <dd>{describeChoice(sub.payload.food)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 font-bold text-capy-deep">🎬 Phim</dt>
                <dd>{describeChoice(sub.payload.movie)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 font-bold text-capy-deep">🧋 Cafe</dt>
                <dd>{describeChoice(sub.payload.cafe)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 font-bold text-capy-deep">✨ Vibe</dt>
                <dd>{sub.payload.vibe ?? "—"}</dd>
              </div>
              {sub.payload.feedback && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 font-bold text-capy-deep">📝 Note</dt>
                  <dd className="italic">{sub.payload.feedback}</dd>
                </div>
              )}
            </dl>
            <p className="mt-2 text-xs text-ink-soft">
              Bấm hụt nút No {sub.payload.noDodgeCount} lần 😆
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
