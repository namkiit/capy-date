import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Bỏ ký tự lạ trong tên file client gửi lên trước khi dùng làm blob key */
function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned.slice(-80) || "image";
}

/** Upload ảnh lên Vercel Blob. Chưa cấu hình token → 501, admin dán URL thay thế. */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Chưa cấu hình BLOB_READ_WRITE_TOKEN — dán URL ảnh trực tiếp thay vì upload nha" },
      { status: 501 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Body không phải form data hợp lệ" }, { status: 400 });
  }
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

  const blob = await put(`capy-date/${sanitizeFileName(file.name)}`, file, {
    access: "public",
    // random suffix để key không đoán được và không ghi đè nhau
    addRandomSuffix: true,
  });
  return NextResponse.json({ ok: true, url: blob.url });
}
