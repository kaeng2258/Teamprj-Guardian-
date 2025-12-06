"use client";

import { resolveProfileImageUrl } from "@/lib/image";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const DEFAULT_PROFILE_IMG = "/image/픽토그램.png";
type ThemeMode = "light" | "dark";
type TextSizeMode = "normal" | "large";
type IconProps = { className?: string };

const normalizeBirthDate = (value?: string | null) => {
  if (!value) return "";
  if (value.length >= 10) {
    if (value.includes("T")) return value.split("T")[0];
    if (value.includes(" ")) return value.split(" ")[0];
  }
  return value;
};

const parsePhoneParts = (value?: string | null): [string, string, string] => {
  if (!value) return ["", "", ""];
  const parts = value.split("-");
  return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""];
};

const extractLoginErrorMessage = async (
  res: Response,
  fallback = "비밀번호가 올바르지 않습니다.",
): Promise<string> => {
  try {
    const data = (await res.clone().json()) as { message?: string };
    if (data?.message && typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
  } catch {
    /* ignore */
  }
  try {
    const text = (await res.text()).trim();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed?.message && typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      /* ignore */
    }
    if (text.startsWith("{") && text.endsWith("}")) return fallback;
    return text;
  } catch {
    return fallback;
  }
  return fallback;
};

type UserSummary = {
  id: number;
  email: string;
  name: string;
  birthDate?: string | null;
  gender?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  address?: string | null;
  detailAddress?: string | null;
  profileImageUrl?: string | null;
};

const BellIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6 9a6 6 0 1112 0v3.5l1.4 2.8a1 1 0 01-.9 1.5H5.5a1 1 0 01-.9-1.5L6 12.5V9z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 18a2 2 0 004 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ThemeIcon = ({ mode, className = "h-4 w-4" }: { mode: ThemeMode; className?: string }) =>
  mode === "dark" ? (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1.4-1.4M20.4 20.4 19 19M5 19l-1.4 1.4M20.4 3.6 19 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );

