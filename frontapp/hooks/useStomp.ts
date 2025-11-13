// frontapp/hooks/useStomp.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ?? "wss://localhost:8081/ws";

// 채팅 메시지 타입은 백엔드와 맞춰서 수정해도 됨
export type ChatMessage = {
  id?: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt?: string;
};

type UseStompOptions = {
  roomId: number;
  me: { id: number; name: string };
  onMessage?: (message: ChatMessage) => void;
};

export function useStomp({ roomId, me, onMessage }: UseStompOptions) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // 방 ID 없으면 아무 것도 안 함
    if (!roomId) return;

    // SockJS 팩토리
    const socketFactory = () => new SockJS(WS_BASE);

    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);

        // 구독
        client.subscribe(`/topic/chat/${roomId}`, (msg: IMessage) => {
          try {
            const body = JSON.parse(msg.body) as ChatMessage;
            setMessages((prev) => [...prev, body]);
            onMessage?.(body);
          } catch (e) {
            console.error("메시지 파싱 실패:", e);
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error", event);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomId, onMessage]);

  const sendMessage = (content: string) => {
    const client = clientRef.current;
    if (!client || !connected) return;

    const payload: ChatMessage = {
      roomId,
      senderId: me.id,
      senderName: me.name,
      content,
    };

    client.publish({
      destination: `/app/chat/${roomId}`,
      body: JSON.stringify(payload),
    });

    // 낙관적 업데이트(원하면 빼도 됨)
    setMessages((prev) => [
      ...prev,
      { ...payload, createdAt: new Date().toISOString() },
    ]);
  };

  return {
    connected,
    messages,
    sendMessage,
  };
}
