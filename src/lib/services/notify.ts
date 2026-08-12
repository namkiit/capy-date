import { Resend } from "resend";
import { describeChoice } from "@/lib/choice-label";
import type { SubmissionRow } from "@/lib/db/schema";

/** Notify host qua email (Resend) khi có submission mới */

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function notifySubmission(submission: SubmissionRow): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_EMAIL_FROM;
  const to = process.env.NOTIFY_EMAIL_TO;
  if (!apiKey || !from || !to) {
    console.warn("Resend chưa cấu hình (RESEND_API_KEY / NOTIFY_EMAIL_FROM / NOTIFY_EMAIL_TO) — bỏ qua notify");
    return;
  }

  const p = submission.payload;
  const rows: Array<[string, string]> = [
    ["📅 Ngày", p.date],
    ["⏰ Giờ", p.slot],
    ["🍜 Ăn", describeChoice(p.food)],
    ["🎬 Phim", describeChoice(p.movie)],
    ["🧋 Cafe", describeChoice(p.cafe)],
    ["✨ Vibe", p.vibe ?? "—"],
    ["📝 Feedback", p.feedback ?? "—"],
    ["🙅 Số lần bấm hụt nút No", String(p.noDodgeCount)],
  ];

  const html = `
    <div style="font-family:sans-serif;max-width:480px">
      <h2 style="color:#b08968">🎉 Capy Date: proposal đã được approve!</h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([label, value]) =>
              `<tr>
                <td style="padding:6px 10px;font-weight:bold;color:#6f5138;white-space:nowrap">${label}</td>
                <td style="padding:6px 10px;color:#3e2f23">${escapeHtml(value)}</td>
              </tr>`
          )
          .join("")}
      </table>
      <p style="color:#7a6a58;font-size:12px">Submission #${submission.id} — xem đầy đủ trong trang admin.</p>
    </div>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `💌 Capy Date: em đã chốt lịch ${p.date} ${p.slot}!`,
    html,
  });
  if (error) {
    throw new Error(`Resend trả lỗi khi gửi notify: ${error.message}`);
  }
}
