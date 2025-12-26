"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, useStomp } from "@/hooks/useStomp";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRouter } from "next/navigation";
import { resolveProfileImageUrl } from "@/lib/image";
import { ensureAccessToken, fetchWithAuth } from "@/lib/auth";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Grid,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  Badge,
  Loader,
  Indicator,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVideo, faVideoSlash, faMicrophone, faMicrophoneSlash, faPaperPlane, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

// ... existing logic code imports ...
// I will keep the imports and logic, but replace JSX.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const WS_ENDPOINT = (() => {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) {
    return env.startsWith("http") ? env : env.replace(/^ws/, "http");
  }
  if (typeof window === "undefined") return "/ws-stomp";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.host}/ws-stomp`;
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

export default function ChatRoom({ roomId, me, initialMessages = [] }: Props) {
  const router = useRouter();
  const [resolvedMe, setResolvedMe] = useState(me);
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

  const isMobile = useMediaQuery("(max-width: 50em)");

  const getProfileImage = useCallback(
    (url?: string | null) => {
      if (url && typeof url === "string" && url.trim().length > 0) {
        return resolveProfileImageUrl(url) || defaultProfileImage;
      }
      return defaultProfileImage;
    },
    [defaultProfileImage]
  );

  useEffect(() => {
    setMessages(initialMessages);
    const s = new Set<string>();
    initialMessages.forEach((m) => s.add(buildKey(m)));
    seen.current = s;
  }, [initialMessages]);

  useEffect(() => {
    setResolvedMe(me);
  }, [me]);

  useEffect(() => {
    if (!roomId) return;
    (async () => {
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL}/api/chat/rooms/${roomId}`,
        );
        if (!res.ok) return;
        const data: ThreadInfo = await res.json();
        setThread(data);
      } catch {
        // ignore
      }
    })();
  }, [roomId]);

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

  useEffect(() => {
    const loadProfiles = async () => {
      if (!thread) return;
      const targets = [thread.clientId, thread.managerId].filter(
        (id) => !participantProfiles[id]
      );
      if (targets.length === 0) return;

      for (const id of targets) {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/users/${id}`);
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

  const POLL_INTERVAL_MS = 800;

  useEffect(() => {
    if (!roomId) return;
    if (connected) return;

    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL}/api/chat/rooms/${roomId}/messages`,
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
        // ignore
      }
    };

    void fetchOnce();
    const timer = setInterval(fetchOnce, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [roomId, connected]);

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

  const sendViaHttp = async (text: string) => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/chat/rooms/${roomId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            senderId: resolvedMe.id,
            content: text,
          }),
        },
      );
      if (!res.ok) return;
      const saved = (await res.json()) as ChatMessage;
      const key = buildKey(saved);
      if (!seen.current.has(key)) {
        seen.current.add(key);
        setMessages((prev) => [...prev, saved]);
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !resolvedMe.id) return;
    setInput("");
    if (connected) {
      const ok = await sendMessage(text);
      if (ok) return;
    }
    void sendViaHttp(text);
  };

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

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [remoteVideoOn, setRemoteVideoOn] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const rtcClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!camOn) return;
    const video = localVideoRef.current;
    const stream = localStreamRef.current;
    if (!video || !stream) return;

    video.muted = true;
    video.srcObject = stream;

    const play = async () => {
      try {
        await video.play();
      } catch {
        // ignore
      }
    };

    if (video.readyState >= 1) {
      void play();
    } else {
      video.onloadedmetadata = () => {
        void play();
      };
    }

    return () => {
      video.onloadedmetadata = null;
    };
  }, [camOn]);

  const sendRtc = useCallback((type: RtcMessageType, payload: RtcPayload = {}) => {
    const client = rtcClientRef.current;
    if (!client || !client.connected || !roomId || !resolvedMe.id) return;
    const body = { type, from: resolvedMe.id, ...payload };
    client.publish({
      destination: `/app/rtc/${roomId}`,
      body: JSON.stringify(body),
    });
  }, [roomId, resolvedMe.id]);

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
      setRemoteVideoOn(true);
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
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setRemoteVideoOn(false);
    }
  }, [ensurePc, sendRtc]);

  const handleRtcSignalRef = useRef(handleRtcSignal);
  useEffect(() => {
    handleRtcSignalRef.current = handleRtcSignal;
  }, [handleRtcSignal]);

  useEffect(() => {
    if (!roomId || !resolvedMe.id) return;
    const socketFactory = () =>
      new SockJS(
        WS_ENDPOINT,
        undefined,
        {
          transportOptions: {
            "xhr-streaming": { withCredentials: true },
            "xhr-polling": { withCredentials: true },
          },
        } as any,
      );
    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      onConnect: () => {
        setRtcStatus("connected");
        client.subscribe(`/topic/rtc/${roomId}`, async (frame) => {
          try {
            const msg = JSON.parse(frame.body) as RTCSignalMessage;
            if (!msg || msg.from === resolvedMe.id) return;
            await handleRtcSignalRef.current(msg);
          } catch (e) {
            console.error("RTC Parse Error", e);
          }
        });
      },
      onStompError: () => setRtcStatus("disconnected"),
      onWebSocketError: () => setRtcStatus("disconnected"),
    });

    client.beforeConnect = async () => {
      const token = await ensureAccessToken();
      client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    };

    setRtcStatus("connecting");
    client.activate();
    rtcClientRef.current = client;

    return () => {
      client.deactivate();
      rtcClientRef.current = null;
      setRtcStatus("disconnected");
      setRemoteVideoOn(false);
    };
  }, [roomId, resolvedMe.id]);

