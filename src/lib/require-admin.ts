import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";

/**
 * Lớp phòng thủ thứ hai bên trong từng route handler admin — proxy đã chặn
 * ở rìa nhưng không được là tuyến duy nhất (khuyến cáo của Next docs; từng có
 * CVE bypass middleware). Trả NextResponse 401 nếu chưa đăng nhập, null nếu ok.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  const valid = await isValidAdminCookie(store.get(ADMIN_COOKIE)?.value);
  if (valid) return null;
  return NextResponse.json({ ok: false, error: "Chưa đăng nhập admin" }, { status: 401 });
}
