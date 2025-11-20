// frontapp/hooks/useStomp.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// 환경변수에 ws://, wss:// 를 넣어도 SockJS 에서 쓸 수 있게 변환
// frontapp/hooks/useStomp.ts
const rawWs =
  process.env.NEXT_PUBLIC_WS_URL ?? "https://localhost:8081/ws";

const WS_ENDPOINT = rawWs.startsWith("ws")
  ? rawWs.replace(/^ws/, "http") // ws → http, wss → https
  : rawWs;

// 백엔드 ChatMessageResponse 형태에 맞춰서 사용
export type ChatMessage = {
  id?: number;
  roomId: number;
  senderId: number;
  senderName?: string;
  content: string;
  sentAt?: string; // 백엔드에서 사용하는 시간 필드명
  createdAt?: string; // 혹시 다른 이름일 수도 있어 둘 다 둠
};

type UseStompOptions = {
  roomId: number;
  me: { id: number; name: string };
  onMessage?: (message: ChatMessage) => void;
};

export function useStomp({ roomId, me, onMessage }: UseStompOptions) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  console.log("[useStomp] roomId:", roomId, "WS_ENDPOINT:", WS_ENDPOINT);

  useEffect(() => {
    if (!roomId) {
      console.warn("[useStomp] roomId 없음 → STOMP 연결 안 함");
      return;
    }

    if (typeof window === "undefined") return;

    console.log("[useStomp] STOMP 클라이언트 생성 시작");

    const socketFactory = () => new SockJS(WS_ENDPOINT);

    const client = new Client({
      webSocketFactory: socketFactory,
       heartbeatIncoming: 10000, // 서버 → 클라
  heartbeatOutgoing: 10000, // 클라 → 서버

      reconnectDelay: 5000,
      debug: (str) => {
        console.log("[STOMP DEBUG]", str);
      },
      onConnect: () => {
        console.log("✅ STOMP onConnect 호출");
        setConnected(true);

        client.subscribe(`/topic/room/${roomId}`, (msg: IMessage) => {
          console.log("📩 수신 메시지:", msg.body);
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
      onDisconnect: () => {
        console.log("❌ STOMP onDisconnect 호출");
        setConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();
    console.log("[useStomp] client.activate 호출");

    return () => {
      console.log("🧹 STOMP cleanup");
      setConnected(false);
      clientRef.current = null;
      client.deactivate();
    };
  }, [roomId, onMessage]);


const sendMessage = useCallback(
  (content: string) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.warn("⚠️ STOMP 연결 안 됨, 메시지 전송 불가");
      return;
    }
    if (!content.trim()) return;

    const payload = {
      roomId,
      senderId: me.id,
      senderName: me.name,
      content,
    };

    try {
      client.publish({
        destination: `/app/signal/${roomId}`,
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("publish 중 에러:", e);
    }
  },
  [roomId, me.id, me.name]
);

  return {
    connected,
    sendMessage,
  };
}
