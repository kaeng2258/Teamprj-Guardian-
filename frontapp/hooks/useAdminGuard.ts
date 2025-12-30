"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readAuth } from "../lib/auth";

export function useAdminGuard() {
  const router = useRouter();
  const [ready] = useState<boolean>(() => {
    const auth = readAuth();
    const role = auth?.role?.toUpperCase().trim();
    return Boolean(role && role.includes("ADMIN"));
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (ready) return;
    try {
      const auth = readAuth();
      const role = auth?.role?.toUpperCase().trim();

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
