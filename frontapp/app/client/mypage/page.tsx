"use client";
import MyChatRooms from "@/components/MyChatRooms";
import { InlineDrugSearch } from "@/components/InlineDrugSearch";
import { resolveProfileImageUrl } from "@/lib/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type ClientOverview = {
  userId: number | null;
  email: string;
  name: string;
  profileImageUrl?: string | null;
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
  managerName?: string | null;
  managerEmail?: string | null;
  managerPhone?: string | null;
  managerOrganization?: string | null;
};

type MedicationLog = {
  id: number;
  planId?: number | null;
  medicineId: number;
  medicineName: string;
  logTimestamp: string;
  notes?: string | null;
};

type MedicationWeeklyDayStatus = {
  date: string;
  scheduledCount: number;
  takenCount: number;
  manualLogCount: number;
  status: "NO_SCHEDULE" | "MISSED" | "PARTIAL" | "COMPLETED";
};

type MedicationWeeklySummary = {
  startDate: string;
  endDate: string;
  days: MedicationWeeklyDayStatus[];
};

const weeklyStatusConfig: Record<
  MedicationWeeklyDayStatus["status"],
  { label: string; icon: string; circle: string; text: string }
> = {
  COMPLETED: {
    label: "완료",
    icon: "✓",
    circle: "bg-emerald-600 text-white",
    text: "text-emerald-700",
  },
  PARTIAL: {
    label: "부분 확인",
    icon: "½",
    circle: "bg-amber-500/80 text-white",
    text: "text-amber-700",
  },
  MISSED: {
    label: "미확인",
    icon: "!",
    circle: "bg-rose-600 text-white",
    text: "text-rose-700",
  },
  NO_SCHEDULE: {
    label: "일정 없음",
    icon: "-",
    circle: "bg-slate-200 text-slate-600",
    text: "text-slate-500",
  },
};

type UserSummary = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  profileImageUrl?: string | null;
};

type WebPushConfigResponse = {
  enabled: boolean;
  publicKey: string;
};

type ClientPanel = "schedule" | "drug" | "chat";

