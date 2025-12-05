// frontapp/hooks/useStomp.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// 환경변수에 ws://, wss:// 를 넣어도 SockJS 에서 쓸 수 있게 변환
const WS_ENDPOINT = (() => {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) {
    return env.startsWith("http") ? env : env.replace(/^ws/, "http"); // ws → http, wss → https
  }
  if (typeof window === "undefined") return "/ws";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.host}/ws`;
})();

// 백엔드 ChatMessageResponse 형태에 맞춰서 사용
export type ChatMessage = {
  id?: number;
  messageId?: number;
  roomId: number;
  senderId: number;
  senderName?: string;
  content: string;
  messageType?: string | null;
  fileUrl?: string | null;
  sentAt?: string;      // 백엔드에서 사용하는 시간 필드명
  createdAt?: string;   // 혹시 다른 이름일 수도 있어 둘 다 둠
};

type UseStompOptions = {
  roomId: number;
  me: { id: number; name: string };
  onMessage?: (message: ChatMessage) => void;
};

export function useStomp({ roomId, me, onMessage }: UseStompOptions) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const socketFactory = () => new SockJS(WS_ENDPOINT);

    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);

        // ✅ 백엔드와 동일: /topic/room/{roomId}
        client.subscribe(`/topic/room/${roomId}`, (msg: IMessage) => {
          try {
            const body = JSON.parse(msg.body) as ChatMessage;
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
  }, [roomId, onMessage, me.id, me.name]);

  // ✅ 여기서는 publish 만, 실제 메시지 추가는 ChatRoom 쪽에서만 처리
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
      destination: `/app/signal/${roomId}`,
      body: JSON.stringify(payload),
    });
  };

  return {
    connected,
    sendMessage,
  };
}
