// frontapp/app/chat/[roomId]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatRoom from "../../../components/ChatRoom";
import type { ChatMessage } from "../../../hooks/useStomp";
import { api } from "../../../lib/api";
import { ensureAccessToken, readAuth } from "../../../lib/auth";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Number(params.roomId);
  const [initial, setInitial] = useState<ChatMessage[]>([]);
  const [tokenReady, setTokenReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const me = useMemo(() => {
    const auth = readAuth();
    if (!auth?.userId) return null;
    const name =
      auth.name ||
      auth.email ||
      `사용자${auth.userId}`;
    return { id: auth.userId, name };
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!roomId || Number.isNaN(roomId)) {
        router.replace("/");
        return;
      }
      const token = await ensureAccessToken();
      if (!token || !me) {
        router.replace("/login");
        return;
      }
      setTokenReady(true);
      try {
        const data = await api.getRoomHistory(roomId);
        setInitial(data.messages as ChatMessage[]);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "채팅 기록을 불러오지 못했습니다.";
        setErr(message);
      }
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

  if (err) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-red-600">
        {err}
      </div>
    );
  }

  return <ChatRoom roomId={roomId} me={me} initialMessages={initial} />;
}
