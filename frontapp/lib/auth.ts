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

function clearAuthStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("refreshToken");
  window.localStorage.removeItem("guardian_auth");
  window.localStorage.removeItem("userId");
  window.localStorage.removeItem("userRole");
  window.localStorage.removeItem("userEmail");
  window.localStorage.removeItem("userName");
  clearAuthCookie();
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

export function buildAuthHeaders(): Record<string, string> {
  const auth = readAuth();
  if (!auth?.accessToken) {
    return {};
  }
  return { Authorization: `Bearer ${auth.accessToken}` };
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function mergeHeaders(initHeaders?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!initHeaders) return headers;

  if (initHeaders instanceof Headers) {
    initHeaders.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  if (Array.isArray(initHeaders)) {
    initHeaders.forEach(([key, value]) => {
      headers[key] = value;
    });
    return headers;
  }

  return { ...initHeaders };
}

function persistAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  const current = readAuth() ?? {};
  const next = { ...current, accessToken, refreshToken };
  window.localStorage.setItem("accessToken", accessToken);
  window.localStorage.setItem("refreshToken", refreshToken);
  window.localStorage.setItem("guardian_auth", JSON.stringify(next));
  setAuthCookie(next);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  try {
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  if (!exp) return false;
  return Date.now() >= exp * 1000 - skewSeconds * 1000;
}

export async function refreshAccessToken(): Promise<string | null> {
  const auth = readAuth();
  if (!auth?.refreshToken || !API_BASE) {
    return auth?.accessToken ?? null;
  }
  try {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
    if (!refreshRes.ok) {
      clearAuthStorage();
      return null;
    }
    const payload = (await refreshRes.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    persistAuthTokens(payload.accessToken, payload.refreshToken);
    return payload.accessToken;
  } catch {
    clearAuthStorage();
    return null;
  }
}

export async function ensureAccessToken(): Promise<string | null> {
  const auth = readAuth();
  if (!auth) return null;
  const accessToken = auth.accessToken ?? null;
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }
  return refreshAccessToken();
}

export async function fetchWithAuth(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const auth = readAuth();
  const headers = mergeHeaders(init.headers);
  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  // 401: 토큰 만료/검증 실패 시에만 새 토큰 요청. 403은 권한 거부일 수 있으니 그대로 반환.
  if (res.status === 401 && auth?.refreshToken && API_BASE) {
    try {
      const nextToken = await refreshAccessToken();
      if (!nextToken) {
        return res;
      }
      const retryHeaders = mergeHeaders(init.headers);
      retryHeaders.Authorization = `Bearer ${nextToken}`;
      return await fetch(url, {
        ...init,
        headers: retryHeaders,
        credentials: "include",
      });
    } catch {
      return res;
    }
  }

  return res;
}