const clientQuickActions: Array<{
  value: ClientPanel;
  label: string;
  description: string;
  accent: string;
}> = [
  {
    value: "schedule",
    label: "복약 일정 확인",
    description: "오늘 일정과 주간 현황",
    accent: "bg-indigo-600",
  },
  {
    value: "drug",
    label: "약 검색",
    description: "e약은요 기반 조회",
    accent: "bg-emerald-500",
  },
  {
    value: "chat",
    label: "채팅방",
    description: "매니저와 실시간 대화",
    accent: "bg-sky-500",
  },
];

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
    profileImageUrl: "",
  });
  const [plans, setPlans] = useState<MedicationPlan[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [plansInitialized, setPlansInitialized] = useState(false);
  const [todayLogs, setTodayLogs] = useState<Record<number, MedicationLog | undefined>>({});
  const [confirmationState, setConfirmationState] = useState<Record<number, "idle" | "confirming">>({});
  const [confirmationMessage, setConfirmationMessage] = useState<
    Record<number, { type: "success" | "error"; text: string } | undefined>
  >({});
  const [weeklySummary, setWeeklySummary] = useState<MedicationWeeklySummary | null>(null);
  const [weeklySummaryLoading, setWeeklySummaryLoading] = useState(false);
  const [weeklySummaryError, setWeeklySummaryError] = useState("");
  const [supportsPushApi, setSupportsPushApi] = useState(false);
  const [pushServiceEnabled, setPushServiceEnabled] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [pushMessage, setPushMessage] = useState("");
  const [activePanel, setActivePanel] = useState<ClientPanel>("schedule");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [emergencySending, setEmergencySending] = useState<Record<number, boolean>>({});
  const [emergencyMessage, setEmergencyMessage] = useState<
    Record<number, { type: "success" | "error"; text: string } | undefined>
  >({});
  const defaultProfileImage = resolveProfileImageUrl("/image/픽토그램.png") || "/image/픽토그램.png";
  const logoImage = resolveProfileImageUrl("/image/logo.png") || "/image/logo.png";

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
      profileImageUrl: defaultProfileImage,
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
            profileImageUrl:
              resolveProfileImageUrl(data.profileImageUrl) ||
              defaultProfileImage,
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

  const loadWeeklySummary = useCallback(async () => {
    if (!client.userId) {
      return;
    }

    setWeeklySummaryLoading(true);
    setWeeklySummaryError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/clients/${client.userId}/medication/logs/weekly`
      );
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "주간 복약 현황을 불러오지 못했습니다."
        );
        throw new Error(message);
      }
      const summary: MedicationWeeklySummary = await response.json();
      const sortedDays = [...(summary.days ?? [])]
        .sort((a, b) => {
          const da = new Date(`${a.date}T00:00:00`).getTime();
          const db = new Date(`${b.date}T00:00:00`).getTime();
          return da - db;
        })
        .slice(-7); // 최신 7일만 유지
      setWeeklySummary({ ...summary, days: sortedDays });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "주간 복약 현황을 불러오지 못했습니다.";
      setWeeklySummary(null);
      setWeeklySummaryError(message);
    } finally {
      setWeeklySummaryLoading(false);
    }
  }, [client.userId]);

  const loadMedicationData = useCallback(async () => {
    if (!client.userId) {
      return;
    }

    loadWeeklySummary();
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
      const latestByPlan = new Map<number, MedicationLog>();
      const latestByMedicine = new Map<number, MedicationLog>();
      logsData.forEach((log) => {
        const mapKey = log.planId ?? null;
        const targetMap = mapKey ? latestByPlan : latestByMedicine;
        const key = mapKey ?? log.medicineId;
        const existing = targetMap.get(key);
        if (!existing) {
          targetMap.set(key, log);
          return;
        }
        const currentTime = new Date(log.logTimestamp).getTime();
        const existingTime = new Date(existing.logTimestamp).getTime();
        if (Number.isFinite(currentTime) && currentTime > existingTime) {
          targetMap.set(key, log);
        }
      });

      const record: Record<number, MedicationLog | undefined> = {};
      planData.forEach((plan) => {
        const log = latestByPlan.get(plan.id) ?? latestByMedicine.get(plan.medicineId);
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
      setPlansInitialized(true);
    }
  }, [client.userId, loadWeeklySummary]);

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

  const avatarInitial = useMemo(() => {
    if (client.name && client.name.trim().length > 0) {
      return client.name.trim().charAt(0).toUpperCase();
    }
    if (client.email) {
      return client.email.trim().charAt(0).toUpperCase();
    }
    return "?";
  }, [client.name, client.email]);

  const todayConfirmCount = useMemo(
    () => Object.values(todayLogs).filter(Boolean).length,
    [todayLogs],
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

  type ServiceStat = {
    key: "plans" | "confirm" | "push";
    label: string;
    value: string;
    hint: string;
    accent: string;
    badge: string;
    detail: string;
    items?: string[];
    actionLabel?: string;
    actionDisabled?: boolean;
    onAction?: () => void;
  };

  const [activeStat, setActiveStat] = useState<ServiceStat | null>(null);

  const todayToken = useMemo(() => {
    const tokens = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    return tokens[new Date().getDay()] ?? "ALL";
  }, []);

  const planPreview = useMemo(
    () =>
      plans.slice(0, 4).map((plan) => {
        const days = plan.daysOfWeek?.map(mapDayToLabel).join(", ") || "요일 정보 없음";
        return `${plan.medicineName} / ${days} / ${plan.alarmTime.slice(0, 5)}`;
      }),
    [plans, mapDayToLabel],
  );

  const todayDuePlans = useMemo(() => {
    return plans
      .filter((plan) => {
        const normalized = plan.daysOfWeek?.map((d) => d.toUpperCase()) ?? [];
        return normalized.includes("ALL") || normalized.includes(todayToken);
      })
      .slice(0, 5)
      .map((plan) => `${plan.medicineName} / ${plan.alarmTime.slice(0, 5)}`);
  }, [plans, todayToken]);

  const serviceStats = useMemo(
    () =>
      [
      {
        key: "plans",
        label: "복약 일정",
        value: planLoading ? "확인 중" : `${plans.length}건`,
        hint:
          planLoading && plans.length === 0
            ? "일정을 불러오는 중입니다."
            : plans.length > 0
            ? "등록된 복약 일정이 있습니다."
            : "등록된 일정이 없습니다.",
        accent: "bg-indigo-100 text-indigo-700",
        badge: "PLAN",
        detail:
          plans.length > 0
            ? `등록된 복약 일정 ${plans.length}건을 확인하고 필요하면 담당 매니저에게 수정을 요청하세요.`
            : "아직 복약 일정이 없습니다. 담당 매니저에게 일정 등록을 요청해 주세요.",
        items: planPreview.length > 0 ? planPreview : undefined,
      },
      {
        key: "confirm",
        label: "오늘 복약 확인",
        value:
          planLoading || plans.length === 0
            ? "-"
            : `${todayConfirmCount}/${plans.length}`,
        hint:
          plans.length === 0
            ? "일정을 먼저 등록해주세요."
            : "오늘 복용한 약을 확인해 주세요.",
        accent: "bg-emerald-100 text-emerald-700",
        badge: "TODAY",
        detail:
          plans.length === 0
            ? "등록된 일정이 없어서 오늘 확인 건수가 없습니다."
            : todayConfirmCount === plans.length
            ? "오늘 모든 복약을 확인했습니다. 훌륭해요!"
            : `오늘 ${plans.length - todayConfirmCount}건이 남아 있습니다. 복용 후 '복용 완료' 버튼으로 기록하세요.`,
        items: todayDuePlans.length > 0 ? todayDuePlans : undefined,
      },
      {
        key: "push",
        label: "미처리 알림",
        value: pushCapable ? "푸시 가능" : "푸시 불가",
        hint: pushCapable ? "푸시를 켜면 매니저의 비상 알림을 받을 수 있습니다." : pushHelperText,
        accent: pushCapable ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500",
        badge: "ALERT",
        detail: pushCapable
          ? "모바일 푸시를 활성화하여 매니저의 비상/안내 알림을 바로 받을 수 있습니다."
          : "이 브라우저에서는 푸시 알림이 제한됩니다. 지원되는 환경에서 접속하거나 앱 설치를 고려해주세요.",
      },
    ] as ServiceStat[],
    [
      planLoading,
      plans.length,
      todayConfirmCount,
      pushCapable,
      pushHelperText,
      planPreview,
      todayDuePlans,
      pushButtonDisabled,
      handleEnablePush,
      pushStatus,
    ],
  );

  type AlertTab = "overdue" | "chat" | "emergency";
  const [alertTab, setAlertTab] = useState<AlertTab>("overdue");
  const [alertPage, setAlertPage] = useState<Record<AlertTab, number>>({
    overdue: 0,
    chat: 0,
    emergency: 0,
  });
  const [alertsAcknowledged, setAlertsAcknowledged] = useState(false);
  const PAGE_SIZE = 10;
  const [emergencyAlerts, setEmergencyAlerts] = useState<string[]>([]);
  const [emergencyLoaded, setEmergencyLoaded] = useState(false);
  const [emergencyError, setEmergencyError] = useState("");

  const overdueAlerts = useMemo(() => {
    const now = new Date();
    const today = todayToken;
    return plans
      .filter((plan) => {
        const days = plan.daysOfWeek?.map((d) => d.toUpperCase()) ?? [];
        const dueToday = days.includes("ALL") || days.includes(today);
        if (!dueToday) return false;
        const [h, m] = plan.alarmTime?.split(":") ?? [];
        const planDate = new Date(now);
        planDate.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
        const past = planDate.getTime() < now.getTime();
        const confirmed = Boolean(todayLogs[plan.id]);
        return past && !confirmed;
      })
      .slice(0, 10)
      .map((plan) => `${plan.medicineName} / 알람 ${plan.alarmTime.slice(0, 5)} / 확인 필요`);
  }, [plans, todayLogs, todayToken]);

  const chatAlerts = useMemo(
    () => ["채팅 미읽음 알림 연동 준비 중입니다."],
    [],
  );

  const effectiveOverdueCount = alertsAcknowledged ? 0 : overdueAlerts.length;
  const effectiveChatCount = alertsAcknowledged ? 0 : chatAlerts.length;
  const effectiveEmergencyCount = alertsAcknowledged ? 0 : emergencyAlerts.length;
  const totalPendingAlerts = effectiveOverdueCount + effectiveChatCount + effectiveEmergencyCount;

  useEffect(() => {
    if (alertTab !== "emergency" || emergencyLoaded || !client.userId) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/emergency/alerts/client/${client.userId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "알림을 불러오지 못했습니다.");
        }
        const data: Array<{ alertType?: string; status?: string; alertTime?: string }> = await res.json();
        const list = data.map((a) => {
          const time = a.alertTime ? a.alertTime.replace("T", " ").slice(0, 16) : "";
          return `${time} / ${a.alertType ?? ""} / ${a.status ?? ""}`;
        });
        setEmergencyAlerts(list);
      } catch (e: any) {
        setEmergencyError(e instanceof Error ? e.message : "알림을 불러오지 못했습니다.");
      } finally {
        setEmergencyLoaded(true);
      }
    };
    void load();
  }, [alertTab, emergencyLoaded, client.userId]);

  const currentAlerts = useMemo(() => {
    if (alertsAcknowledged) {
      return ["모든 알림을 확인했습니다."];
    }
    switch (alertTab) {
      case "overdue":
        return overdueAlerts;
      case "chat":
        return chatAlerts;
      case "emergency":
        return emergencyError ? [emergencyError] : emergencyAlerts.length > 0 ? emergencyAlerts : ["알림이 없습니다."];
      default:
        return [];
    }
  }, [alertTab, overdueAlerts, chatAlerts, emergencyAlerts, emergencyError, alertsAcknowledged]);

  const pagedAlerts = useMemo(() => {
    const page = alertPage[alertTab] ?? 0;
    const start = page * PAGE_SIZE;
    return currentAlerts.slice(start, start + PAGE_SIZE);
  }, [alertPage, alertTab, currentAlerts]);

  const handleAcknowledgeAlerts = useCallback(() => {
    setAlertsAcknowledged(true);
    setAlertPage({ overdue: 0, chat: 0, emergency: 0 });
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(currentAlerts.length / PAGE_SIZE)), [currentAlerts.length]);

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

  const formatWeekdayLabel = useCallback((value: string) => {
    const day = new Date(`${value}T00:00:00`);
    const labels = ["일", "월", "화", "수", "목", "금", "토"];
    const index = Number.isNaN(day.getDay()) ? -1 : day.getDay();
    return index >= 0 ? labels[index] : "-";
  }, []);

  const formatCompactDate = useCallback((value: string) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}.${day}`;
  }, []);

  const WeeklyDayCard = ({
    day,
    className = "",
  }: {
    day: MedicationWeeklyDayStatus;
    className?: string;
  }) => {
    const config = weeklyStatusConfig[day.status];
    const effectiveTaken = Math.min(
      day.scheduledCount,
      day.takenCount + day.manualLogCount
    );
    const combinedClassName = [
      "flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={combinedClassName}>
        <div className="flex items-center justify-between gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ${config.circle}`}
          >
            {config.icon}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {formatWeekdayLabel(day.date)}요일
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {formatCompactDate(day.date)}
            </p>
          </div>
        </div>
        <p className={`mt-3 text-sm font-semibold ${config.text}`}>{config.label}</p>
        <p className="mt-1 text-xs text-slate-500">
          {day.scheduledCount > 0
            ? `확인 ${effectiveTaken}/${day.scheduledCount}`
            : day.manualLogCount > 0
            ? `기록 ${day.manualLogCount}건`
            : "일정 없음"}
        </p>
        {day.manualLogCount > 0 && day.scheduledCount > 0 && (
          <p className="mt-0.5 text-xs text-amber-600">
            수동 기록 {day.manualLogCount}건 포함
          </p>
        )}
      </div>
    );
  };

  const WeeklyDayCompact = ({ day }: { day: MedicationWeeklyDayStatus }) => {
    const config = weeklyStatusConfig[day.status];
    const effectiveTaken = Math.min(
      day.scheduledCount,
      day.takenCount + day.manualLogCount,
    );
    return (
      <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-white/80 px-1 py-2 text-[10px]">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${config.circle}`}
        >
          {config.icon}
        </div>
        <p className="mt-1 font-semibold text-slate-700">{formatWeekdayLabel(day.date)}</p>
        <p className={`font-semibold ${config.text}`}>{config.label}</p>
        <p className="text-slate-500">
          {day.scheduledCount > 0
            ? `${effectiveTaken}/${day.scheduledCount}`
            : day.manualLogCount > 0
              ? `기록 ${day.manualLogCount}`
              : "-"}
        </p>
      </div>
    );
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
            planId: plan.id,
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

  const handleEmergencyCall = async (plan: MedicationPlan) => {
    if (!client.userId) return;
    setEmergencyMessage((prev) => ({ ...prev, [plan.id]: undefined }));
    setEmergencySending((prev) => ({ ...prev, [plan.id]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/emergency/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.userId,
          alertType: "CLIENT_EMERGENCY",
          shareLocation: false,
        }),
      });
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "비상 호출을 전송하지 못했습니다.",
        );
        throw new Error(message);
      }
      setEmergencyMessage((prev) => ({
        ...prev,
        [plan.id]: { type: "success", text: "비상 호출을 전송했습니다. 매니저가 확인할 때까지 기다려주세요." },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "비상 호출을 전송하지 못했습니다.";
      setEmergencyMessage((prev) => ({
        ...prev,
        [plan.id]: { type: "error", text: message },
      }));
    } finally {
      setEmergencySending((prev) => ({ ...prev, [plan.id]: false }));
    }
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file || !client.userId) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setAvatarUploading(true);
    setAvatarError("");
    setAvatarMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${API_BASE_URL}/api/users/${client.userId}/profile-image`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "프로필 이미지를 업로드하지 못했습니다."
        );
        throw new Error(message);
      }
      const data: UserSummary = await response.json();
      setClient((prev) => ({
        ...prev,
        profileImageUrl:
          resolveProfileImageUrl(data.profileImageUrl) ||
          defaultProfileImage,
      }));
      setAvatarMessage("프로필 이미지가 업데이트되었습니다.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "프로필 이미지를 업로드하지 못했습니다.";
      setAvatarError(message);
    } finally {
      setAvatarUploading(false);
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
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl bg-white p-4 shadow-lg sm:p-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-200 bg-indigo-50 text-lg font-semibold text-indigo-700">
                  {client.profileImageUrl ? (
                    <img
                      src={client.profileImageUrl}
                      alt="프로필 이미지"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{avatarInitial}</span>
                  )}
                </div>
                <button
                  className="absolute -left-1 -bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-sm ring-4 ring-white transition hover:bg-indigo-700"
                  type="button"
                  onClick={() => router.push("/client/profile/edit")}
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src={logoImage}
                    alt="Guardian 로고"
                    className="h-6 w-auto sm:h-7"
                  />
                  <span className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600 sm:text-base">
                    GUARDIAN
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold uppercase tracking-wide text-indigo-600 sm:text-3xl">
                    Client
                  </p>
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {client.name ? `${client.name}님` : "클라이언트 마이페이지"}
                  </h1>
                </div>
              </div>
            </div>
            <button
              className="h-10 rounded-md border border-red-400 px-4 text-sm font-semibold text-red-500 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={handleLogout}
              type="button"
            >
              로그아웃
            </button>
          </div>
          {(avatarError || avatarMessage) && (
            <p
              className={`text-sm ${
                avatarError ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {avatarError || avatarMessage}
            </p>
          )}
          <div className="flex gap-3 pb-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:pb-0">
            {clientQuickActions.map((action) => {
              const isActive = activePanel === action.value;
              return (
                <button
                  key={action.value}
                  type="button"
                  onClick={() => setActivePanel(action.value)}
                  className={`group flex flex-1 min-w-0 flex-col gap-1 rounded-2xl border px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow sm:px-4 ${
                    isActive
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[0.7rem] font-semibold text-white ${action.accent}`}
                  >
                    {action.label.slice(0, 1)}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {action.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {action.description}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {activePanel === "schedule" && (
          <>
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 sm:p-6 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">서비스 이용 현황</h2>
              <p className="text-sm text-slate-600">
                오늘의 복약 진행 상황과 알림 상태를 한눈에 확인하세요.
              </p>
            </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  미처리 알림 포함
                </div>
              </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {serviceStats.map((stat) => (
              <button
                key={stat.key}
                type="button"
              onClick={() => setActiveStat(stat)}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{stat.label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${stat.accent}`}>
                    {stat.badge}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{stat.hint}</p>
              </button>
            ))}
          </div>

          {activeStat && (
            <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 sm:py-10">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setActiveStat(null)}
                role="presentation"
              />
              <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-200">
                      관리 현황
                    </p>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                      {activeStat.label}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{activeStat.detail}</p>
                  </div>
                  <button
                    className="text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-300"
                    onClick={() => setActiveStat(null)}
                    type="button"
                    aria-label="상세 닫기"
                  >
                    닫기 ✕
                  </button>
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                  {activeStat.key === "push" ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: "overdue", label: "미복약", count: effectiveOverdueCount },
                          { key: "chat", label: "미읽 메세지", count: effectiveChatCount },
                          { key: "emergency", label: "긴급 호출", count: effectiveEmergencyCount },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setAlertTab(tab.key as AlertTab)}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              alertTab === tab.key
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                            }`}
                          >
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              {tab.count}
                            </span>
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                        <ul className="space-y-2">
                          {pagedAlerts.map((item, idx) => (
                            <li
                              key={`${alertTab}-item-${idx}`}
                              className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
                            >
                              <span className="mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-100 px-2 text-[10px] font-bold text-indigo-700">
                                {(alertPage[alertTab] ?? 0) * PAGE_SIZE + idx + 1}
                              </span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>
                            페이지 { (alertPage[alertTab] ?? 0) + 1 } / {totalPages}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-slate-200 px-2 py-1 hover:border-indigo-300"
                              disabled={(alertPage[alertTab] ?? 0) === 0}
                              onClick={() =>
                                setAlertPage((prev) => ({
                                  ...prev,
                                  [alertTab]: Math.max(0, (prev[alertTab] ?? 0) - 1),
                                }))
                              }
                            >
                              이전
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-slate-200 px-2 py-1 hover:border-indigo-300"
                              disabled={(alertPage[alertTab] ?? 0) >= totalPages - 1}
                              onClick={() =>
                                setAlertPage((prev) => ({
                                  ...prev,
                                  [alertTab]: Math.min(totalPages - 1, (prev[alertTab] ?? 0) + 1),
                                }))
                              }
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          disabled={alertsAcknowledged || totalPendingAlerts === 0}
                          onClick={handleAcknowledgeAlerts}
                        >
                          전부 확인
                        </button>
                        {activeStat.actionLabel && (
                          <button
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                            disabled={activeStat.actionDisabled}
                            onClick={handleStatAction}
                            type="button"
                          >
                            {activeStat.actionLabel}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {activeStat.items && activeStat.items.length > 0 && (
                        <ul className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
                          {activeStat.items.map((item, idx) => (
                            <li
                              key={`${activeStat.key}-item-${idx}`}
                              className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                            >
                              <span className="mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-100 px-2 text-[10px] font-bold text-indigo-700">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {activeStat.actionLabel && (
                        <button
                          className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                          disabled={activeStat.actionDisabled}
                          onClick={handleStatAction}
                          type="button"
                        >
                          {activeStat.actionLabel}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">복약 확인</h2>
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

          <div className="mt-4 space-y-3 sm:space-y-4">
            {planLoading ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                복약 정보를 불러오는 중입니다...
              </div>
            ) : planError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {planError}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                등록된 복약 일정이 없습니다. 담당자에게 일정을 요청해주세요.
              </div>
            ) : (
              plans.map((plan) => {
                const log = todayLogs[plan.id];
                const alreadyConfirmed = Boolean(log);
                const now = new Date();
                const planTime = new Date();
                const [hour, minute] = plan.alarmTime.split(":").map(Number);
                planTime.setHours(hour ?? 0, minute ?? 0, 0, 0);
                const diffMs = now.getTime() - planTime.getTime();
                const currentDayToken = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][now.getDay()];
                const currentDayLabel = mapDayToLabel(currentDayToken);
                const isSameDay = plan.daysOfWeek.includes(currentDayToken);
                const daySummary =
                  plan.daysOfWeek.length > 0
                    ? plan.daysOfWeek.map(mapDayToLabel).join(", ")
                    : "요일 정보 없음";
                const withinWindow =
                  isSameDay
                  && diffMs >= 0
                  && diffMs <= 60 * 60 * 1000
                  && daySummary.includes(currentDayLabel);
                const message = confirmationMessage[plan.id];
                const statusLabel = alreadyConfirmed
                  ? `${formatLogTime(log?.logTimestamp)} 확인`
                  : "미확인";
                const managerRaw = plan.managerName?.trim();
                const managerFallback =
                  plan.managerEmail?.trim() ||
                  plan.managerOrganization?.trim() ||
                  plan.managerPhone?.trim() ||
                  "";
                const managerName =
                  managerRaw && managerRaw.length > 0
                    ? `${managerRaw} 매니저`
                    : managerFallback || "담당 매니저 정보 없음";
                const managerMeta = [
                  plan.managerOrganization?.trim(),
                  plan.managerEmail?.trim(),
                  plan.managerPhone?.trim(),
                ]
                  .filter((value) => value && value.length > 0)
                  .join(" · ");

                const emergencyMsg = emergencyMessage[plan.id];
                return (
                  <article
                    key={plan.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                          {plan.medicineName}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {`용량: ${plan.dosageAmount}${plan.dosageUnit} / 알람: ${formatAlarmTime(
                            plan.alarmTime
                          )} / 요일: ${daySummary}`}
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
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            담당 매니저
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {managerName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {managerMeta || "연락처 정보 없음"}
                          </p>
                        </div>
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          disabled={
                            emergencySending[plan.id] ||
                            managerName === "담당 매니저 정보 없음"
                          }
                          onClick={() => handleEmergencyCall(plan)}
                          type="button"
                          aria-label="담당 매니저에게 비상 호출"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M6.5 12h11l-.9-5.4a1 1 0 0 0-.99-.83H8.39a1 1 0 0 0-.99.83L6.5 12Z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5 14h14v2H5z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8 18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2H8v2Z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path d="M12 4V2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5.5 6.5 4 5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 6.5 20 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {emergencySending[plan.id] ? "전송 중..." : "비상 호출"}
                        </button>
                      </div>
                      {emergencyMsg && (
                        <p
                          className={`mt-2 text-xs ${
                            emergencyMsg.type === "success"
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {emergencyMsg.text}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {withinWindow ? (
                        <button
                          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
                          disabled={confirmationState[plan.id] === "confirming"}
                          onClick={() => handleMedicationConfirm(plan)}
                          type="button"
                        >
                          {confirmationState[plan.id] === "confirming"
                            ? "저장 중..."
                            : alreadyConfirmed
                            ? "복용 완료"
                            : "복용 완료"}
                        </button>
                      ) : (
                        <p className="text-sm text-slate-500">
                          아직 복용시간이 아닙니다
                        </p>
                      )}
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

        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-6">
          <div className="flex flex-col gap-2 border-b border-amber-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-amber-900 sm:text-xl">주간 복약 현황</h2>
              <p className="text-sm text-amber-700">
                최근 7일 동안의 복약 기록을 요일별 아이콘으로 확인할 수 있습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-amber-300 px-3 py-1.5 text-sm text-amber-800 transition hover:border-amber-400 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={weeklySummaryLoading}
                onClick={loadWeeklySummary}
                type="button"
              >
                {weeklySummaryLoading ? "갱신 중..." : "주간 새로고침"}
              </button>
            </div>
          </div>
          {!planLoading && plansInitialized && planError.trim().length === 0 && plans.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-amber-800">
              아직 복약 일정이 없습니다. 담당자에게 일정을 등록해 달라고 요청해주세요.
            </div>
          ) : weeklySummaryLoading && !weeklySummary ? (
            <div className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-sm text-amber-800">
              주간 복약 현황을 불러오는 중입니다...
            </div>
          ) : weeklySummaryError ? (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-red-600">
              {weeklySummaryError}
            </div>
          ) : weeklySummary && weeklySummary.days.length > 0 ? (
            <div className="mt-4">
              <div className="grid grid-cols-7 gap-1 sm:hidden">
                {weeklySummary.days.map((day) => (
                  <WeeklyDayCompact key={`mobile-weekly-${day.date}`} day={day} />
                ))}
              </div>
              <div className="hidden gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-7">
                {weeklySummary.days.map((day) => (
                  <WeeklyDayCard key={`desktop-weekly-${day.date}`} day={day} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-amber-800">
              아직 복약 기록이 없습니다. 복약 확인을 기록해 주세요.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-indigo-900">
            다음 단계 미리 보기
          </h2>
          <p className="mt-1.5 text-sm text-indigo-700">
            복약 일정, 알림 이력, 담당 매니저와의 커뮤니케이션 도구가 곧 연결될 예정입니다.
            필요한 기능이 있다면 관리자에게 알려주세요.
          </p>
        </section>
        </>
      )}

      {activePanel === "drug" && (
        <section>
          <InlineDrugSearch />
        </section>
      )}

      {activePanel === "chat" && (
        <section>
          <MyChatRooms role="CLIENT" userId={client.userId} />
        </section>
      )}
      </main>
    </div>
  );
}
