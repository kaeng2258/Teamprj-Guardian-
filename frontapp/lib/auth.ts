"use client";

type GuardianAuthPayload = {
  userId?: number;
  role?: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
};

const AUTH_COOKIE = "guardian_auth";

function toNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.slice(name.length + 1);
  return value ? decodeURIComponent(value) : null;
}

function getAuthCookie(): GuardianAuthPayload | null {
  const raw = getCookieValue(AUTH_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuardianAuthPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(payload: GuardianAuthPayload) {
  if (typeof document === "undefined") return;
  const domain =
    window.location.hostname.endsWith("prjguardian.com") ? "; domain=.prjguardian.com" : "";
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(
    JSON.stringify(payload),
  )}; path=/; max-age=2592000; samesite=lax; secure${domain}`;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  const domain =
    window.location.hostname.endsWith("prjguardian.com") ? "; domain=.prjguardian.com" : "";
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax; secure${domain}`;
}

export function readAuth(): GuardianAuthPayload | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem("guardian_auth");
  let parsed: GuardianAuthPayload | null = null;

  if (raw) {
    try {
      parsed = JSON.parse(raw) as GuardianAuthPayload;
    } catch {
      parsed = null;
    }
  }

  const cookie = getAuthCookie();
  const accessToken =
    parsed?.accessToken ??
    cookie?.accessToken ??
    window.localStorage.getItem("accessToken") ??
    undefined;
  const refreshToken =
    parsed?.refreshToken ??
    cookie?.refreshToken ??
    window.localStorage.getItem("refreshToken") ??
    undefined;
  const role =
    parsed?.role ??
    cookie?.role ??
    window.localStorage.getItem("userRole") ??
    undefined;
  const userId =
    typeof parsed?.userId === "number"
      ? parsed.userId
      : typeof cookie?.userId === "number"
      ? cookie.userId
      : toNumber(window.localStorage.getItem("userId"));
  const email =
    parsed?.email ?? cookie?.email ?? window.localStorage.getItem("userEmail") ?? undefined;
  const name =
    parsed?.name ?? cookie?.name ?? window.localStorage.getItem("userName") ?? undefined;

  if (!accessToken && !refreshToken && !role && !userId && !email && !name) {
    return null;
  }

  return {
    userId,
    role,
    name,
    accessToken,
    refreshToken,
    email,
  };
}
