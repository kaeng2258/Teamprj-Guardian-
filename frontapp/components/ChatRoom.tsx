"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, useStomp } from "@/hooks/useStomp";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRouter } from "next/navigation";
import { resolveProfileImageUrl } from "@/lib/image";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

// RTC용 STOMP 엔드포인트 (SockJS는 http/https 스킴만 허용)
const WS_ENDPOINT = (() => {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) {
    return env.startsWith("http") ? env : env.replace(/^ws/, "http"); // ws → http, wss → https
  }
  if (typeof window === "undefined") return "/ws";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.host}/ws`;
})();

type Props = {
  roomId: number;
  me: { id: number; name: string };
  initialMessages?: ChatMessage[];
};

type ThreadInfo = {
  roomId: number;
  clientId: number;
  managerId: number;
  clientName?: string | null;
  managerName?: string | null;
  clientProfileImageUrl?: string | null;
  managerProfileImageUrl?: string | null;
  lastMessageSnippet?: string | null;
  lastMessageAt?: string | null;
};

const buildKey = (m: ChatMessage) => {
  const ident = m.messageId ?? m.id;
  if (ident != null) return `id:${ident}`;

  const ts = m.sentAt ?? m.createdAt ?? "";
  return `${m.roomId}:${m.senderId}:${ts}:${m.content}:${m.messageType ?? ""}`;
};


type RtcMessageType = "candidate" | "offer" | "answer" | "video-off";

interface RtcOfferAnswerMessage {
  type: "offer" | "answer";
  sdp: string;
  from: number;
}

interface RtcCandidateMessage {
  type: "candidate";
  candidate: RTCIceCandidateInit;
  from: number;
}

interface RtcVideoOffMessage {
  type: "video-off";
  from: number;
}

type RTCSignalMessage = RtcOfferAnswerMessage | RtcCandidateMessage | RtcVideoOffMessage;

interface RtcPayload {
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

// --------- 컴포넌트 ---------
export default function ChatRoom({ roomId, me, initialMessages = [] }: Props) {
  const router = useRouter();
  const [resolvedMe, setResolvedMe] = useState(me);
  // ===== 채팅 관련 =====
  const [thread, setThread] = useState<ThreadInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [rtcStatus, setRtcStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const logRef = useRef<HTMLDivElement | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const [participantProfiles, setParticipantProfiles] = useState<Record<number, string>>({});
  const defaultProfileImage =
    resolveProfileImageUrl("/image/픽토그램.png") || "/image/픽토그램.png";
  const getProfileImage = useCallback(
    (url?: string | null) => {
      if (url && typeof url === "string" && url.trim().length > 0) {
        return resolveProfileImageUrl(url) || defaultProfileImage;
      }
      return defaultProfileImage;
    },
    [defaultProfileImage]
  );

  // 초기 메시지 + seen 초기화
  useEffect(() => {
    setMessages(initialMessages);
    const s = new Set<string>();
    initialMessages.forEach((m) => s.add(buildKey(m)));
    seen.current = s;
  }, [initialMessages]);

  // me prop이 변경되면 내부 상태도 동기화
  useEffect(() => {
    setResolvedMe(me);
  }, [me]);

  // 채팅방 정보 로딩 (클라이언트/매니저 이름 포함)
  useEffect(() => {
    if (!roomId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`);
        if (!res.ok) return;
        const data: ThreadInfo = await res.json();
        setThread(data);
      } catch {
        // 무시
      }
    })();
  }, [roomId]);

  // 내 정보 보정: 로그인 정보나 스레드 정보로 id/name을 확보해 버튼이 비활성화되지 않도록 함
  useEffect(() => {
    if (!thread) return;
    const storedId =
      typeof window !== "undefined"
        ? Number(window.localStorage.getItem("userId") ?? 0)
        : 0;
    const storedRole =
      typeof window !== "undefined"
        ? window.localStorage.getItem("userRole")
        : null;
    const storedName =
      (typeof window !== "undefined" && window.localStorage.getItem("userName")) ||
      (typeof window !== "undefined" && window.localStorage.getItem("userEmail")) ||
      "";

    const candidateId =
      (storedId && Number.isFinite(storedId) ? storedId : 0) ||
      (storedRole === "MANAGER" ? thread.managerId : 0) ||
      (storedRole === "CLIENT" ? thread.clientId : 0);

    if (candidateId && candidateId !== resolvedMe.id) {
      const nameFromThread =
        candidateId === thread.managerId
          ? thread.managerName
          : candidateId === thread.clientId
          ? thread.clientName
          : null;
      const nextName =
        nameFromThread && nameFromThread.trim().length > 0
          ? nameFromThread
          : storedName && storedName.trim().length > 0
          ? storedName
          : resolvedMe.name || `사용자#${candidateId}`;
      setResolvedMe({ id: candidateId, name: nextName });
    }
  }, [thread, resolvedMe.id, resolvedMe.name]);

  // 프로필 이미지 보강 로딩
  useEffect(() => {
    const loadProfiles = async () => {
      if (!thread) return;
      const targets = [thread.clientId, thread.managerId].filter(
        (id) => !participantProfiles[id]
      );
      if (targets.length === 0) return;

      for (const id of targets) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
          if (!res.ok) continue;
          const detail: { profileImageUrl?: string | null } = await res.json();
          setParticipantProfiles((prev) => ({
            ...prev,
            [id]: getProfileImage(detail.profileImageUrl),
          }));
        } catch {
          // ignore
        }
      }
    };
    void loadProfiles();
  }, [thread, participantProfiles, getProfileImage]);

  // STOMP 채팅 연결
  const onMessageHandler = useCallback((msg: ChatMessage) => {
    const key = buildKey(msg);
    if (seen.current.has(key)) return;
    seen.current.add(key);
    setMessages((prev) => [...prev, msg]);
  }, []);

  const { connected, sendMessage } = useStomp({
    roomId,
    me: resolvedMe,
    onMessage: onMessageHandler,
  });

