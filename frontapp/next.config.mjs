/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* config options here */
  async rewrites() {
  return [
    { source: "/api/:path*", destination: "http://localhost:8081/api/:path*" },
    { source: "/ws", destination: "http://localhost:8081/ws" },
    { source: "/image/:path*", destination: "http://localhost:8081/image/:path*" },
    { source: "/files/:path*", destination: "http://localhost:8081/files/:path*" },
  ];
}
};

export default nextConfig;
