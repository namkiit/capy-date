/**
 * Rate limit in-memory theo key (thường là IP) — đủ cho site 1 người dùng.
 * Lưu ý: trên Vercel mỗi serverless instance có Map riêng nên giới hạn là
 * "per instance", không tuyệt đối — chấp nhận được ở quy mô này, mục đích
 * chính là chặn brute-force password và spam submit thô.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** true = còn trong hạn mức; false = đã vượt, caller nên trả 429 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  // dọn rác thô khi map phình to (tránh memory leak trên instance sống lâu)
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Lấy IP client từ header do Vercel/proxy set */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
