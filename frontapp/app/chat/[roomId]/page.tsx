// =============================
// app/chat/[roomId]/page.tsx — 채팅방 화면
// =============================
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import ChatRoom from "@/components/ChatRoom";


export default function ChatRoomPage() {
const params = useParams();
const roomId = Number(params.roomId);
const [initial, setInitial] = useState<{ id: number; senderId: number; senderName: string; content: string; createdAt: string }[]>([]);
const [me] = useState<{ id: number; name: string }>({ id: 999, name: "Me" }); // TODO: 로그인 세션 연동
const [err, setErr] = useState<string | null>(null);


useEffect(() => {
(async () => {
try {
const data = await api.getRoomHistory(roomId);
// 초기 이력은 ChatRoom 내부 실시간 목록과 시각적으로만 합칩니다 (간단 처리)
setInitial(data.messages as any);
} catch (e: any) { setErr(e.message); }
})();
}, [roomId]);


return (
<div style={{display:"grid", gap:12}}>
<h1>채팅방 #{roomId}</h1>
{err && <p style={{color:"crimson"}}>{err}</p>}
{/* 초기 메시지 출력 */}
{!!initial?.length && (
<div style={{border:"1px dashed #ddd", padding:10, borderRadius:8}}>
<b>이전 대화</b>
<div style={{maxHeight:200, overflow:"auto", marginTop:8}}>
{initial.map(m => (
<div key={m.id} style={{marginBottom:8}}>
<b>{m.senderName}</b>
<div>{m.content}</div>
<small style={{color:"#888"}}>{new Date(m.createdAt).toLocaleString()}</small>
</div>
))}
</div>
</div>
)}
<ChatRoom roomId={roomId} me={me} />
</div>
);
}