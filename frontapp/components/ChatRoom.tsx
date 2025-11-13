// =============================
// components/ChatRoom.tsx — 채팅방 UI (실시간)
// =============================
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useStomp } from "@/hooks/useStomp";


export default function ChatRoom({ roomId, me }: { roomId: number; me: { id: number; name: string } }) {
const { connected, messages, send } = useStomp(roomId);
const [input, setInput] = useState("");
const logRef = useRef<HTMLDivElement | null>(null);


useEffect(() => {
logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
}, [messages]);


return (
<div style={{display:"grid", gridTemplateRows:"1fr auto", height:"calc(100dvh - 120px)", border:"1px solid #eee", borderRadius:12}}>
<div ref={logRef} style={{padding:12, overflowY:"auto"}}>
{!connected && <div style={{color:"#999"}}>연결 중…</div>}
{messages.map((m, i) => (
<div key={i} style={{display:"grid", gap:2, marginBottom:8}}>
<b>{m.senderName}</b>
<div>{m.content}</div>
{m.createdAt && <small style={{color:"#999"}}>{new Date(m.createdAt).toLocaleString()}</small>}
</div>
))}
</div>
<form
onSubmit={(e) => { e.preventDefault(); if (!input.trim()) return; send({ senderId: me.id, content: input.trim() }); setInput(""); }}
style={{display:"flex", gap:8, padding:12, borderTop:"1px solid #eee"}}
>
<input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="메시지를 입력하세요" style={{flex:1, padding:"10px 12px", border:"1px solid #ddd", borderRadius:10}}/>
<button type="submit" style={{padding:"10px 16px", borderRadius:10}}>전송</button>
</form>
</div>
);
}