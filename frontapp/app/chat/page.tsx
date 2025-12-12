"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const WS_BASE = (() => {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) return env.startsWith("http") ? env : env.replace(/^ws/, "http");
  if (typeof window === "undefined") return "/ws";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.host}/ws`;
})();

type SignalMessage =
  | { type: "offer"; roomId: number; sdp: any }
  | { type: "answer"; roomId: number; sdp: any }
  | { type: "ice"; roomId: number; candidate: any };

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem("guardian_auth");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    const token = parsed?.accessToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export default function ChatPage() {
  const sp = useSearchParams();
  const roomId = Number(sp.get("roomId") ?? "0");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const stompRef = useRef<Client | null>(null);

  const [connected, setConnected] = useState(false);
  const [camOn, setCamOn] = useState(false);

  const rtcConfig = useMemo<RTCConfiguration>(
    () => ({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    }),
    []
  );

  const bindLocalPreview = async () => {
    const video = localVideoRef.current;
    const stream = localStreamRef.current;
    if (!video || !stream) return;

    video.muted = true;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    // “내 화면 안 보임” 방지용 안전망: play 트리거
    try {
      await video.play();
    } catch {
      // 일부 브라우저는 metadata 이후 play가 안정적
      video.onloadedmetadata = async () => {
        try {
          await video.play();
        } catch {}
      };
    }
  };

  const bindRemote = async (stream: MediaStream) => {
    const video = remoteVideoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    try {
      await video.play();
    } catch {
      video.onloadedmetadata = async () => {
        try {
          await video.play();
        } catch {}
      };
    }
  };

  const ensurePC = () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(rtcConfig);

    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (stream) void bindRemote(stream);
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        sendSignal({ type: "ice", roomId, candidate: ev.candidate });
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const connectStomp = () => {
    if (stompRef.current) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),
      connectHeaders: getAuthHeader(),
      debug: () => {},
      reconnectDelay: 2000,
      onConnect: () => {
        setConnected(true);

        // 수신 구독 (백엔드 destination에 맞게 변경)
        client.subscribe(`/topic/webrtc/${roomId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body) as SignalMessage;
            void onSignal(data);
          } catch {
            // ignore
          }
        });
      },
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    stompRef.current = client;
    client.activate();
  };

  const sendSignal = (payload: SignalMessage) => {
    const client = stompRef.current;
    if (!client || !client.connected) return;

    // 송신 destination (백엔드 destination에 맞게 변경)
    client.publish({
      destination: `/app/webrtc/signal`,
      body: JSON.stringify(payload),
    });
  };

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    setCamOn(true);
    await bindLocalPreview();

    const pc = ensurePC();
    // 중복 addTrack 방지
    const senders = pc.getSenders();
    for (const track of stream.getTracks()) {
      const already = senders.some((s) => s.track?.kind === track.kind);
      if (!already) pc.addTrack(track, stream);
    }
  };

  const stopCamera = () => {
    setCamOn(false);
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  const createOffer = async () => {
    const pc = ensurePC();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal({ type: "offer", roomId, sdp: offer });
  };

  const onSignal = async (m: SignalMessage) => {
    if (!roomId) return;

    const pc = ensurePC();

    if (m.type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(m.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ type: "answer", roomId, sdp: answer });
      return;
    }

    if (m.type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(m.sdp));
      return;
    }

    if (m.type === "ice") {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(m.candidate));
      } catch {
        // ignore
      }
    }
  };

  // 초기 연결
  useEffect(() => {
    if (!roomId) return;
    connectStomp();

    return () => {
      stompRef.current?.deactivate();
      stompRef.current = null;

      pcRef.current?.close();
      pcRef.current = null;

      stopCamera();
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // “내 화면 안 보임” 추가 안전망: camOn 변경 시마다 재바인딩 시도
  useEffect(() => {
    void bindLocalPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-bold">Chat / WebRTC</div>
          <div className="text-sm text-gray-500">
            roomId: {roomId} / STOMP: {connected ? "connected" : "disconnected"}
          </div>
        </div>
        <div className="flex gap-2">
          {!camOn ? (
            <button className="border rounded px-3 py-2" onClick={startCamera}>
              카메라 켜기
            </button>
          ) : (
            <button className="border rounded px-3 py-2" onClick={stopCamera}>
              카메라 끄기
            </button>
          )}
          <button
            className="border rounded px-3 py-2 disabled:opacity-50"
            onClick={createOffer}
            disabled={!connected || !camOn}
          >
            통화 시작(Offer)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded border p-3 space-y-2">
          <div className="font-semibold">Local</div>
          <video
            ref={localVideoRef}
            className="w-full rounded bg-black"
            playsInline
            autoPlay
            muted
          />
        </div>

        <div className="rounded border p-3 space-y-2">
          <div className="font-semibold">Remote</div>
          <video
            ref={remoteVideoRef}
            className="w-full rounded bg-black"
            playsInline
            autoPlay
          />
        </div>
      </div>

      <div className="text-sm text-gray-500">
        - “상대 화면은 보이는데 내 화면이 안 보임”은 보통 로컬 video에 stream 바인딩/재생 트리거 문제입니다. 위 코드는 재바인딩 + play() 안전망을 포함합니다.
        <br />
        - 백엔드에서 사용하는 STOMP destination이 다르면, <b>/topic/webrtc/{`{roomId}`}</b>, <b>/app/webrtc/signal</b> 부분만 맞추면 됩니다.
      </div>
    </div>
  );
}
