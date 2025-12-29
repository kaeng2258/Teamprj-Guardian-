export function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
  ];

  const turnUrlsRaw = process.env.NEXT_PUBLIC_TURN_URL ?? "";
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME ?? "";
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "";

  if (turnUrlsRaw && turnUsername && turnCredential) {
    const urls = turnUrlsRaw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (urls.length > 0) {
      servers.push({
        urls,
        username: turnUsername,
        credential: turnCredential,
      });
    }
  }

  return servers;
}
