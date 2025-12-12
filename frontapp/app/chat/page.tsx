"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SockJS from "sockjs-client";
import { Client, StompSubscription } from "@stomp/stompjs";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
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
  | {
      type: "offer" | "answer";
      from: number;
      sdp?: string;
    }
  | {
      type: "candidate";
      from: number;
      candidate?: RTCIceCandidateInit;
    }
  | {
      type: "video-off" | "video-on";
      from: number;
    };

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
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
    // ignore body parse failure
  }

  try {
    const text = await response.text();
    if (text.trim().length > 0) {
      return text;
    }
  } catch {
    // ignore text read failure
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
    senderId: raw.senderId,
    senderName: raw.senderName,
    content: raw.content,
    messageType: raw.messageType,
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
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">(
    "disconnected"
  );
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
      threads: (userId: number) =>
        `${API_BASE}/api/chat/threads?userId=${encodeURIComponent(userId)}`,
      messages: (roomId: number) =>
        `${API_BASE}/api/chat/rooms/${roomId}/messages`,
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
      if (meId) {
        window.localStorage.setItem("guardian.me", String(meId));
      } else {
        window.localStorage.removeItem("guardian.me");
      }
    }
  }, [meId]);

  useEffect(() => {
    currentRoomRef.current = currentRoomId;
    if (typeof window !== "undefined") {
      if (currentRoomId) {
        window.localStorage.setItem("guardian.room", String(currentRoomId));
      } else {
        window.localStorage.removeItem("guardian.room");
      }
    }
  }, [currentRoomId]);

  useEffect(() => {
    if (typeof window === "undefined" || initialParamsHandled.current) {
      return;
    }
    initialParamsHandled.current = true;
    const savedMe = window.localStorage.getItem("guardian.me");
    const savedRoom = window.localStorage.getItem("guardian.room");
    if (savedMe && !meId) {
      const parsed = Number(savedMe);
      if (!Number.isNaN(parsed)) {
        setMeId(parsed);
      }
    }
    if (savedRoom) {
      const parsed = Number(savedRoom);
      if (!Number.isNaN(parsed)) {
        pendingRoomRef.current = parsed;
      }
    }
    if (searchParams) {
      const meParam = Number(searchParams.get("me") ?? "");
      const clientParam = Number(searchParams.get("client") ?? "");
      const managerParam = Number(searchParams.get("manager") ?? "");
      if (!Number.isNaN(meParam) && meParam > 0) {
        setMeId(meParam);
      }
      if (!Number.isNaN(clientParam) && clientParam > 0) {
        setClientIdInput(clientParam);
      }
      if (!Number.isNaN(managerParam) && managerParam > 0) {
        setManagerIdInput(managerParam);
      }
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
    if (!container) {
      return;
    }
    const handleScroll = () => {
      const nearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 80;
      autoStickRef.current = nearBottom;
      setShowJump(!nearBottom);
    };
    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (autoStickRef.current) {
      scrollMessagesToBottom();
    }
  }, [messages, scrollMessagesToBottom]);

  const updateThreadsState = useCallback((list: ChatThread[]) => {
    threadCacheRef.current = list;
    setThreads(sortThreads(list));
  }, []);

  const handleThreadTick = useCallback(
    (roomId: number, snippet?: string | null, timestamp?: string | null) => {
      if (threadCacheRef.current.length === 0) {
        return;
      }
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
    },
    []
  );

  const appendMessage = useCallback(
    (raw: RawMessage, roomId: number) => {
      const normalized = normalizeMessage(raw);
      if (seenKeysRef.current.has(normalized.key)) {
        return;
      }
      seenKeysRef.current.add(normalized.key);
      setMessages((prev) => [...prev, normalized]);
      if (autoStickRef.current) {
        scrollMessagesToBottom();
      } else {
        setShowJump(true);
      }
      handleThreadTick(
        roomId,
        raw.content ?? "",
        raw.createdAt ?? raw.sentAt ?? new Date().toISOString()
      );
    },
    [handleThreadTick, scrollMessagesToBottom]
  );

  const sendRtc = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const client = stompRef.current;
    if (!client || !client.connected) {
      return;
    }
    const roomId = currentRoomRef.current;
    const sender = meIdRef.current;
    if (!roomId || !sender) {
      return;
    }
    client.publish({
      destination: `/app/rtc/${roomId}`,
      body: JSON.stringify({ type, from: sender, ...payload }),
    });
  }, []);

  const ensurePeer = useCallback(() => {
    if (peerRef.current) {
      return peerRef.current;
    }
    const pc = new RTCPeerConnection(rtcConfig);
    peerRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendRtc("candidate", { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onnegotiationneeded = async () => {
      if (negotiatingRef.current) {
        return;
      }
      negotiatingRef.current = true;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendRtc("offer", { sdp: offer.sdp });
      } catch {
        setRtcError("WebRTC ?ëÏÉÅ Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
      } finally {
        negotiatingRef.current = false;
      }
    };

    return pc;
  }, [sendRtc]);

  const handleRtc = useCallback(
    async (signal: RtcSignal) => {
      if (!signal || signal.from === meIdRef.current) {
        return;
      }
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
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
      } catch {
        setRtcError("WebRTC ?úÍ∑∏??Ï≤òÎ¶¨ Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
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
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (!screenStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setCamOn(false);
    setMicOn(false);
  }, []);

  const stopShareStream = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setShareOn(false);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    const pc = peerRef.current;
    const cameraTrack = localStreamRef.current?.getVideoTracks()?.[0] ?? null;
    if (pc) {
      const sender = pc
        .getSenders()
        .find((item) => item.track && item.track.kind === "video");
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
    if (typeof navigator === "undefined" || camOn) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        try { localVideoRef.current.play(); } catch { /* ignore */ }
      }
      setCamOn(true);
      setMicOn(true);
      ensurePeer()
        .getSenders()
        .forEach((sender) => {
          if (sender.track?.kind === "video" || sender.track?.kind === "audio") {
            try {
              ensurePeer().removeTrack(sender);
            } catch {
              // ignore
            }
          }
        });
      stream.getTracks().forEach((track) => {
        ensurePeer().addTrack(track, stream);
      });
      sendRtc("video-on", {});
    } catch {
      setRtcError("Ïπ¥Î©î?ºÎ? Ïº????ÜÏäµ?àÎã§. Î∏åÎùº?∞Ï? Í∂åÌïú???ïÏù∏?¥Ï£º?∏Ïöî.");
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
      setRtcError("Î®ºÏ? Ïπ¥Î©î?ºÎ? ÏºúÏÑú ÎßàÏù¥??Í∂åÌïú???úÏÑ±?îÌï¥Ï£ºÏÑ∏??");
      return;
    }
    const next = !micOn;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  }, [micOn]);

  const startShare = useCallback(async () => {
    if (typeof navigator === "undefined" || shareOn) {
      return;
    }
    try {
      const legacyGetDisplay = (navigator as Navigator & {
        getDisplayMedia?: MediaDevices["getDisplayMedia"];
      }).getDisplayMedia;
      const getDisplay =
        navigator.mediaDevices?.getDisplayMedia ?? legacyGetDisplay;
      if (!getDisplay) {
        setRtcError("??Î∏åÎùº?∞Ï????îÎ©¥ Í≥µÏú†Î•?ÏßÄ?êÌïòÏßÄ ?äÏäµ?àÎã§.");
        return;
      }
      const stream = await getDisplay({
        video: true,
        audio: false,
      });
      screenStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        try { localVideoRef.current.play(); } catch { /* ignore */ }
      }
      setShareOn(true);
      const track = stream.getVideoTracks()[0];
      const sender = peerRef.current
        ?.getSenders()
        .find((item) => item.track?.kind === "video");
      if (sender && track) {
        await sender.replaceTrack(track);
      } else if (track) {
        ensurePeer().addTrack(track, stream);
      }
      track.addEventListener("ended", () => {
        void stopShareStream();
      });
    } catch {
      setRtcError("?îÎ©¥ Í≥µÏú†Î•??úÏûë?òÏ? Î™ªÌñà?µÎãà??");
    }
  }, [ensurePeer, shareOn, stopShareStream]);

  const markRead = useCallback(
    async (roomId: number) => {
      if (!meIdRef.current) {
        return;
      }
      try {
        await fetch(endpoints.read(roomId, meIdRef.current), {
          method: "POST",
        });
      } catch {
        // ignore markRead failure
      }
    },
    [endpoints]
  );

  const loadMessages = useCallback(
    async (roomId: number) => {
      setMessagesError(null);
      setMessagesLoading(true);
      try {
        const response = await fetch(endpoints.messages(roomId));
        if (!response.ok) {
          throw new Error(
            await extractApiError(response, "Î©îÏãúÏßÄÎ•?Î∂àÎü¨?§Ï? Î™ªÌñà?µÎãà??")
          );
        }
        const data = await response.json();
        const list: RawMessage[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.messages)
          ? data.messages
          : [];
        const normalized = list.map(normalizeMessage);
        seenKeysRef.current = new Set(normalized.map((item) => item.key));
        setMessages(normalized);
        autoStickRef.current = true;
        setTimeout(() => {
          scrollMessagesToBottom();
        }, 0);
      } catch (error) {
        setMessages([]);
        seenKeysRef.current.clear();
        setMessagesError(
          error instanceof Error
            ? error.message
            : "Î©îÏãúÏßÄÎ•?Î∂àÎü¨?§Ï? Î™ªÌñà?µÎãà??"
        );
      } finally {
        setMessagesLoading(false);
      }
    },
    [endpoints, scrollMessagesToBottom]
  );

  const subscribeToRoom = useCallback(
    (roomId: number) => {
      const client = stompRef.current;
      if (!client || !client.connected) {
        return;
      }
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
      if (!client || !client.connected) {
        return;
      }
      const activeIds = new Set(list.map((thread) => thread.roomId));
      list.forEach((thread) => {
        if (threadSubsRef.current.has(thread.roomId)) {
          return;
        }
        const subscription = client.subscribe(`/topic/room/${thread.roomId}`, (frame) => {
          const payload = JSON.parse(frame.body) as RawMessage;
          if (thread.roomId === currentRoomRef.current) {
            return;
          }
          handleThreadTick(
            thread.roomId,
            payload.content ?? "",
            payload.createdAt ?? payload.sentAt ?? new Date().toISOString()
          );
        });
        threadSubsRef.current.set(thread.roomId, subscription);
      });
      for (const [roomId, subscription] of threadSubsRef.current.entries()) {
        if (!activeIds.has(roomId)) {
          subscription.unsubscribe();
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
    if (!meIdRef.current) {
      return;
    }
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const response = await fetch(endpoints.threads(meIdRef.current));
      if (!response.ok) {
        throw new Error(
          await extractApiError(response, "Ï±ÑÌåÖ Î™©Î°ù??Î∂àÎü¨?§Ï? Î™ªÌñà?µÎãà??")
        );
      }
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
      setThreadsError(
        error instanceof Error
          ? error.message
          : "Ï±ÑÌåÖ Î™©Î°ù??Î∂àÎü¨?§Ï? Î™ªÌñà?µÎãà??"
      );
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
        if (currentRoomRef.current) {
          subscribeToRoom(currentRoomRef.current);
        }
        ensureThreadSubscriptions(threadCacheRef.current);
      },
      onStompError: () => setWsStatus("disconnected"),
      onWebSocketClose: () => setWsStatus("disconnected"),
      onDisconnect: () => setWsStatus("disconnected"),
    });
    client.activate();
    stompRef.current = client;

    const cleanupThreadSubsRef = threadSubsRef.current;
    const cleanupStompClient = client;

    return () => {
      cleanupThreadSubsRef.forEach((sub) => sub.unsubscribe());
      cleanupThreadSubsRef.clear();
      subChatRef.current?.unsubscribe();
      subRtcRef.current?.unsubscribe();
      cleanupStompClient.deactivate();
      cleanupPeer();
      stopLocalStream();
      void stopShareStream();
    };
  }, [cleanupPeer, ensureThreadSubscriptions, stopLocalStream, stopShareStream, subscribeToRoom]);

  const sendChat = useCallback(async () => {
    if (!meIdRef.current) {
      setRoomActionMessage("Î®ºÏ? ???¨Ïö©??IDÎ•??ÖÎ†•?¥Ï£º?∏Ïöî.");
      return;
    }
    if (!currentRoomRef.current) {
      setRoomActionMessage("Ï±ÑÌåÖÎ∞©ÏùÑ ?†ÌÉù?¥Ï£º?∏Ïöî.");
      return;
    }
    const text = inputValue.trim();
    if (!text) {
      return;
    }
    setInputValue("");
    const client = stompRef.current;
    const payload = {
      roomId: currentRoomRef.current,
      senderId: meIdRef.current,
      content: text,
      messageType: "TEXT",
      fileUrl: null,
    };
    if (client && client.connected) {
      client.publish({
        destination: `/app/signal/${currentRoomRef.current}`,
        body: JSON.stringify(payload),
      });
      return;
    }
    try {
      const response = await fetch(endpoints.send(currentRoomRef.current), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(
          await extractApiError(response, "Î©îÏãúÏßÄÎ•??ÑÏÜ°?òÏ? Î™ªÌñà?µÎãà??")
        );
      }
    } catch (e: unknown) {
      setRoomActionMessage(
        e instanceof Error
          ? e.message
          : "Î©îÏãúÏßÄÎ•??ÑÏÜ°?òÏ? Î™ªÌñà?µÎãà??"
      );
    }
  }, [endpoints, inputValue, currentRoomRef, meIdRef]);

  const openRoom = useCallback(async () => {
    if (!clientIdInput || !managerIdInput) {
      setRoomActionMessage("clientId?Ä managerIdÎ•?Î™®Îëê ?ÖÎ†•?¥Ï£º?∏Ïöî.");
      return;
    }
    setRoomActionLoading(true);
    setRoomActionMessage(null);
    try {
      const response = await fetch(endpoints.openRoom(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: clientIdInput,
          managerId: managerIdInput,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await extractApiError(response, "Ï±ÑÌåÖÎ∞©ÏùÑ ?ùÏÑ±?òÏ? Î™ªÌñà?µÎãà??")
        );
      }
      const room: ChatThread = await response.json();
      await loadThreads();
      await selectRoom(room.roomId);
      setRoomActionMessage("Ï±ÑÌåÖÎ∞©ÏùÑ ?¥Ïóà?µÎãà??");
    } catch (e: unknown) {
      setRoomActionMessage(
        e instanceof Error
          ? e.message
          : "Ï±ÑÌåÖÎ∞©ÏùÑ ?ùÏÑ±?òÏ? Î™ªÌñà?µÎãà??"
      );
    } finally {
      setRoomActionLoading(false);
    }
  }, [clientIdInput, endpoints, loadThreads, managerIdInput, selectRoom]);

  const deleteRoom = useCallback(async () => {
    if (!currentRoomRef.current) {
      setRoomActionMessage("??†ú??Ï±ÑÌåÖÎ∞©ÏùÑ Î®ºÏ? ?†ÌÉù?¥Ï£º?∏Ïöî.");
      return;
    }
    if (!meIdRef.current) {
      setRoomActionMessage("???¨Ïö©??IDÍ∞Ä ?ÑÏöî?©Îãà??");
      return;
    }
    if (!window.confirm(`Room #${currentRoomRef.current}????†ú?òÏãúÍ≤†Ïäµ?àÍπå?`)) {
      return;
    }
    setRoomActionLoading(true);
    setRoomActionMessage(null);
    try {
      const response = await fetch(
        endpoints.deleteRoom(currentRoomRef.current, meIdRef.current),
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(
          await extractApiError(response, "Ï±ÑÌåÖÎ∞©ÏùÑ ??†ú?òÏ? Î™ªÌñà?µÎãà??")
        );
      }
      setCurrentRoomId(null);
      pendingRoomRef.current = null;
      setMessages([]);
      seenKeysRef.current.clear();
      await loadThreads();
      setRoomActionMessage("Ï±ÑÌåÖÎ∞©ÏùÑ ??†ú?àÏäµ?àÎã§.");
      cleanupPeer();
    } catch (error) {
      setRoomActionMessage(
        error instanceof Error
          ? error.message
          : "Ï±ÑÌåÖÎ∞©ÏùÑ ??†ú?òÏ? Î™ªÌñà?µÎãà??"
      );
    } finally {
      setRoomActionLoading(false);
    }
  }, [cleanupPeer, endpoints, loadThreads]);

  const netStatusLabel =
    wsStatus === "connected"
      ? { label: "WS ?∞Í≤∞??, className: "status ok" }
      : wsStatus === "connecting"
      ? { label: "WS ?∞Í≤∞ Ï§?..", className: "status warn" }
      : { label: "WS ?∞Í≤∞ ????, className: "status err" };

  const roomTitle = currentRoomId ? `Room #${currentRoomId}` : "Ï±ÑÌåÖÎ∞?ÎØ∏ÏÑ†??;
  const roomMeta = meId
    ? `??ID: ${meId}${currentRoomId ? " ¬∑ ?§ÏãúÍ∞??òÏã† Ï§? : ""}`
    : "??IDÎ•??ÖÎ†•?òÍ≥† Î∞©ÏùÑ ?†ÌÉù?òÏÑ∏??;

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
        * {
          box-sizing: border-box;
        }
        html,
        body {
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        body {
          margin: 0;
          background: linear-gradient(180deg, #0b1020, #0f172a);
          color: var(--text);
          font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans KR",
            "Apple SD Gothic Neo", sans-serif;
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
        .btn.secondary {
          background: linear-gradient(180deg, var(--gray), var(--gray2));
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .hint {
          color: var(--muted);
          font-size: 12px;
          margin-left: 6px;
        }
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
          grid-template-rows: 1fr;
          grid-auto-rows: 1fr;
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
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #000;
          display: block;
        }
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
        .toolbar {
          margin-left: auto;
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
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
        .th:hover {
          background: #0d1730;
        }
        .th.active {
          background: #0a1a33;
          border-color: #1e3a8a;
        }
        .th .name {
          font-weight: 700;
        }
        .th .snippet {
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 260px;
        }
        .th .time {
          color: #7aa2f7;
          font-size: 12px;
        }
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
        .msgs {
          flex: 1;
          overflow: auto;
          padding: 12px;
          min-height: 0;
          max-height: 100%;
        }
        .empty {
          color: var(--muted);
          text-align: center;
          padding: 24px;
        }
        .bubble {
          max-width: 82%;
          margin: 6px 0;
          padding: 10px 12px;
          border-radius: 14px;
          word-break: break-word;
        }
        .bubble.mine {
          margin-left: auto;
          background: linear-gradient(180deg, #1a5fff, #1448be);
        }
        .bubble.other {
          background: #1f2937;
          border: 1px solid #2a3648;
        }
        .bubble.emergency {
          background: linear-gradient(180deg, #fef2f2, #fee2e2);
          border: 1px solid #fecdd3;
          color: #7f1d1d;
        }
        .bubble.mine.emergency {
          background: linear-gradient(180deg, #ef4444, #b91c1c);
          color: #fff1f1;
          border: 1px solid #b91c1c;
        }
        .metaRow {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 4px;
          color: var(--muted);
          font-size: 12px;
        }
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
        .jump.show {
          display: block;
        }
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
        .status {
          font-size: 12px;
        }
        .status.ok {
          color: var(--ok);
        }
        .status.warn {
          color: var(--warn);
        }
        .status.err {
          color: var(--err);
        }
      `}</style>
      <div className="shell">
        <section className="left">
          <div className="avbar">
            <button
              className="btn"
              onClick={() => {
                if (camOn) {
                  void stopCamera();
                } else {
                  void startCamera();
                }
              }}
            >
              {camOn ? "Ïπ¥Î©î???ÑÍ∏∞" : "Ïπ¥Î©î??ÏºúÍ∏∞"}
            </button>
            <button className="btn secondary" onClick={toggleMic} disabled={!camOn}>
              {micOn ? "ÎßàÏù¥???ÑÍ∏∞" : "ÎßàÏù¥??ÏºúÍ∏∞"}
            </button>
            <button
              className="btn"
              onClick={() => {
                if (shareOn) {
                  void stopShareStream();
                } else {
                  void startShare();
                }
              }}
            >
              {shareOn ? "?îÎ©¥Í≥µÏú† Ï§ëÏ?" : "?îÎ©¥Í≥µÏú† ?úÏûë"}
            </button>
            <span className="hint">Ïπ¥Î©î?ºÎßå ÏºúÎ©¥ ?êÎèô ?∞Í≤∞/?°Ï∂ú?©Îãà??</span>
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
                <small>??ÎØ∏Î¶¨Î≥¥Í∏∞</small>
                <video ref={localVideoRef} autoPlay playsInline muted />
              </div>
              <div className="tile">
                <small>?ÅÎ? ?ÅÏÉÅ</small>
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
                placeholder="??ID"
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
                  setManagerIdInput(
                    Number.isNaN(value) || value <= 0 ? null : value
                  );
                }}
              />
              <button className="btn" disabled={roomActionLoading} onClick={() => void openRoom()}>
                Î∞??ùÏÑ±/?çÎìù
              </button>
              <button
                className="btn secondary"
                disabled={roomActionLoading || !currentRoomId}
                onClick={() => void deleteRoom()}
              >
                Î∞???†ú
              </button>
            </div>
          </div>
          <div className="threads">
            {threadsLoading && <div className="status warn">Î™©Î°ù??Î∂àÎü¨?§Îäî Ï§?..</div>}
            {threadsError && <div className="status err">{threadsError}</div>}
            {!threadsLoading && !threadsError && threads.length === 0 && (
              <div className="status">Ï±ÑÌåÖÎ∞©Ïù¥ ?ÜÏäµ?àÎã§.</div>
            )}
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
                      Room #{thread.roomId} ({thread.clientId}??thread.managerId})
                    </div>
                    <div className="snippet">{thread.lastMessageSnippet ?? ""}</div>
                  </div>
                  <div className="time">{formatTimestamp(thread.lastMessageAt)}</div>
                </div>
              ))}
          </div>
          <div className="msgsWrap">
            <div className="msgs" ref={messagesRef}>
              {messagesLoading && <div className="status warn">Î©îÏãúÏßÄÎ•?Î∂àÎü¨?§Îäî Ï§?..</div>}
              {messagesError && <div className="status err">{messagesError}</div>}
              {!messagesLoading && !messagesError && messages.length === 0 && (
                <div className="empty">Î©îÏãúÏßÄÍ∞Ä ?ÜÏäµ?àÎã§.</div>
              )}
              {messages.map((message) => {
                const emergency =
                  (message.messageType ?? "").toUpperCase() === "NOTICE" ||
                  /Í∏¥Í∏â\s*?∏Ï∂ú/.test(message.content ?? "");
                const mine = Boolean(message.senderId && meId === message.senderId);
                const owner =
                  message.senderName && message.senderName.trim().length > 0
                    ? message.senderName
                    : message.senderId
                    ? `?¨Ïö©??${message.senderId}`
                    : "?úÏä§??;
                const bubbleClass = [
                  "bubble",
                  mine ? "mine" : "other",
                  emergency ? "emergency" : null,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div key={message.key} className={bubbleClass}>
                    <div>
                      {emergency && (
                        <div style={{ marginBottom: 6, fontWeight: 700 }}>
                          {owner}?òÏùò ÎπÑÏÉÅ ?∏Ï∂ú?ÖÎãà??
                        </div>
                      )}
                      <div>{message.content}</div>
                    </div>
                    <div className="metaRow">
                      <span>{message.messageType ?? "TEXT"}</span>
                      <span>¬∑</span>
                      <span>{formatTimestamp(message.createdAt)}</span>
                      {message.senderId && (
                        <>
                          <span>¬∑</span>
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
              Îß??ÑÎûòÎ°???
            </button>
          </div>
          <div className="composer">
            <input
              placeholder="Î©îÏãúÏßÄÎ•??ÖÎ†•?òÏÑ∏??(Enter ?ÑÏÜ°)"
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
    <Suspense fallback={<div className="p-4 text-sm text-slate-600">Ï±ÑÌåÖ??Î∂àÎü¨?§Îäî Ï§ëÏûÖ?àÎã§...</div>}>
      <GuardianChatPage />
    </Suspense>
  );
}
