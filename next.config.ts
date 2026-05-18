import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run/Docker 배포용 — Next.js가 .next/standalone에 최소 실행 파일만 묶음
  // (이미지 크기 ~1GB → ~150MB 감소)
  output: "standalone",
};

export default nextConfig;
