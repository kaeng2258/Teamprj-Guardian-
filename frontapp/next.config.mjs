/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8081",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "8081",
        pathname: "/image/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8081",
        pathname: "/files/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "8081",
        pathname: "/files/**",
      },
    ],
  },
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
