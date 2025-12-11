/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // 🔥 외부 이미지 도메인 허용
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.prjguardian.com",
        // port: "",                        // 443 기본이면 생략
        pathname: "/image/**",             // /image 하위만 허용
      },
    ],
    // 또는 간단히:
    // domains: ["api.prjguardian.com"],
  },

  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8081/api/:path*" },
      { source: "/ws", destination: "http://localhost:8081/ws" },
      { source: "/image/:path*", destination: "http://localhost:8081/image/:path*" },
      { source: "/files/:path*", destination: "http://localhost:8081/files/:path*" },
    ];
  },
};

export default nextConfig;
