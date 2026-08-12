import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Upload ảnh lên Vercel Blob. Chưa cấu hình token → 501, admin dán URL thay thế. */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Chưa cấu hình BLOB_READ_WRITE_TOKEN — dán URL ảnh trực tiếp thay vì upload nha" },
      { status: 501 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Thiếu file trong form data" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: `Định dạng ${file.type} không được hỗ trợ` }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "Ảnh vượt quá 5MB" }, { status: 400 });
  }

  const blob = await put(`capy-date/${Date.now()}-${file.name}`, file, { access: "public" });
  return NextResponse.json({ ok: true, url: blob.url });
}
