// =============================
// app/chat/page.tsx — 채팅 목록 + 필터
// =============================
"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ProviderClientPicker from "@/components/ProviderClientPicker";
import ChatList from "@/components/ChatList";


// ⚠️ providers/clients 목록은 실제 백엔드 엔드포인트로 교체하세요.
const MOCK_PROVIDERS = [ { id: 1, label: "간호사A" }, { id: 2, label: "의사B" } ];
const MOCK_CLIENTS = [ { id: 11, label: "환자 홍길동" }, { id: 12, label: "환자 김철수" } ];


export default function ChatIndexPage() {
const [filters, setFilters] = useState<{providerId?: number; clientId?: number}>({});
const [rooms, setRooms] = useState<{ id: number; name: string; lastMessage?: string; updatedAt?: string }[]>([]);
const [loading, setLoading] = useState(false);
const [err, setErr] = useState<string | null>(null);


const load = async () => {
setLoading(true); setErr(null);
try {
const data = await api.listRooms(filters);
setRooms(data.rooms);
} catch (e: any) {
setErr(e.message);
} finally {
setLoading(false);
}
};


useEffect(() => { load(); }, [filters]);


return (
<div style={{display:"grid", gap:16}}>
<h1>채팅방 목록</h1>
<ProviderClientPicker providers={MOCK_PROVIDERS} clients={MOCK_CLIENTS} onChange={setFilters} />
<div>
<button onClick={load}>새로고침</button>
</div>
{loading && <p>불러오는 중…</p>}
{err && <p style={{color:"crimson"}}>{err}</p>}
<ChatList rooms={rooms} />
</div>
);
}