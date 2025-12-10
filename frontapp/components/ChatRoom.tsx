"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage, useStomp } from "@/hooks/useStomp";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRouter } from "next/navigation";
import { resolveProfileImageUrl } from "@/lib/image";
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
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
import { faVideo, faVideoSlash, faMicrophone, faMicrophoneSlash, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

// ... existing logic code imports ...
// I will keep the imports and logic, but replace JSX.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const WS_ENDPOINT = (() => {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) {
    return env.startsWith("http") ? env : env.replace(/^ws/, "http");
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
        const res = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`);
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

  useEffect(() => {
    if (!roomId) return;
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
        // ignore
      }
    };

    void fetchOnce();
    const timer = setInterval(fetchOnce, 2000);
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !resolvedMe.id) return;
    setInput("");
    sendMessage(text);
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
    }
  }, [ensurePc, sendRtc]);

  const handleRtcSignalRef = useRef(handleRtcSignal);
  useEffect(() => {
    handleRtcSignalRef.current = handleRtcSignal;
  }, [handleRtcSignal]);

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
            const msg = JSON.parse(frame.body) as RTCSignalMessage;
            if (!msg || msg.from === me.id) return;
            await handleRtcSignalRef.current(msg);
          } catch (e) {
            console.error("RTC Parse Error", e);
          }
        });
      },
      onStompError: () => setRtcStatus("disconnected"),
      onWebSocketError: () => setRtcStatus("disconnected"),
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

  return (
    <Container size="xl" py="md">
      <Paper withBorder radius="md" p="md" mb="md">
        <Group justify="space-between" align="center">
          <Group>
            <ActionIcon variant="light" color="gray" onClick={() => router.back()}>
              ←
            </ActionIcon>
            <Stack gap={0}>
              <Text fw={700}>실시간 채팅방 #{roomId}</Text>
              <Text size="xs" c="dimmed">담당자와 클라이언트간의 실시간 소통</Text>
            </Stack>
          </Group>
          <Badge color={connected ? "teal" : "gray"} variant="light">
            {connected ? "실시간 연결됨" : "연결 대기중"}
          </Badge>
        </Group>
      </Paper>

      <Grid>
        {/* Video Area */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper withBorder radius="md" p="xs" bg="gray.9" h="100%" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <Group mb="xs" justify="center">
              <Button
                leftSection={<FontAwesomeIcon icon={camOn ? faVideoSlash : faVideo} />}
                color={camOn ? "red" : "teal"}
                onClick={camOn ? stopCamera : startCamera}
                size="xs"
              >
                {camOn ? "카메라 끄기" : "카메라 켜기"}
              </Button>
              <Button
                leftSection={<FontAwesomeIcon icon={micOn ? faMicrophoneSlash : faMicrophone} />}
                disabled={!camOn}
                color={micOn ? "teal" : "gray"}
                variant="light"
                onClick={toggleMic}
                size="xs"
              >
                {micOn ? "마이크 끄기" : "마이크 켜기"}
              </Button>
            </Group>

            <Box style={{ position: 'relative', flex: 1, borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden', background: '#000' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {camOn && (
                <Paper
                  shadow="md"
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    width: 120,
                    height: 90,
                    overflow: 'hidden',
                    zIndex: 10,
                    border: '1px solid rgba(255,255,255,0.3)'
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
              <Text c="white" size="xs" style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4 }}>
                상대방 화면
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Chat Area */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper withBorder radius="md" h="100%" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <ScrollArea p="md" style={{ flex: 1 }} viewportRef={logRef}>
              <Stack gap="sm">
                {messages.length === 0 ? (
                  <Text ta="center" c="dimmed" mt="xl">메시지가 없습니다.</Text>
                ) : (
                  messages.map((m, idx) => {
                    const mine = m.senderId === resolvedMe.id;
                    const name = resolveName(m.senderId, m.senderName);
                    const avatar = resolveAvatar(m.senderId);
                    const isNotice = isEmergencyNotice(m);

                    return (
                      <Group key={idx} align="flex-start" justify={mine ? "flex-end" : "flex-start"} wrap="nowrap">
                        {!mine && (
                          <Avatar src={avatar} radius="xl" size="sm" alt={name} />
                        )}
                        <Stack gap={2} style={{ maxWidth: '70%' }}>
                          {!mine && <Text size="xs" c="dimmed">{name}</Text>}
                          <Paper
                            p="sm"
                            radius="md"
                            bg={isNotice ? "red.1" : mine ? "teal.6" : "gray.1"}
                            c={isNotice ? "red.9" : mine ? "white" : "black"}
                          >
                            <Text size="sm">{m.content}</Text>
                          </Paper>
                          <Text size="xs" c="dimmed" ta={mine ? "right" : "left"}>
                            {fmt(m.sentAt ?? m.createdAt)}
                          </Text>
                        </Stack>
                      </Group>
                    );
                  })
                )}
              </Stack>
            </ScrollArea>

            <Paper p="sm" withBorder style={{ borderTop: '1px solid var(--mantine-color-gray-3)', borderBottom: 0, borderLeft: 0, borderRight: 0 }}>
              <form onSubmit={handleSend}>
                <Group>
                  <TextInput
                    placeholder="메시지를 입력하세요"
                    value={input}
                    onChange={(e) => setInput(e.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  <Button type="submit" disabled={!input.trim()}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </Button>
                </Group>
              </form>
            </Paper>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
