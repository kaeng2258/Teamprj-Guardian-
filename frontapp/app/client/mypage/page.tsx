"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type ClientOverview = {
  userId: number | null;
  email: string;
  name: string;
};

type PushStatus = "idle" | "requesting" | "enabled" | "error";

type MedicationPlan = {
  id: number;
  medicineId: number;
  medicineName: string;
  dosageAmount: number;
  dosageUnit: string;
  alarmTime: string;
  daysOfWeek: string[];
  active: boolean;
};

type MedicationLog = {
  id: number;
  medicineId: number;
  medicineName: string;
  logTimestamp: string;
  notes?: string | null;
};

type UserSummary = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
};

type WebPushConfigResponse = {
  enabled: boolean;
  publicKey: string;
};

async function extractApiError(response: Response, fallback: string) {
  try {
    const data = await response.clone().json();
    if (data && typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message?: string }).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
  } catch (error) {
    // ignore body parse issues
  }

  try {
    const text = await response.text();
    if (text.trim().length > 0) {
      return text;
    }
  } catch (error) {
    // ignore text read issues
  }

  return fallback;
}

export default function ClientMyPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [client, setClient] = useState<ClientOverview>({
    userId: null,
    email: "",
    name: "",
  });
  const [plans, setPlans] = useState<MedicationPlan[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [todayLogs, setTodayLogs] = useState<Record<number, MedicationLog | undefined>>({});
  const [confirmationState, setConfirmationState] = useState<Record<number, "idle" | "confirming">>({});
  const [confirmationMessage, setConfirmationMessage] = useState<
    Record<number, { type: "success" | "error"; text: string } | undefined>
  >({});
  const [supportsPushApi, setSupportsPushApi] = useState(false);
  const [pushServiceEnabled, setPushServiceEnabled] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [pushMessage, setPushMessage] = useState("");

  const pushCapable = useMemo(
    () => supportsPushApi && pushServiceEnabled && Boolean(vapidPublicKey),
    [supportsPushApi, pushServiceEnabled, vapidPublicKey]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const accessToken = window.localStorage.getItem("accessToken");
    const role = window.localStorage.getItem("userRole");

    if (!accessToken || role !== "CLIENT") {
      router.replace("/");
      return;
    }

    const storedEmail = window.localStorage.getItem("userEmail") ?? "";
    const storedUserId = window.localStorage.getItem("userId");
    const userId = storedUserId ? Number(storedUserId) : null;
    setClient({
      email: storedEmail,
      userId,
      name: "",
    });

    if (userId) {
      (async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
          if (!response.ok) {
            return;
          }
          const data: UserSummary = await response.json();
          setClient((prev) => ({
            ...prev,
            name: data.name ?? "",
          }));
        } catch (error) {
          // ignore profile fetch errors
        }
      })();
    }
    setIsReady(true);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupportsPushApi(supported);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/push/config`);
        if (!response.ok) {
          const message = await extractApiError(
            response,
            "웹 푸시 설정 정보를 불러오지 못했습니다."
          );
          throw new Error(message);
        }
        const data: WebPushConfigResponse = await response.json();
        if (cancelled) {
          return;
        }
        setVapidPublicKey(data.publicKey ?? "");
        setPushServiceEnabled(Boolean(data.enabled && data.publicKey));
        setPushStatus((prev) => (prev === "error" ? "idle" : prev));
        setPushMessage((prev) =>
          prev && prev.includes("설정 정보를") ? "" : prev
        );
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "웹 푸시 설정 정보를 불러오지 못했습니다.";
        setPushServiceEnabled(false);
        setVapidPublicKey("");
        setPushStatus("error");
        setPushMessage(message);
      }
    };

    fetchConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !pushCapable) {
      return;
    }
    if (Notification.permission === "granted") {
      setPushStatus("enabled");
      setPushMessage("이미 푸시 알림이 허용되었습니다.");
    }
  }, [pushCapable]);

  const loadMedicationData = useCallback(async () => {
    if (!client.userId) {
      return;
    }

    setPlanLoading(true);
    setPlanError("");
    setConfirmationMessage({});

    try {
      const planResponse = await fetch(
        `${API_BASE_URL}/api/clients/${client.userId}/medication/plans`
      );

      if (!planResponse.ok) {
        const message = await extractApiError(
          planResponse,
          "복약 일정을 불러오지 못했습니다."
        );
        throw new Error(message);
      }

      const planData: MedicationPlan[] = await planResponse.json();
      setPlans(planData);

      const today = new Date();
      const dateParam = today.toISOString().split("T")[0]!;

      const logsResponse = await fetch(
        `${API_BASE_URL}/api/clients/${client.userId}/medication/logs?date=${encodeURIComponent(
          dateParam
        )}`
      );

      if (!logsResponse.ok) {
        if (logsResponse.status !== 404) {
          const message = await extractApiError(
            logsResponse,
            "복약 확인 이력을 불러오지 못했습니다."
          );
          setPlanError(message);
        }
        setTodayLogs({});
        return;
      }

      const logsData: MedicationLog[] = await logsResponse.json();
      const latestByMedicine = new Map<number, MedicationLog>();
      logsData.forEach((log) => {
        const existing = latestByMedicine.get(log.medicineId);
        if (!existing) {
          latestByMedicine.set(log.medicineId, log);
          return;
        }

        const currentTime = new Date(log.logTimestamp).getTime();
        const existingTime = new Date(existing.logTimestamp).getTime();
        if (Number.isFinite(currentTime) && currentTime > existingTime) {
          latestByMedicine.set(log.medicineId, log);
        }
      });

      const record: Record<number, MedicationLog | undefined> = {};
      planData.forEach((plan) => {
        const log = latestByMedicine.get(plan.medicineId);
        if (log) {
          record[plan.id] = log;
        }
      });
      setTodayLogs(record);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "복약 일정을 불러오지 못했습니다.";
      setPlanError(message);
      setPlans([]);
      setTodayLogs({});
    } finally {
      setPlanLoading(false);
    }
  }, [client.userId]);

  useEffect(() => {
    if (!isReady || !client.userId) {
      return;
    }
    loadMedicationData();
  }, [isReady, client.userId, loadMedicationData]);

  const handleEnablePush = useCallback(async () => {
    if (!client.userId) {
      setPushStatus("error");
      setPushMessage("사용자 정보를 먼저 불러온 뒤 다시 시도해주세요.");
      return;
    }

    if (typeof window === "undefined" || !pushCapable) {
      setPushStatus("error");
      setPushMessage("현재 브라우저에서 웹 푸시를 지원하지 않습니다.");
      return;
    }

    if (!vapidPublicKey) {
      setPushStatus("error");
      setPushMessage("VAPID 공개키가 설정되지 않았습니다.");
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
      const readyRegistration = registration.active
        ? registration
        : await navigator.serviceWorker.ready;

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
        keys?: {
          auth?: string;
          p256dh?: string;
        };
      };
      const keys = json.keys ?? {};
      if (!keys.auth || !keys.p256dh) {
        throw new Error("브라우저가 푸시 키 정보를 제공하지 못했습니다.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/users/${client.userId}/push/subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime,
            keys: {
              auth: keys.auth,
              p256dh: keys.p256dh,
            },
            userAgent: navigator.userAgent,
          }),
        }
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "푸시 구독 정보를 저장하지 못했습니다."
        );
        throw new Error(message);
      }

      setPushStatus("enabled");
      setPushMessage("모바일 브라우저 푸시 알림이 활성화되었습니다.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "푸시 알림을 설정하는 동안 문제가 발생했습니다.";
      setPushStatus("error");
      setPushMessage(message);
    }
  }, [client.userId, pushCapable, vapidPublicKey]);

  const pushButtonDisabled =
    pushStatus === "requesting" || !pushCapable || !client.userId;

  const pushHelperText = useMemo(() => {
    if (pushMessage) {
      return pushMessage;
    }
    if (pushCapable) {
      return "모바일 Chrome/Safari에서 홈 화면에 추가하면 백그라운드에서도 알림을 받을 수 있습니다.";
    }
    if (!supportsPushApi) {
      return "현재 브라우저에서 웹 푸시를 지원하지 않습니다.";
    }
    if (!pushServiceEnabled) {
      return "서버의 웹 푸시 설정이 비활성화되어 있습니다. 관리자에게 문의해주세요.";
    }
    return "VAPID 공개키를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.";
  }, [pushCapable, pushMessage, pushServiceEnabled, supportsPushApi]);

  const sections = useMemo(
    () => [
      {
        title: "기본 정보",
        description: "로그인한 계정의 기초 정보를 확인하세요.",
        rows: [
          {
            label: "이름",
            value: client.name || "확인 중",
          },
          {
            label: "이메일",
            value: client.email || "확인 중",
          },
        ],
      },
      {
        title: "서비스 이용 현황",
        description: "복약 알림 및 보호자 정보는 추후 연동 예정입니다.",
        rows: [
          {
            label: "복약 일정",
            value: planLoading
              ? "확인 중"
              : plans.length > 0
              ? `${plans.length}건`
              : "등록된 일정 없음",
          },
          {
            label: "오늘 복약 확인",
            value:
              planLoading || plans.length === 0
                ? planLoading
                  ? "확인 중"
                  : "-"
                : `${Object.values(todayLogs).filter(Boolean).length}/${plans.length}`,
          },
          { label: "보호자 메모", value: "준비 중" },
        ],
      },
    ],
    [client, planLoading, plans, todayLogs]
  );

  const mapDayToLabel = useCallback((value: string) => {
    const normalized = value.trim().toUpperCase();
    const labels: Record<string, string> = {
      MONDAY: "월",
      TUESDAY: "화",
      WEDNESDAY: "수",
      THURSDAY: "목",
      FRIDAY: "금",
      SATURDAY: "토",
      SUNDAY: "일",
      WEEKDAY: "평일",
      WEEKEND: "주말",
      ALL: "매일",
    };
    return labels[normalized] ?? value;
  }, []);

  const formatAlarmTime = (value: string) => {
    if (!value) {
      return "-";
    }
    return value.slice(0, 5);
  };

  const formatLogTime = (value: string | undefined) => {
    if (!value) {
      return "미확인";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "미확인";
    }
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${hour}:${minute}`;
  };

  const handleMedicationConfirm = async (plan: MedicationPlan) => {
    if (!client.userId) {
      return;
    }

    setConfirmationState((prev) => ({ ...prev, [plan.id]: "confirming" }));
    setConfirmationMessage((prev) => ({ ...prev, [plan.id]: undefined }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/clients/${client.userId}/medication/logs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            medicineId: plan.medicineId,
            logTimestamp: new Date().toISOString(),
            notes: "사용자가 복약을 확인했습니다.",
          }),
        }
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "복약 확인에 실패했습니다."
        );
        throw new Error(message);
      }

      const log: MedicationLog = await response.json();
      setTodayLogs((prev) => ({ ...prev, [plan.id]: log }));
      setConfirmationMessage((prev) => ({
        ...prev,
        [plan.id]: { type: "success", text: "복약 확인이 저장되었습니다." },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "복약 확인 중 오류가 발생했습니다.";
      setConfirmationMessage((prev) => ({
        ...prev,
        [plan.id]: { type: "error", text: message },
      }));
    } finally {
      setConfirmationState((prev) => ({ ...prev, [plan.id]: "idle" }));
    }
  };

  const handleLogout = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
    window.localStorage.removeItem("userRole");
    window.localStorage.removeItem("userEmail");
    window.localStorage.removeItem("userId");
    router.replace("/");
  };

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg bg-white px-6 py-8 shadow-sm">
          <p className="text-gray-600">클라이언트 정보를 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-xl">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Guardian
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              클라이언트 마이페이지
            </h1>
            <p className="text-sm text-slate-600">
              복약 서비스 이용 현황과 알림 설정을 한곳에서 관리하세요.
            </p>
          </div>
          <button
            className="h-11 rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            onClick={handleLogout}
            type="button"
          >
            로그아웃
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-slate-200 p-6"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {section.description}
              </p>
              <dl className="mt-4 space-y-3">
                {section.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                  >
                    <dt className="text-sm font-medium text-slate-600">
                      {row.label}
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-6 md:hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                모바일 푸시
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                브라우저가 꺼져 있어도 복약 알림 받기
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                한 번만 허용하면 모바일에서도 정해진 복약 시간에 맞춰 알림을 전달해 드립니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={pushButtonDisabled}
              className="h-12 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {pushStatus === "requesting" ? "설정 중..." : "푸시 알림 활성화"}
            </button>
          </div>
          <p
            className={`mt-4 text-sm ${
              pushStatus === "error" ? "text-red-600" : "text-slate-700"
            }`}
          >
            {pushHelperText}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 p-6">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">복약 확인</h2>
              <p className="text-sm text-slate-500">
                오늘 예정된 복약 일정을 확인하고 복약 여부를 기록하세요.
              </p>
            </div>
            <button
              className="self-start rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              disabled={planLoading}
              onClick={loadMedicationData}
              type="button"
            >
              {planLoading ? "불러오는 중..." : "새로고침"}
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {planLoading ? (
              <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                복약 정보를 불러오는 중입니다...
              </div>
            ) : planError ? (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {planError}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                등록된 복약 일정이 없습니다. 담당자에게 일정을 요청해주세요.
              </div>
            ) : (
              plans.map((plan) => {
                const log = todayLogs[plan.id];
                const alreadyConfirmed = Boolean(log);
                const message = confirmationMessage[plan.id];
                const statusLabel = alreadyConfirmed
                  ? `${formatLogTime(log?.logTimestamp)} 확인`
                  : "미확인";
                const daySummary =
                  plan.daysOfWeek.length > 0
                    ? plan.daysOfWeek.map(mapDayToLabel).join(", ")
                    : "요일 정보 없음";

                return (
                  <article
                    key={plan.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {plan.medicineName}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {`${plan.dosageAmount}${plan.dosageUnit} · ${formatAlarmTime(
                            plan.alarmTime
                          )} · ${daySummary}`}
                        </p>
                      </div>
                      <span
                        className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ${
                          alreadyConfirmed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                        disabled={confirmationState[plan.id] === "confirming"}
                        onClick={() => handleMedicationConfirm(plan)}
                        type="button"
                      >
                        {confirmationState[plan.id] === "confirming"
                          ? "저장 중..."
                          : alreadyConfirmed
                          ? "다시 확인"
                          : "복약 확인"}
                      </button>
                      {message && (
                        <p
                          className={`text-sm ${
                            message.type === "success"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {message.text}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-lg font-semibold text-indigo-900">
            다음 단계 미리 보기
          </h2>
          <p className="mt-2 text-sm text-indigo-700">
            복약 일정, 알림 이력, 담당 제공자와의 커뮤니케이션 도구가 곧 연결될 예정입니다.
            필요한 기능이 있다면 관리자에게 알려주세요.
          </p>
        </section>
      </main>
    </div>
  );
}
