"use client";

import { useEffect } from "react";

type GuardianAuthPayload = {
  userId?: number;
  role?: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
};

function toNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function AuthHydrator() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem("guardian_auth");
    let parsed: GuardianAuthPayload | null = null;

    if (raw) {
      try {
        parsed = JSON.parse(raw) as GuardianAuthPayload;
      } catch {
        parsed = null;
      }
    }

    const accessToken = window.localStorage.getItem("accessToken");
    const refreshToken = window.localStorage.getItem("refreshToken");
    const userRole = window.localStorage.getItem("userRole");
    const userId = window.localStorage.getItem("userId");
    const userEmail = window.localStorage.getItem("userEmail");
    const userName = window.localStorage.getItem("userName");

    if (parsed) {
      if (!accessToken && parsed.accessToken) {
        window.localStorage.setItem("accessToken", parsed.accessToken);
      }
      if (!refreshToken && parsed.refreshToken) {
        window.localStorage.setItem("refreshToken", parsed.refreshToken);
      }
      if (!userRole && parsed.role) {
        window.localStorage.setItem("userRole", parsed.role);
      }
      if (!userId && typeof parsed.userId === "number") {
        window.localStorage.setItem("userId", String(parsed.userId));
      }
      if (!userEmail && parsed.email) {
        window.localStorage.setItem("userEmail", parsed.email);
      }
      if (!userName && parsed.name) {
        window.localStorage.setItem("userName", parsed.name);
      }
      return;
    }

    if (
      accessToken ||
      refreshToken ||
      userRole ||
      userId ||
      userEmail ||
      userName
    ) {
      const payload: GuardianAuthPayload = {
        userId: toNumber(userId),
        role: userRole ?? undefined,
        name: userName ?? undefined,
        accessToken: accessToken ?? undefined,
        refreshToken: refreshToken ?? undefined,
        email: userEmail ?? undefined,
      };
      window.localStorage.setItem("guardian_auth", JSON.stringify(payload));
    }
  }, []);

  return null;
}
