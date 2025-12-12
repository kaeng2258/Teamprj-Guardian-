"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SockJS from "sockjs-client";
import { Client, StompSubscription } from "@stomp/stompjs";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// SockJS는 http/https 기반 엔드포인트를 기대하므로 ws/wss가 오면 변환
const WS_BASE = (() => {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) {
    return env.startsWith("http") ? env : env.replace(/^ws/, "http");
  }
  if (typeof window === "undefined") return "/ws";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.host}/ws`;
})();

type ChatThread = {
  roomId: number;
  clientId: number;
  managerId: number;
  lastMessageSnippet?: string | null;
  lastMessageAt?: string | null;
  readByClient?: boolean;
  readByManager?: boolean;
};

type RawMessage = {
  id?: number;
  messageId?: string;
  roomId?: number;
  senderId?: number;
  senderName?: string | null;
  content?: string | null;
  messageType?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
  fileUrl?: string | null;
};

type UiMessage = {
  key: string;
  senderId?: number | null;
  senderName?: string | null;
  content?: string | null;
  messageType?: string | null;
  createdAt?: string | null;
};

type RtcSignal =
  | { type: "offer" | "answer"; from: number; sdp?: string }
  | { type: "candidate"; from: number; candidate?: RTCIceCandidateInit }
  | { type: "video-off" | "video-on"; from: number };

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function formatTimestamp(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yy}/${mm}/${dd} ${hh}:${mi}`;
}

async function extractApiError(response: Response, fallback: string) {
  try {
    const data = await response.clone().json();
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message?: string }).message === "string"
    ) {
      return (data as { message?: string }).message as string;
    }
  } catch {
    // ignore
  }
  try {
    const text = await response.text();
    if (text.trim().length > 0) return text;
  } catch {
    // ignore
  }
  return fallback;
}

function normalizeMessage(raw: RawMessage): UiMessage {
  const timestamp = raw.createdAt ?? raw.sentAt ?? new Date().toISOString();
  const key =
    raw.messageId ??
    (raw.id ? String(raw.id) : `${raw.senderId ?? "anon"}-${timestamp}-${raw.content ?? ""}`);
  return {
    key,
    senderId: raw.senderId ?? null,
    senderName: raw.senderName ?? null,
    content: raw.content ?? null,
    messageType: raw.messageType ?? "TEXT",
    createdAt: timestamp,
  };
}

