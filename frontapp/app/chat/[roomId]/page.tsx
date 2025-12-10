// frontapp/app/chat/[roomId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatRoom from "@/components/ChatRoom";
import type { ChatMessage } from "@/hooks/useStomp";
import { api } from "@/lib/api";

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = Number(params.roomId);
  const [initial, setInitial] = useState<ChatMessage[]>([]);
  const [me] = useState<{ id: number; name: string }>(() => {
    if (typeof window === "undefined") {
      return { id: 0, name: "" };
    }
    const rawId = window.localStorage.getItem("userId");
    const id = rawId ? Number(rawId) : 0;
    const storedName =
      window.localStorage.getItem("userName") ?? window.localStorage.getItem("userEmail") ?? "";
    return {
      id,
      name: storedName || (id ? `사용자#${id}` : "Me"),
    };
  });
  const [err, setErr] = useState<string | null>(null);

  // ✅ 기존 대화 이력 가져오기
  useEffect(() => {
    if (!roomId) return;

    (async () => {
      try {
        const data = await api.getRoomHistory(roomId);
        setInitial(data.messages as ChatMessage[]);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "채팅 이력을 불러오지 못했습니다.";
        setErr(message);
      }
    })();
  }, [roomId]);

  return <ChatRoom roomId={roomId} me={me} initialMessages={initial} />;
}
