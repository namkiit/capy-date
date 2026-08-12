import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminSessionToken,
  safeEqual,
} from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const loginSchema = z.object({ password: z.string().min(1).max(200) });

/** Tối đa 5 lần thử đăng nhập / IP / phút — chặn brute-force thô */
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!checkRateLimit(`admin-login:${ip}`, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS)) {
    console.warn(`Rate limit đăng nhập admin: IP ${ip} thử quá ${LOGIN_ATTEMPT_LIMIT} lần/phút`);
    return NextResponse.json(
      { ok: false, error: "Thử nhiều quá rồi — đợi 1 phút rồi thử lại nha" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body không hợp lệ" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Thiếu password" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error("ADMIN_PASSWORD chưa cấu hình — không thể đăng nhập admin");
    return NextResponse.json(
      { ok: false, error: "Server chưa cấu hình admin (thiếu ADMIN_PASSWORD)" },
      { status: 500 }
    );
  }
  if (!process.env.ADMIN_SESSION_SECRET) {
    // guard trước khi adminSessionToken() throw — không thì login đúng password vẫn 500 trần
    console.error("ADMIN_SESSION_SECRET chưa cấu hình — không thể tạo session admin");
    return NextResponse.json(
      { ok: false, error: "Server chưa cấu hình admin (thiếu ADMIN_SESSION_SECRET)" },
      { status: 500 }
    );
  }
  if (!safeEqual(parsed.data.password, expected)) {
    console.warn(`Đăng nhập admin sai mật khẩu từ IP ${ip}`);
    return NextResponse.json({ ok: false, error: "Sai mật khẩu rồi 🙅" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await adminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
