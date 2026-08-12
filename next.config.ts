import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Ảnh quán/phim do host dán URL bất kỳ từ admin (Google Maps, fanpage...)
    // nên phải mở wildcard https — site riêng tư, chỉ host kiểm soát nội dung
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
