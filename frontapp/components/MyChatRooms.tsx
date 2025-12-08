// frontapp/components/MyChatRooms.tsx
"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolveProfileImageUrl } from "../lib/image";


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
  const effectiveUserId = React.useMemo(
    () => (role === "MANAGER" ? userId ?? managerProfileId ?? null : userId ?? null),
    [role, userId, managerProfileId],
  );
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profileImages, setProfileImages] = useState<Record<number, string>>({});
  const [leaving, setLeaving] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [bookmarksHydrated, setBookmarksHydrated] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const defaultProfileImage =
    resolveProfileImageUrl("/image/픽토그램.png") || "/image/픽토그램.png";
  const bookmarkKey = useMemo(
    () => (effectiveUserId ? `guardian.bookmarkedRooms.${role}.${String(effectiveUserId)}` : null),
    [effectiveUserId, role],
  );

  const getProfileImage = (url?: string | null) =>
    url && typeof url === "string" && url.trim().length > 0
      ? resolveProfileImageUrl(url) || defaultProfileImage
      : defaultProfileImage;

  const sortThreads = (list: ChatThread[], marks: number[]) => {
    const star = new Set(marks);
    return [...list].sort((a, b) => {
      const aStar = star.has(a.roomId) ? 1 : 0;
      const bStar = star.has(b.roomId) ? 1 : 0;
      if (aStar !== bStar) return bStar - aStar;
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  };

  const handleMarkThreadAsRead = useCallback(
    async (roomId: number) => {
      if (!effectiveUserId) return;
      try {
        await fetch(
          `${API_BASE_URL}/api/chat/rooms/${roomId}/read?userId=${encodeURIComponent(
            String(effectiveUserId),
          )}`,
          { method: "POST" },
        );
      } catch {
        // ignore read sync errors
      } finally {
        setThreads((prev) =>
          prev.map((t) =>
            t.roomId === roomId
              ? {
                  ...t,
                  readByManager: role === "MANAGER" ? true : t.readByManager,
                  readByClient: role === "CLIENT" ? true : t.readByClient,
                }
              : t,
          ),
        );
      }
    },
    [effectiveUserId, role],
  );

  useEffect(() => {
    if (!effectiveUserId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/chat/threads?userId=${encodeURIComponent(
            String(effectiveUserId),
          )}`,
        );
        if (!res.ok) {
          throw new Error("채팅 목록을 불러오지 못했습니다.");
        }
        const data: ChatThread[] = await res.json();
        if (!active) return;
        const filtered =
          role === "MANAGER"
            ? data.filter((t) => t.managerId === effectiveUserId)
            : data.filter((t) => t.clientId === effectiveUserId);
        setThreads(sortThreads(filtered, bookmarked));
      } catch (e) {
        if (!active) return;
        setErr(e instanceof Error ? e.message : "채팅 목록을 불러오지 못했습니다.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [role, userId, managerProfileId, refreshToken, effectiveUserId]);

  useEffect(() => {
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
          // ignore
        }
      }
    };
    void loadProfileImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, role]);

  useEffect(() => {
    if (!bookmarkKey) return;
    try {
      const raw = window.localStorage.getItem(bookmarkKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0);
          setBookmarked(cleaned);
          setThreads((prev) => sortThreads(prev, cleaned));
        }
      }
    } catch {
      // ignore
    } finally {
      setBookmarksHydrated(true);
    }
  }, [bookmarkKey]);

  useEffect(() => {
    if (!bookmarkKey || !bookmarksHydrated) return;
    try {
      window.localStorage.setItem(bookmarkKey, JSON.stringify(bookmarked));
    } catch {
      // ignore
    }
    setThreads((prev) => sortThreads(prev, bookmarked));
  }, [bookmarkKey, bookmarked, bookmarksHydrated]);

  const handleLeaveRoom = async (roomId: number) => {
    if (!effectiveUserId) {
      setActionError("사용자 정보를 확인할 수 없습니다.");
      return;
    }
    if (!window.confirm("이 채팅방에서 나가시겠습니까?")) return;
    setLeaving(roomId);
    setActionError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/chat/rooms/${roomId}?userId=${encodeURIComponent(
          String(effectiveUserId),
        )}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        throw new Error("채팅방에서 나갈 수 없습니다.");
      }
      setThreads((prev) => prev.filter((t) => t.roomId !== roomId));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "채팅방에서 나갈 수 없습니다.");
    } finally {
      setLeaving(null);
    }
  };

  const toggleBookmark = (roomId: number) => {
    if (!bookmarkKey) return;
    if (!bookmarksHydrated) return;
    setBookmarked((prev) => {
      const next = prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId];
      setThreads((current) => sortThreads(current, next));
      return next;
    });
  };

  const filteredThreads = useMemo(() => {
    if (role !== "CLIENT") return threads;
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return threads;
    return threads.filter((t) => {
      const name = t.managerName ?? "";
      const fields = [name, t.lastMessageSnippet ?? "", String(t.roomId ?? "")];
      return fields.some((field) => field.toLowerCase().includes(keyword));
    });
  }, [role, searchKeyword, threads]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50/70 p-6 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">내 채팅방</h2>
          <p className="mt-1 text-sm text-slate-600">
            현재 배정된 상대와의 대화를 한눈에 확인하세요.
          </p>
        </div>
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
          const otherName = role === "MANAGER" ? t.clientName : t.managerName;
          const displayName = otherName && otherName.trim().length > 0 ? otherName : "이름 미등록";
          const otherId = role === "MANAGER" ? t.clientId : t.managerId;
          const avatar =
            role === "MANAGER"
              ? getProfileImage(profileImages[otherId] ?? t.clientProfileImageUrl)
              : getProfileImage(profileImages[otherId] ?? t.managerProfileImageUrl);
          const lastTime = t.lastMessageAt ?? undefined;
          const lastSnippet = t.lastMessageSnippet ?? "";
          const unread = role === "MANAGER" ? t.readByManager === false : t.readByClient === false;

          return (
            <li
              key={roomId}
              className="group rounded-2xl border border-sky-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg"
            >
              <Link
                href={`/chat/${roomId}`}
                className="flex flex-col gap-2"
                onClick={() => void handleMarkThreadAsRead(roomId)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-100 bg-sky-50 text-sm font-semibold text-sky-700 shadow-inner">
                      <img
                        src={avatar}
                        alt={`${displayName} 프로필`}
                        className="h-full w-full object-cover"
                      />
                      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/80 ring-offset-1" />
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unread && (
                      <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        NEW
                      </span>
                    )}
                    <button
                      type="button"
                      className={`bookmark-star inline-flex h-7 w-7 items-center justify-center rounded-full border text-[13px] font-bold transition ${
                        bookmarked.includes(roomId)
                          ? "on border-lime-300 bg-lime-100 text-lime-700"
                          : "border-slate-200 bg-white text-slate-400 hover:border-lime-200 hover:text-lime-500"
                      }`}
                      title="상단에 고정하기"
                      aria-label={bookmarked.includes(roomId) ? "북마크 해제" : "북마크 추가"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleBookmark(roomId);
                      }}
                    >
                      ★
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="line-clamp-1 text-[13px] text-slate-700">
                      {lastSnippet || "최근 메시지가 없습니다."}
                    </p>
                    {lastTime && (
                      <small className="text-[11px] text-slate-500">
                        {new Date(lastTime).toLocaleString()}
                      </small>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`shrink-0 inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-semibold transition ${
                      leaving === roomId
                        ? "border-rose-300 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleLeaveRoom(roomId);
                    }}
                    disabled={leaving === roomId}
                  >
                    {leaving === roomId ? "나가는 중..." : "나가기"}
                  </button>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      <style jsx>{`
        .bookmark-star {
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }
        .bookmark-star:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
        }
        .bookmark-star.on {
          animation: bookmark-pop 0.45s ease;
          box-shadow: 0 6px 14px rgba(163, 230, 53, 0.25);
        }
        @keyframes bookmark-pop {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.18);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}
