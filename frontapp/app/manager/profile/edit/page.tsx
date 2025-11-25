"use client";

import { resolveProfileImageUrl } from "@/lib/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const DEFAULT_PROFILE_IMG = "/image/픽토그램.png";

type UserSummary = {
  id: number;
  email: string;
  name: string;
  birthDate?: string | null;
  gender?: string | null;
  zipCode?: string | null;
  address?: string | null;
  detailAddress?: string | null;
  profileImageUrl?: string | null;
};

export default function ManagerProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string>(DEFAULT_PROFILE_IMG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [supportsPushApi, setSupportsPushApi] = useState(false);
  const [pushServiceEnabled, setPushServiceEnabled] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const [pushStatus, setPushStatus] = useState<"idle" | "requesting" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarInitial = useMemo(() => {
    if (name && name.trim().length > 0) return name.trim().slice(0, 1).toUpperCase();
    if (email) return email.trim().slice(0, 1).toUpperCase();
    return "M";
  }, [name, email]);

  useEffect(() => {
    setSupportsPushApi(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
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
        setBirthDate(data.birthDate ?? "");
        setGender(data.gender ?? "");
        setZipCode(data.zipCode ?? "");
        setAddress(data.address ?? "");
        setDetailAddress(data.detailAddress ?? "");
        setProfileImageUrl(resolveProfileImageUrl(data.profileImageUrl) || DEFAULT_PROFILE_IMG);
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
        body: JSON.stringify({
          name: name.trim(),
          birthDate: birthDate || null,
          gender: gender || null,
          zipCode: zipCode || null,
          address: address || null,
          detailAddress: detailAddress || null,
          profileImageUrl: profileImageUrl || DEFAULT_PROFILE_IMG,
          status: null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "저장에 실패했습니다.");
      }
      const data: UserSummary = await res.json();
      setUser(data);
      setProfileImageUrl(resolveProfileImageUrl(data.profileImageUrl) || DEFAULT_PROFILE_IMG);
      setMessage("개인정보가 저장되었습니다.");
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetImage = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          birthDate: birthDate || null,
          gender: gender || null,
          zipCode: zipCode || null,
          address: address || null,
          detailAddress: detailAddress || null,
          profileImageUrl: DEFAULT_PROFILE_IMG,
          status: null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "기본 이미지로 변경에 실패했습니다.");
      }
      const data: UserSummary = await res.json();
      setUser(data);
      setProfileImageUrl(resolveProfileImageUrl(data.profileImageUrl) || DEFAULT_PROFILE_IMG);
      setMessage("기본 이미지로 변경되었습니다.");
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "기본 이미지로 변경에 실패했습니다.");
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
      setProfileImageUrl(resolveProfileImageUrl(data.profileImageUrl) || DEFAULT_PROFILE_IMG);
      setMessage("프로필 이미지가 업데이트되었습니다.");
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "이미지 업로드 실패");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/push/config`);
        if (!res.ok) return;
        const data: { enabled?: boolean; publicKey?: string } = await res.json();
        if (cancelled) return;
        setPushServiceEnabled(Boolean(data.enabled));
        setVapidPublicKey(data.publicKey ?? "");
      } catch {
        // ignore
      }
    };
    void fetchConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const checkExistingSubscription = async () => {
      if (typeof window === "undefined" || !supportsPushApi) return;
      try {
        const reg =
          (await navigator.serviceWorker.getRegistration()) ??
          (await navigator.serviceWorker.ready);
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setPushEnabled(true);
          setPushMessage("이미 푸시 알림이 활성화되어 있습니다.");
        }
      } catch {
        // ignore
      }
    };
    void checkExistingSubscription();
  }, [supportsPushApi]);

  const handleEnablePush = useCallback(async () => {
    if (!supportsPushApi || !pushServiceEnabled || !vapidPublicKey || !user?.id) {
      setPushMessage("현재 환경에서 푸시를 사용할 수 없습니다.");
      setPushStatus("error");
      return;
    }

    const convertKey = (key: string) => {
      const padding = "=".repeat((4 - (key.length % 4)) % 4);
      const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    try {
      setPushStatus("requesting");
      setPushMessage("");

      const existingRegistration = await navigator.serviceWorker.getRegistration();
      const registration =
        existingRegistration ?? (await navigator.serviceWorker.register("/sw.js"));
      const readyRegistration = registration.active ? registration : await navigator.serviceWorker.ready;

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("알림 권한을 허용해야 푸시 알림을 받을 수 있습니다.");
        }
      } else if (Notification.permission === "denied") {
        throw new Error("브라우저 설정에서 알림 권한이 차단되어 있습니다.");
      }

      const existingSubscription = await readyRegistration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertKey(vapidPublicKey),
        }));

      const json = subscription.toJSON() as {
        endpoint?: string;
        expirationTime?: number | null;
        keys?: { auth?: string; p256dh?: string };
      };
      const keys = json.keys ?? {};
      if (!keys.auth || !keys.p256dh) {
        throw new Error("브라우저가 푸시 키 정보를 제공하지 못했습니다.");
      }

      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/push/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          expirationTime: subscription.expirationTime,
          keys: { auth: keys.auth, p256dh: keys.p256dh },
        }),
      });
      if (!res.ok) {
        throw new Error("푸시 구독 정보를 저장하지 못했습니다.");
      }
      setPushEnabled(true);
      setPushStatus("idle");
      setPushMessage("모바일 푸시 알림이 활성화되었습니다.");
    } catch (e: any) {
      setPushStatus("error");
      setPushMessage(e instanceof Error ? e.message : "푸시 알림을 설정하지 못했습니다.");
    }
  }, [API_BASE_URL, pushServiceEnabled, supportsPushApi, vapidPublicKey, user?.id]);

  const handleTogglePush = useCallback(async () => {
    if (pushEnabled) {
      setPushEnabled(false);
      setPushMessage("푸시 구독 해제를 지원하지 않습니다. 브라우저 설정에서 알림을 꺼주세요.");
      return;
    }
    await handleEnablePush();
  }, [handleEnablePush, pushEnabled]);

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
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-200 bg-indigo-50 text-lg font-semibold text-indigo-700">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="프로필 이미지" className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarInitial}</span>
                )}
              </div>
              <button
                className="absolute -left-1 -bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 shadow-sm ring-4 ring-white transition hover:bg-slate-300"
                type="button"
                onClick={() => setImageMenuOpen((prev) => !prev)}
              >
                Img
              </button>
              {imageMenuOpen && (
                <div className="absolute left-0 top-full z-10 mt-2 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                  <button
                    className="block w-full rounded px-2 py-1 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50"
                    type="button"
                    onClick={() => {
                      setImageMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    새 이미지 업로드
                  </button>
                  <button
                    className="mt-1 block w-full rounded px-2 py-1 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50"
                    type="button"
                    onClick={() => {
                      setImageMenuOpen(false);
                      void handleResetImage();
                    }}
                    disabled={saving || !user}
                  >
                    기본 이미지로 변경
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleUpload(file);
                  event.target.value = "";
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-indigo-600">Manager</p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {user?.name ? `${user.name} 매니저` : "매니저"}
              </h1>
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
          <label className="flex flex-col gap-2 text-sm text-slate-700">
            <span>생년월일</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="YYYY-MM-DD"
            />
          </label>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">모바일 푸시 알림</p>
              <p className="text-xs text-slate-500">브라우저 푸시를 활성화하여 비상 알림을 받아보세요.</p>
              {pushMessage && (
                <p className={`mt-1 text-xs ${pushStatus === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                  {pushMessage}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleTogglePush()}
              disabled={pushStatus === "requesting"}
              className={`relative inline-flex h-7 w-14 items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                pushEnabled ? "border-indigo-500 bg-indigo-600" : "border-slate-200 bg-slate-200"
              } ${pushStatus === "requesting" ? "opacity-60" : "hover:shadow-sm"}`}
              aria-pressed={pushEnabled}
              aria-label="모바일 푸시 알림 설정"
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                  pushEnabled ? "translate-x-7 bg-indigo-50" : "translate-x-0"
                }`}
              />
              <span className="sr-only">{pushEnabled ? "푸시 켜짐" : "푸시 꺼짐"}</span>
            </button>
          </div>
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
