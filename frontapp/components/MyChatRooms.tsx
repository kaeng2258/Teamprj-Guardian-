// =============================
// components/MyChatRooms.tsx — 내(클라이언트/프로바이더) 채팅방 목록 위젯
// =============================
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";


type Room = { id: number; name: string; lastMessage?: string; updatedAt?: string };


export default function MyChatRooms({ role, userId }: { role: "CLIENT" | "PROVIDER"; userId?: number | null }) {
const [rooms, setRooms] = useState<Room[]>([]);
const [loading, setLoading] = useState(false);
const [err, setErr] = useState<string | null>(null);


useEffect(() => {
if (!userId) return;
const load = async () => {
setLoading(true); setErr(null);
try {
const data = role === "CLIENT"
? await (api as any).listMyRoomsForClient(userId)
: await (api as any).listMyRoomsForProvider(userId);
setRooms(data.rooms);
} catch (e: any) { setErr(e.message); }
finally { setLoading(false); }
};
load();
}, [role, userId]);


return (
<section className="rounded-xl border border-slate-200 p-6">
<h2 className="text-xl font-semibold text-slate-900">내 채팅방</h2>
<p className="mt-1 text-sm text-slate-500">본인에게 배정된 채팅방만 표시됩니다.</p>
{loading && <p className="mt-3 text-sm text-slate-600">불러오는 중…</p>}
{err && <p className="mt-3 text-sm text-red-600">{err}</p>}
{!loading && !err && rooms.length === 0 && (
<p className="mt-3 text-sm text-slate-600">채팅방이 없습니다.</p>
)}
<ul className="mt-3 grid gap-3">
{rooms.map(r => (
<li key={r.id} className="rounded-lg border border-slate-200 p-3">
<Link href={`/chat/${r.id}`} className="block">
<div className="flex items-center justify-between">
<b className="text-slate-900">{r.name}</b>
{r.updatedAt && <small className="text-slate-500">{new Date(r.updatedAt).toLocaleString()}</small>}
</div>
{r.lastMessage && <p className="mt-1 line-clamp-1 text-sm text-slate-600">{r.lastMessage}</p>}
</Link>
</li>
))}
</ul>
</section>
);
}