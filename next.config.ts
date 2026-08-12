import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Chỉ cho Blob của mình qua Image Optimization; ảnh dán URL ngoài dùng
    // unoptimized (xem src/lib/image-src.ts) — không mở wildcard để /_next/image
    // không thành proxy ảnh công khai
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
