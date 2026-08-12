/**
 * Auth admin tối giản cho site 1 host: password trong env, session là cookie
 * HTTP-only chứa HMAC(secret, nhãn cố định). Không cần bảng user/session —
 * đổi ADMIN_SESSION_SECRET là mọi session cũ hết hạn.
 * Dùng Web Crypto để chạy được cả Edge (proxy) lẫn Node (route handler).
 */

export const ADMIN_COOKIE = "capy_admin";
/** 30 ngày */
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const SESSION_LABEL = "capy-admin-session-v1";

export async function adminSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set — xem .env.example");
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(SESSION_LABEL));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** So sánh constant-time để không lộ thông tin qua timing */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function isValidAdminCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  try {
    return safeEqual(cookieValue, await adminSessionToken());
  } catch {
    // thiếu secret → coi như chưa đăng nhập, đừng crash proxy
    return false;
  }
}
