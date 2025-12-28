import { useState, useRef, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_ENDPOINT = (() => {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) {
    return env.startsWith("http") ? env : env.replace(/^ws/, "http"); // ws → http, wss → https
  }
  if (typeof window === "undefined") return "/ws-stomp";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.host}/ws-stomp`;
})();

interface UseWebRtcCallProps {
  roomId: number;
  me: { id: number; name: string };
}

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

export function useWebRtcCall({ roomId, me }: UseWebRtcCallProps) {
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [rtcStatus, setRtcStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const rtcClientRef = useRef<Client | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

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
        const play = async () => {
          try {
            await remoteVideoRef.current?.play();
          } catch {
            // ignore autoplay errors
          }
        };
        void play();
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
      if (pendingCandidatesRef.current.length > 0) {
        const pending = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        for (const candidate of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Failed to add ICE candidate", e);
          }
        }
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendRtc("answer", { sdp: answer.sdp });
    } else if (msg.type === "answer" && "sdp" in msg) {
      await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
      if (pendingCandidatesRef.current.length > 0) {
        const pending = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        for (const candidate of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Failed to add ICE candidate", e);
          }
        }
      }
    } else if (msg.type === "candidate" && "candidate" in msg) {
      if (!pc.remoteDescription || !pc.remoteDescription.type) {
        pendingCandidatesRef.current.push(msg.candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) {
        console.error("Failed to add ICE candidate", e);
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

  // STOMP connection + signal subscription
  useEffect(() => {
    if (!roomId || !me.id) return;

    const socketFactory = () => new SockJS(WS_ENDPOINT);

    const token = window.localStorage.getItem("accessToken");
    const client = new Client({
      webSocketFactory: socketFactory,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setRtcStatus("connected");
        client.subscribe(`/topic/rtc/${roomId}`, async (frame) => {
          try {
            const msg = JSON.parse(frame.body) as RTCSignalMessage;
            if (!msg || msg.from === me.id) return;
            await handleRtcSignalRef.current(msg);
          } catch (e) {
            console.error("RTC message parsing failed", e);
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

    setTimeout(() => setRtcStatus("connecting"), 0);
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

      // Negotiation
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendRtc("offer", { sdp: offer.sdp });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      alert("Camera access failed: " + message);
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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

  return {
    camOn,
    micOn,
    rtcStatus,
    localVideoRef,
    remoteVideoRef,
    startCamera,
    stopCamera,
    toggleMic,
  };
}