function sortThreads(list: ChatThread[]) {
  return [...list].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

function GuardianChatPage() {
  const searchParams = useSearchParams();

  const [meId, setMeId] = useState<number | null>(null);
  const [clientIdInput, setClientIdInput] = useState<number | null>(null);
  const [managerIdInput, setManagerIdInput] = useState<number | null>(null);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [roomActionMessage, setRoomActionMessage] = useState<string | null>(null);

  const [showJump, setShowJump] = useState(false);

  const [rtcError, setRtcError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [shareOn, setShareOn] = useState(false);

  const stompRef = useRef<Client | null>(null);
  const subChatRef = useRef<StompSubscription | null>(null);
  const subRtcRef = useRef<StompSubscription | null>(null);
  const threadSubsRef = useRef<Map<number, StompSubscription>>(new Map());

  const meIdRef = useRef<number | null>(null);
  const currentRoomRef = useRef<number | null>(null);
  const threadCacheRef = useRef<ChatThread[]>([]);
  const seenKeysRef = useRef<Set<string>>(new Set());
  const pendingRoomRef = useRef<number | null>(null);
  const initialParamsHandled = useRef(false);
  const autoStickRef = useRef(true);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const negotiatingRef = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const endpoints = useMemo(
    () => ({
      threads: (userId: number) => `${API_BASE}/api/chat/threads?userId=${encodeURIComponent(userId)}`,
      messages: (roomId: number) => `${API_BASE}/api/chat/rooms/${roomId}/messages`,
      send: (roomId: number) => `${API_BASE}/api/chat/rooms/${roomId}/messages`,
      read: (roomId: number, userId: number) =>
        `${API_BASE}/api/chat/rooms/${roomId}/read?userId=${encodeURIComponent(userId)}`,
      openRoom: () => `${API_BASE}/api/chat/rooms`,
      deleteRoom: (roomId: number, userId: number) =>
        `${API_BASE}/api/chat/rooms/${roomId}?userId=${encodeURIComponent(userId)}`,
    }),
    []
  );

  useEffect(() => {
    meIdRef.current = meId;
    if (typeof window !== "undefined") {
      if (meId) window.localStorage.setItem("guardian.me", String(meId));
      else window.localStorage.removeItem("guardian.me");
    }
  }, [meId]);

  useEffect(() => {
    currentRoomRef.current = currentRoomId;
    if (typeof window !== "undefined") {
      if (currentRoomId) window.localStorage.setItem("guardian.room", String(currentRoomId));
      else window.localStorage.removeItem("guardian.room");
    }
  }, [currentRoomId]);

  useEffect(() => {
    if (typeof window === "undefined" || initialParamsHandled.current) return;
    initialParamsHandled.current = true;

    const savedMe = window.localStorage.getItem("guardian.me");
    const savedRoom = window.localStorage.getItem("guardian.room");

    if (savedMe && !meId) {
      const parsed = Number(savedMe);
      if (!Number.isNaN(parsed)) setMeId(parsed);
    }
    if (savedRoom) {
      const parsed = Number(savedRoom);
      if (!Number.isNaN(parsed)) pendingRoomRef.current = parsed;
    }

    if (searchParams) {
      const meParam = Number(searchParams.get("me") ?? "");
      const clientParam = Number(searchParams.get("client") ?? "");
      const managerParam = Number(searchParams.get("manager") ?? "");
      if (!Number.isNaN(meParam) && meParam > 0) setMeId(meParam);
      if (!Number.isNaN(clientParam) && clientParam > 0) setClientIdInput(clientParam);
      if (!Number.isNaN(managerParam) && managerParam > 0) setManagerIdInput(managerParam);
    }
  }, [meId, searchParams]);

  const scrollMessagesToBottom = useCallback(() => {
    const container = messagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      setShowJump(false);
    }
  }, []);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
      autoStickRef.current = nearBottom;
      setShowJump(!nearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (autoStickRef.current) scrollMessagesToBottom();
  }, [messages, scrollMessagesToBottom]);

  const updateThreadsState = useCallback((list: ChatThread[]) => {
    threadCacheRef.current = list;
    setThreads(sortThreads(list));
  }, []);

  const handleThreadTick = useCallback((roomId: number, snippet?: string | null, timestamp?: string | null) => {
    if (threadCacheRef.current.length === 0) return;
    threadCacheRef.current = threadCacheRef.current.map((thread) =>
      thread.roomId === roomId
        ? {
            ...thread,
            lastMessageSnippet: snippet ?? thread.lastMessageSnippet,
            lastMessageAt: timestamp ?? thread.lastMessageAt,
          }
        : thread
    );
    setThreads(sortThreads(threadCacheRef.current));
  }, []);

  const appendMessage = useCallback(
    (raw: RawMessage, roomId: number) => {
      const normalized = normalizeMessage(raw);
      if (seenKeysRef.current.has(normalized.key)) return;
      seenKeysRef.current.add(normalized.key);

      setMessages((prev) => [...prev, normalized]);

      if (autoStickRef.current) scrollMessagesToBottom();
      else setShowJump(true);

      handleThreadTick(roomId, raw.content ?? "", raw.createdAt ?? raw.sentAt ?? new Date().toISOString());
    },
    [handleThreadTick, scrollMessagesToBottom]
  );

  const sendRtc = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const client = stompRef.current;
    if (!client || !client.connected) return;

    const roomId = currentRoomRef.current;
    const sender = meIdRef.current;
    if (!roomId || !sender) return;

    client.publish({
      destination: `/app/rtc/${roomId}`,
      body: JSON.stringify({ type, from: sender, ...payload }),
    });
  }, []);

  const ensurePeer = useCallback(() => {
    if (peerRef.current) return peerRef.current;

    const pc = new RTCPeerConnection(rtcConfig);
    peerRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) sendRtc("candidate", { candidate: event.candidate });
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    };

    pc.onnegotiationneeded = async () => {
      if (negotiatingRef.current) return;
      negotiatingRef.current = true;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendRtc("offer", { sdp: offer.sdp });
      } catch {
        setRtcError("WebRTC 협상 중 오류가 발생했습니다.");
      } finally {
        negotiatingRef.current = false;
      }
    };

    return pc;
  }, [sendRtc]);

  const handleRtc = useCallback(
    async (signal: RtcSignal) => {
      if (!signal || signal.from === meIdRef.current) return;

      try {
        const pc = ensurePeer();

        if (signal.type === "offer" && signal.sdp) {
          await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendRtc("answer", { sdp: answer.sdp });
        } else if (signal.type === "answer" && signal.sdp) {
          await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp });
        } else if (signal.type === "candidate" && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else if (signal.type === "video-off") {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        }
      } catch {
        setRtcError("WebRTC 시그널 처리 중 오류가 발생했습니다.");
      }
    },
    [ensurePeer, sendRtc]
  );

  const cleanupPeer = useCallback(() => {
    try {
      peerRef.current?.getSenders()?.forEach((sender) => {
        try {
          peerRef.current?.removeTrack(sender);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
    try {
      peerRef.current?.close();
    } catch {
      // ignore
    }
    peerRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (!screenStreamRef.current && localVideoRef.current) localVideoRef.current.srcObject = null;
    setCamOn(false);
    setMicOn(false);
  }, []);

  const stopShareStream = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setShareOn(false);

    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

    const pc = peerRef.current;
    const cameraTrack = localStreamRef.current?.getVideoTracks()?.[0] ?? null;
    if (pc) {
      const sender = pc.getSenders().find((item) => item.track && item.track.kind === "video");
      if (sender) {
        try {
          await sender.replaceTrack(cameraTrack);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || camOn) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        try {
          await localVideoRef.current.play();
        } catch {
          // ignore
        }
      }

      setCamOn(true);
      setMicOn(true);

      const pc = ensurePeer();

      // 기존 sender 비우기
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video" || sender.track?.kind === "audio") {
          try {
            pc.removeTrack(sender);
          } catch {
            // ignore
          }
        }
      });

      // 새 트랙 추가
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      sendRtc("video-on", {});
    } catch {
      setRtcError("카메라/마이크를 켤 수 없습니다. 브라우저 권한을 확인하세요.");
    }
  }, [camOn, ensurePeer, sendRtc]);

  const stopCamera = useCallback(async () => {
    stopLocalStream();
    const pc = peerRef.current;
    if (pc) {
      pc.getSenders().forEach(async (sender) => {
        if (sender.track?.kind === "video" || sender.track?.kind === "audio") {
          try {
            await sender.replaceTrack(null);
          } catch {
            // ignore
          }
        }
      });
    }
    sendRtc("video-off", {});
  }, [sendRtc, stopLocalStream]);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) {
      setRtcError("먼저 카메라를 켜서 마이크 권한을 활성화해주세요.");
      return;
    }
    const next = !micOn;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  }, [micOn]);

  const startShare = useCallback(async () => {
    if (typeof navigator === "undefined" || shareOn) return;
    try {
      const legacyGetDisplay = (navigator as Navigator & { getDisplayMedia?: MediaDevices["getDisplayMedia"] })
        .getDisplayMedia;
      const getDisplay = navigator.mediaDevices?.getDisplayMedia ?? legacyGetDisplay;
      if (!getDisplay) {
        setRtcError("이 브라우저는 화면 공유를 지원하지 않습니다.");
        return;
      }

      const stream = await getDisplay({ video: true, audio: false });
      screenStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        try {
          await localVideoRef.current.play();
        } catch {
          // ignore
        }
      }

      setShareOn(true);

      const track = stream.getVideoTracks()[0];
      const pc = ensurePeer();
      const sender = pc.getSenders().find((item) => item.track?.kind === "video");

      if (sender && track) await sender.replaceTrack(track);
      else if (track) pc.addTrack(track, stream);

      track.addEventListener("ended", () => {
        void stopShareStream();
      });
    } catch {
      setRtcError("화면 공유를 시작하지 못했습니다.");
    }
  }, [ensurePeer, shareOn, stopShareStream]);

  const markRead = useCallback(
    async (roomId: number) => {
      if (!meIdRef.current) return;
      try {
        await fetch(endpoints.read(roomId, meIdRef.current), { method: "POST" });
      } catch {
        // ignore
      }
    },
    [endpoints]
  );

  const loadMessages = useCallback(
    async (roomId: number) => {
      setMessagesError(null);
      setMessagesLoading(true);
      try {
        const response = await fetch(endpoints.messages(roomId), { cache: "no-store" });
        if (!response.ok) {
          throw new Error(await extractApiError(response, "메시지를 불러오지 못했습니다."));
        }
        const data = await response.json();
        const list: RawMessage[] = Array.isArray(data) ? data : Array.isArray(data?.messages) ? data.messages : [];
        const normalized = list.map(normalizeMessage);
        seenKeysRef.current = new Set(normalized.map((item) => item.key));
        setMessages(normalized);
        autoStickRef.current = true;
        setTimeout(scrollMessagesToBottom, 0);
      } catch (error) {
        setMessages([]);
        seenKeysRef.current.clear();
        setMessagesError(error instanceof Error ? error.message : "메시지를 불러오지 못했습니다.");
      } finally {
        setMessagesLoading(false);
      }
    },
    [endpoints, scrollMessagesToBottom]
  );

  const subscribeToRoom = useCallback(
    (roomId: number) => {
      const client = stompRef.current;
      if (!client || !client.connected) return;

      subChatRef.current?.unsubscribe();
      subRtcRef.current?.unsubscribe();

      subChatRef.current = client.subscribe(`/topic/room/${roomId}`, (frame) => {
        const payload = JSON.parse(frame.body) as RawMessage;
        appendMessage(payload, roomId);
      });

      subRtcRef.current = client.subscribe(`/topic/rtc/${roomId}`, (frame) => {
        const payload = JSON.parse(frame.body) as RtcSignal;
        void handleRtc(payload);
      });
    },
    [appendMessage, handleRtc]
  );

  const ensureThreadSubscriptions = useCallback(
    (list: ChatThread[]) => {
      const client = stompRef.current;
      if (!client || !client.connected) return;

      const activeIds = new Set(list.map((t) => t.roomId));

      list.forEach((thread) => {
        if (threadSubsRef.current.has(thread.roomId)) return;

        const subscription = client.subscribe(`/topic/room/${thread.roomId}`, (frame) => {
          const payload = JSON.parse(frame.body) as RawMessage;
          if (thread.roomId === currentRoomRef.current) return;

          handleThreadTick(thread.roomId, payload.content ?? "", payload.createdAt ?? payload.sentAt ?? new Date().toISOString());
        });

        threadSubsRef.current.set(thread.roomId, subscription);
      });

      for (const [roomId, sub] of threadSubsRef.current.entries()) {
        if (!activeIds.has(roomId)) {
          sub.unsubscribe();
          threadSubsRef.current.delete(roomId);
        }
      }
    },
    [handleThreadTick]
  );

  const selectRoom = useCallback(
    async (roomId: number) => {
      setCurrentRoomId(roomId);
      pendingRoomRef.current = null;
      seenKeysRef.current.clear();
      await loadMessages(roomId);
      subscribeToRoom(roomId);
      await markRead(roomId);
    },
    [loadMessages, markRead, subscribeToRoom]
  );

  const loadThreads = useCallback(async () => {
    if (!meIdRef.current) return;
    setThreadsLoading(true);
    setThreadsError(null);

    try {
      const response = await fetch(endpoints.threads(meIdRef.current), { cache: "no-store" });
      if (!response.ok) throw new Error(await extractApiError(response, "채팅 목록을 불러오지 못했습니다."));

      const data: ChatThread[] = await response.json();
      updateThreadsState(data);
      ensureThreadSubscriptions(data);

      if (pendingRoomRef.current) {
        const exists = data.some((item) => item.roomId === pendingRoomRef.current);
        if (exists) {
          await selectRoom(pendingRoomRef.current);
          return;
        }
      }

      if (!currentRoomRef.current && data.length > 0) {
        await selectRoom(data[0].roomId);
      }
    } catch (error) {
      setThreads([]);
      threadCacheRef.current = [];
      setThreadsError(error instanceof Error ? error.message : "채팅 목록을 불러오지 못했습니다.");
    } finally {
      setThreadsLoading(false);
    }
  }, [endpoints, ensureThreadSubscriptions, selectRoom, updateThreadsState]);

  useEffect(() => {
    if (!meId) {
      setThreads([]);
      threadCacheRef.current = [];
      setCurrentRoomId(null);
      return;
    }
    meIdRef.current = meId;
    void loadThreads();
  }, [loadThreads, meId]);

  useEffect(() => {
    setWsStatus("connecting");

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        setWsStatus("connected");
        if (currentRoomRef.current) subscribeToRoom(currentRoomRef.current);
        ensureThreadSubscriptions(threadCacheRef.current);
      },
      onStompError: () => setWsStatus("disconnected"),
      onWebSocketClose: () => setWsStatus("disconnected"),
      onDisconnect: () => setWsStatus("disconnected"),
    });

    client.activate();
    stompRef.current = client;

    const cleanupThreadSubs = threadSubsRef.current;
    const cleanupClient = client;

    return () => {
      cleanupThreadSubs.forEach((sub) => sub.unsubscribe());
      cleanupThreadSubs.clear();
      subChatRef.current?.unsubscribe();
      subRtcRef.current?.unsubscribe();
      cleanupClient.deactivate();
      cleanupPeer();
      stopLocalStream();
      void stopShareStream();
    };
  }, [cleanupPeer, ensureThreadSubscriptions, stopLocalStream, stopShareStream, subscribeToRoom]);

  const sendChat = useCallback(async () => {
    const senderId = meIdRef.current;
    const roomId = currentRoomRef.current;

    if (!senderId || !roomId) return;

    const text = inputValue.trim();
    if (!text) return;

    setInputValue("");

    const payload = {
      roomId,
      senderId,
      content: text,
      messageType: "TEXT",
      fileUrl: null,
    };

    const client = stompRef.current;
    if (client && client.connected) {
      client.publish({
        // NOTE: 서버가 /app/signal/{roomId} 를 받는 구조면 유지
        destination: `/app/signal/${roomId}`,
        body: JSON.stringify(payload),
      });
      return;
    }

    try {
      const response = await fetch(endpoints.send(roomId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await extractApiError(response, "메시지를 전송하지 못했습니다."));
    } catch (e: unknown) {
      setRoomActionMessage(e instanceof Error ? e.message : "메시지를 전송하지 못했습니다.");
    }
  }, [endpoints, inputValue]);

  const openRoom = useCallback(async () => {
    if (!clientIdInput || !managerIdInput) {
      setRoomActionMessage("clientId와 managerId를 모두 입력해주세요.");
      return;
    }

    setRoomActionLoading(true);
    setRoomActionMessage(null);

    try {
      const response = await fetch(endpoints.openRoom(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientIdInput, managerId: managerIdInput }),
      });

      if (!response.ok) throw new Error(await extractApiError(response, "채팅방 생성/획득에 실패했습니다."));

      const room: ChatThread = await response.json();
      await loadThreads();
      await selectRoom(room.roomId);
    } catch (e: unknown) {
      setRoomActionMessage(e instanceof Error ? e.message : "채팅방 생성/획득에 실패했습니다.");
    } finally {
      setRoomActionLoading(false);
    }
  }, [clientIdInput, endpoints, loadThreads, managerIdInput, selectRoom]);

  const deleteRoom = useCallback(async () => {
    const roomId = currentRoomRef.current;
    const userId = meIdRef.current;
    if (!roomId || !userId) return;

    if (!window.confirm(`Room #${roomId} 을(를) 삭제하시겠습니까?`)) return;

    setRoomActionLoading(true);
    setRoomActionMessage(null);

    try {
      const response = await fetch(endpoints.deleteRoom(roomId, userId), { method: "DELETE" });
      if (!response.ok) throw new Error(await extractApiError(response, "채팅방 삭제에 실패했습니다."));

      setCurrentRoomId(null);
      pendingRoomRef.current = null;
      setMessages([]);
      seenKeysRef.current.clear();
      await loadThreads();
      cleanupPeer();
    } catch (error) {
      setRoomActionMessage(error instanceof Error ? error.message : "채팅방 삭제에 실패했습니다.");
    } finally {
      setRoomActionLoading(false);
    }
  }, [cleanupPeer, endpoints, loadThreads]);

  const netStatusLabel =
    wsStatus === "connected"
      ? { label: "WS connected", className: "status ok" }
      : wsStatus === "connecting"
      ? { label: "WS connecting...", className: "status warn" }
      : { label: "WS disconnected", className: "status err" };

  const roomTitle = currentRoomId ? `Room #${currentRoomId}` : "Select a room";
  const roomMeta = meId ? `myId: ${meId}${currentRoomId ? " · click a room to load messages" : ""}` : "Enter myId and choose a room";

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #0b1020;
          --panel: #0b1220;
          --panel2: #0a0f1c;
          --text: #e5e7eb;
          --muted: #9ca3af;
          --ok: #10b981;
          --warn: #f59e0b;
          --err: #ef4444;
          --blue: #2563eb;
          --blue2: #1d4ed8;
          --gray: #6b7280;
          --gray2: #4b5563;
          --border: #1f2937;
        }
        * { box-sizing: border-box; }
        html, body { height: 100%; width: 100%; overflow: hidden; }
        body {
          margin: 0;
          background: linear-gradient(180deg, #0b1020, #0f172a);
          color: var(--text);
          font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
        }
        .shell {
          height: 100dvh;
          width: 100vw;
          min-height: 0;
          min-width: 0;
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 12px;
          padding: 12px;
          overflow: hidden;
        }
        .left {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 12px;
          min-width: 0;
          overflow: hidden;
          height: 100%;
          min-height: 0;
        }
        .avbar {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 8px 12px;
          background: linear-gradient(180deg, #0b1220, #0a0f1c);
          border: 1px solid var(--border);
          border-radius: 12px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 8px 12px;
          border-radius: 10px;
          border: 0;
          background: linear-gradient(180deg, var(--blue), var(--blue2));
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        .btn.secondary { background: linear-gradient(180deg, var(--gray), var(--gray2)); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .hint { color: var(--muted); font-size: 12px; margin-left: 6px; }
        .videoPanel {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 8px;
          background: linear-gradient(180deg, #0b1220, #0a0f1c);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }
        .videoGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }
        .tile {
          position: relative;
          background: #000;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--border);
          min-height: 0;
          height: 100%;
        }
        .tile small {
          position: absolute;
          left: 8px;
          top: 6px;
          color: #cbd5e1;
          font-size: 12px;
          background: rgba(0, 0, 0, 0.35);
          padding: 2px 6px;
          border-radius: 999px;
        }
        video { width: 100%; height: 100%; object-fit: cover; background: #000; display: block; }
        .right {
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          gap: 10px;
          min-width: 0;
          overflow: hidden;
          height: 100%;
          min-height: 0;
        }
        .roomBar {
          display: flex;
          gap: 10px;
          align-items: center;
          background: linear-gradient(180deg, #0b1220, #0a0f1c);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 12px;
          flex-wrap: wrap;
        }
        .toolbar { margin-left: auto; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .toolbar input {
          width: 110px;
          padding: 6px 8px;
          border-radius: 8px;
          border: 1px solid #334155;
          background: #0c1426;
          color: var(--text);
        }
        .threads {
          background: linear-gradient(180deg, #0b1220, #0a0f1c);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 8px;
          max-height: 22vh;
          overflow: auto;
          min-height: 0;
        }
        .th {
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid transparent;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 6px;
        }
        .th:hover { background: #0d1730; }
        .th.active { background: #0a1a33; border-color: #1e3a8a; }
        .th .name { font-weight: 700; }
        .th .snippet {
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
        .th .time { color: #7aa2f7; font-size: 12px; }
        .msgsWrap {
          position: relative;
          background: linear-gradient(180deg, #0b1220, #0a0f1c);
          border: 1px solid var(--border);
          border-radius: 12px;
          min-height: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .msgs { flex: 1; overflow: auto; padding: 12px; min-height: 0; max-height: 100%; }
        .empty { color: var(--muted); text-align: center; padding: 24px; }
        .bubble { max-width: 82%; margin: 6px 0; padding: 10px 12px; border-radius: 14px; word-break: break-word; }
        .bubble.mine { margin-left: auto; background: linear-gradient(180deg, #1a5fff, #1448be); }
        .bubble.other { background: #1f2937; border: 1px solid #2a3648; }
        .bubble.emergency { background: linear-gradient(180deg, #fef2f2, #fee2e2); border: 1px solid #fecdd3; color: #7f1d1d; }
        .bubble.mine.emergency { background: linear-gradient(180deg, #ef4444, #b91c1c); color: #fff1f1; border: 1px solid #b91c1c; }
        .metaRow { display: flex; gap: 8px; align-items: center; margin-top: 4px; color: var(--muted); font-size: 12px; }
        .jump {
          position: absolute;
          right: 12px;
          bottom: 54px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #111827;
          border: 1px solid #334155;
          color: #cbd5e1;
          cursor: pointer;
          display: none;
        }
        .jump.show { display: block; }
        .composer {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 10px 12px;
          background: linear-gradient(180deg, #0b1220, #0a0f1c);
          border: 1px solid var(--border);
          border-radius: 12px;
          position: sticky;
          bottom: 0;
          z-index: 3;
        }
        .composer input {
          flex: 1;
          padding: 12px 14px;
          border-radius: 999px;
          border: 1px solid #1f2937;
          background: #0c1426;
          color: var(--text);
        }
        .status { font-size: 12px; }
        .status.ok { color: var(--ok); }
        .status.warn { color: var(--warn); }
        .status.err { color: var(--err); }
      `}</style>

      <div className="shell">
        <section className="left">
          <div className="avbar">
            <button className="btn" onClick={() => (camOn ? void stopCamera() : void startCamera())}>
              {camOn ? "카메라 끄기" : "카메라 켜기"}
            </button>
            <button className="btn secondary" onClick={toggleMic} disabled={!camOn}>
              {micOn ? "마이크 끄기" : "마이크 켜기"}
            </button>
            <button className="btn" onClick={() => (shareOn ? void stopShareStream() : void startShare())}>
              {shareOn ? "화면공유 중지" : "화면공유 시작"}
            </button>
            <span className="hint">카메라만 켜면 자동 연결됩니다.</span>
          </div>

          <div className="videoPanel">
            <div>
              <span className={netStatusLabel.className}>{netStatusLabel.label}</span>
              {rtcError && (
                <span className="status err" style={{ marginLeft: 12 }}>
                  {rtcError}
                </span>
              )}
            </div>
            <div className="videoGrid">
              <div className="tile">
                <small>내 미리보기</small>
                <video ref={localVideoRef} autoPlay playsInline muted />
              </div>
              <div className="tile">
                <small>상대 영상</small>
                <video ref={remoteVideoRef} autoPlay playsInline />
              </div>
            </div>
          </div>
        </section>

        <section className="right">
          <div className="roomBar">
            <div>
              <div style={{ fontWeight: 800 }}>{roomTitle}</div>
              <div className="status">{roomMeta}</div>
            </div>

            <div className="toolbar">
              <input
                type="number"
                value={meId ?? ""}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setMeId(Number.isNaN(value) || value <= 0 ? null : value);
                }}
              />
              <input
                type="number"
                placeholder="clientId"
                value={clientIdInput ?? ""}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setClientIdInput(Number.isNaN(value) || value <= 0 ? null : value);
                }}
              />
              <input
                type="number"
                placeholder="managerId"
                value={managerIdInput ?? ""}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setManagerIdInput(Number.isNaN(value) || value <= 0 ? null : value);
                }}
              />
              <button className="btn" disabled={roomActionLoading} onClick={() => void openRoom()}>
                생성/획득
              </button>
              <button className="btn secondary" disabled={roomActionLoading || !currentRoomId} onClick={() => void deleteRoom()}>
                삭제
              </button>
            </div>
          </div>

          <div className="threads">
            {threadsLoading && <div className="status warn">목록을 불러오는 중...</div>}
            {threadsError && <div className="status err">{threadsError}</div>}
            {!threadsLoading && !threadsError && threads.length === 0 && <div className="status">채팅방이 없습니다.</div>}
            {!threadsLoading &&
              !threadsError &&
              threads.map((thread) => (
                <div
                  key={thread.roomId}
                  className={`th ${thread.roomId === currentRoomId ? "active" : ""}`}
                  onClick={() => void selectRoom(thread.roomId)}
                >
                  <div>
                    <div className="name">
                      Room #{thread.roomId} ({thread.clientId} ↔ {thread.managerId})
                    </div>
                    <div className="snippet">{thread.lastMessageSnippet ?? ""}</div>
                  </div>
                  <div className="time">{formatTimestamp(thread.lastMessageAt)}</div>
                </div>
              ))}
          </div>

          <div className="msgsWrap">
            <div className="msgs" ref={messagesRef}>
              {messagesLoading && <div className="status warn">메시지를 불러오는 중...</div>}
              {messagesError && <div className="status err">{messagesError}</div>}
              {!messagesLoading && !messagesError && messages.length === 0 && <div className="empty">메시지가 없습니다.</div>}

              {messages.map((message) => {
                const emergency =
                  (message.messageType ?? "").toUpperCase() === "NOTICE" || /긴급\s*호출/.test(message.content ?? "");
                const mine = Boolean(message.senderId && meId === message.senderId);

                const owner =
                  message.senderName && message.senderName.trim().length > 0
                    ? message.senderName
                    : message.senderId
                    ? `사용자 ${message.senderId}`
                    : "게스트";

                const bubbleClass = ["bubble", mine ? "mine" : "other", emergency ? "emergency" : null]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div key={message.key} className={bubbleClass}>
                    <div>
                      {emergency && (
                        <div style={{ marginBottom: 6, fontWeight: 700 }}>{owner}의 비상 호출입니다.</div>
                      )}
                      <div>{message.content}</div>
                    </div>
                    <div className="metaRow">
                      <span>{message.messageType ?? "TEXT"}</span>
                      <span>·</span>
                      <span>{formatTimestamp(message.createdAt)}</span>
                      {message.senderId && (
                        <>
                          <span>·</span>
                          <span>#{message.senderId}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className={`jump ${showJump ? "show" : ""}`}
              onClick={() => {
                autoStickRef.current = true;
                scrollMessagesToBottom();
              }}
            >
              아래로
            </button>
          </div>

          <div className="composer">
            <input
              placeholder="메시지를 입력하세요 (Enter 전송)"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendChat();
                }
              }}
            />
            <button className="btn" onClick={() => void sendChat()}>
              Send
            </button>
          </div>

          {roomActionMessage && <div className="status warn">{roomActionMessage}</div>}
        </section>
      </div>
    </>
  );
}

export default function GuardianChatPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-600">채팅을 불러오는 중입니다...</div>}>
      <GuardianChatPage />
    </Suspense>
  );
}
