import { NextResponse } from "next/server";
import {
  SubmissionValidationError,
  submissionInputSchema,
  submitInvitation,
} from "@/lib/services/submission";

/** POST /api/submit — nhận lựa chọn của khách, validate ở boundary rồi giao cho service */
export async function POST(request: Request) {
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
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không đúng cấu trúc" },
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
