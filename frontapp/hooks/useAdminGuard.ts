"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type GuardianAuthPayload = {
  userId: number;
  role: string;
  accessToken: string;
  refreshToken: string;
  email: string;
};

export function useAdminGuard() {
  const router = useRouter();
  const [ready] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem("guardian_auth");
      if (!raw) return false;
      const parsed: GuardianAuthPayload = JSON.parse(raw);
      const role = parsed.role?.toUpperCase().trim();
      return Boolean(role && role.includes("ADMIN"));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (ready) return;
    try {
      const raw = window.localStorage.getItem("guardian_auth");

      if (!raw) {
        router.replace("/");
        return;
      }

      const parsed: GuardianAuthPayload = JSON.parse(raw);
      const role = parsed.role?.toUpperCase().trim();

      console.log("🔎 관리자 권한 체크 role =", role);

      // 🔥 "ADMIN" 이 포함되어 있으면 관리자 인정
      if (!role || !role.includes("ADMIN")) {
        router.replace("/");
        return;
      }
    } catch (error) {
      console.error("[useAdminGuard] auth parse error:", error);
      router.replace("/");
    }
  }, [ready, router]);

  return ready;
}
