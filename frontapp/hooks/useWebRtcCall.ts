import { useState, useRef, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_ENDPOINT = (() => {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) {
    return env.startsWith("http") ? env : env.replace(/^ws/, "http"); // ws → http, wss → https
  }
  if (typeof window === "undefined") return "/ws";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.host}/ws`;
})();

interface UseWebRtcCallProps {
  roomId: number;
  me: { id: number; name: string };
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

  const sendRtc = useCallback((type: string, payload: any = {}) => {
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

  const handleRtcSignal = useCallback(async (msg: any) => {
    const pc = ensurePc();

    if (msg.type === "offer" && msg.sdp) {
      await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendRtc("answer", { sdp: answer.sdp });
    } else if (msg.type === "answer" && msg.sdp) {
      await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
    } else if (msg.type === "candidate" && msg.candidate) {
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
    } catch (e: any) {
      alert("Camera access failed: " + e.message);
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
