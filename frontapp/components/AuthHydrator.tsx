"use client";

import { useEffect } from "react";
import { readAuth, setAuthCookie } from "../lib/auth";

export default function AuthHydrator() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const auth = readAuth();
    if (!auth) {
      return;
    }

    if (auth.accessToken) {
      window.localStorage.setItem("accessToken", auth.accessToken);
    }
    if (auth.refreshToken) {
      window.localStorage.setItem("refreshToken", auth.refreshToken);
    }
    if (auth.role) {
      window.localStorage.setItem("userRole", auth.role);
    }
    if (typeof auth.userId === "number") {
      window.localStorage.setItem("userId", String(auth.userId));
    }
    if (auth.email) {
      window.localStorage.setItem("userEmail", auth.email);
    }
    if (auth.name) {
      window.localStorage.setItem("userName", auth.name);
    }
    window.localStorage.setItem("guardian_auth", JSON.stringify(auth));
    setAuthCookie(auth);
  }, []);

  return null;
}
