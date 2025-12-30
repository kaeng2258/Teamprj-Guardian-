"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ChatRoom from "@/components/ChatRoom";
import { ensureAccessToken } from "@/lib/auth";

type Me = {
  id: number;
  name: string;
  role?: string;
  email?: string;
  profileImageUrl?: string | null;
};

function getMeFromLocalStorage(): Me | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("guardian_auth");
  let parsed: any = null;

  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  const storedId = localStorage.getItem("userId");
  const id = Number(parsed?.id ?? parsed?.userId ?? storedId);
  if (!id || Number.isNaN(id)) return null;

  const name =
    parsed?.name ||
    localStorage.getItem("userName") ||
    localStorage.getItem("userEmail") ||
    (parsed?.email ? String(parsed.email) : null) ||
    `사용자${id}`;

  return {
    id,
    name,
    role: parsed?.role,
    email: parsed?.email ?? localStorage.getItem("userEmail") ?? undefined,
    profileImageUrl: parsed?.profileImage ?? parsed?.profileImageUrl ?? null,
  };
}

export default function ChatPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tokenReady, setTokenReady] = useState(false);

  const roomIdParam = searchParams.get("roomId");
  const roomId = roomIdParam ? Number(roomIdParam) : NaN;

  const me = useMemo(() => getMeFromLocalStorage(), []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!roomId || Number.isNaN(roomId)) {
        router.replace("/");
        return;
      }
      const token = await ensureAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      if (!me) {
        router.replace("/login");
        return;
      }
      setTokenReady(true);
    };
    void bootstrap();
  }, [roomId, me, router]);

  if (!tokenReady || !me || !roomId || Number.isNaN(roomId)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        채팅방을 불러오는 중..
      </div>
    );
  }

  return <ChatRoom roomId={roomId} me={me} />;
}
