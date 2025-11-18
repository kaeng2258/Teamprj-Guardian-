// frontapp/components/MyChatRooms.tsx
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:8081";

type ChatThread = {
  roomId: number;
  clientId: number;
  providerId: number;
  clientName?: string | null;
  providerName?: string | null;
  lastMessageSnippet?: string | null;
  lastMessageAt?: string | null;
  readByClient?: boolean;
  readByProvider?: boolean;
};

type MyChatRoomsProps = {
  role: "CLIENT" | "PROVIDER";
  userId?: number | null;
  providerProfileId?: number | null;
  refreshToken?: number;
};

export default function MyChatRooms({
  role,
  userId,
  providerProfileId,
  refreshToken,
}: MyChatRoomsProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const effectiveUserId =
      role === "PROVIDER" ? providerProfileId ?? userId ?? null : userId ?? null;

    if (!effectiveUserId) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/chat/threads?userId=${encodeURIComponent(
            String(effectiveUserId)
          )}`
        );
        if (!res.ok) {
          throw new Error("채팅방 목록을 불러오지 못했습니다.");
        }
        const data: ChatThread[] = await res.json();

        if (!active) return;

        // 내 역할에 맞는 방만 필터링
        const filtered =
          role === "PROVIDER"
            ? data.filter((t) => t.providerId === effectiveUserId)
            : data.filter((t) => t.clientId === effectiveUserId);

        setThreads(filtered);
      } catch (e: any) {
        if (!active) return;
        setErr(
          e instanceof Error
            ? e.message
            : "채팅방 목록을 불러오지 못했습니다."
        );
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [role, userId, providerProfileId, refreshToken]);

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">내 채팅방</h2>
        <p className="mt-1 text-sm text-emerald-800">
          현재 배정된 클라이언트와의 채팅방입니다.
        </p>
      </div>

      {loading && (
        <p className="mt-3 text-sm text-slate-600">
          채팅방을 불러오는 중입니다...
        </p>
      )}
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      {!loading && !err && threads.length === 0 && (
        <p className="mt-3 text-sm text-slate-600">
          현재 개설된 채팅방이 없습니다.
        </p>
      )}

      <ul className="mt-4 grid gap-3">
        {threads.map((t) => {
          const roomId = t.roomId;
          // PROVIDER → 상대는 clientName, CLIENT → providerName
          const otherName =
            role === "PROVIDER" ? t.clientName : t.providerName;
          const displayName = otherName && otherName.trim().length > 0
            ? otherName
            : "이름 미등록";

          const lastTime = t.lastMessageAt ?? undefined;
          const lastSnippet = t.lastMessageSnippet ?? "";
          const unread =
            role === "PROVIDER"
              ? t.readByProvider === false
              : t.readByClient === false;

          return (
            <li
              key={roomId}
              className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <Link href={`/chat/${roomId}`} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                      {displayName.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500">
                        방 번호 #{roomId}
                      </p>
                    </div>
                  </div>
                  {lastTime && (
                    <small className="text-xs text-slate-500">
                      {new Date(lastTime).toLocaleString()}
                    </small>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-xs text-slate-600">
                    {lastSnippet || "최근 메시지가 없습니다."}
                  </p>
                  {unread && (
                    <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      NEW
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
