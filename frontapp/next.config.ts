import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
  return [
    { source: "/api/:path*", destination: "http://localhost:8081/api/:path*" },
    { source: "/ws", destination: "http://localhost:8081/ws" },
  ];
}
};

export default nextConfig;
