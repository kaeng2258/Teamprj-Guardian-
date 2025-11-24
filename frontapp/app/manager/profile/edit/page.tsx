"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type UserSummary = {
  id: number;
  email: string;
  name: string;
  profileImageUrl?: string | null;
};

export default function ManagerProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const avatarInitial = useMemo(() => {
    if (name && name.trim().length > 0) return name.trim().slice(0, 1).toUpperCase();
    if (email) return email.trim().slice(0, 1).toUpperCase();
    return "M";
  }, [name, email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const idStr = window.localStorage.getItem("userId");
    const role = window.localStorage.getItem("userRole");
    if (!idStr || role !== "MANAGER") {
      router.replace("/");
      return;
    }
    const id = Number(idStr);
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${id}`);
        if (!res.ok) {
          throw new Error("내 정보를 불러오지 못했습니다.");
        }
        const data: UserSummary = await res.json();
        setUser(data);
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setProfileImageUrl(data.profileImageUrl ?? "");
      } catch (e: any) {
        setError(e instanceof Error ? e.message : "내 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), profileImageUrl, status: null }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "저장에 실패했습니다.");
      }
      const data: UserSummary = await res.json();
      setUser(data);
      setProfileImageUrl(data.profileImageUrl ?? "");
      setMessage("개인정보가 저장되었습니다.");
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File | null) => {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/profile-image`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "이미지 업로드 실패");
      }
      const data: UserSummary = await res.json();
      setProfileImageUrl(data.profileImageUrl ?? "");
      setMessage("프로필 이미지가 업데이트되었습니다.");
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "이미지 업로드 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg bg-white px-6 py-8 shadow-sm">
          <p className="text-gray-600">내 정보를 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-white p-4 shadow-lg sm:p-8">
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-200 bg-indigo-50 text-lg font-semibold text-indigo-700">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="프로필 이미지" className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarInitial}</span>
                )}
              </div>
              <label className="absolute -left-1 -bottom-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 shadow-sm ring-4 ring-white transition hover:bg-slate-300">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleUpload(file);
                    event.target.value = "";
                  }}
                />
                Img
              </label>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">개인정보 수정</h1>
              <p className="text-sm text-slate-600">이름과 프로필 이미지를 변경할 수 있습니다.</p>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span>이메일</span>
            <input
              value={email}
              readOnly
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span>이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="이름을 입력하세요"
            />
          </label>
        </div>

        {(message || error) && (
          <p className={`text-sm ${error ? "text-rose-600" : "text-emerald-700"}`}>{error || message}</p>
        )}

        <div className="flex justify-between gap-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-900"
            type="button"
            onClick={() => router.back()}
          >
            이전 페이지로
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={saving || !user}
            onClick={handleSave}
            type="button"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </main>
    </div>
  );
}
