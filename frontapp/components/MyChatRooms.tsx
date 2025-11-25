// frontapp/components/MyChatRooms.tsx
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { resolveProfileImageUrl } from "@/lib/image";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type ChatThread = {
  roomId: number;
  clientId: number;
  managerId: number;
  clientName?: string | null;
  managerName?: string | null;
  clientProfileImageUrl?: string | null;
  managerProfileImageUrl?: string | null;
  lastMessageSnippet?: string | null;
  lastMessageAt?: string | null;
  readByClient?: boolean;
  readByManager?: boolean;
};

type MyChatRoomsProps = {
  role: "CLIENT" | "MANAGER";
  userId?: number | null;
  managerProfileId?: number | null;
  refreshToken?: number;
};

export default function MyChatRooms({
  role,
  userId,
  managerProfileId,
  refreshToken,
}: MyChatRoomsProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<Record<number, string>>({});
  const defaultProfileImage =
    resolveProfileImageUrl("/image/픽토그램.png") || "/image/픽토그램.png";

  const getProfileImage = (url?: string | null) =>
    url && typeof url === "string" && url.trim().length > 0
      ? resolveProfileImageUrl(url) || defaultProfileImage
      : defaultProfileImage;

  useEffect(() => {
    const effectiveUserId =
      role === "MANAGER" ? managerProfileId ?? userId ?? null : userId ?? null;

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
          role === "MANAGER"
            ? data.filter((t) => t.managerId === effectiveUserId)
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
  }, [role, userId, managerProfileId, refreshToken]);

  useEffect(() => {
    // 다른 참여자의 프로필 이미지를 추가로 로드
    const loadProfileImages = async () => {
      const targets = threads
        .map((t) => (role === "MANAGER" ? t.clientId : t.managerId))
        .filter((id) => id && !profileImages[id]);
      if (targets.length === 0) return;

      for (const id of targets) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
          if (!res.ok) continue;
          const detail: { profileImageUrl?: string | null } = await res.json();
          setProfileImages((prev) => ({
            ...prev,
            [id]: getProfileImage(detail.profileImageUrl),
          }));
        } catch {
          // ignore fetch errors
        }
      }
    };
    void loadProfileImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, role]);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-sky-200 bg-sky-50/70 p-6">
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
          // MANAGER → 상대는 clientName, CLIENT → managerName
          const otherName =
            role === "MANAGER" ? t.clientName : t.managerName;
          const displayName = otherName && otherName.trim().length > 0
            ? otherName
            : "이름 미등록";
          const otherId = role === "MANAGER" ? t.clientId : t.managerId;
          const avatar =
            role === "MANAGER"
              ? getProfileImage(profileImages[otherId] ?? t.clientProfileImageUrl)
              : getProfileImage(profileImages[otherId] ?? t.managerProfileImageUrl);

          const lastTime = t.lastMessageAt ?? undefined;
          const lastSnippet = t.lastMessageSnippet ?? "";
          const unread =
            role === "MANAGER"
              ? t.readByManager === false
              : t.readByClient === false;

          return (
            <li
              key={roomId}
              className="rounded-lg border border-sky-100 bg-white p-3 shadow-sm transition hover:border-sky-300 hover:shadow-md"
            >
              <Link href={`/chat/${roomId}`} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-100 bg-sky-50 text-sm font-semibold text-sky-700">
                      <img
                        src={avatar}
                        alt={`${displayName} 프로필`}
                        className="h-full w-full object-cover"
                      />
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
                    <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
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