// 2초 폴링 (백업용)
useEffect(() => {
  if (!roomId) return;

  // ✅ STOMP 가 정상 연결된 상태라면 폴링 사용 안 함
  if (connected) return;

  let cancelled = false;

  const fetchOnce = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chat/rooms/${roomId}/messages`
      );
      if (!res.ok) return;
      const data = await res.json();
      const list: ChatMessage[] = data.messages ?? [];

      const added: ChatMessage[] = [];
      for (const m of list) {
        const key = buildKey(m);
        if (!seen.current.has(key)) {
          seen.current.add(key);
          added.push(m);
        }
      }
      if (!cancelled && added.length > 0) {
        setMessages((prev) => [...prev, ...added]);
      }
    } catch {
      // 무시
    }
  };

  void fetchOnce();
  const timer = setInterval(fetchOnce, 2000);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}, [roomId, connected]); // ✅ connected를 deps에 추가


  const resolveName = (senderId: number, fallback?: string) => {
    if (thread) {
      if (senderId === thread.clientId) {
        return thread.clientName || fallback || `클라이언트#${senderId}`;
      }
      if (senderId === thread.managerId) {
        return thread.managerName || fallback || `매니저#${senderId}`;
      }
    }
    return fallback || `사용자#${senderId}`;
  };

  const displayMeName = useMemo(
    () => resolveName(resolvedMe.id, resolvedMe.name),
    [thread, resolvedMe.id, resolvedMe.name]
  );
  const resolveAvatar = useCallback(
    (senderId: number) => {
      if (!thread) return defaultProfileImage;
      const detailAvatar = participantProfiles[senderId];
      if (detailAvatar) return detailAvatar;
      if (senderId === thread.clientId) {
        return getProfileImage(thread.clientProfileImageUrl);
      }
      if (senderId === thread.managerId) {
        return getProfileImage(thread.managerProfileImageUrl);
      }
      return defaultProfileImage;
    },
    [thread, getProfileImage, participantProfiles]
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !resolvedMe.id) return;
    setInput("");
    // 실제 메시지 추가는 STOMP/폴링에서만 처리 (중복 방지)
    sendMessage(text);
  };

  // 스크롤 맨 아래
  useEffect(() => {
    const box = logRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  }, [messages.length]);

  const fmt = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const isEmergencyNotice = (m: ChatMessage) => {
    const type = (m.messageType ?? "").trim().toUpperCase();
    if (type === "NOTICE" || type === "EMERGENCY" || type === "ALERT") return true;
    const content = (m.content ?? "").replace(/\s+/g, "");
    return /긴급호출|비상호출|긴급|비상/.test(content);
  };

  const title = useMemo(
    () =>
      thread
        ? `실시간 채팅방 #${thread.roomId}`
        : `실시간 채팅방 #${roomId}`,
    [thread, roomId]
  );

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const rtcClientRef = useRef<Client | null>(null);

  const sendRtc = useCallback((type: RtcMessageType, payload: RtcPayload = {}) => {
    const client = rtcClientRef.current;
    if (!client || !client.connected || !roomId || !me.id) return;
    const body = { type, from: me.id, ...payload };
    client.publish({
      destination: `/app/rtc/${roomId}`,
      body: JSON.stringify(body),
    });
  }, [roomId, me.id]);

  const ensurePc = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendRtc("candidate", { candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onconnectionstatechange = () => {
      // console.log("pc state", pc.connectionState);
    };

    pcRef.current = pc;
    return pc;
  }, [sendRtc]);

  const handleRtcSignal = useCallback(async (msg: RTCSignalMessage) => {
    const pc = ensurePc();

    if (msg.type === "offer" && "sdp" in msg) {
      await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendRtc("answer", { sdp: answer.sdp });
    } else if (msg.type === "answer" && "sdp" in msg) {
      await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
    } else if (msg.type === "candidate" && "candidate" in msg) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) {
        console.error("ICE 추가 실패", e);
      }
    } else if (msg.type === "video-off") {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  }, [ensurePc, sendRtc]);

  const handleRtcSignalRef = useRef(handleRtcSignal);
  useEffect(() => {
    handleRtcSignalRef.current = handleRtcSignal;
  }, [handleRtcSignal]);

  // STOMP 연결 + 시그널 구독
  useEffect(() => {
    if (!roomId || !me.id) return;

    const socketFactory = () => new SockJS(WS_ENDPOINT);

    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      onConnect: () => {
        setRtcStatus("connected");
        client.subscribe(`/topic/rtc/${roomId}`, async (frame) => {
          try {
            const msg = JSON.parse(frame.body) as any;
            if (!msg || msg.from === me.id) return;
            await handleRtcSignalRef.current(msg);
          } catch (e) {
            console.error("RTC 메시지 파싱 실패", e);
          }
        });
      },
      onStompError: (f) => {
        console.error("RTC STOMP error", f);
        setRtcStatus("disconnected");
      },
      onWebSocketError: (e) => {
        console.error("RTC WebSocket error", e);
        setRtcStatus("disconnected");
      },
    });

    setRtcStatus("connecting");
    client.activate();
    rtcClientRef.current = client;

    return () => {
      client.deactivate();
      rtcClientRef.current = null;
      setRtcStatus("disconnected");
    };
  }, [roomId, me.id]);

  const startCamera = async () => {
    if (camOn) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCamOn(true);
      setMicOn(true);

      const pc = ensurePc();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // 네고시에이션
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendRtc("offer", { sdp: offer.sdp });
    } catch (e: any) {
      alert("카메라 접근 실패: " + e.message);
    }
  };

  const stopCamera = async () => {
    if (!camOn) return;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setCamOn(false);
    setMicOn(false);

    sendRtc("video-off", {});
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const enabled = !micOn;
    localStreamRef.current
      .getAudioTracks()
      .forEach((t) => (t.enabled = enabled));
    setMicOn(enabled);
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

const rtcLabel = connected ? "WS 연결됨" : "WS 연결 대기";
const rtcDotClass = connected ? "bg-emerald-500" : "bg-slate-400";
const rtcTextClass = connected ? "text-emerald-700" : "text-slate-500";

  // --------- 렌더 ---------
  return (
    <section className="flex flex-col gap-4">
      {/* 상단 헤더 */}
<header className="flex flex-col gap-2 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3"> {/* Added a flex container for button and title */}
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="뒤로가기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                GUARDIAN CHAT
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                실시간 채팅방 #{roomId}
              </h1>
              <p className="text-xs text-slate-500">
                담당자와 클라이언트가 실시간으로 소통합니다.
              </p>
            </div>
          </div>
  {/* 🔽 여기 상태 뱃지 영역 */}
  <div className="mt-2 flex items-center gap-3 text-xs md:mt-0">
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1">
      <span className={`h-2 w-2 rounded-full ${rtcDotClass}`} />
      <span className={`font-medium ${rtcTextClass}`}>
        {connected ? "실시간 채팅 연결됨" : "채팅 연결 대기중"}
      </span>
    </span>

    <span className="text-slate-500">WS 상태: {rtcLabel}</span>
  </div>
</header>

      {/* 가운데: 좌측 영상 / 우측 채팅 */}
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {/* ===== 왼쪽: WebRTC 영상 영역 ===== */}
        {/* ===== 왼쪽: WebRTC 영상 영역 (밝은 UI) ===== */}
{/* ===== 왼쪽: WebRTC 영상 영역 (세로 배치, 큰 화면) ===== */}
{/* ===== 왼쪽: WebRTC 영상 영역 (적당 크기 + 한 화면에 들어오는 레이아웃) ===== */}
{/* ===== 왼쪽: WebRTC 영상 영역 (FaceTime 스타일) ===== */}
<section className="flex h-full flex-col gap-3 rounded-2xl border border-emerald-200 bg-white p-4">
  {/* 상단 컨트롤 바 */}
  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2">
    <button
      type="button"
      onClick={camOn ? stopCamera : startCamera}
      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
    >
      {camOn ? "카메라 끄기" : "카메라 켜기"}
    </button>

    <button
      type="button"
      onClick={toggleMic}
      disabled={!camOn}
      className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:bg-slate-200 disabled:text-slate-400"
    >
      {micOn ? "마이크 끄기" : "마이크 켜기"}
    </button>

    <span className="ml-1 text-xs text-emerald-700">
      카메라를 켜면 상대와 자동으로 연결됩니다.
    </span>
  </div>

  {/* 아래: 상대 영상 꽉 채우기 + 내 영상 PiP */}
  <div className="relative flex-1 rounded-xl border border-emerald-200 bg-slate-100 overflow-hidden">
    {/* 상대 영상: 섹션을 거의 꽉 채움 */}
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className="h-full w-full object-cover"
    />

    {/* 살짝 그라데이션/테두리 느낌 (선택사항) */}
    <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5 bg-gradient-to-t from-black/10 via-transparent" />

    {/* 내 영상: 우측 상단 미니 PiP */}
    <div className="pointer-events-auto absolute right-3 top-3 h-24 w-32 md:h-28 md:w-40 rounded-lg border border-white/70 bg-slate-900/80 shadow-lg overflow-hidden">
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute left-1 top-1 rounded-full bg-black/40 px-2 py-[2px] text-[10px] font-medium text-slate-100">
        나
      </div>
    </div>

    {/* 아래쪽에 상대 정보 라벨 (원하면) */}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3">
      <div className="rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-slate-50">
        상대 영상
      </div>
    </div>
  </div>
</section>




        {/* ===== 오른쪽: 채팅 영역 ===== */}
        <section className="flex h-[420px] min-h-[320px] flex-col rounded-2xl border border-slate-100 bg-white lg:h-[calc(100dvh-220px)]">
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto rounded-2xl bg-slate-50/70 px-5 py-4"
          >
            {messages.length === 0 ? (
              <p className="mt-10 text-center text-sm text-slate-500">
                아직 메시지가 없습니다. 첫 메시지를 보내보세요.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {messages.map((m, idx) => {
                  const emergency = isEmergencyNotice(m);
                  const mine = m.senderId === resolvedMe.id;
                  const name = resolveName(m.senderId, m.senderName);
                  const alertOwner = name;
                  const avatar = resolveAvatar(m.senderId);
                  const bubbleBase = emergency
                    ? "bg-red-50 text-red-900 border border-red-200"
                    : mine
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-slate-900";
                  const metaText = emergency
                    ? "text-red-500"
                    : mine
                    ? "text-emerald-50/80"
                    : "text-slate-400";
                  return (
                    <li
                      key={idx}
                      className={`flex ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm ${bubbleBase}`}
                      >
                        {!mine && (
                          <div className="mb-0.5 flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[11px] font-semibold text-emerald-700">
                              {avatar && (
                                <img
                                  src={avatar}
                                  alt={`${name} 프로필`}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </span>
                            <span className="text-xs font-semibold text-emerald-700">
                              {name}
                            </span>
                          </div>
                        )}
                        {emergency && (
                          <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            {alertOwner}님의 비상 호출입니다
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words">
                          {m.content}
                        </div>
                        <div
                          className={`mt-1 text-[10px] ${metaText}`}
                        >
                          {fmt(m.sentAt ?? m.createdAt)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form
            className="flex items-center gap-3 border-t border-slate-100 px-5 py-3.5"
            onSubmit={handleSend}
          >
            <input
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              placeholder="메시지를 입력하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!input.trim() || !resolvedMe.id}
            >
              전송
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
