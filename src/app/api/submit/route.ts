import { NextResponse } from "next/server";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import {
  SubmissionValidationError,
  submissionInputSchema,
  submitInvitation,
} from "@/lib/services/submission";

/** POST /api/submit — nhận lựa chọn của khách, validate ở boundary rồi giao cho service */
export async function POST(request: Request) {
  // chặn spam thô (mỗi submit = 1 record + 1 email) — người dùng thật không đụng trần này
  if (!checkRateLimit(`submit:${clientIp(request)}`, 10, 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Gửi nhiều quá rồi — đợi chút rồi thử lại nha" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body không phải JSON hợp lệ" },
      { status: 400 }
    );
  }

  const parsed = submissionInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // log để host còn debug được — không nuốt lỗi im lặng
    console.warn("Submit payload sai cấu trúc:", parsed.error.issues);
    return NextResponse.json(
      { ok: false, error: `Dữ liệu gửi lên không hợp lệ (${issue.path.join(".")})` },
      { status: 400 }
    );
  }

  try {
    const row = await submitInvitation(parsed.data);
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    if (err instanceof SubmissionValidationError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    console.error("Submit thất bại:", err);
    return NextResponse.json(
      { ok: false, error: "Server đang dỗi, thử lại sau chút nha 🥲" },
      { status: 500 }
    );
  }
}
