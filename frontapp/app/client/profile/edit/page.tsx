"use client";

import { resolveProfileImageUrl } from "@/lib/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const DEFAULT_PROFILE_IMG = "/image/픽토그램.png";
type ThemeMode = "light" | "dark";
type TextSizeMode = "normal" | "large";
type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
};
declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeData) => void }) => void;
    };
  }
}
const normalizeBirthDate = (value?: string | null) => {
  if (!value) return "";
  if (value.length >= 10) {
    if (value.includes("T")) return value.split("T")[0];
    if (value.includes(" ")) return value.split(" ")[0];
  }
  return value;
};

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

export default function ClientProfileEditPage() {
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
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [textSize, setTextSize] = useState<TextSizeMode>("normal");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarInitial = useMemo(() => {
    if (name && name.trim().length > 0) return name.trim().slice(0, 1).toUpperCase();
    if (email) return email.trim().slice(0, 1).toUpperCase();
    return "?";
  }, [name, email]);

  useEffect(() => {
    setSupportsPushApi(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window,
    );
    if (typeof window === "undefined") return;
    const idStr = window.localStorage.getItem("userId");
    const role = window.localStorage.getItem("userRole");
    if (!idStr || role !== "CLIENT") {
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
        setBirthDate(normalizeBirthDate(data.birthDate));
        setGender(data.gender ?? "");
        setZipCode(data.zipCode ? String(data.zipCode) : "");
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

  const applyTheme = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (mode === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", mode);
    }
  }, []);

  const applyTextSize = useCallback((mode: TextSizeMode) => {
    setTextSize(mode);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const body = document.body;
      if (mode === "large") {
        root.classList.add("large-text");
        body?.classList.add("large-text");
      } else {
        root.classList.remove("large-text");
        body?.classList.remove("large-text");
      }
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("textSize", mode === "large" ? "large" : "normal");
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const saved =
      (typeof window !== "undefined" && window.localStorage.getItem("theme")) as ThemeMode | null;
    const savedText =
      (typeof window !== "undefined" && window.localStorage.getItem("textSize")) as
        | "large"
        | "normal"
        | null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");
    applyTheme(initial);
    applyTextSize(savedText === "large" ? "large" : "normal");
  }, [applyTheme, applyTextSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("daum-postcode-script")) return;
    const script = document.createElement("script");
    script.id = "daum-postcode-script";
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleAddressSearch = () => {
    if (typeof window === "undefined" || !window.daum?.Postcode) {
      alert("주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        setZipCode(data.zonecode ?? "");
        const fullAddress = data.roadAddress || data.jibunAddress || "";
        setAddress(fullAddress);
      },
    }).open();
  };

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
      setBirthDate(normalizeBirthDate(data.birthDate));
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
          (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.ready);
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

  const toggleTheme = () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleTextSize = () => {
    applyTextSize(textSize === "large" ? "normal" : "large");
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
    <div className="min-h-screen bg-slate-50 px-3 py-6 dark:bg-slate-900 sm:px-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl bg-white p-4 shadow-lg dark:bg-slate-800 dark:text-slate-100 sm:p-8">
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
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-indigo-600">Client</p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {user?.name ? `${user.name}님` : "클라이언트 마이페이지"}
              </h1>
              <p className="text-sm text-slate-600">이름과 프로필 이미지를 변경할 수 있습니다.</p>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">기본 정보</h2>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">계정</span>
            </div>
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">이메일</span>
                <input
                  value={email}
                  readOnly
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">이름</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
                    placeholder="이름을 입력하세요"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">생년월일</span>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${
                      birthDate ? "text-slate-900" : "text-slate-400"
                    } dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100`}
                    placeholder="YYYY-MM-DD"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">성별</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <option value="">선택해주세요</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">주소</h2>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">연락처</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200 sm:col-span-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">우편번호</span>
                <input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
                  placeholder="우편번호"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">주소</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
                  placeholder="주소"
                />
              </label>
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  주소 검색 (다음)
                </button>
              </div>
              <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200 sm:col-span-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">상세 주소</span>
                <input
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
                  placeholder="동/호 등"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              현재 주소: {zipCode || "미등록"} / {address || "미등록"} {detailAddress || ""}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">환경 설정</h2>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">보기·알림</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">모바일 푸시 알림</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">브라우저 푸시를 활성화하여 비상 알림을 받아보세요.</p>
                  {pushMessage && (
                    <p className={`mt-1 text-xs ${pushStatus === "error" ? "text-rose-500" : "text-emerald-400"}`}>
                      {pushMessage}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleTogglePush()}
                  disabled={pushStatus === "requesting"}
                  className={`relative inline-flex h-9 w-24 items-center justify-between rounded-full border px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    pushEnabled
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-slate-200 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  } ${pushStatus === "requesting" ? "opacity-60" : "hover:shadow-sm"}`}
                  aria-pressed={pushEnabled}
                  aria-label="모바일 푸시 알림 설정"
                >
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">🔔</span>
                    <span>{pushEnabled ? "ON" : "OFF"}</span>
                  </span>
                  <span
                    className={`absolute left-1 top-1 h-7 w-7 rounded-full bg-white shadow transition ${
                      pushEnabled ? "translate-x-12 bg-indigo-50" : "translate-x-0"
                    }`}
                  />
                  <span className="sr-only">{pushEnabled ? "푸시 켜짐" : "푸시 꺼짐"}</span>
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">다크 모드</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    인터페이스 색상을 {theme === "dark" ? "밝게" : "어둡게"} 전환합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`relative inline-flex h-9 w-24 items-center justify-between rounded-full border px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    theme === "dark"
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-slate-300 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                  aria-pressed={theme === "dark"}
                  aria-label="다크 모드 토글"
                >
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">{theme === "dark" ? "🌙" : "☀️"}</span>
                    <span>{theme === "dark" ? "Dark" : "Light"}</span>
                  </span>
                  <span
                    className={`absolute left-1 top-1 h-7 w-7 rounded-full bg-white shadow transition ${
                      theme === "dark" ? "translate-x-12 bg-indigo-50" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">큰 글씨 모드</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">가독성을 위해 텍스트 크기를 확대합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTextSize}
                  className={`relative inline-flex h-9 w-24 items-center justify-between rounded-full border px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    textSize === "large"
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-slate-300 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  }`}
                  aria-pressed={textSize === "large"}
                  aria-label="큰 글씨 모드 토글"
                >
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true">A</span>
                    <span>{textSize === "large" ? "크게" : "보통"}</span>
                  </span>
                  <span
                    className={`absolute left-1 top-1 h-7 w-7 rounded-full bg-white shadow transition ${
                      textSize === "large" ? "translate-x-12 bg-indigo-50" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
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
