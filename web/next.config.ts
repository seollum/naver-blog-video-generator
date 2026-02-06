import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 타입 에러가 있어도 무시하고 배포합니다
    ignoreBuildErrors: true,
  },
  eslint: {
    // 스타일 에러가 있어도 무시하고 배포합니다
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;