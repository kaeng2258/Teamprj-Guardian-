/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* config options here */
  async rewrites() {
  return [
    { source: "/api/:path*", destination: "http://localhost:8081/api/:path*" },
    { source: "/ws", destination: "http://localhost:8081/ws" },
  ];
}
};

export default nextConfig;
