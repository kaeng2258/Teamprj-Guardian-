/** @type {import("next").NextConfig} */
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "");
const wsBase = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081/ws").replace(/\/$/, "");
const apiUrl = new URL(apiBase);
const protocol = apiUrl.protocol.replace(":", "");
const hostname = apiUrl.hostname;
const port = apiUrl.port;

const toPattern = (pathname) => ({
  protocol,
  hostname,
  pathname,
  ...(port ? { port } : {}),
});

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    domains: [hostname],
    remotePatterns: [toPattern("/image/**"), toPattern("/files/**")],
  },
  /* config options here */
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiBase}/api/:path*` },
      { source: "/ws", destination: wsBase },
      { source: "/image/:path*", destination: `${apiBase}/image/:path*` },
      { source: "/files/:path*", destination: `${apiBase}/files/:path*` },
    ];
  },
};

export default nextConfig;