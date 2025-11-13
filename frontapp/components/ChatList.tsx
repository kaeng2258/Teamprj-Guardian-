// =============================
// components/ChatList.tsx — 채팅방 목록
// =============================
"use client";
import React from "react";
import Link from "next/link";


export default function ChatList({ rooms }: { rooms: { id: number; name: string; lastMessage?: string; updatedAt?: string }[] }) {
if (!rooms?.length) return <p>채팅방이 없습니다.</p>;
return (
<ul style={{listStyle:"none", padding:0, margin:0, display:"grid", gap:8}}>
{rooms.map(r => (
<li key={r.id} style={{border:"1px solid #eee", borderRadius:12, padding:12}}>
<Link href={`/chat/${r.id}`} style={{display:"grid", gap:4}}>
<b>{r.name}</b>
{r.lastMessage && <span style={{color:"#666"}}>{r.lastMessage}</span>}
{r.updatedAt && <small style={{color:"#888"}}>{new Date(r.updatedAt).toLocaleString()}</small>}
</Link>
</li>
))}
</ul>
);
}