const TextSizeIcon = ({ large, className = "h-4 w-4" }: { large: boolean; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4.5 17h7M8 17V7M8 7H4.8M8 7h3.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 15h5M17 15V9.5M17 9.5h-2.3M17 9.5h2.3"
      stroke="currentColor"
      strokeWidth={large ? "2" : "1.4"}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={large ? 1 : 0.9}
    />
  </svg>
);

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
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [supportsPushApi, setSupportsPushApi] = useState(false);
  const [pushServiceEnabled, setPushServiceEnabled] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const [pushStatus, setPushStatus] = useState<"idle" | "requesting" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [profileLocked, setProfileLocked] = useState(true);
  const [unlockModalOpen, setUnlockModalOpen] = useState(true);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [textSize, setTextSize] = useState<TextSizeMode>("normal");
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
        const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });
        if (!res.ok) {
          throw new Error("내 정보를 불러오지 못했습니다.");
        }
        const data: UserSummary = await res.json();
        setUser(data);
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setBirthDate(normalizeBirthDate(data.birthDate));
        setGender(data.gender ?? "");
        const [p1, p2, p3] = parsePhoneParts(data.phone);
        setPhone1(p1);
        setPhone2(p2);
        setPhone3(p3);
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

  const authHeaders = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const token = window.localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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
    if (
      !phone1 ||
      !phone2 ||
      !phone3 ||
      phone2.length < 4 ||
      phone3.length < 4
    ) {
      setError("연락처를 모두 입력해주세요.");
      return;
    }
    if (!currentPassword.trim()) {
      setError("비밀번호를 입력해야 개인정보를 수정할 수 있습니다.");
      return;
    }
    const phone = [phone1, phone2, phone3].join("-");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          name: name.trim(),
          birthDate: birthDate || null,
          gender: gender || null,
          phone,
          zipCode: zipCode || null,
          address: address || null,
          detailAddress: detailAddress || null,
          profileImageUrl: profileImageUrl || DEFAULT_PROFILE_IMG,
          status: null,
          currentPassword: currentPassword.trim(),
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
      const [np1, np2, np3] = parsePhoneParts(data.phone);
      setPhone1(np1);
      setPhone2(np2);
      setPhone3(np3);
      setMessage("개인정보가 저장되었습니다.");
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetImage = async () => {
    if (!user) return;
    if (!currentPassword.trim()) {
      setError("비밀번호를 입력해야 개인정보를 수정할 수 있습니다.");
      return;
    }
    if (
      !phone1 ||
      !phone2 ||
      !phone3 ||
      phone2.length < 4 ||
      phone3.length < 4
    ) {
      setError("연락처를 모두 입력해주세요.");
      return;
    }
    const phone = [phone1, phone2, phone3].join("-");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          name: name.trim(),
          birthDate: birthDate || null,
          gender: gender || null,
          phone,
          zipCode: zipCode || null,
          address: address || null,
          detailAddress: detailAddress || null,
          profileImageUrl: DEFAULT_PROFILE_IMG,
          status: null,
          currentPassword: currentPassword.trim(),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "기본 이미지로 변경에 실패했습니다.");
      }
      const data: UserSummary = await res.json();
      setUser(data);
      setProfileImageUrl(resolveProfileImageUrl(data.profileImageUrl) || DEFAULT_PROFILE_IMG);
      const [np1, np2, np3] = parsePhoneParts(data.phone);
      setPhone1(np1);
      setPhone2(np2);
      setPhone3(np3);
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
        credentials: "include",
        headers: {
          ...authHeaders(),
        },
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
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
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

  const handleUnlockProfile = async () => {
    if (!email || !unlockPassword.trim()) {
      setUnlockError("비밀번호를 입력해주세요.");
      return;
    }
    setUnlocking(true);
    setUnlockError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: unlockPassword }),
      });
      if (!res.ok) {
        const message = await extractLoginErrorMessage(res);
        throw new Error(message);
      }
      type LoginPayload = {
        userId: number;
        role: string;
        accessToken: string;
        refreshToken: string;
        redirectPath?: string;
      };
      const payload: LoginPayload = await res.json();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("accessToken", payload.accessToken);
        window.localStorage.setItem("refreshToken", payload.refreshToken);
        window.localStorage.setItem("userRole", payload.role);
        window.localStorage.setItem("userId", String(payload.userId));
        window.localStorage.setItem("userEmail", email);
      }
      setCurrentPassword(unlockPassword);
      setProfileLocked(false);
      setUnlockModalOpen(false);
      setUnlockPassword("");
    } catch (e: any) {
      setUnlockError(e instanceof Error ? e.message : "비밀번호가 올바르지 않습니다.");
    } finally {
      setUnlocking(false);
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
    <>
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
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-indigo-600">Manager</p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {user?.name ? `${user.name} 매니저` : "매니저"}
              </h1>
              <p className="text-sm text-slate-600">이름과 프로필 이미지를 변경할 수 있습니다.</p>
            </div>
            <button
              className="ml-auto inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-900"
              type="button"
              onClick={() => router.back()}
            >
              이전 페이지로
            </button>
          </div>
        </header>

        <div className="relative space-y-4">
          {profileLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
              <p className="text-sm font-semibold text-slate-700">비밀번호를 입력하면 개인정보를 수정할 수 있습니다.</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm"
                onClick={() => setUnlockModalOpen(true)}
              >
                비밀번호 입력하기
              </button>
            </div>
          )}
          <section
            className={`rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${
              profileLocked ? "pointer-events-none select-none blur-[2px] opacity-60" : ""
            }`}
          >
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">개인정보</h2>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">계정/연락처</span>
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
              <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">연락처</span>
                <PhoneNumberInput
                  inputClassName="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
                  onChange={({ first, middle, last }) => {
                    setPhone1(first);
                    setPhone2(middle);
                    setPhone3(last);
                  }}
                  parts={{ first: phone1, middle: phone2, last: phone3 }}
                  placeholders={{ first: "010", middle: "0000", last: "0000" }}
                />
              </label>
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
                    주소 검색
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                현재 주소: {zipCode || "미등록"} / {address || "미등록"} {detailAddress || ""}
              </p>
            </div>
          </section>


          <section
            className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
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
                  className={`relative inline-flex h-10 w-32 items-center justify-between rounded-full border px-3 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    pushEnabled
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  } ${pushStatus === "requesting" ? "opacity-60" : "hover:-translate-y-[1px] hover:shadow-sm"}`}
                  aria-pressed={pushEnabled}
                  aria-label="모바일 푸시 알림 설정"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm ${
                        pushEnabled ? "text-indigo-600" : "text-slate-600"
                      }`}
                    >
                      <BellIcon className="h-4 w-4" />
                    </span>
                    <span className="sr-only">{pushEnabled ? "알림 켜짐" : "알림 꺼짐"}</span>
                  </span>
                  <span
                    className={`relative flex h-7 w-14 items-center rounded-full transition ${pushEnabled ? "bg-indigo-100" : "bg-slate-200/90"}`}
                  >
                    <span
                      className={`absolute left-1 h-5 w-5 rounded-full ring-1 ring-slate-200 transition-all duration-200 ${
                        pushEnabled
                          ? "translate-x-7 bg-indigo-600 shadow-lg"
                          : "translate-x-0 bg-white shadow-sm"
                      }`}
                    />
                  </span>
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
                  className={`relative inline-flex h-10 w-32 items-center justify-between rounded-full border px-3 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    theme === "dark"
                      ? "border-indigo-500 bg-gradient-to-r from-slate-800 to-indigo-600 text-white shadow-sm"
                      : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  }`}
                  aria-pressed={theme === "dark"}
                  aria-label="다크 모드 토글"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm ${
                        theme === "dark" ? "text-indigo-600" : "text-amber-500"
                      }`}
                    >
                      <ThemeIcon mode={theme} className="h-4 w-4" />
                    </span>
                    <span className="sr-only">{theme === "dark" ? "다크 모드" : "라이트 모드"}</span>
                  </span>
                  <span
                    className={`relative flex h-7 w-14 items-center rounded-full transition ${theme === "dark" ? "bg-indigo-200/60" : "bg-slate-200/90"}`}
                  >
                    <span
                      className={`absolute left-1 h-5 w-5 rounded-full ring-1 ring-slate-200 transition-all duration-200 ${
                        theme === "dark"
                          ? "translate-x-7 bg-indigo-700 shadow-lg"
                          : "translate-x-0 bg-white shadow-sm"
                      }`}
                    />
                  </span>
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
                  className={`relative inline-flex h-10 w-32 items-center justify-between rounded-full border px-3 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    textSize === "large"
                      ? "border-indigo-500 bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm"
                      : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  }`}
                  aria-pressed={textSize === "large"}
                  aria-label="큰 글씨 모드 토글"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm ${
                        textSize === "large" ? "text-indigo-600" : "text-slate-600"
                      }`}
                    >
                      <TextSizeIcon large={textSize === "large"} className="h-4 w-4" />
                    </span>
                    <span className="sr-only">{textSize === "large" ? "큰 글씨" : "보통 글씨"}</span>
                  </span>
                  <span
                    className={`relative flex h-7 w-14 items-center rounded-full transition ${textSize === "large" ? "bg-indigo-200/60" : "bg-slate-200/90"}`}
                  >
                    <span
                      className={`absolute left-1 h-5 w-5 rounded-full ring-1 ring-slate-200 transition-all duration-200 ${
                        textSize === "large"
                          ? "translate-x-7 bg-indigo-700 shadow-lg"
                          : "translate-x-0 bg-white shadow-sm"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {(message || error) && (
          <p className={`text-sm ${error ? "text-rose-600" : "text-emerald-700"}`}>{error || message}</p>
        )}

        <div className={`flex justify-start gap-2 ${profileLocked ? "pointer-events-none select-none opacity-60" : ""}`}>
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

      {unlockModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => {
              if (!unlocking) setUnlockModalOpen(false);
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">비밀번호 확인</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              개인정보 수정을 위해 현재 비밀번호를 입력해주세요.
            </p>
            <div className="mt-4 space-y-2">
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-50"
                placeholder="비밀번호"
              />
              {unlockError && <p className="text-sm text-rose-600">{unlockError}</p>}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                onClick={() => void handleUnlockProfile()}
                disabled={unlocking}
              >
                {unlocking ? "확인 중..." : "확인"}
              </button>
              <button
                type="button"
                className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200"
                onClick={() => setUnlockModalOpen(false)}
                disabled={unlocking}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
