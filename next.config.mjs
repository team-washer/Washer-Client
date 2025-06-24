/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	// 텔레메트리 비활성화
	telemetry: {
		enabled: false,
	},
	// 정적 배포를 원하는 경우 아래 주석 해제
	// output: 'export',
	// trailingSlash: true,
};

export default nextConfig;
