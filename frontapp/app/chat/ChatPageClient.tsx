"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import ChatRoom from "@/components/ChatRoom";

type Me = {
  id: number;              // ✅ ChatRoom이 요구하는 필드명
  name: string;            // ✅ ChatRoom이 요구하는 필드명
  role?: string;
  email?: string;
  profileImageUrl?: string | null;
};

function getMeFromLocalStorage(): Me | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("guardian_auth");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    // guardian_auth에 userId 또는 id 중 어떤 키가 있든 대응
    const id = Number(parsed?.id ?? parsed?.userId);
    const name = parsed?.name;

    if (!id || Number.isNaN(id) || !name) return null;

    return {
      id,
      name,
      role: parsed?.role,
      email: parsed?.email,
      profileImageUrl: parsed?.profileImage ?? parsed?.profileImageUrl ?? null,
    };
  } catch {
    return null;
  }
}

export default function ChatPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomIdParam = searchParams.get("roomId");
  const roomId = roomIdParam ? Number(roomIdParam) : NaN;

  const me = useMemo(() => getMeFromLocalStorage(), []);

  useEffect(() => {
    if (!roomId || Number.isNaN(roomId)) {
      router.replace("/");
      return;
    }
    if (!me) {
      router.replace("/login");
    }
  }, [roomId, me, router]);

  if (!me || !roomId || Number.isNaN(roomId)) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        채팅방을 불러오는 중...
      </div>
    );
  }

  // ✅ ChatRoom Props 타입에 정확히 일치
  return <ChatRoom roomId={roomId} me={me} />;
}
