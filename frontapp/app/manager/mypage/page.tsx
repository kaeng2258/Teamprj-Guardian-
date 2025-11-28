"use client";
import MyChatRooms from "@/components/MyChatRooms";
import { InlineDrugSearch } from "@/components/InlineDrugSearch";
import { DrugDetailModal } from "@/components/DrugDetailModal";
import { resolveProfileImageUrl } from "@/lib/image";
import { useRouter } from "next/navigation";
import { ChatClientPicker } from "@/components/ChatClientPicker";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type ManagerOverview = {
  userId: number | null;
  email: string;
  name: string;
  profileImageUrl?: string | null;
};

type ManagerDashboardResponse = {
  managerId: number;
  clients: ManagerClientSummary[];
  activeAlertCount: number;
  pendingMedicationCount: number;
};

type ManagerClientSummary = {
  clientId: number;
  clientName: string;
  email?: string | null;
  address?: string | null;
  detailAddress?: string | null;
  zipCode?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  age?: number | null;
  profileImageUrl?: string | null;
  medicationPlans: MedicationPlan[];
  latestMedicationLogs: MedicationLog[];
  emergencyAlerts: EmergencyAlertInfo[];
};

type ClientDetail = {
  email?: string | null;
  address?: string | null;
  detailAddress?: string | null;
  zipCode?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  age?: number | null;
  profileImageUrl?: string | null;
};

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
  planId?: number | null;
  medicineId: number;
  medicineName: string;
  logTimestamp: string;
  notes?: string | null;
};

type EmergencyAlertInfo = {
  alertId: number;
  alertType: string;
  status: string;
  alertTime: string;
  clientName?: string;
  clientBirthDate?: string;
};

type MedicineSummary = {
  id: number;
  name: string;
  productCode?: string | null;
};

type EasyDrugSearchResult = {
  itemSeq: string;
  itemName: string;
  entpName?: string;
  etcOtcName?: string;
  className?: string;
  chart?: string;
  itemImage?: string;
};

type ManagerClientSearchResult = {
  clientId: number;
  name: string;
  email: string;
  status: string;
  address?: string | null;
  detailAddress?: string | null;
  age?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  medicationCycle?: string | null;
  currentlyAssigned: boolean;
  assignedManagerId?: number | null;
  assignedManagerName?: string | null;
  assignedManagerEmail?: string | null;
  assignable: boolean;
};

type UserSummary = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  profileImageUrl?: string | null;
};

type ManualMedicineForm = {
  name: string;
  productCode: string;
  efficacy: string;
  usageDosage: string;
  caution: string;
  sideEffects: string;
  description: string;
};

type PlanFormItemState = {
  mode: "search" | "manual";
  manualMedicine: ManualMedicineForm;
  medicineKeyword: string;
  medicineResults: EasyDrugSearchResult[];
  selectedMedicineId: number | null;
  dosageAmount: string;
  dosageUnit: string;
  searching: boolean;
};

type PlanFormState = {
  items: PlanFormItemState[];
  alarmTime: string;
  daysOfWeek: string[];
  submitting: boolean;
  error: string;
  message: string;
};

type PlanActionMessage = {
  type: "success" | "error";
  text: string;
};

