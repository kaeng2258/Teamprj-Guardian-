"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveProfileImageUrl } from "@/lib/image";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type ClientSummary = {
  clientId: number;
  name: string;
  email?: string | null;
  profileImageUrl?: string | null;
};

type ChatClientPickerProps = {
  managerId?: number | null;
  assignedClients?: ClientSummary[];
  onChatCreated?: () => void;
};

export function ChatClientPicker({
  managerId,
  assignedClients = [],
  onChatCreated,
}: ChatClientPickerProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [remoteResults, setRemoteResults] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState<number | null>(null);
  const defaultProfileImage =
    resolveProfileImageUrl("/image/픽토그램.png") || "/image/픽토그램.png";

  const getProfileImage = (url?: string | null) =>
    url && url.trim().length > 0
      ? resolveProfileImageUrl(url) || defaultProfileImage
      : defaultProfileImage;

  const normalizedAssigned = useMemo(
    () => assignedClients.map((c) => ({ ...c, name: c.name ?? "이름 미등록" })),
    [assignedClients],
  );

  const filteredLocal = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return normalizedAssigned;
    return normalizedAssigned.filter(
      (c) =>
        c.name.toLowerCase().includes(k) ||
        (c.email ?? "").toLowerCase().includes(k),
    );
  }, [keyword, normalizedAssigned]);

  const handleRemoteSearch = useCallback(async () => {
    if (!managerId) {
      setError("매니저 정보를 확인할 수 없습니다.");
      return;
    }
    const trimmed = keyword.trim();
    if (!trimmed) {
      setError("검색어를 입력하세요.");
      setRemoteResults([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/managers/${managerId}/clients/search?keyword=${encodeURIComponent(
          trimmed,
        )}&size=10`,
      );
      if (!res.ok) {
        throw new Error("검색 결과를 가져오지 못했습니다.");
      }
      const data: ClientSummary[] = await res.json();
      setRemoteResults(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 결과를 가져오지 못했습니다.");
      setRemoteResults([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, managerId]);

  const openChat = useCallback(
    async (clientId: number) => {
      if (!managerId) {
        setError("매니저 정보를 확인할 수 없습니다.");
        return;
      }
      setCreating(clientId);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, managerId }),
        });
        if (!res.ok) {
          throw new Error("채팅방을 만들지 못했습니다.");
        }
        const data: { roomId?: number } = await res.json();
        if (onChatCreated) onChatCreated();
        if (data.roomId) {
          router.push(`/chat/${data.roomId}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "채팅방을 만들지 못했습니다.");
      } finally {
        setCreating(null);
      }
    },
    [managerId, onChatCreated, router],
  );

  const renderList = (title: string, list: ClientSummary[]) => (
    <div className="rounded-xl border border-slate-100 bg-white/80 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <span className="text-xs font-semibold text-slate-500">{list.length}명</span>
      </div>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">결과가 없습니다.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {list.map((item) => (
            <li key={item.clientId} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                  <img
                    src={getProfileImage(item.profileImageUrl)}
                    alt={`${item.name} 프로필`}
                    className="h-full w-full object-cover"
                  />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600">{item.email || "이메일 미등록"}</p>
                </div>
              </div>
              <button
                type="button"
                className="self-start rounded-md border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void openChat(item.clientId)}
                disabled={creating === item.clientId}
              >
                {creating === item.clientId ? "연결 중..." : "채팅하기"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-white/70 p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-slate-900">클라이언트 찾기</h3>
        <p className="text-sm text-slate-600">검색 후 바로 채팅방을 개설합니다.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
          placeholder="이름 또는 이메일로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleRemoteSearch();
            }
          }}
        />
        <button
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          type="button"
          onClick={() => void handleRemoteSearch()}
          disabled={loading}
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {renderList("내 담당 클라이언트", filteredLocal)}

      {keyword.trim().length > 0 && renderList("검색 결과", remoteResults)}
    </section>
  );
}
