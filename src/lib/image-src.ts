/**
 * Chỉ ảnh trên Vercel Blob (do host upload) mới đi qua Image Optimization —
 * remotePatterns wildcard sẽ biến /_next/image thành proxy ảnh công khai
 * (đốt quota, fetch ẩn danh). Ảnh dán URL ngoài render unoptimized (load thẳng
 * từ nguồn, không qua proxy của site).
 */
export function isOptimizableImage(src: string): boolean {
  try {
    return new URL(src).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
