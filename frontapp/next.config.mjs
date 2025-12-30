/** @type {import("next").NextConfig} */
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "");
const wsEnv = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081/ws").replace(/\/$/, "");

// Normalize WS URL into an HTTP(S) URL for Next.js rewrite (rewrites disallow ws://)
const wsRewrite = (() => {
  try {
    const url = new URL(wsEnv);
    if (url.protocol === "ws:") return `http://${url.host}${url.pathname}`;
    if (url.protocol === "wss:") return `https://${url.host}${url.pathname}`;
    if (url.protocol === "http:" || url.protocol === "https:") return wsEnv;
  } catch (e) {
    // fallback below
  }
  return `${apiBase}/ws`;
})();

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
      { source: "/ws", destination: wsRewrite },
      { source: "/image/:path*", destination: `${apiBase}/image/:path*` },
      { source: "/files/:path*", destination: `${apiBase}/files/:path*` },
    ];
  },
};

export default nextConfig;