// components/ChatList.tsx
"use client";
import React from "react";
import Link from "next/link";

type Room = {
  id: number;
  name: string;
  lastMessage?: string;
  updatedAt?: string;
};

export default function ChatList({ rooms }: { rooms: Room[] }) {
  if (!rooms?.length)
    return <p className="text-sm text-slate-600">채팅방이 없습니다.</p>;

  return (
    <ul className="grid gap-3">
      {rooms.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-emerald-400 hover:bg-emerald-50"
        >
          <Link href={`/chat/${r.id}`} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              {/* 🔥 글씨 검정색 계열 */}
              <span className="text-sm font-semibold text-slate-900">
                {r.name}
              </span>
              {r.updatedAt && (
                <small className="text-xs text-slate-500">
                  {new Date(r.updatedAt).toLocaleString()}
                </small>
              )}
            </div>
            {r.lastMessage && (
              <p className="line-clamp-1 text-xs text-slate-600">
                {r.lastMessage}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
