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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

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

      // ADMIN 확인 완료
      setReady(true);
    } catch (error) {
      console.error("[useAdminGuard] auth parse error:", error);
      router.replace("/");
    }
  }, [router]);

  return ready;
}