type ChatRoomEnsureResult = {
  success: boolean;
  message?: string;
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

type ManagerPanel = "client" | "drug" | "chat";

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

const managerQuickActions: Array<{
  value: ManagerPanel;
  label: string;
  description: string;
  accent: string;
}> = [
  {
    value: "client",
    label: "복약 관리",
    description: "배정 및 복약 일정",
    accent: "bg-indigo-600",
  },
  {
    value: "drug",
    label: "약 검색",
    description: "e약은요 기반 약품 조회",
    accent: "bg-emerald-500",
  },
  {
    value: "chat",
    label: "채팅방",
    description: "실시간 상담 및 공지",
    accent: "bg-sky-500",
  },
];

const subtleActionButton =
  "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-indigo-800 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60";
const primaryActionButton =
  "flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300";

const allDays = [
  { value: "MONDAY", label: "월" },
  { value: "TUESDAY", label: "화" },
  { value: "WEDNESDAY", label: "수" },
  { value: "THURSDAY", label: "목" },
  { value: "FRIDAY", label: "금" },
  { value: "SATURDAY", label: "토" },
  { value: "SUNDAY", label: "일" },
];

const createEmptyManualMedicine = (): ManualMedicineForm => ({
  name: "",
  productCode: "",
  efficacy: "",
  usageDosage: "",
  caution: "",
  sideEffects: "",
  description: "",
});

const createPlanFormItemState = (): PlanFormItemState => ({
  mode: "search",
  manualMedicine: createEmptyManualMedicine(),
  medicineKeyword: "",
  medicineResults: [],
  selectedMedicineId: null,
  dosageAmount: "",
  dosageUnit: "",
  searching: false,
});

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

const createInitialFormState = (): PlanFormState => ({
  items: [createPlanFormItemState()],
  alarmTime: "",
  daysOfWeek: [],
  submitting: false,
  error: "",
  message: "",
});

export default function ManagerMyPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [manager, setManager] = useState<ManagerOverview>({
    userId: null,
    email: "",
    name: "",
    profileImageUrl: "",
  });
  const [dashboard, setDashboard] = useState<ManagerDashboardResponse | null>(
    null
  );
  const [managerProfileId, setManagerProfileId] = useState<number | null>(
    null
  );
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [planForms, setPlanForms] = useState<Record<number, PlanFormState>>({});
  const [planMessages, setPlanMessages] = useState<
    Record<number, PlanActionMessage | undefined>
  >({});
  const [logProcessing, setLogProcessing] = useState<
    Record<number, "idle" | "loading">
  >({});
  const [logMessages, setLogMessages] = useState<
    Record<number, PlanActionMessage | undefined>
  >({});
  const [deleteProcessing, setDeleteProcessing] = useState<
    Record<number, "idle" | "loading">
  >({});
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editingForms, setEditingForms] = useState<
    Record<
      number,
      {
        dosageAmount: string;
        dosageUnit: string;
        alarmTime: string;
        days: Set<string>;
        active: boolean;
      }
    >
  >({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<ManagerClientSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [assignmentStates, setAssignmentStates] = useState<
    Record<number, "idle" | "assigning" | "unassigning">
  >({});
  const [assignmentMessages, setAssignmentMessages] = useState<
    Record<number, PlanActionMessage | undefined>
  >({});
  const [favoriteClientIds, setFavoriteClientIds] = useState<number[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<
    Record<number, MedicationWeeklySummary | null>
  >({});
  const [weeklySummaryLoading, setWeeklySummaryLoading] = useState<
    Record<number, boolean>
  >({});
  const [weeklySummaryErrors, setWeeklySummaryErrors] = useState<
    Record<number, string>
  >({});
  const [clientModalClientId, setClientModalClientId] = useState<number | null>(null);
  const [clientFilter, setClientFilter] = useState("");
  const [activePanel, setActivePanel] =
    useState<ManagerPanel>("client");
  const [selectedDrugDetailSeq, setSelectedDrugDetailSeq] = useState<
    string | null
  >(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");
  const [clientDetails, setClientDetails] = useState<Record<number, ClientDetail>>({});
  const [chatRefreshToken, setChatRefreshToken] = useState(0);
  const [chatView, setChatView] = useState<"rooms" | "search">("rooms");
  const defaultProfileImage = resolveProfileImageUrl("/image/픽토그램.png") || "/image/픽토그램.png";
  const logoImage = resolveProfileImageUrl("/image/logo.png") || "/image/logo.png";
  const getProfileImage = (url?: string | null) =>
    url && url.trim().length > 0
      ? resolveProfileImageUrl(url) || defaultProfileImage
      : defaultProfileImage;
  const formatAddress = (addr?: string | null, detail?: string | null) => {
    const base = addr?.trim() ?? "";
    const sub = detail?.trim() ?? "";
    if (base && sub) return `${base} ${sub}`;
    return base || sub || "미등록";
  };
  const authHeaders = () => {
    if (typeof window === "undefined") return {};
    const token = window.localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const InfoChip = ({
    label,
    value,
    truncate,
  }: {
    label: string;
    value: string;
    truncate?: boolean;
  }) => (
    <div className="flex flex-col gap-0.5 rounded-lg bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <span
        className={`text-sm font-semibold text-slate-900 ${truncate ? "truncate" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
  const computeInternationalAge = (birthDate?: string | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  };
  const updatePlanForm = (
    clientId: number,
    updater: (current: PlanFormState) => PlanFormState
  ) => {
    setPlanForms((prev) => {
      const current = prev[clientId] ?? createInitialFormState();
      return {
        ...prev,
        [clientId]: updater(current),
      };
    });
  };

  const updatePlanFormItem = (
    clientId: number,
    itemIndex: number,
    updater: (current: PlanFormItemState) => PlanFormItemState,
    options: { resetStatus?: boolean } = {}
  ) => {
    const { resetStatus = false } = options;
    updatePlanForm(clientId, (current) => {
      const items = [...current.items];
      const target = items[itemIndex] ?? createPlanFormItemState();
      items[itemIndex] = updater(target);
      return {
        ...current,
        items,
        ...(resetStatus ? { error: "", message: "" } : {}),
      };
    });
  };

  const loadWeeklySummaryForClient = useCallback(
    async (clientId: number) => {
      setWeeklySummaryLoading((prev) => ({ ...prev, [clientId]: true }));
      setWeeklySummaryErrors((prev) => ({ ...prev, [clientId]: "" }));
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/clients/${clientId}/medication/logs/weekly`
        );
        if (!response.ok) {
          const message = await extractApiError(
            response,
            "주간 복약 현황을 불러오지 못했습니다."
          );
          throw new Error(message);
        }
        const summary: MedicationWeeklySummary = await response.json();
        setWeeklySummaries((prev) => ({ ...prev, [clientId]: summary }));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "주간 복약 현황을 불러오지 못했습니다.";
        setWeeklySummaries((prev) => ({ ...prev, [clientId]: null }));
        setWeeklySummaryErrors((prev) => ({ ...prev, [clientId]: message }));
      } finally {
        setWeeklySummaryLoading((prev) => ({ ...prev, [clientId]: false }));
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const accessToken = window.localStorage.getItem("accessToken");
    const role = window.localStorage.getItem("userRole");

    if (!accessToken || role !== "MANAGER") {
      router.replace("/");
      return;
    }

    const storedEmail = window.localStorage.getItem("userEmail") ?? "";
    const storedUserId = window.localStorage.getItem("userId");
    const userId = storedUserId ? Number(storedUserId) : null;
    setManager({
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
          setManager((prev) => ({
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

  const favoritesKey = manager.userId ? `managerFavoriteClients:${manager.userId}` : null;

  // 즐겨찾기 로드 (사용자 기준)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!manager.userId) {
      setFavoriteClientIds([]);
      return;
    }
    try {
      const key = favoritesKey ?? "managerFavoriteClients";
      const storedFavorites = window.localStorage.getItem(key);
      const legacy = window.localStorage.getItem("managerFavoriteClients");
      const source = storedFavorites ?? legacy;
      if (source) {
        const parsed = JSON.parse(source);
        if (Array.isArray(parsed)) {
          const normalized = Array.from(
            new Set(
              parsed
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id) && id > 0),
            ),
          );
          setFavoriteClientIds(normalized);
        }
      }
    } catch {
      // ignore parse error
    }
  }, [manager.userId, favoritesKey]);

  // 즐겨찾기 저장
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const key = favoritesKey ?? "managerFavoriteClients";
    try {
      window.localStorage.setItem(key, JSON.stringify(favoriteClientIds));
    } catch {
      // ignore storage error
    }
  }, [favoriteClientIds, favoritesKey]);

  const loadDashboard = useCallback(async () => {
    if (!manager.userId) {
      return;
    }

    setDashboardLoading(true);
    setDashboardError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/managers/${manager.userId}/dashboard`
      );
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "매니저 대시보드를 불러오지 못했습니다."
        );
        throw new Error(message);
      }

      const data: ManagerDashboardResponse = await response.json();
      const normalizedClients = data.clients.map((client) => ({
        ...client,
        latestMedicationLogs: [...(client.latestMedicationLogs ?? [])].sort(
          (a, b) =>
            new Date(b.logTimestamp).getTime() -
            new Date(a.logTimestamp).getTime()
        ),
      }));

      const mergedClients: ManagerClientSummary[] = await Promise.all(
        normalizedClients.map(async (client) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/users/${client.clientId}`, {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
              },
            });
            if (!res.ok) return client;
            const detail: ClientDetail = await res.json();
            const birthDate = detail.birthDate ?? client.birthDate ?? null;
            const computedAge = computeInternationalAge(birthDate);
            return {
              ...client,
              email: detail.email ?? client.email,
              birthDate,
              gender: detail.gender ?? client.gender,
              address: detail.address ?? client.address,
              detailAddress: detail.detailAddress ?? client.detailAddress,
              zipCode: detail.zipCode ?? client.zipCode,
              profileImageUrl: detail.profileImageUrl ?? client.profileImageUrl,
              age:
                typeof detail.age === "number" && detail.age > 0
                  ? detail.age
                  : typeof client.age === "number" && client.age > 0
                  ? client.age
                  : typeof computedAge === "number"
                  ? computedAge
                  : null,
            };
          } catch {
            return client;
          }
        })
      );

      setClientDetails((prev) => {
        const next = { ...prev };
        mergedClients.forEach((c) => {
          next[c.clientId] = {
            email: c.email,
            address: c.address,
            detailAddress: c.detailAddress,
            zipCode: c.zipCode,
            birthDate: c.birthDate,
            gender: c.gender,
            age: c.age,
            profileImageUrl: c.profileImageUrl,
          };
        });
        return next;
      });

      const normalized: ManagerDashboardResponse = {
        ...data,
        clients: mergedClients,
      };

      setDashboard(normalized);
      setManagerProfileId(data.managerId ?? null);
      const clients = normalized.clients;
      setPlanForms((prev) => {
        const next = { ...prev };
        clients.forEach((client) => {
          if (!next[client.clientId]) {
            next[client.clientId] = createInitialFormState();
          }
        });
        return next;
      });
      clients.forEach((client) => {
        loadWeeklySummaryForClient(client.clientId);
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "매니저 대시보드를 불러오지 못했습니다.";
      setDashboardError(message);
      setDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [manager.userId, loadWeeklySummaryForClient]);

  useEffect(() => {
    if (!isReady || !manager.userId) {
      return;
    }
    loadDashboard();
  }, [isReady, manager.userId, loadDashboard]);

  const avatarInitial = useMemo(() => {
    if (manager.name && manager.name.length > 0) {
      return manager.name.slice(0, 1).toUpperCase();
    }
    if (manager.email && manager.email.length > 0) {
      return manager.email.slice(0, 1).toUpperCase();
    }
    return "M";
  }, [manager.email, manager.name]);

  const handleAvatarChange = async (file: File | null) => {
    if (!file || !manager.userId) {
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
        `${API_BASE_URL}/api/users/${manager.userId}/profile-image`,
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
      const data: UserSummary & { profileImageUrl?: string | null } = await response.json();
      setManager((prev) => ({
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

  const [activeStat, setActiveStat] = useState<(typeof managerStats)[number] | null>(null);
  type AlertTab = "overdue" | "chat" | "emergency";
  const [managerAlertTab, setManagerAlertTab] = useState<AlertTab>("overdue");
  const [alertPage, setAlertPage] = useState<Record<AlertTab, number>>({
    overdue: 0,
    chat: 0,
    emergency: 0,
  });
  const [managerAlertsAcknowledged, setManagerAlertsAcknowledged] = useState(false);
  const PAGE_SIZE = 10;

  const todayToken = useMemo(() => {
    const tokens = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    return tokens[new Date().getDay()] ?? "ALL";
  }, []);

  const todayDateString = useMemo(() => new Date().toISOString().split("T")[0] ?? "", []);
  const upcomingTodayPlans = useMemo(() => {
    const now = new Date();
    const list: Array<{ clientName: string; medicineName: string; time: string; planId: number }> = [];
    (dashboard?.clients ?? []).forEach((client) => {
      (client.medicationPlans ?? []).forEach((plan) => {
        if (!plan.active) return;
        const days = (plan.daysOfWeek ?? []).map((d) => d.toUpperCase());
        const dueToday = days.includes("ALL") || days.includes(todayToken);
        if (!dueToday) return;
        const [h, m] = (plan.alarmTime ?? "").split(":");
        const alarm = new Date(now);
        alarm.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
        if (Number.isNaN(alarm.getTime())) return;
        if (alarm.getTime() <= now.getTime()) return;
        list.push({
          clientName: client.clientName ?? "이용자",
          medicineName: plan.medicineName ?? "약품",
          time: plan.alarmTime?.slice(0, 5) ?? "",
          planId: plan.id,
        });
      });
    });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [dashboard, todayToken]);

  const managerStats = useMemo(() => {
    const total = dashboard?.clients.length ?? 0;
    const pendingToday = upcomingTodayPlans.length;
    const alerts = managerAlertsAcknowledged ? 0 : dashboard?.activeAlertCount ?? 0;
    return [
      {
        key: "care",
        label: "복약관리 인원",
        value: dashboardLoading && !dashboard ? "확인 중" : `${total}명`,
        hint: total > 0 ? "현재 담당 중인 이용자 수" : "담당 이용자가 없습니다.",
        accent: "bg-indigo-100 text-indigo-700",
        badge: "CARE",
        detail:
          total > 0
            ? "담당 중인 이용자의 복약 일정과 알림을 정기적으로 점검해주세요."
            : "아직 담당 인원이 없습니다. 관리자나 매칭을 통해 배정해 주세요.",
        items: (dashboard?.clients ?? [])
                .slice(0, 5)
                .map((c) => `${c.clientName} / 일정 ${c.medicationPlans.length}건 / 알림 ${c.emergencyAlerts.length}건`),
      },
      {
        key: "pending",
        label: "대기 중 복약 일정",
        value: dashboardLoading && !dashboard ? "확인 중" : `${pendingToday}건`,
        hint: pendingToday > 0 ? "오늘 예정된 복약 일정이 있습니다." : "현재 시간 이후 예정된 일정이 없습니다.",
        accent: "bg-amber-100 text-amber-700",
        badge: "PLAN",
        detail:
          pendingToday > 0
            ? "오늘 복약 시간이 아직 남은 이용자를 확인하고 대비하세요."
            : "오늘 남은 복약 일정이 없습니다.",
        items: upcomingTodayPlans
                .slice(0, 5)
                .map((p) => `${p.time} · ${p.clientName} / ${p.medicineName}`),
      },
      {
        key: "alert",
        label: "미처리 알림",
        value: dashboardLoading && !dashboard ? "확인 중" : alerts > 0 ? `${alerts}건` : "없음",
        hint: alerts > 0 ? "즉시 확인이 필요합니다." : "미처리 알림이 없습니다.",
        accent: alerts > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
        badge: "ALERT",
        detail:
          alerts > 0
            ? "비상 알림을 우선 처리하고 이용자에게 연락해 주세요."
            : "처리 대기 중인 비상 알림이 없습니다.",
        items: (dashboard?.clients ?? [])
                .flatMap((c) => c.emergencyAlerts ?? [])
                .slice(0, 5)
                .map((a) => `알림 ${a.alertType ?? ""} / ${a.status ?? ""}`),
      },
    ];
  }, [dashboard, dashboardLoading, upcomingTodayPlans]);

  const emergencyAlerts = useMemo(
    () =>
      (dashboard?.clients ?? [])
        .flatMap((c) =>
          (c.emergencyAlerts ?? []).map((a) => {
            const time = a.alertTime ? a.alertTime.replace("T", " ").slice(0, 16) : "";
            const name = c.clientName != null ? `${c.clientName}` : "이용자";
            return `${name} 긴급 호출 / ${time} / ${a.status ?? ""}`;
          }),
        ),
    [dashboard],
  );

  const overdueAlerts = useMemo(() => {
    const now = new Date();
    const list: string[] = [];
    (dashboard?.clients ?? []).forEach((client) => {
      (client.medicationPlans ?? []).forEach((plan) => {
        if (!plan.active) return;
        const days = (plan.daysOfWeek ?? []).map((d) => d.toUpperCase());
        const dueToday = days.includes("ALL") || days.includes(todayToken);
        if (!dueToday) return;
        const [h, m] = (plan.alarmTime ?? "").split(":");
        const alarm = new Date(now);
        alarm.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
        if (alarm.getTime() > now.getTime()) return;
        const logs = client.latestMedicationLogs ?? [];
        const hasTodayLog = logs.some((log) => {
          const logDate = (log.logTimestamp ?? "").split("T")[0];
          const sameDay = logDate === todayDateString;
          if (!sameDay) return false;
          if (log.planId && plan.id) return log.planId === plan.id;
          return log.medicineId === plan.medicineId;
        });
        if (!hasTodayLog) {
          list.push(`${client.clientName} / ${plan.medicineName} / ${plan.alarmTime?.slice(0, 5) ?? ""} 확인 필요`);
        }
      });
    });
    return list;
  }, [dashboard, todayDateString, todayToken]);

  const [chatAlerts, setChatAlerts] = useState<Array<{ roomId: number; label: string }>>([]);

  useEffect(() => {
    const loadUnread = async () => {
      if (!manager.userId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/threads?userId=${manager.userId}`);
        if (!res.ok) return;
        const data: Array<{
          roomId: number;
          clientName?: string;
          managerName?: string;
          lastMessageSnippet?: string;
          readByManager: boolean;
        }> = await res.json();
        const unread = data
          .filter((t) => !t.readByManager)
          .map((t) => ({
            roomId: t.roomId,
            label: `${t.clientName ?? "이용자"} / ${t.lastMessageSnippet ?? "새 메시지"}`,
          }));
        setChatAlerts(unread);
      } catch {
        // ignore
      }
    };
    void loadUnread();
  }, [manager.userId]);

  const currentAlerts = useMemo(() => {
    if (managerAlertsAcknowledged) {
      return [];
    }
    switch (managerAlertTab) {
      case "overdue":
        return overdueAlerts;
      case "chat":
        return chatAlerts.map((c) => c.label);
      case "emergency":
        return emergencyAlerts;
      default:
        return [];
    }
  }, [managerAlertTab, overdueAlerts, chatAlerts, emergencyAlerts, managerAlertsAcknowledged]);

  const pagedAlerts = useMemo(() => {
    const page = alertPage[managerAlertTab] ?? 0;
    const start = page * PAGE_SIZE;
    return currentAlerts.slice(start, start + PAGE_SIZE);
  }, [alertPage, managerAlertTab, currentAlerts]);
  const managerHasAlerts = currentAlerts.length > 0;
  const managerAlertEmptyText = useMemo(() => {
    if (managerAlertsAcknowledged) return "모든 알림을 확인했습니다.";
    switch (managerAlertTab) {
      case "overdue":
        return "미복약 알림이 없습니다.";
      case "chat":
        return "미읽 메시지가 없습니다.";
      case "emergency":
        return "긴급 알림이 없습니다.";
      default:
        return "알림이 없습니다.";
    }
  }, [managerAlertTab, managerAlertsAcknowledged]);

  const [ackLoading, setAckLoading] = useState(false);
  const effectiveOverdueCount = managerAlertsAcknowledged ? 0 : overdueAlerts.length;
  const effectiveChatCount = managerAlertsAcknowledged ? 0 : chatAlerts.length;
  const effectiveEmergencyCount = managerAlertsAcknowledged ? 0 : emergencyAlerts.length;
  const totalPendingManagerAlerts = effectiveOverdueCount + effectiveChatCount + effectiveEmergencyCount;

  const handleManagerAcknowledgeAlerts = useCallback(async () => {
    if (!manager.userId) return;
    setAckLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/emergency/alerts/acknowledge-all?managerId=${manager.userId}`,
        { method: "POST" },
      );
      if (!response.ok) {
        const message = await extractApiError(response, "알림을 확인 처리하지 못했습니다.");
        throw new Error(message);
      }
      setManagerAlertsAcknowledged(true);
      setAlertPage({ overdue: 0, chat: 0, emergency: 0 });
      setChatAlerts([]);
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "알림을 확인 처리하지 못했습니다.";
      setDashboardError(message);
    } finally {
      setAckLoading(false);
    }
  }, [manager.userId, loadDashboard]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(currentAlerts.length / PAGE_SIZE)), [currentAlerts.length]);

  const filteredClients = useMemo(() => {
    if (!dashboard?.clients) {
      return [];
    }
    const favoriteSet = new Set(favoriteClientIds);
    const favoritesOnly = dashboard.clients.filter((client) =>
      favoriteSet.has(client.clientId),
    );
    const keyword = clientFilter.trim().toLowerCase();
    if (!keyword) {
      return favoritesOnly;
    }
    return favoritesOnly.filter((client) =>
      client.clientName?.toLowerCase().includes(keyword),
    );
  }, [dashboard, clientFilter, favoriteClientIds]);

  const favoriteClientCount = useMemo(() => {
    if (!dashboard?.clients) return 0;
    const favoriteSet = new Set(favoriteClientIds);
    return dashboard.clients.filter((client) => favoriteSet.has(client.clientId)).length;
  }, [dashboard, favoriteClientIds]);

  const isFavorite = useCallback(
    (clientId: number) => favoriteClientIds.includes(clientId),
    [favoriteClientIds],
  );

  const toggleFavorite = useCallback((clientId: number) => {
    setFavoriteClientIds((prev) => {
      const set = new Set(prev);
      if (set.has(clientId)) {
        set.delete(clientId);
      } else {
        set.add(clientId);
      }
      return Array.from(set);
    });
  }, []);

  const openClientModalById = useCallback(
    (clientId: number) => {
      if (!dashboard?.clients) return;
      const exists = dashboard.clients.some((c) => c.clientId === clientId);
      if (exists) {
        setClientModalClientId(clientId);
      }
    },
    [dashboard],
  );

  const selectedClient =
    clientModalClientId && dashboard?.clients
      ? dashboard.clients.find((client) => client.clientId === clientModalClientId) ?? null
      : null;
  const selectedClientDetail = selectedClient
    ? clientDetails[selectedClient.clientId] ?? null
    : null;
  const selectedClientForm = selectedClient
    ? planForms[selectedClient.clientId] ?? createInitialFormState()
    : null;
  const selectedSummary = selectedClient
    ? weeklySummaries[selectedClient.clientId] ?? null
    : null;
  const selectedSummaryLoading = selectedClient
    ? weeklySummaryLoading[selectedClient.clientId] ?? false
    : false;
  const selectedSummaryError = selectedClient
    ? weeklySummaryErrors[selectedClient.clientId] ?? ""
    : "";
  const closeClientModal = () => setClientModalClientId(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const body = document.body;
    const docEl = document.documentElement;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;
    const originalPosition = body.style.position;
    const originalTop = body.style.top;
    const originalWidth = body.style.width;
    const originalDocOverscroll = docEl.style.overscrollBehavior;
    const scrollY = window.scrollY;

    if (clientModalClientId) {
      const scrollBarWidth = window.innerWidth - docEl.clientWidth;
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
      body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        body.style.paddingRight = `${scrollBarWidth}px`;
      }
      docEl.style.overscrollBehavior = "none";
    }

    return () => {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
      body.style.position = originalPosition;
      body.style.top = originalTop;
      body.style.width = originalWidth;
      docEl.style.overscrollBehavior = originalDocOverscroll;
      if (clientModalClientId) {
        window.scrollTo(0, scrollY);
      }
    };
  }, [clientModalClientId]);

  useEffect(() => {
    const loadClientDetail = async (clientId: number) => {
      const existing = clientDetails[clientId];
      const needsMore =
        !existing ||
        !existing.address ||
        !existing.detailAddress ||
        !existing.profileImageUrl ||
        !existing.gender ||
        !existing.birthDate;
      if (!needsMore) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${clientId}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });
        if (!res.ok) return;
        const detail: ClientDetail = await res.json();
        setClientDetails((prev) => ({
          ...prev,
          [clientId]: detail,
        }));
      } catch {
        // ignore detail fetch errors
      }
    };

    if (selectedClient) {
      void loadClientDetail(selectedClient.clientId);
    }
  }, [selectedClient, clientDetails]);

  useEffect(() => {
    if (clientModalClientId === null) {
      return;
    }
    const exists = dashboard?.clients?.some(
      (client) => client.clientId === clientModalClientId,
    );
    if (!exists) {
      setClientModalClientId(null);
    }
  }, [clientModalClientId, dashboard]);

  useEffect(() => {
    if (clientModalClientId === null) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setClientModalClientId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clientModalClientId]);

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

  const dayOptions = useMemo(
    () => [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ],
    [],
  );

  const formatAlarmTime = (value: string) => {
    if (!value) {
      return "-";
    }
    return value.slice(0, 5);
  };

  const formatDateTime = (value: string) => {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
    const timePart = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
    return `${datePart} ${timePart}`;
  };

  const formatWeekdayLabel = useCallback((value: string) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    const labels = ["일", "월", "화", "수", "목", "금", "토"];
    return labels[date.getDay()] ?? "-";
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
        <p className={`mt-3 text-sm font-semibold ${config.text}`}>
          {config.label}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {day.scheduledCount > 0
            ? `${effectiveTaken}/${day.scheduledCount}`
            : day.manualLogCount > 0
            ? `기록 ${day.manualLogCount}`
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
        <p className={`text-[9px] font-semibold leading-tight ${config.text}`}>
          {config.label}
        </p>
        <p className="text-slate-500">
          {day.scheduledCount > 0
            ? `${effectiveTaken}/${day.scheduledCount}`
            : day.manualLogCount > 0
              ? `기록 ${day.manualLogCount}`
              : "0"}
        </p>
      </div>
    );
  };

  const mapStatusToLabel = useCallback((status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: "활성",
      WAITING_MATCH: "배정 대기",
      SUSPENDED: "이용 중지",
      DEACTIVATED: "비활성",
    };
    return labels[status] ?? status;
  }, []);

  const handleClientSearch = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }

    if (!manager.userId) {
      return;
    }

    const keyword = searchKeyword.trim();
    if (!keyword) {
      setSearchError("검색어를 입력해주세요.");
      setSearchMessage("");
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    setSearchMessage("");
    setAssignmentMessages({});
    setAssignmentStates({});

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/managers/${manager.userId}/clients/search?keyword=${encodeURIComponent(
          keyword
        )}&size=20`
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "이용자를 검색하지 못했습니다."
        );
        throw new Error(message);
      }

      const data: ManagerClientSearchResult[] = await response.json();
      const enriched = data.map((item) => {
        const computedAge =
          typeof item.age === "number" && item.age > 0
            ? item.age
            : computeInternationalAge(item.birthDate);
        return {
          ...item,
          age: typeof computedAge === "number" ? computedAge : null,
        };
      });

      const detailedResults = await Promise.all(
        enriched.map(async (item) => {
          const needsDetail =
            !item.birthDate ||
            !(typeof item.age === "number" && item.age > 0) ||
            !item.address ||
            !item.detailAddress ||
            !item.profileImageUrl ||
            !item.gender;
          if (!needsDetail) {
            return item;
          }
          try {
            const detailRes = await fetch(`${API_BASE_URL}/api/users/${item.clientId}`, {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                ...authHeaders(),
              },
            });
            if (!detailRes.ok) return item;
            const detail: {
              birthDate?: string | null;
              age?: number | null;
              gender?: string | null;
              address?: string | null;
              profileImageUrl?: string | null;
              detailAddress?: string | null;
            } = await detailRes.json();
            const birthDate = detail.birthDate ?? item.birthDate ?? null;
            const computedAge = computeInternationalAge(birthDate);
            return {
              ...item,
              birthDate,
              gender: detail.gender ?? item.gender ?? null,
              address: detail.address ?? item.address ?? null,
              detailAddress: detail.detailAddress ?? item.detailAddress ?? null,
              profileImageUrl: detail.profileImageUrl ?? item.profileImageUrl ?? null,
              age:
                typeof detail.age === "number" && detail.age > 0
                  ? detail.age
                  : typeof item.age === "number" && item.age > 0
                  ? item.age
                  : typeof computedAge === "number"
                  ? computedAge
                  : null,
            };
          } catch {
            return item;
          }
        })
      );

      setSearchResults(detailedResults);
      setSearchMessage(data.length === 0 ? "검색 결과가 없습니다." : "");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "이용자를 검색하지 못했습니다.";
      setSearchError(message);
      setSearchResults([]);
      setSearchMessage("");
    } finally {
      setSearchLoading(false);
    }
  };

  const openChatRoomForClient = useCallback(
    async (clientId: number): Promise<ChatRoomEnsureResult> => {
      if (!managerProfileId) {
        return {
          success: false,
          message: "??? ?? ID? ??? ? ?? ???? ??? ?????.",
        };
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/rooms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId,
            managerId: managerProfileId,
          }),
        });

        if (!response.ok) {
          const message = await extractApiError(
            response,
            "???? ???? ?????."
          );
          throw new Error(message);
        }

        await response.json();
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "???? ???? ?????.";
        return { success: false, message };
      }
    },
    [managerProfileId]
  );

  const handleAssignClient = async (clientId: number) => {
    if (!manager.userId) {
      return;
    }

    setAssignmentStates((prev) => ({ ...prev, [clientId]: "assigning" }));
    setAssignmentMessages((prev) => ({ ...prev, [clientId]: undefined }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/managers/${manager.userId}/clients/assignments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ clientId }),
        }
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "배정하지 못했습니다."
        );
        throw new Error(message);
      }

      await loadDashboard();
      if (searchKeyword.trim()) {
        await handleClientSearch();
      }
      const chatResult = await openChatRoomForClient(clientId);
      const successText = chatResult.success
        ? "배정하고 채팅방을 자동으로 개설했습니다."
        : `채팅방 개설 중 문제가 발생했습니다.${
            chatResult.message ? ` ${chatResult.message}` : ""
          }`;
      setAssignmentMessages((prev) => ({
        ...prev,
        [clientId]: {
          type: chatResult.success ? "success" : "error",
          text: successText,
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "배정하지 못했습니다.";
      setAssignmentMessages((prev) => ({
        ...prev,
        [clientId]: { type: "error", text: message },
      }));
    } finally {
      setAssignmentStates((prev) => ({ ...prev, [clientId]: "idle" }));
    }
  };

  const handleUnassignClient = async (clientId: number) => {
    if (!manager.userId) {
      return;
    }

    setAssignmentStates((prev) => ({ ...prev, [clientId]: "unassigning" }));
    setAssignmentMessages((prev) => ({ ...prev, [clientId]: undefined }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/managers/${manager.userId}/clients/assignments/${clientId}`,
        {
          method: "DELETE",
          headers: {
            ...authHeaders(),
          },
        }
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "배정을 취소하지 못했습니다."
        );
        throw new Error(message);
      }

      await loadDashboard();
      if (searchKeyword.trim()) {
        await handleClientSearch();
      }

      setAssignmentMessages((prev) => ({
        ...prev,
        [clientId]: { type: "success", text: "배정을 취소했습니다." },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "배정을 취소하지 못했습니다.";
      setAssignmentMessages((prev) => ({
        ...prev,
        [clientId]: { type: "error", text: message },
      }));
    } finally {
      setAssignmentStates((prev) => ({ ...prev, [clientId]: "idle" }));
    }
  };

  const handleMedicineSearch = async (clientId: number, itemIndex: number) => {
    const form = planForms[clientId] ?? createInitialFormState();
    const item = form.items[itemIndex];
    if (!item) {
      return;
    }

    const keyword = item.medicineKeyword.trim();
    if (!keyword) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "약품명을 먼저 입력해주세요.",
        message: "",
      }));
      return;
    }

    updatePlanFormItem(
      clientId,
      itemIndex,
      (current) => ({
        ...current,
        searching: true,
        medicineResults: [],
      }),
      { resetStatus: true }
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/drugs/search?query=${encodeURIComponent(
          keyword
        )}&size=12`
      );
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "약품 정보를 조회할 수 없습니다."
        );
        throw new Error(message);
      }

      const payload: { items: EasyDrugSearchResult[] } = await response.json();
      const medicines = payload.items ?? [];
      updatePlanFormItem(clientId, itemIndex, (current) => ({
        ...current,
        medicineResults: medicines,
        searching: false,
      }));
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: medicines.length === 0 ? "검색 결과가 없습니다." : "",
        message: "",
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "약품 정보를 조회할 수 없습니다.";
      updatePlanFormItem(clientId, itemIndex, (current) => ({
        ...current,
        searching: false,
      }));
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: message,
        message: "",
      }));
    }
  };

  const handleSelectMedicine = async (
    clientId: number,
    itemIndex: number,
    medicine: EasyDrugSearchResult
  ) => {
    updatePlanFormItem(
      clientId,
      itemIndex,
      (current) => ({
        ...current,
        searching: true,
      }),
      { resetStatus: true }
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/medicines/easy-drug/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemSeq: medicine.itemSeq,
            itemName: medicine.itemName,
          }),
        }
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "약품 정보를 가져오지 못했습니다."
        );
        throw new Error(message);
      }

      const summary: MedicineSummary = await response.json();
      updatePlanFormItem(clientId, itemIndex, (current) => ({
        ...current,
        mode: "search",
        selectedMedicineId: summary.id,
        medicineKeyword: summary.name ?? medicine.itemName,
        medicineResults: [],
        manualMedicine: createEmptyManualMedicine(),
        searching: false,
      }));
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "",
        message: "",
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "약품 정보를 가져오지 못했습니다.";
      updatePlanFormItem(clientId, itemIndex, (current) => ({
        ...current,
        searching: false,
      }));
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: message,
        message: "",
      }));
    }
  };

  const handlePlanModeChange = (
    clientId: number,
    itemIndex: number,
    mode: "search" | "manual"
  ) => {
    updatePlanFormItem(
      clientId,
      itemIndex,
      (current) => {
        if (current.mode === mode) {
          return current;
        }
        if (mode === "manual") {
          const nextManual = createEmptyManualMedicine();
          nextManual.name = current.medicineKeyword.trim();
          return {
            ...current,
            mode,
            selectedMedicineId: null,
            medicineResults: [],
            manualMedicine: nextManual,
            searching: false,
          };
        }

        return {
          ...current,
          mode,
          medicineKeyword: current.manualMedicine.name.trim(),
          selectedMedicineId: null,
          manualMedicine: createEmptyManualMedicine(),
          searching: false,
        };
      },
      { resetStatus: true }
    );
  };

  const handleManualFieldChange = (
    clientId: number,
    itemIndex: number,
    field: keyof ManualMedicineForm,
    value: string
  ) => {
    updatePlanFormItem(
      clientId,
      itemIndex,
      (current) => ({
        ...current,
        manualMedicine: {
          ...current.manualMedicine,
          [field]: value,
        },
      }),
      { resetStatus: true }
    );
  };

  const handleAddPlanItem = (clientId: number) => {
    updatePlanForm(clientId, (current) => ({
      ...current,
      items: [...current.items, createPlanFormItemState()],
      error: "",
      message: "",
    }));
  };

  const handleRemovePlanItem = (clientId: number, itemIndex: number) => {
    updatePlanForm(clientId, (current) => {
      if (current.items.length <= 1) {
        return current;
      }

      const nextItems = current.items.filter((_, index) => index !== itemIndex);
      return {
        ...current,
        items: nextItems.length > 0 ? nextItems : [createPlanFormItemState()],
        error: "",
        message: "",
      };
    });
  };

  const handleToggleDay = (clientId: number, dayValue: string) => {
    setPlanForms((prev) => {
      const form = prev[clientId] ?? createInitialFormState();
      const nextDays = form.daysOfWeek.includes(dayValue)
        ? form.daysOfWeek.filter((day) => day !== dayValue)
        : [...form.daysOfWeek, dayValue];
      return {
        ...prev,
        [clientId]: {
          ...form,
          daysOfWeek: nextDays,
          error: "",
          message: "",
        },
      };
    });
  };

  const handlePlanSubmit = async (
    clientId: number,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const form = planForms[clientId] ?? createInitialFormState();

    if (form.items.length === 0) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "최소 1개 이상의 약품을 추가해주세요.",
      }));
      return;
    }

    for (let index = 0; index < form.items.length; index += 1) {
      const item = form.items[index];
      if (!item) {
        continue;
      }

      if (item.mode === "search" && !item.selectedMedicineId) {
        updatePlanForm(clientId, (current) => ({
          ...current,
          error: `복약 항목 ${index + 1}의 약품을 검색하여 선택해주세요.`,
        }));
        return;
      }

      if (item.mode === "manual" && !item.manualMedicine.name.trim()) {
        updatePlanForm(clientId, (current) => ({
          ...current,
          error: `복약 항목 ${index + 1}의 약품 이름을 입력해주세요.`,
        }));
        return;
      }

      const dosageAmountRaw = item.dosageAmount.trim();
      const dosageAmountValue = Number(dosageAmountRaw);
      if (
        !dosageAmountRaw ||
        Number.isNaN(dosageAmountValue) ||
        dosageAmountValue <= 0
      ) {
        updatePlanForm(clientId, (current) => ({
          ...current,
          error: `복약 항목 ${index + 1}의 복용량을 1 이상으로 입력해주세요.`,
        }));
        return;
      }

      if (!item.dosageUnit.trim()) {
        updatePlanForm(clientId, (current) => ({
          ...current,
          error: `복약 항목 ${index + 1}의 복용 단위를 입력해주세요.`,
        }));
        return;
      }
    }

    if (!form.alarmTime) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "알람 시간을 선택해주세요.",
      }));
      return;
    }

    if (form.daysOfWeek.length === 0) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "복용 요일을 최소 1개 이상 선택해주세요.",
      }));
      return;
    }

    updatePlanForm(clientId, (current) => ({
      ...current,
      submitting: true,
      error: "",
      message: "",
    }));

    try {
      const sanitizeOptional = (value: string) => {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const itemsPayload = form.items.map((item) => {
        const base = {
          dosageAmount: Number(item.dosageAmount),
          dosageUnit: item.dosageUnit.trim(),
        };

        if (item.mode === "manual") {
          return {
            ...base,
            manualMedicine: {
              name: item.manualMedicine.name.trim(),
              productCode: sanitizeOptional(item.manualMedicine.productCode),
              efficacy: sanitizeOptional(item.manualMedicine.efficacy),
              usageDosage: sanitizeOptional(item.manualMedicine.usageDosage),
              caution: sanitizeOptional(item.manualMedicine.caution),
              sideEffects: sanitizeOptional(item.manualMedicine.sideEffects),
              description: sanitizeOptional(item.manualMedicine.description),
            },
          };
        }

        return {
          ...base,
          medicineId: item.selectedMedicineId,
        };
      });

      const response = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/medication/plans/batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // 백엔드 LocalTime 디시리얼라이저는 초 단위를 요구하므로 HH:mm → HH:mm:ss 로 보낸다.
            alarmTime: form.alarmTime ? `${form.alarmTime}:00` : "",
            daysOfWeek: form.daysOfWeek,
            items: itemsPayload,
          }),
        }
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "복약 일정을 등록하지 못했습니다."
        );
        throw new Error(message);
      }

      await loadDashboard();
      const successMessage =
        form.items.length > 1
          ? `${form.items.length}개의 복약 일정이 등록되었습니다.`
          : "복약 일정이 등록되었습니다.";
      setPlanForms((prev) => ({
        ...prev,
        [clientId]: {
          ...createInitialFormState(),
          message: successMessage,
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "복약 일정을 등록하지 못했습니다.";
      updatePlanForm(clientId, (current) => ({
        ...current,
        submitting: false,
        error: message,
      }));
    } finally {
      updatePlanForm(clientId, (current) => ({
        ...current,
        submitting: false,
      }));
    }
  };

  const handleDeletePlan = async (clientId: number, planId: number) => {
    setDeleteProcessing((prev) => ({ ...prev, [planId]: "loading" }));
    setPlanMessages((prev) => ({ ...prev, [planId]: undefined }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/medication/plans/${planId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "복약 일정을 삭제하지 못했습니다."
        );
        throw new Error(message);
      }

      await loadDashboard();
      setPlanMessages((prev) => ({
        ...prev,
        [planId]: { type: "success", text: "복약 일정이 삭제되었습니다." },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "복약 일정을 삭제하지 못했습니다.";
      setPlanMessages((prev) => ({
        ...prev,
        [planId]: { type: "error", text: message },
      }));
    } finally {
      setDeleteProcessing((prev) => ({ ...prev, [planId]: "idle" }));
    }
  };

  const handleUpdatePlan = async (
    clientId: number,
    planId: number,
    payload: Partial<{
      dosageAmount: number;
      dosageUnit: string;
      alarmTime: string;
      daysOfWeek: string[];
      active: boolean;
      medicineId: number | null;
      manualMedicine?: Partial<ManualMedicineForm>;
    }>
  ) => {
    setPlanMessages((prev) => ({ ...prev, [planId]: undefined }));
    updatePlanForm(clientId, (current) => ({
      ...current,
      submitting: true,
      error: "",
      message: "",
    }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/medication/plans/${planId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            daysOfWeek: payload.daysOfWeek ?? [],
            active: payload.active ?? true,
          }),
        }
      );
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "복약 일정을 수정하지 못했습니다."
        );
        throw new Error(message);
      }
      await loadDashboard();
      setPlanMessages((prev) => ({
        ...prev,
        [planId]: { type: "success", text: "복약 일정이 수정되었습니다." },
      }));
      setEditingPlanId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "복약 일정을 수정하지 못했습니다.";
      setPlanMessages((prev) => ({
        ...prev,
        [planId]: { type: "error", text: message },
      }));
    } finally {
      updatePlanForm(clientId, (current) => ({
        ...current,
        submitting: false,
      }));
    }
  };

  const beginEditPlan = (plan: MedicationPlan) => {
    setEditingPlanId(plan.id);
    setEditingForms((prev) => ({
      ...prev,
      [plan.id]: {
        dosageAmount: String(plan.dosageAmount),
        dosageUnit: plan.dosageUnit,
        alarmTime: plan.alarmTime,
        days: new Set(plan.daysOfWeek.map((d) => d.toUpperCase())),
        active: plan.active,
      },
    }));
  };

  const updateEditField = (planId: number, updater: (draft: {
    dosageAmount: string;
    dosageUnit: string;
    alarmTime: string;
    days: Set<string>;
    active: boolean;
  }) => void) => {
    setEditingForms((prev) => {
      const current = prev[planId];
      if (!current) return prev;
      const next = { ...current, days: new Set(current.days) };
      updater(next);
      return { ...prev, [planId]: next };
    });
  };

  const handleRecordMedication = async (
    clientId: number,
    plan: MedicationPlan
  ) => {
    setLogProcessing((prev) => ({ ...prev, [plan.id]: "loading" }));
    setLogMessages((prev) => ({ ...prev, [plan.id]: undefined }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/medication/logs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId: plan.id,
            medicineId: plan.medicineId,
            logTimestamp: new Date().toISOString(),
            notes: "매니저가 복약을 확인했습니다.",
          }),
        }
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "복약 확인을 저장하지 못했습니다."
        );
        throw new Error(message);
      }

      const savedLog: MedicationLog = await response.json();

      setDashboard((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          clients: prev.clients.map((client) => {
            if (client.clientId !== clientId) {
              return client;
            }
            const nextLogs = [
              savedLog,
              ...(client.latestMedicationLogs ?? []).filter((log) => log.id !== savedLog.id),
            ]
              .sort(
                (a, b) =>
                  new Date(b.logTimestamp).getTime() -
                  new Date(a.logTimestamp).getTime()
              )
              .slice(0, 5);
            return {
              ...client,
              latestMedicationLogs: nextLogs,
            };
          }),
        };
      });

      await loadDashboard();
      setLogMessages((prev) => ({
        ...prev,
        [plan.id]: { type: "success", text: "복약 확인이 저장되었습니다." },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "복약 확인을 저장하지 못했습니다.";
      setLogMessages((prev) => ({
        ...prev,
        [plan.id]: { type: "error", text: message },
      }));
    } finally {
      setLogProcessing((prev) => ({ ...prev, [plan.id]: "idle" }));
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

  const renderClientDetailSections = (
    client: ManagerClientSummary,
    options: {
      form: PlanFormState;
      summary: MedicationWeeklySummary | null;
      summaryLoadingState: boolean;
      summaryError: string;
    },
  ): JSX.Element => {
    const { form, summary, summaryLoadingState, summaryError } = options;
    return (
      <>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                주간 복약 현황
              </p>
              <h4 className="text-lg font-semibold text-slate-900 sm:text-xl">
                최근 7일 복약 확인
              </h4>
              <p className="text-xs text-slate-500">
                복약 일정이 있는 경우 주간 현황을 확인할 수 있습니다.
              </p>
            </div>
            <button
              className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-indigo-800 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={summaryLoadingState}
              onClick={() => loadWeeklySummaryForClient(client.clientId)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                  summaryLoadingState
                    ? "animate-spin border-indigo-100 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                ↻
              </span>
              <span>{summaryLoadingState ? "갱신 중..." : "주간 현황 새로고침"}</span>
            </button>
          </div>
          <div className="mt-4">
            {client.medicationPlans.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                복약 일정이 없습니다. 일정을 먼저 등록해주세요.
              </div>
            ) : summaryLoadingState && !summary ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                주간 현황을 불러오는 중입니다...
              </div>
            ) : summaryError ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {summaryError}
              </div>
            ) : summary && summary.days.length > 0 ? (
              <>
                <div className="grid grid-cols-7 gap-1 sm:hidden">
                  {summary.days.map((day) => (
                    <WeeklyDayCompact
                      key={`mobile-weekly-${client.clientId}-${day.date}`}
                      day={day}
                    />
                  ))}
                </div>
                <div className="hidden gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-7">
                  {summary.days.map((day) => (
                    <WeeklyDayCard
                      key={`desktop-weekly-${client.clientId}-${day.date}`}
                      day={day}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                아직 주간 복약 기록이 없습니다.
              </div>
            )}
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {client.medicationPlans.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                등록된 복약 일정이 없습니다. 아래 양식을 통해 일정을 추가해주세요.
              </div>
            ) : (
              client.medicationPlans.map((plan) => {
                const message = planMessages[plan.id];
                const logMessage = logMessages[plan.id];
                const latestLog =
                  client.latestMedicationLogs.find(
                    (log) => log.planId === plan.id,
                  ) ??
                  client.latestMedicationLogs.find(
                    (log) => !log.planId && log.medicineId === plan.medicineId,
                  );
                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-start sm:gap-4">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900 sm:text-lg">
                          {plan.medicineName}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {`${plan.dosageAmount}${plan.dosageUnit} · ${formatAlarmTime(
                            plan.alarmTime,
                          )} · ${plan.daysOfWeek.map(mapDayToLabel).join(", ")}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:ml-auto sm:justify-end">
                        <button
                          className={subtleActionButton}
                          onClick={() => beginEditPlan(plan)}
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] text-indigo-700"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                              <path d="M14.06 4.69l3.75 3.75" />
                            </svg>
                          </span>
                          수정
                        </button>
                        <button
                          className={`${subtleActionButton} hover:border-rose-200 hover:text-rose-700`}
                          disabled={deleteProcessing[plan.id] === "loading"}
                          onClick={() => handleDeletePlan(client.clientId, plan.id)}
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-[10px] text-rose-700"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 7h14" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M6 7l1-3h10l1 3" />
                              <path d="M5 7h14l-1 14H6L5 7z" />
                            </svg>
                          </span>
                          {deleteProcessing[plan.id] === "loading"
                            ? "삭제 중..."
                            : "삭제"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <p className="text-sm text-slate-600">
                        최근 확인:{" "}
                        {latestLog ? `${formatDateTime(latestLog.logTimestamp)}` : "기록 없음"}
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          className={`${subtleActionButton} ${
                            plan.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800"
                              : ""
                          }`}
                          onClick={() =>
                            handleUpdatePlan(client.clientId, plan.id, {
                              active: !plan.active,
                              dosageAmount: plan.dosageAmount,
                              dosageUnit: plan.dosageUnit,
                              alarmTime: plan.alarmTime,
                              daysOfWeek: plan.daysOfWeek,
                              medicineId: plan.medicineId,
                            })
                          }
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                              plan.active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          {plan.active ? "비활성화" : "활성화"}
                        </button>
                        <button
                          className={`${primaryActionButton} w-full sm:w-auto`}
                          disabled={logProcessing[plan.id] === "loading"}
                          onClick={() => handleRecordMedication(client.clientId, plan)}
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 12l5 5 9-9" />
                            </svg>
                          </span>
                            {logProcessing[plan.id] === "loading" ? "기록 중..." : "복약 확정"}
                          </button>
                      </div>
                    </div>
                    {editingPlanId === plan.id && editingForms[plan.id] && (
                      <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="flex flex-col gap-1 text-sm text-slate-700">
                            <span>복용량</span>
                            <input
                              type="number"
                              min={1}
                              value={editingForms[plan.id].dosageAmount}
                              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                              onChange={(event) =>
                                updateEditField(plan.id, (draft) => {
                                  draft.dosageAmount = event.target.value;
                                })
                              }
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-sm text-slate-700">
                            <span>단위</span>
                            <input
                              value={editingForms[plan.id].dosageUnit}
                              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                              onChange={(event) =>
                                updateEditField(plan.id, (draft) => {
                                  draft.dosageUnit = event.target.value;
                                })
                              }
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-sm text-slate-700">
                            <span>알람 시간</span>
                            <input
                              type="time"
                              value={editingForms[plan.id].alarmTime}
                              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                              onChange={(event) =>
                                updateEditField(plan.id, (draft) => {
                                  draft.alarmTime = event.target.value;
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dayOptions.map((day) => {
                            const checked = editingForms[plan.id].days.has(day);
                            return (
                              <label
                                key={day}
                                className={`relative inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                                  checked
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                  checked={checked}
                                  onChange={(event) =>
                                    updateEditField(plan.id, (draft) => {
                                      const next = new Set(draft.days);
                                      if (event.target.checked) next.add(day);
                                      else next.delete(day);
                                      draft.days = next;
                                    })
                                  }
                                />
                                {mapDayToLabel(day)}
                              </label>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={editingForms[plan.id].active}
                              onChange={(event) =>
                                updateEditField(plan.id, (draft) => {
                                  draft.active = event.target.checked;
                                })
                              }
                            />
                            활성화
                          </label>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <button
                            className={primaryActionButton}
                            type="button"
                            onClick={() =>
                              handleUpdatePlan(client.clientId, plan.id, {
                                dosageAmount: Number(editingForms[plan.id].dosageAmount) || plan.dosageAmount,
                                dosageUnit: editingForms[plan.id].dosageUnit || plan.dosageUnit,
                                alarmTime: editingForms[plan.id].alarmTime || plan.alarmTime,
                                daysOfWeek: Array.from(editingForms[plan.id].days),
                                active: editingForms[plan.id].active,
                                medicineId: plan.medicineId,
                              })
                            }
                          >
                            수정 저장
                          </button>
                          <button
                            className={subtleActionButton}
                            type="button"
                            onClick={() => setEditingPlanId(null)}
                          >
                            닫기
                          </button>
                        </div>
                      </div>
                    )}
                    {logMessage && (
                      <p
                        className={`mt-2 text-sm ${
                          logMessage.type === "success" ? "text-indigo-600" : "text-red-600"
                        }`}
                      >
                        {logMessage.text}
                      </p>
                    )}
                    {message && (
                      <p
                        className={`mt-1 text-xs ${
                          message.type === "success" ? "text-indigo-600" : "text-red-600"
                        }`}
                      >
                        {message.text}
                      </p>
                    )}
                  </div>
                );
              })
            )}

            <form
              className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
              onSubmit={(event) => handlePlanSubmit(client.clientId, event)}
            >
              <h4 className="text-sm font-semibold text-slate-900">복약 일정 추가</h4>
              <div className="flex flex-col gap-4">
                {form.items.map((item, index) => (
                  <div
                    key={`plan-item-${index}`}
                    className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          복약 항목 {index + 1}
                        </p>
                        {item.mode === "search" && item.selectedMedicineId && (
                          <p className="text-sm font-medium text-slate-700">
                            {item.medicineKeyword}
                          </p>
                        )}
                        {item.mode === "manual" &&
                          item.manualMedicine.name.trim().length > 0 && (
                            <p className="text-sm font-medium text-slate-700">
                              {item.manualMedicine.name}
                            </p>
                          )}
                      </div>
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlanItem(client.clientId, index)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
                        >
                          항목 삭제
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlanModeChange(client.clientId, index, "search")}
                        className={`rounded-md border px-4 py-2 text-xs font-semibold transition ${
                          item.mode === "search"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-300 bg-white text-slate-600 hover:border-indigo-300"
                        }`}
                      >
                        약 검색
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlanModeChange(client.clientId, index, "manual")}
                        className={`rounded-md border px-4 py-2 text-xs font-semibold transition ${
                          item.mode === "manual"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-300 bg-white text-slate-600 hover:border-indigo-300"
                        }`}
                      >
                        직접 입력
                      </button>
                    </div>

                    {item.mode === "search" ? (
                      <>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="약품명으로 검색"
                            value={item.medicineKeyword}
                            onChange={(event) =>
                              updatePlanFormItem(
                                client.clientId,
                                index,
                                (current) => ({
                                  ...current,
                                  medicineKeyword: event.target.value,
                                  selectedMedicineId: null,
                                }),
                                { resetStatus: true },
                              )
                            }
                          />
                          <button
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-indigo-400 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={item.searching}
                            onClick={(event) => {
                              event.preventDefault();
                              handleMedicineSearch(client.clientId, index);
                            }}
                          >
                            {item.searching ? "검색 중..." : "검색"}
                          </button>
                        </div>
                    {item.medicineResults.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-slate-500">
                          e약은요 검색 결과입니다. 일정을 등록할 약품을 선택하세요.
                        </p>
                        <div className="space-y-2">
                              {item.medicineResults.map((medicine) => (
                                <div
                                  key={medicine.itemSeq}
                                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                                >
                                  <div className="flex gap-3">
                                    {medicine.itemImage ? (
                                      <img
                                        src={medicine.itemImage}
                                        alt={medicine.itemName}
                                        className="h-16 w-16 rounded border border-slate-200 object-contain"
                                      />
                                    ) : (
                                      <div className="h-16 w-16 rounded border border-dashed border-slate-300" />
                                    )}
                                    <div className="flex-1 text-left">
                                      <p className="text-sm font-semibold text-slate-900">
                                        {medicine.itemName}
                                      </p>
                                      <p className="text-xs text-slate-600">
                                        {medicine.entpName ?? "제조사 정보 없음"}
                                      </p>
                                      <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-500">
                                        {medicine.etcOtcName && (
                                          <span className="rounded bg-white px-2 py-0.5">
                                            {medicine.etcOtcName}
                                          </span>
                                        )}
                                        {medicine.className && (
                                          <span className="rounded bg-white px-2 py-0.5">
                                            {medicine.className}
                                          </span>
                                        )}
                                        {medicine.chart && (
                                          <span className="rounded bg-white px-2 py-0.5">
                                            {medicine.chart}
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1 text-[11px] text-slate-500">
                                        품목 기준 코드: {medicine.itemSeq}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                                      disabled={item.searching}
                                      onClick={(event) => {
                                        event.preventDefault();
                                        handleSelectMedicine(client.clientId, index, medicine);
                                      }}
                                    >
                                      {item.searching ? "불러오는 중..." : "이 약 일정에 추가"}
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                                      onClick={(event) => {
                                        event.preventDefault();
                                        setSelectedDrugDetailSeq(medicine.itemSeq);
                                      }}
                                    >
                                      상세 보기
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <p className="text-xs text-slate-500">
                          검색 결과가 없을 때 직접 약품 정보를 입력하고 등록할 수 있습니다.
                        </p>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600">
                            약품 이름<span className="text-red-500">*</span>
                          </label>
                          <input
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="직접 입력할 약품 이름"
                            value={item.manualMedicine.name}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              handleManualFieldChange(
                                client.clientId,
                                index,
                                "name",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600">
                            제품 코드 (선택)
                          </label>
                          <input
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="예) 국문 제품 코드"
                            value={item.manualMedicine.productCode}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              handleManualFieldChange(
                                client.clientId,
                                index,
                                "productCode",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600">
                            효능 / 효과 (선택)
                          </label>
                          <textarea
                            className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="약품의 주요 효능을 입력하세요."
                            value={item.manualMedicine.efficacy}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                              handleManualFieldChange(
                                client.clientId,
                                index,
                                "efficacy",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600">
                            복용 방법 (선택)
                          </label>
                          <textarea
                            className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="예) 1일 3회, 1회 1정 등"
                            value={item.manualMedicine.usageDosage}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                              handleManualFieldChange(
                                client.clientId,
                                index,
                                "usageDosage",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600">
                            주의 사항 (선택)
                          </label>
                          <textarea
                            className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="주의사항이나 알레르기 정보를 입력하세요."
                            value={item.manualMedicine.caution}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                              handleManualFieldChange(
                                client.clientId,
                                index,
                                "caution",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600">
                            부작용 (선택)
                          </label>
                          <textarea
                            className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="예상되는 부작용을 입력하세요."
                            value={item.manualMedicine.sideEffects}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                              handleManualFieldChange(
                                client.clientId,
                                index,
                                "sideEffects",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600">
                            비고 (선택)
                          </label>
                          <textarea
                            className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="추가 메모를 입력하세요."
                            value={item.manualMedicine.description}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                              handleManualFieldChange(
                                client.clientId,
                                index,
                                "description",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">복용량</label>
                        <input
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          min={1}
                          type="number"
                          value={item.dosageAmount}
                          onChange={(event) =>
                            updatePlanFormItem(
                              client.clientId,
                              index,
                              (current) => ({
                                ...current,
                                dosageAmount: event.target.value,
                              }),
                              { resetStatus: true },
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">복용 단위</label>
                        <input
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="ex) 정, 캡슐"
                          value={item.dosageUnit}
                          onChange={(event) =>
                            updatePlanFormItem(
                              client.clientId,
                              index,
                              (current) => ({
                                ...current,
                                dosageUnit: event.target.value,
                              }),
                              { resetStatus: true },
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddPlanItem(client.clientId)}
                  className="rounded-md border border-dashed border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:border-indigo-400 hover:text-indigo-900"
                >
                  + 약품 항목 추가
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">알람 시간</label>
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  onChange={(event) =>
                    updatePlanForm(client.clientId, (current) => ({
                      ...current,
                      alarmTime: event.target.value,
                    }))
                  }
                  type="time"
                  value={form.alarmTime}
                />
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-medium text-slate-600">복용 요일</legend>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {allDays.map((day) => {
                    const isSelected = form.daysOfWeek.includes(day.value);
                    return (
                      <label key={day.value} className="relative block cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          checked={isSelected}
                          onChange={() => handleToggleDay(client.clientId, day.value)}
                        />
                        <span
                          className={`flex h-10 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-100 text-indigo-700 shadow-sm"
                              : "border-slate-300 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
                          } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500`}
                        >
                          {day.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              {form.error && <p className="text-sm text-red-600">{form.error}</p>}
              {form.message && <p className="text-sm text-indigo-600">{form.message}</p>}
              <button
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                disabled={form.submitting}
                type="submit"
              >
                {form.submitting ? "등록 중..." : "복약 일정 등록"}
              </button>
            </form>
          </div>
          <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">최근 복약 확인 기록</h4>
            {client.latestMedicationLogs.length === 0 ? (
              <p className="text-sm text-slate-600">기록이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {[...client.latestMedicationLogs]
                  .sort(
                    (a, b) =>
                      new Date(b.logTimestamp).getTime() - new Date(a.logTimestamp).getTime(),
                  )
                  .slice(0, 8)
                  .map((log) => (
                    <li
                      key={log.id}
                      className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      <p className="font-medium">{log.medicineName}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(log.logTimestamp)}
                      </p>
                      {log.notes && <p className="text-xs text-slate-500">{log.notes}</p>}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </>
    );
  };

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg bg-white px-6 py-8 shadow-sm">
          <p className="text-gray-600">매니저 정보를 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl bg-white p-4 shadow-lg sm:p-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-200 bg-indigo-50 text-lg font-semibold text-indigo-700">
                  {manager.profileImageUrl ? (
                    <img
                      src={manager.profileImageUrl}
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
                  onClick={() => router.push("/manager/profile/edit")}
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-col gap-1">
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
                    Manager
                  </p>
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {manager.name ? `${manager.name} 매니저` : "매니저"}
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
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 pb-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:pb-0">
                {managerQuickActions.map((action) => {
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
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {action.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {action.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
        </header>

        {activePanel === "client" && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 sm:p-6 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">관리 현황</h2>
                  <p className="text-sm text-slate-600">
                    복약 일정, 미처리 알림, 담당 인원을 한눈에 확인하세요.
                  </p>
                </div>
            </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {managerStats.map((stat) => (
                  <button
                    key={stat.key}
                    type="button"
                    onClick={() => setActiveStat(stat)}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow"
                  >
                    {(() => {
                      const isAlert = stat.key === "alert";
                      const pendingAlerts = managerAlertsAcknowledged ? 0 : totalPendingManagerAlerts;
                      const value = isAlert
                        ? pendingAlerts > 0
                          ? `${pendingAlerts}건`
                          : "없음"
                        : stat.value;
                      const hint = isAlert
                        ? pendingAlerts > 0
                          ? "즉시 확인이 필요합니다."
                          : "미처리 알림이 없습니다."
                        : stat.hint;
                      const accent = isAlert
                        ? pendingAlerts > 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                        : stat.accent;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">{stat.label}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${accent}`}>
                              {stat.badge}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900">{value}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{hint}</p>
                        </>
                      );
                    })()}
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
                      {activeStat.key === "alert" ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex flex-wrap gap-2">
                              {[
                                { key: "overdue", label: "미복약", count: effectiveOverdueCount },
                                { key: "chat", label: "메시지", count: effectiveChatCount },
                                { key: "emergency", label: "긴급 호출", count: effectiveEmergencyCount },
                              ].map((tab) => {
                                const active = managerAlertTab === tab.key;
                                return (
                                  <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setManagerAlertTab(tab.key as AlertTab)}
                                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                      active
                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                                    }`}
                                  >
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                      {tab.count}
                                    </span>
                                    {tab.label}
                                  </button>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              className="ml-auto inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={ackLoading || managerAlertsAcknowledged || totalPendingManagerAlerts === 0}
                              onClick={handleManagerAcknowledgeAlerts}
                            >
                              {ackLoading ? "처리 중..." : "전부 확인"}
                            </button>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                            {managerHasAlerts ? (
                              <ul className="space-y-2">
                                {pagedAlerts.map((item, idx) => {
                                  const absoluteIdx = (alertPage[managerAlertTab] ?? 0) * PAGE_SIZE + idx;
                                  return (
                                    <li
                                      key={`${managerAlertTab}-item-${idx}`}
                                      className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
                                      onClick={() => {
                                        if (managerAlertTab === "chat" && chatAlerts[absoluteIdx]) {
                                          const target = chatAlerts[absoluteIdx];
                                          setClientModalClientId(null);
                                          setActivePanel("chat");
                                          setTimeout(() => {
                                            const el = document.querySelector(`[data-room-id='${target.roomId}']`);
                                            if (el instanceof HTMLElement) {
                                              el.scrollIntoView({ behavior: "smooth", block: "center" });
                                            }
                                          }, 100);
                                        }
                                        if (managerAlertTab === "emergency") {
                                          const label = item;
                                          const roomId = label.match(/room (\\d+)/i)?.[1];
                                          if (roomId) {
                                            setClientModalClientId(null);
                                            setActivePanel("chat");
                                            setTimeout(() => {
                                              const el = document.querySelector(`[data-room-id='${roomId}']`);
                                              if (el instanceof HTMLElement) {
                                                el.scrollIntoView({ behavior: "smooth", block: "center" });
                                              }
                                            }, 100);
                                          }
                                        }
                                      }}
                                      role="button"
                                    >
                                      <span className="mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-100 px-2 text-[10px] font-bold text-indigo-700">
                                        {(alertPage[managerAlertTab] ?? 0) * PAGE_SIZE + idx + 1}
                                      </span>
                                      <span className="leading-relaxed">{item}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <div className="flex items-center justify-center rounded-lg bg-white px-3 py-3 text-sm text-slate-500">
                                {managerAlertEmptyText}
                              </div>
                            )}
                            {managerHasAlerts && totalPages > 1 && (
                              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                                <span>
                                  페이지 {(alertPage[managerAlertTab] ?? 0) + 1} / {totalPages}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="rounded-md border border-slate-200 px-3 py-1 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={(alertPage[managerAlertTab] ?? 0) === 0}
                                    onClick={() =>
                                      setAlertPage((prev) => ({
                                        ...prev,
                                        [managerAlertTab]: Math.max(0, (prev[managerAlertTab] ?? 0) - 1),
                                      }))
                                    }
                                  >
                                    이전
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-md border border-slate-200 px-3 py-1 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={(alertPage[managerAlertTab] ?? 0) >= totalPages - 1}
                                    onClick={() =>
                                      setAlertPage((prev) => ({
                                        ...prev,
                                        [managerAlertTab]: Math.min(
                                          totalPages - 1,
                                          (prev[managerAlertTab] ?? 0) + 1,
                                        ),
                                      }))
                                    }
                                  >
                                    다음
                                  </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                        activeStat.key === "pending" ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-800">
                                오늘 예정된 복약 (시간 전) {upcomingTodayPlans.length}건
                              </p>
                              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                pending
                              </span>
                            </div>
                            {upcomingTodayPlans.length === 0 ? (
                              <p className="mt-2 text-sm text-slate-600">현재 시간 이후에 예정된 복약 일정이 없습니다.</p>
                            ) : (
                              <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-lg border border-white bg-white shadow-sm">
                                {upcomingTodayPlans.map((item, idx) => (
                                  <div
                                    key={`upcoming-${item.planId}-${idx}`}
                                    className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="flex h-10 w-14 items-center justify-center rounded-md bg-indigo-50 text-sm font-semibold text-indigo-700">
                                        {item.time}
                                      </span>
                                      <div className="leading-tight">
                                        <p className="text-sm font-semibold text-slate-900">{item.clientName}</p>
                                        <p className="text-xs text-slate-600">{item.medicineName}</p>
                                      </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 sm:justify-end">
                                      예정 · 오늘
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          activeStat.items &&
                          activeStat.items.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                              <p className="text-sm font-semibold text-slate-800">주요 항목 {activeStat.items.length}건</p>
                              <ul className="mt-2 space-y-2">
                                {activeStat.items.map((item, idx) => (
                                  <li
                                    key={`${activeStat.key}-item-${idx}`}
                                    className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
                                  >
                                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                                      {idx + 1}
                                    </span>
                                    <span className="leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    검색 및 배정
                  </h2>
                  <p className="text-sm text-slate-600">
                    이름 또는 이메일로 이용자를 찾아 배정 여부를 확인하고 배정을 진행하세요.
                  </p>
                </div>
              </div>

              <form
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
                onSubmit={(event) => {
                  void handleClientSearch(event);
                }}
              >
                <input
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  onChange={(event) => {
                    setSearchKeyword(event.target.value);
                    if (searchError) {
                      setSearchError("");
                    }
                  }}
                  placeholder="이름 또는 이메일"
                  value={searchKeyword}
                />
                <button
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
                  disabled={searchLoading}
                  type="submit"
                >
                  {searchLoading ? "검색 중..." : "검색"}
                </button>
              </form>

          {searchError && (
            <p className="mt-3 text-sm text-red-600">{searchError}</p>
          )}

          {searchLoading ? (
            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              검색 중입니다...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-4 space-y-3">
              {searchResults.map((result) => {
                const assignedToCurrent =
                  result.currentlyAssigned &&
                  result.assignedManagerId === manager.userId;
                const assignedToOther =
                  result.currentlyAssigned &&
                  result.assignedManagerId !== manager.userId;
                const assignState = assignmentStates[result.clientId] ?? "idle";
                const isAssigning = assignState === "assigning";
                const isUnassigning = assignState === "unassigning";
                const buttonDisabled =
                  isAssigning || isUnassigning || assignedToCurrent || !result.assignable;
                let buttonLabel = "배정하기";
                if (isAssigning) {
                  buttonLabel = "배정 중...";
                } else if (assignedToCurrent) {
                  buttonLabel = "이미 배정됨";
                } else if (!result.assignable) {
                  buttonLabel = "배정 불가";
                }
                const showUnassign = assignedToCurrent;
                const unassignDisabled = isAssigning || isUnassigning;

                const addressDisplay = formatAddress(result.address, result.detailAddress);
                const computedAge =
                  typeof result.age === "number" && result.age > 0
                    ? result.age
                    : computeInternationalAge(result.birthDate);
                const ageDisplay =
                  typeof computedAge === "number" && computedAge >= 0
                    ? `${computedAge}세`
                    : "미등록";
                const cycleDisplay =
                  result.medicationCycle && result.medicationCycle.trim().length > 0
                    ? result.medicationCycle
                    : "미등록";
                const statusLabel = mapStatusToLabel(result.status);
                const assignMessage = assignmentMessages[result.clientId];
                const favorite = isFavorite(result.clientId);
                const avatarUrl = getProfileImage(result.profileImageUrl);
                const nameInitial =
                  result.name && result.name.trim().length > 0
                    ? result.name.trim().charAt(0).toUpperCase()
                    : "C";

                return (
                  <article
                    key={result.clientId}
                    className="relative rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (assignedToCurrent) {
                        openClientModalById(result.clientId);
                      }
                    }}
                    onKeyDown={(event) => {
                      if ((event.key === "Enter" || event.key === " ") && assignedToCurrent) {
                        event.preventDefault();
                        openClientModalById(result.clientId);
                      }
                    }}
                    aria-label={`${result.name} 정보 보기`}
                  >
                    <button
                      className={`favorite-heart absolute right-3 top-3 ${favorite ? "on" : ""}`}
                      aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(result.clientId);
                      }}
                      type="button"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={`${result.name} 프로필`} className="h-full w-full object-cover" />
                          ) : (
                            <span>{nameInitial}</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                            {result.name} 님
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-indigo-700">
                              {statusLabel}
                            </span>
                            <span>{result.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 sm:grid-cols-2">
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 sm:col-span-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-700">
                          현재 배정
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-800">
                          {assignedToOther
                            ? `${result.assignedManagerName ?? "다른 매니저"} (${result.assignedManagerEmail ?? "정보 없음"})`
                            : assignedToCurrent
                            ? "현재 담당 중"
                            : "없음"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          주소
                        </span>
                        <span className="flex-1 text-slate-800">{addressDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          나이
                        </span>
                        <span className="font-semibold text-slate-900">{ageDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          성별
                        </span>
                        <span className="font-semibold text-slate-900">{result.gender ?? "미등록"}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          복약 주기
                        </span>
                        <span className="font-semibold text-slate-900">{cycleDisplay}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <button
                          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
                          disabled={buttonDisabled}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleAssignClient(result.clientId);
                          }}
                          type="button"
                        >
                          {buttonLabel}
                        </button>
                        {showUnassign && (
                          <button
                            className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            disabled={unassignDisabled}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleUnassignClient(result.clientId);
                            }}
                            type="button"
                          >
                            {isUnassigning ? "배정 취소 중..." : "배정 취소"}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 sm:items-end">
                        {assignMessage && (
                          <p
                            className={`text-sm ${
                              assignMessage.type === "success"
                                ? "text-indigo-700"
                                : "text-red-600"
                            }`}
                          >
                            {assignMessage.text}
                          </p>
                        )}
                        {!result.assignable && !assignedToCurrent && (
                          <p className="text-sm text-red-600">
                            다른 매니저에게 배정된 이용자입니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : searchKeyword.trim().length > 0 && searchMessage ? (
            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {searchMessage}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                복약 관리
              </h2>
              <p className="text-sm text-slate-600">
                복약 스케줄을 등록하거나 복약 여부를 대신 기록할 수 있습니다.
              </p>
            </div>
            <button
              className="flex items-center gap-2 self-start rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-indigo-400 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={dashboardLoading}
              onClick={loadDashboard}
              type="button"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                  dashboardLoading ? "animate-spin bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                }`}
                aria-hidden="true"
              >
                ↻
              </span>
              {dashboardLoading ? "새로고침 중..." : "새로고침"}
            </button>
          </div>

          <div className="mt-3">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              <span>이름 검색</span>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="이름을 입력하세요"
                value={clientFilter}
                onChange={(event) => setClientFilter(event.target.value)}
              />
            </label>
          </div>

          {dashboardLoading && !dashboard ? (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
              복약 정보를 불러오는 중입니다...
            </div>
          ) : dashboardError ? (
            <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {dashboardError}
            </div>
          ) : !dashboard || dashboard.clients.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
              현재 배정된 이용자가 없습니다. 관리자에게 문의해주세요.
            </div>
          ) : favoriteClientCount === 0 ? (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
              즐겨찾기한 클라이언트가 없습니다. 상단 검색/배정 목록에서 별표를 눌러 즐겨찾기를 추가하세요.
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
              검색 조건에 맞는 이용자가 없습니다.
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {filteredClients.map((client) => {
                const latestLog = client.latestMedicationLogs[0] ?? null;
                const recentLogLabel = latestLog
                  ? formatDateTime(latestLog.logTimestamp)
                  : "기록 없음";
                const favorite = isFavorite(client.clientId);
                const avatarUrl = getProfileImage(client.profileImageUrl);
                const nameInitial =
                  client.clientName && client.clientName.trim().length > 0
                    ? client.clientName.trim().charAt(0).toUpperCase()
                    : "C";
                return (
                  <article
                    key={client.clientId}
                    className="relative cursor-pointer rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 sm:p-5"
                    role="button"
                    tabIndex={0}
                    onClick={() => setClientModalClientId(client.clientId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setClientModalClientId(client.clientId);
                      }
                    }}
                    aria-label={`${client.clientName}님의 복약 관리 열기`}
                  >
                    <button
                      className={`favorite-heart absolute right-3 top-3 ${favorite ? "on" : ""}`}
                      aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(client.clientId);
                      }}
                      type="button"
                    />
                    <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between pr-12">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${client.clientName} 프로필`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{nameInitial}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                            {client.clientName} 님
                          </h3>
                          <p className="text-xs text-slate-500 sm:text-sm">
                            복약 일정 {client.medicationPlans.length}건 · 최근 확인{" "}
                            {client.latestMedicationLogs.length}건
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            복약 일정 {client.medicationPlans.length}건
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            최근 확인 {client.latestMedicationLogs.length}건
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            비상 알림 {client.emergencyAlerts.length}건
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          최근 복약 확인: {recentLogLabel}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                        상세 관리 열기
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        </>
      )}

      {activePanel === "drug" && (
        <section>
          <InlineDrugSearch />
        </section>
      )}

      {activePanel === "chat" && (
        <section className="space-y-4">
          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <button
              type="button"
              onClick={() => setChatView("rooms")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                chatView === "rooms"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              채팅방 보기
            </button>
            <button
              type="button"
              onClick={() => setChatView("search")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                chatView === "search"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              클라이언트 찾기
            </button>
          </div>

          {chatView === "search" ? (
            <ChatClientPicker
              managerId={managerProfileId ?? manager.userId}
              assignedClients={(dashboard?.clients ?? []).map((c) => ({
                clientId: c.clientId,
                name: c.clientName,
                email: c.email,
                profileImageUrl: c.profileImageUrl,
              }))}
              onChatCreated={() => {
                setChatRefreshToken((prev) => prev + 1);
                setChatView("rooms");
              }}
            />
          ) : (
            <MyChatRooms
              role="MANAGER"
              userId={manager.userId}
              managerProfileId={managerProfileId}
              refreshToken={chatRefreshToken}
            />
          )}
        </section>
      )}
      </main>
      <style jsx global>{`
        .favorite-heart {
          position: absolute;
          width: 30px;
          height: 30px;
          border: 0;
          font-size: 0;
          border-radius: 9999px;
          background: #fff url("https://umings.github.io/images/i_like_off.png") no-repeat center / 18px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .favorite-heart.on {
          background: #fff url("https://umings.github.io/images/i_like_on.png") no-repeat center / 18px;
          animation: favorite-beat 0.5s 1 alternate;
          }
        .favorite-heart:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }
        @keyframes favorite-beat {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.15);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
      {selectedClient && selectedClientForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/70"
            onClick={closeClientModal}
          />
          <div className="fixed inset-0 z-50 px-3 py-6 sm:flex sm:items-start sm:justify-center">
            <div
              aria-label={`${selectedClient.clientName}님의 복약 관리`}
              aria-modal="true"
              className="relative mx-auto w-full max-w-[calc(72rem+2px)] overflow-hidden rounded-3xl bg-white shadow-2xl"
              role="dialog"
            >
              <button
                type="button"
                onClick={closeClientModal}
                className="absolute right-4 top-4 z-10 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
              >
                닫기 ✕
              </button>
              <div className="modal-scroll max-h-[90vh] overflow-y-auto touch-pan-y overscroll-contain p-4 sm:p-6">
                <div className="space-y-4 pr-2 sm:pr-4">
                  <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-[240px,1fr] sm:items-center sm:gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-indigo-100 bg-white text-xl font-semibold text-indigo-700 shadow-sm sm:h-20 sm:w-20">
                        <img
                          src={getProfileImage(
                            selectedClientDetail?.profileImageUrl ?? selectedClient.profileImageUrl
                          )}
                          alt={`${selectedClient.clientName} 프로필`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                          복약 관리
                        </p>
                        <h3 className="text-xl font-bold text-slate-900">
                          {selectedClient.clientName} 님
                        </h3>
                        <p className="text-sm text-slate-500">
                          복약 일정 {selectedClient.medicationPlans.length}건 · 최근 확인{" "}
                          {selectedClient.latestMedicationLogs.length}건
                        </p>
                      </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                      <InfoChip label="나이" value={(() => {
                        const age =
                          typeof selectedClientDetail?.age === "number" && selectedClientDetail.age > 0
                            ? selectedClientDetail.age
                            : typeof selectedClient.age === "number" && selectedClient.age > 0
                            ? selectedClient.age
                            : computeInternationalAge(
                                selectedClientDetail?.birthDate ?? selectedClient.birthDate
                              );
                        return typeof age === "number" ? `${age}세` : "미등록";
                      })()} />
                      <InfoChip
                        label="성별"
                        value={
                          selectedClientDetail?.gender &&
                          selectedClientDetail.gender.trim().length > 0
                            ? selectedClientDetail.gender
                            : selectedClient.gender ?? "미등록"
                        }
                      />
                      <InfoChip
                        label="이메일"
                        value={
                          selectedClientDetail?.email && selectedClientDetail.email.trim().length > 0
                            ? selectedClientDetail.email
                            : selectedClient.email ?? "미등록"
                        }
                        truncate
                      />
                      <InfoChip
                        label="주소"
                        value={
                          selectedClientDetail
                            ? formatAddress(
                                selectedClientDetail.address ?? selectedClient.address,
                                selectedClientDetail.detailAddress ?? selectedClient.detailAddress
                              )
                            : "불러오는 중..."
                        }
                        truncate
                      />
                    </div>
                  </div>
                  {renderClientDetailSections(selectedClient, {
                    form: selectedClientForm,
                    summary: selectedSummary,
                    summaryLoadingState: selectedSummaryLoading,
                    summaryError: selectedSummaryError,
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {selectedDrugDetailSeq && (
        <DrugDetailModal
          itemSeq={selectedDrugDetailSeq}
          onClose={() => setSelectedDrugDetailSeq(null)}
        />
      )}
      <style jsx global>{`
        .modal-scroll {
          max-height: calc(100vh - 96px);
          scrollbar-width: thin;
          scrollbar-color: #818cf8 #f8fafc;
          padding-right: 1rem;
          scrollbar-gutter: stable both-edges;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        .modal-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #a5b4fc, #4f46e5);
          border-radius: 10px;
          border: 2px solid #e2e8f0;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #818cf8, #4338ca);
        }
      `}</style>
    </div>
  );
}
