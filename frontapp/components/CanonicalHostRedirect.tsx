"use client";

import { useEffect } from "react";

const CANONICAL_HOST = "prjguardian.com";

export default function CanonicalHostRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hostname, protocol, pathname, search, hash } = window.location;
    if (hostname !== CANONICAL_HOST) {
      const target = `${protocol}//${CANONICAL_HOST}${pathname}${search}${hash}`;
      window.location.replace(target);
    }
  }, []);

  return null;
}
