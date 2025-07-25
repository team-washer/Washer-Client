/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ✅ 새로 추가된 옵션 (Next.js 15에서 변경됨)
  serverExternalPackages: [],

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // HMR 관련 설정 조정
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }

      // HMR이 쿠키에 영향을 주지 않도록 설정
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    return config
  },

  // ✅ `experimental` 내에 더 이상 serverComponent 관련 설정 없음
  experimental: {
    optimizeCss: false,
  },

  async rewrites() {
    return [];
  },
};

export default nextConfig;