const startCamera = async () => {
  if (camOn) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      // 로컬 미리보기 안정화(일부 브라우저에서 play 트리거 필요)
      localVideoRef.current.muted = true;
      localVideoRef.current.srcObject = stream;

      const play = async () => {
        try {
          await localVideoRef.current?.play();
        } catch {
          /* ignore */
        }
      };

      localVideoRef.current.onloadedmetadata = () => {
        void play();
      };
      void play();
    }

    setCamOn(true);
    setMicOn(true);

    const pc = ensurePc();

    // 재시작 시 기존 sender가 있으면 replaceTrack으로 갱신
    const senders = pc.getSenders();
    for (const t of stream.getTracks()) {
      const sender = senders.find((s) => s.track && s.track.kind === t.kind);
      if (sender) {
        await sender.replaceTrack(t);
      } else {
        pc.addTrack(t, stream);
      }
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendRtc("offer", { sdp: offer.sdp });
  } catch (e) {
    alert("카메라 접근 실패: " + String(e));
  }
};


  const stopCamera = async () => {
    if (!camOn) return;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    const pc = pcRef.current;
    if (pc) {
      pc.getSenders().forEach((s) => {
        if (s.track) {
          s.replaceTrack(null).catch(() => {});
        }
      });
    }
    setCamOn(false);
    setMicOn(false);
    sendRtc("video-off", {});
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const enabled = !micOn;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setMicOn(enabled);
  };

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

  const renderVideoPanel = (extraStyle?: React.CSSProperties) => (
    <Paper
      withBorder
      radius="md"
      p="0"
      bg="gray.9"
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        ...extraStyle,
      }}
    >
      <Box style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {rtcStatus !== "connected" && (
          <Center
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1,
              flexDirection: 'column'
            }}
          >
            <Loader color="white" type="dots" />
            <Text c="white" mt="sm">
              {rtcStatus === "connecting" ? "화상 연결 중..." : "화상채팅이 연결되지 않았습니다."}
            </Text>
          </Center>
        )}
        {rtcStatus === "connected" && !remoteVideoOn && (
          <Center
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.55)',
              zIndex: 1,
              flexDirection: 'column'
            }}
          >
            <Text c="white" fw={600}>상대방 카메라가 꺼져 있습니다.</Text>
          </Center>
        )}

        {/* Local Video Overlay */}
        {camOn && (
          <Paper
            shadow="xl"
            radius="md"
            withBorder
            style={{
              position: 'absolute',
              right: 20,
              top: 20,
              width: 180,
              aspectRatio: '4/3',
              zIndex: 10,
              overflow: 'hidden',
              borderColor: 'rgba(255,255,255,0.2)'
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Paper>
        )}
      </Box>

      {/* Controls Bar */}
      <Paper p="md" bg="rgba(0,0,0,0.8)" radius={0} style={{ zIndex: 2 }}>
        <Group justify="center" gap="xl">
          <ActionIcon
            variant={camOn ? "filled" : "light"}
            color={camOn ? "gray" : "red"}
            size="xl"
            radius="xl"
            onClick={camOn ? stopCamera : startCamera}
          >
            <FontAwesomeIcon icon={camOn ? faVideoSlash : faVideo} />
          </ActionIcon>

          <ActionIcon
            variant={micOn ? "filled" : "light"}
            color={micOn ? "gray" : "red"}
            size="xl"
            radius="xl"
            disabled={!camOn}
            onClick={toggleMic}
          >
            <FontAwesomeIcon icon={micOn ? faMicrophoneSlash : faMicrophone} />
          </ActionIcon>

        </Group>
      </Paper>
    </Paper>
  );

  const renderChatPanel = (extraStyle?: React.CSSProperties) => (
    <Paper
      withBorder
      radius="md"
      h="100%"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        position: "relative",
        ...extraStyle,
      }}
    >
      {/* Chat Header */}
      <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group justify="space-between">
          <Stack gap={0}>
            <Group gap={8} align="center">
              <Indicator
                color={connected ? "teal" : "gray"}
                size={10}
                processing={connected}
                withBorder
                position="middle-start"
                styles={{ indicator: { transform: "translate(-50%, calc(-50% + 0px))" } }}
              >
                <Text size="xs" c={connected ? "teal" : "dimmed"} ml={10}>
                  {connected ? "상담원 연결됨" : "연결 대기중"}
                </Text>
              </Indicator>
            </Group>
            <Text fw={700} size="lg">채팅방 #{roomId}</Text>
          </Stack>
        </Group>
      </Box>

      {/* Messages List - Container with min-height: 0 is CRITICAL for nested flex scrolling */}
      <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <ScrollArea
          p="md"
          type="auto"
          scrollHideDelay={0}
          viewportRef={logRef}
          style={{ flex: 1, height: "100%", maxHeight: "100%" }}
          styles={{ viewport: { height: "100%", maxHeight: "100%" } }}
        >
          <Stack gap="md">
            {messages.length === 0 ? (
              <Center h={200}>
                <Stack align="center" gap="xs">
                  <ThemeIcon color="gray" variant="light" size={40} radius="xl">
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </ThemeIcon>
                  <Text c="dimmed" size="sm">대화를 시작해보세요.</Text>
                </Stack>
              </Center>
            ) : (
              messages.map((m, idx) => {
                const mine = m.senderId === resolvedMe.id;
                const name = resolveName(m.senderId, m.senderName);
                const avatar = resolveAvatar(m.senderId);
                const isNotice = isEmergencyNotice(m);

                return (
                  <Group key={idx} align="flex-start" justify={mine ? "flex-end" : "flex-start"} wrap="nowrap">
                    {!mine && (
                      <Avatar src={avatar} radius="xl" size="md" />
                    )}
                    <Stack gap={4} style={{ maxWidth: '75%' }}>
                      {!mine && <Text size="xs" c="dimmed" ml={4}>{name}</Text>}
                      <Paper
                        p="sm"
                        px="md"
                        radius="xl"
                        style={{
                          borderTopLeftRadius: !mine ? 0 : undefined,
                          borderTopRightRadius: mine ? 0 : undefined
                        }}
                        bg={isNotice ? "red.1" : mine ? "indigo.6" : "gray.1"}
                        c={isNotice ? "red.9" : mine ? "white" : "black"}
                      >
                        <Text size="sm" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</Text>
                      </Paper>
                      <Text size="xs" c="dimmed" ta={mine ? "right" : "left"} mr={mine ? 4 : 0} ml={!mine ? 4 : 0}>
                        {fmt(m.sentAt ?? m.createdAt)}
                      </Text>
                    </Stack>
                  </Group>
                );
              })
            )}
          </Stack>
        </ScrollArea>
      </Box>

      {/* Input Area */}
      <Box
        p="md"
        style={{
          borderTop: '1px solid var(--mantine-color-gray-3)',
          position: 'sticky',
          bottom: 0,
          background: 'white',
          zIndex: 5,
        }}
        bg="white"
      >
        <form onSubmit={handleSend}>
          <Group gap="xs" align="flex-end">
            <TextInput
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              style={{ flex: 1 }}
              variant="filled"
              radius="md"
              size="md"
              autoComplete="off"
            />
            <ActionIcon
              type="submit"
              disabled={!input.trim()}
              variant="filled"
              color="indigo"
              size="lg"
              radius="md"
              h={42} w={42}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </ActionIcon>
          </Group>
        </form>
      </Box>
    </Paper>
  );

  const layoutCols = isMobile ? "1fr" : "2fr 1fr";
  const layoutRows = isMobile ? "40vh 1fr" : "1fr";

  const handleExit = () => {
    if (typeof window !== "undefined") {
      window.close();
      // Fallback in case window.close() is blocked
      setTimeout(() => router.back(), 150);
    } else {
      router.back();
    }
  };

  return (
    <Box
      style={{
        position: "fixed",
        inset: 0,
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        padding: 12,
        boxSizing: "border-box",
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: isMobile ? 5 : 31, // 모바일(상단 영역) vs 데스크톱 헤더 높이 근처
          right: 20,
          zIndex: 100,
        }}
      >
        <Button
          variant="outline"
          color="gray"
          radius="md"
          size="sm"
          onClick={handleExit}
          style={{ paddingInline: 14, borderWidth: 1.2 }}
        >
          나가기
        </Button>
      </Box>
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: layoutCols,
          gridTemplateRows: layoutRows,
          gap: 12,
          height: "100%",
          width: "100%",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <Box style={{ minHeight: 0, minWidth: 0 }}>{renderVideoPanel()}</Box>
        <Box style={{ minHeight: 0, minWidth: 0 }}>{renderChatPanel()}</Box>
      </Box>
    </Box>
  );
}
