"use client";
import MyChatRooms from "@/components/MyChatRooms";
import { InlineDrugSearch } from "@/components/InlineDrugSearch";
import { DrugDetailModal } from "@/components/DrugDetailModal";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

type ProviderOverview = {
  userId: number | null;
  email: string;
  name: string;
};

type ProviderDashboardResponse = {
  providerId: number;
  clients: ProviderClientSummary[];
  activeAlertCount: number;
  pendingMedicationCount: number;
};

type ProviderClientSummary = {
  clientId: number;
  clientName: string;
  medicationPlans: MedicationPlan[];
  latestMedicationLogs: MedicationLog[];
  emergencyAlerts: EmergencyAlertInfo[];
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

type ProviderClientSearchResult = {
  clientId: number;
  name: string;
  email: string;
  status: string;
  address?: string | null;
  age?: number | null;
  medicationCycle?: string | null;
  currentlyAssigned: boolean;
  assignedProviderId?: number | null;
  assignedProviderName?: string | null;
  assignedProviderEmail?: string | null;
  assignable: boolean;
};

type UserSummary = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
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

type ProviderPanel = "client" | "drug" | "chat";

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

const providerQuickActions: Array<{
  value: ProviderPanel;
  label: string;
  description: string;
  accent: string;
}> = [
  {
    value: "client",
    label: "클라이언트 관리",
    description: "담당자 배정 및 복약 일정",
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

export default function ProviderMyPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [provider, setProvider] = useState<ProviderOverview>({
    userId: null,
    email: "",
    name: "",
  });
  const [dashboard, setDashboard] = useState<ProviderDashboardResponse | null>(
    null
  );
  const [providerProfileId, setProviderProfileId] = useState<number | null>(
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
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<ProviderClientSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [assignmentStates, setAssignmentStates] = useState<
    Record<number, "idle" | "loading">
  >({});
  const [assignmentMessages, setAssignmentMessages] = useState<
    Record<number, PlanActionMessage | undefined>
  >({});
const [weeklySummaries, setWeeklySummaries] = useState<
  Record<number, MedicationWeeklySummary | null>
>({});
const [weeklySummaryLoading, setWeeklySummaryLoading] = useState<
  Record<number, boolean>
>({});
const [weeklySummaryErrors, setWeeklySummaryErrors] = useState<
  Record<number, string>
>({});
const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
const [clientFilter, setClientFilter] = useState("");
const accordionInitializedRef = useRef(false);
const reopenOnDataRef = useRef(false);
  const [activePanel, setActivePanel] =
    useState<ProviderPanel>("client");
  const [selectedDrugDetailSeq, setSelectedDrugDetailSeq] = useState<
    string | null
  >(null);
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

    if (!accessToken || role !== "PROVIDER") {
      router.replace("/");
      return;
    }

    const storedEmail = window.localStorage.getItem("userEmail") ?? "";
    const storedUserId = window.localStorage.getItem("userId");
    const userId = storedUserId ? Number(storedUserId) : null;
    setProvider({
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
          setProvider((prev) => ({
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

  const loadDashboard = useCallback(async () => {
    if (!provider.userId) {
      return;
    }

    setDashboardLoading(true);
    setDashboardError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/providers/${provider.userId}/dashboard`
      );
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "제공자 대시보드를 불러오지 못했습니다."
        );
        throw new Error(message);
      }

      const data: ProviderDashboardResponse = await response.json();
      const normalized: ProviderDashboardResponse = {
        ...data,
        clients: data.clients.map((client) => ({
          ...client,
          latestMedicationLogs: [...(client.latestMedicationLogs ?? [])].sort(
            (a, b) =>
              new Date(b.logTimestamp).getTime() -
              new Date(a.logTimestamp).getTime()
          ),
        })),
      };
      setDashboard(normalized);
      setProviderProfileId(data.providerId ?? null);
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
          : "제공자 대시보드를 불러오지 못했습니다.";
      setDashboardError(message);
      setDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [provider.userId, loadWeeklySummaryForClient]);

  useEffect(() => {
    if (!isReady || !provider.userId) {
      return;
    }
    loadDashboard();
  }, [isReady, provider.userId, loadDashboard]);

  const summarySections = useMemo(() => {
    return [
      {
        title: "담당자 정보",
        description: "현재 로그인한 요양보호사/제공자의 기본 정보입니다.",
        rows: [
          {
            label: "이름",
            value: provider.name || "확인 중",
          },
          {
            label: "이메일",
            value: provider.email || "확인 중",
          },
        ],
      },
      {
        title: "관리 현황",
        description:
          "복약 스케줄, 알림, 클라이언트 매칭 정보를 한눈에 확인하세요.",
        rows: [
          {
            label: "담당 클라이언트",
            value:
              dashboardLoading && !dashboard
                ? "확인 중"
                : dashboard
                ? `${dashboard.clients.length}명`
                : "-",
          },
          {
            label: "대기 중 복약 일정",
            value:
              dashboard && dashboard.pendingMedicationCount > 0
                ? `${dashboard.pendingMedicationCount}건`
                : dashboard
                ? "모두 등록됨"
                : "-",
          },
          {
            label: "미처리 비상 알림",
            value:
              dashboard && dashboard.activeAlertCount > 0
                ? `${dashboard.activeAlertCount}건`
                : dashboard
                ? "없음"
                : "-",
          },
        ],
      },
    ];
  }, [provider, dashboard, dashboardLoading]);

  const filteredClients = useMemo(() => {
    if (!dashboard?.clients) {
      return [];
    }
    const keyword = clientFilter.trim().toLowerCase();
    if (!keyword) {
      return dashboard.clients;
    }
    return dashboard.clients.filter((client) =>
      client.clientName?.toLowerCase().includes(keyword),
    );
  }, [dashboard, clientFilter]);

  useEffect(() => {
    if (filteredClients.length === 0) {
      setExpandedClientId(null);
      reopenOnDataRef.current = true;
      return;
    }

    const exists = filteredClients.some((client) => client.clientId === expandedClientId);

    if (!exists && expandedClientId !== null) {
      setExpandedClientId(filteredClients[0]?.clientId ?? null);
    }
  }, [filteredClients, expandedClientId]);

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
    };
    return labels[normalized] ?? value;
  }, []);

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

    if (!provider.userId) {
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
        `${API_BASE_URL}/api/providers/${provider.userId}/clients/search?keyword=${encodeURIComponent(
          keyword
        )}&size=20`
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "클라이언트를 검색하지 못했습니다."
        );
        throw new Error(message);
      }

      const data: ProviderClientSearchResult[] = await response.json();
      setSearchResults(data);
      setSearchMessage(data.length === 0 ? "검색 결과가 없습니다." : "");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "클라이언트를 검색하지 못했습니다.";
      setSearchError(message);
      setSearchResults([]);
      setSearchMessage("");
    } finally {
      setSearchLoading(false);
    }
  };

  const openChatRoomForClient = useCallback(
    async (clientId: number): Promise<ChatRoomEnsureResult> => {
      if (!providerProfileId) {
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
            providerId: providerProfileId,
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
    [providerProfileId]
  );

  const handleAssignClient = async (clientId: number) => {
    if (!provider.userId) {
      return;
    }

    setAssignmentStates((prev) => ({ ...prev, [clientId]: "loading" }));
    setAssignmentMessages((prev) => ({ ...prev, [clientId]: undefined }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/providers/${provider.userId}/clients/assignments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientId }),
        }
      );

      if (!response.ok) {
        const message = await extractApiError(
          response,
          "클라이언트를 배정하지 못했습니다."
        );
        throw new Error(message);
      }

      await loadDashboard();
      if (searchKeyword.trim()) {
        await handleClientSearch();
      }
      const chatResult = await openChatRoomForClient(clientId);
      const successText = chatResult.success
        ? "클라이언트를 배정하고 채팅방을 자동으로 개설했습니다."
        : `클라이언트 배정은 완료되었지만 채팅방 개설 중 문제가 발생했습니다.${
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
          : "클라이언트를 배정하지 못했습니다.";
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
            alarmTime: form.alarmTime,
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
            notes: "제공자가 복약을 확인했습니다.",
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

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg bg-white px-6 py-8 shadow-sm">
          <p className="text-gray-600">제공자 정보를 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl bg-white p-4 shadow-lg sm:p-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <p className="text-2xl font-semibold uppercase tracking-wide text-indigo-600 sm:text-3xl">
                Guardian Provider
              </p>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                프로바이더 마이페이지
              </h1>
            </div>
            <button
              className="h-10 rounded-md border border-red-400 px-4 text-sm font-semibold text-red-500 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={handleLogout}
              type="button"
            >
              로그아웃
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 pb-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:pb-0">
              {providerQuickActions.map((action) => {
                const isActive = activePanel === action.value;
                return (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => setActivePanel(action.value)}
                    className={`group flex flex-1 min-w-0 flex-col gap-1 rounded-2xl border px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow md:h-full sm:px-4 ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50/80"
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
                    <span className="text-[11px] leading-tight text-slate-500">
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
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {summarySections.map((section) => (
                <section
                  key={section.title}
                  className="rounded-2xl border border-slate-200 p-4 sm:p-6"
                >
                  <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {section.description}
                  </p>
                  <dl className="mt-4 space-y-3">
                    {section.rows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3"
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

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                클라이언트 검색 및 배정
              </h2>
              <p className="text-sm text-slate-600">
                이름 또는 이메일로 클라이언트를 찾아 배정 여부를 확인하고 배정을 진행하세요.
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
              placeholder="클라이언트 이름 또는 이메일"
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
                  result.assignedProviderId === provider.userId;
                const assignedToOther =
                  result.currentlyAssigned &&
                  result.assignedProviderId !== provider.userId;
                const assignState = assignmentStates[result.clientId];
                const buttonDisabled =
                  assignState === "loading" || assignedToCurrent || !result.assignable;
                let buttonLabel = "배정하기";
                if (assignState === "loading") {
                  buttonLabel = "배정 중...";
                } else if (assignedToCurrent) {
                  buttonLabel = "이미 배정됨";
                } else if (!result.assignable) {
                  buttonLabel = "배정 불가";
                }

                const addressDisplay =
                  result.address && result.address.trim().length > 0
                    ? result.address
                    : "미등록";
                const ageDisplay =
                  typeof result.age === "number" && result.age > 0
                    ? `${result.age}세`
                    : "미등록";
                const cycleDisplay =
                  result.medicationCycle && result.medicationCycle.trim().length > 0
                    ? result.medicationCycle
                    : "미등록";
                const statusLabel = mapStatusToLabel(result.status);
                const assignMessage = assignmentMessages[result.clientId];

                return (
                  <article
                    key={result.clientId}
                    className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                          {result.name} 님
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-indigo-700">
                            {statusLabel}
                          </span>
                          <span>{result.email}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        현재 배정:
                        {" "}
                        {assignedToOther
                          ? `${result.assignedProviderName ?? "다른 제공자"} (${result.assignedProviderEmail ?? "정보 없음"})`
                          : assignedToCurrent
                          ? "현재 담당 중"
                          : "없음"}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>주소: {addressDisplay}</p>
                      <p>나이: {ageDisplay}</p>
                      <p>복약 주기: {cycleDisplay}</p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
                        disabled={buttonDisabled}
                        onClick={() => handleAssignClient(result.clientId)}
                        type="button"
                      >
                        {buttonLabel}
                      </button>
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
                          다른 제공자에게 배정된 클라이언트입니다.
                        </p>
                      )}
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
                담당 클라이언트 복약 관리
              </h2>
              <p className="text-sm text-slate-600">
                복약 스케줄을 등록하거나 복약 여부를 대신 기록할 수 있습니다.
              </p>
            </div>
            <button
              className="self-start rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-indigo-400 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={dashboardLoading}
              onClick={loadDashboard}
              type="button"
            >
              {dashboardLoading ? "새로고침 중..." : "데이터 새로고침"}
            </button>
          </div>

          <div className="mt-3">
            <label className="flex flex-col gap-1 text-sm text-slate-600 sm:max-w-sm">
              <span>클라이언트 이름 검색</span>
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
              현재 배정된 클라이언트가 없습니다. 관리자에게 문의해주세요.
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
              검색 조건에 맞는 클라이언트가 없습니다.
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {filteredClients.map((client) => {
                const form = planForms[client.clientId] ?? createInitialFormState();
                const summary = weeklySummaries[client.clientId] ?? null;
                const summaryLoadingState =
                  weeklySummaryLoading[client.clientId] ?? false;
                const summaryError = weeklySummaryErrors[client.clientId] ?? "";
                const expanded = expandedClientId === client.clientId;
                return (
                  <article
                    key={client.clientId}
                    className="rounded-2xl border border-white bg-white p-4 shadow-sm sm:p-5"
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedClientId(expanded ? null : client.clientId)
                      }
                      className="flex w-full items-center justify-between gap-3 border-b border-slate-200 pb-4 text-left"
                    >
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                          {client.clientName} 님
                        </h3>
                        <p className="text-xs text-slate-500 sm:text-sm">
                          복약 일정 {client.medicationPlans.length}건 · 최근 확인{" "}
                          {client.latestMedicationLogs.length}건
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {expanded ? "접기" : "자세히"}
                      </span>
                    </button>

                    <div
                      className={
                        expanded
                          ? "mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5"
                          : "hidden"
                      }
                    >
                      <div className="flex flex-col gap-2 border-b border-amber-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-amber-900">
                            주간 복약 현황
                          </h4>
                          <p className="text-xs text-amber-700">
                            최근 7일간 복약 확인 추이를 한눈에 확인하세요.
                          </p>
                        </div>
                        <button
                          className="self-start rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-800 transition hover:border-amber-400 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={summaryLoadingState}
                          onClick={() => loadWeeklySummaryForClient(client.clientId)}
                          type="button"
                        >
                          {summaryLoadingState ? "갱신 중..." : "새로고침"}
                        </button>
                      </div>
                      {client.medicationPlans.length === 0 ? (
                        <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-amber-800">
                          아직 복약 일정이 없습니다. 아래 양식에서 일정을 먼저 등록해주세요.
                        </div>
                      ) : summaryLoadingState && !summary ? (
                        <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs text-amber-800">
                          주간 현황을 불러오는 중입니다...
                        </div>
                      ) : summaryError ? (
                        <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-red-600">
                          {summaryError}
                        </div>
                      ) : summary && summary.days.length > 0 ? (
                        <div className="mt-3">
                          <div className="-mx-1 flex gap-3 overflow-x-auto pb-3 sm:hidden">
                            {summary.days.map((day) => (
                              <WeeklyDayCard
                                key={`mobile-weekly-${client.clientId}-${day.date}`}
                                day={day}
                                className="min-w-[200px] flex-shrink-0"
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
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-amber-800">
                          아직 주간 복약 기록이 없습니다.
                        </div>
                      )}
                    </div>

                    <div
                      className={
                        expanded
                          ? "mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]"
                          : "hidden"
                      }
                    >
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
                                (log) => log.planId === plan.id
                              ) ??
                              client.latestMedicationLogs.find(
                                (log) =>
                                  !log.planId &&
                                  log.medicineId === plan.medicineId
                              );
                            return (
                              <div
                                key={plan.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <h4 className="text-base font-semibold text-slate-900 sm:text-lg">
                                      {plan.medicineName}
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                      {`${plan.dosageAmount}${plan.dosageUnit} · ${formatAlarmTime(
                                        plan.alarmTime
                                      )} · ${plan.daysOfWeek
                                        .map(mapDayToLabel)
                                        .join(", ")}`}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                                      disabled={deleteProcessing[plan.id] === "loading"}
                                      onClick={() =>
                                        handleDeletePlan(client.clientId, plan.id)
                                      }
                                      type="button"
                                    >
                                      {deleteProcessing[plan.id] === "loading"
                                        ? "삭제 중..."
                                        : "삭제"}
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-sm text-slate-600">
                                    최근 확인:{" "}
                                    {latestLog
                                      ? `${formatDateTime(latestLog.logTimestamp)}`
                                      : "기록 없음"}
                                  </p>
                                  <button
                                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
                                    disabled={logProcessing[plan.id] === "loading"}
                                    onClick={() =>
                                      handleRecordMedication(client.clientId, plan)
                                    }
                                    type="button"
                                  >
                                    {logProcessing[plan.id] === "loading"
                                      ? "기록 중..."
                                      : "복약 확정"}
                                  </button>
                                </div>
                                {logMessage && (
                                  <p
                                    className={`mt-2 text-sm ${
                                      logMessage.type === "success"
                                        ? "text-indigo-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {logMessage.text}
                                  </p>
                                )}
                                {message && (
                                  <p
                                    className={`mt-1 text-xs ${
                                      message.type === "success"
                                        ? "text-indigo-600"
                                        : "text-red-600"
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
                          <h4 className="text-sm font-semibold text-slate-900">
                            복약 일정 추가
                          </h4>
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
                                      onClick={() =>
                                        handleRemovePlanItem(client.clientId, index)
                                      }
                                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
                                    >
                                      항목 삭제
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePlanModeChange(client.clientId, index, "search")
                                    }
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
                                    onClick={() =>
                                      handlePlanModeChange(client.clientId, index, "manual")
                                    }
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
                                            { resetStatus: true }
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
                                      <div className="rounded-md border border-slate-200 bg-white p-3">
                                        <p className="text-xs text-slate-500">
                                          e약은요 검색 결과입니다. 일정을
                                          등록할 약품을 선택하세요.
                                        </p>
                                        <div className="mt-3 space-y-2">
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
                                                    {medicine.entpName ??
                                                      "제조사 정보 없음"}
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
                                                    품목 기준 코드:{" "}
                                                    {medicine.itemSeq}
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
                                                    handleSelectMedicine(
                                                      client.clientId,
                                                      index,
                                                      medicine
                                                    );
                                                  }}
                                                >
                                                  {item.searching
                                                    ? "불러오는 중..."
                                                    : "이 약 일정에 추가"}
                                                </button>
                                                <button
                                                  type="button"
                                                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                                                  onClick={(event) => {
                                                    event.preventDefault();
                                                    setSelectedDrugDetailSeq(
                                                      medicine.itemSeq
                                                    );
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
                                            event.target.value
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
                                            event.target.value
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
                                            event.target.value
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
                                            event.target.value
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
                                            event.target.value
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
                                            event.target.value
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
                                            event.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-600">
                                      복용량
                                    </label>
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
                                          { resetStatus: true }
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-600">
                                      복용 단위
                                    </label>
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
                                          { resetStatus: true }
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
                            <label className="text-xs font-medium text-slate-600">
                              알람 시간
                            </label>
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
                            <legend className="text-xs font-medium text-slate-600">
                              복용 요일
                            </legend>
                            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                              {allDays.map((day) => {
                                const isSelected = form.daysOfWeek.includes(day.value);
                                return (
                                  <label key={day.value} className="block">
                                    <input
                                      type="checkbox"
                                      className="peer sr-only"
                                      checked={isSelected}
                                      onChange={() =>
                                        handleToggleDay(client.clientId, day.value)
                                      }
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
                          {form.error && (
                            <p className="text-sm text-red-600">{form.error}</p>
                          )}
                          {form.message && (
                            <p className="text-sm text-indigo-600">{form.message}</p>
                          )}
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
                        <h4 className="text-sm font-semibold text-slate-900">
                          최근 복약 확인 기록
                        </h4>
                        {client.latestMedicationLogs.length === 0 ? (
                          <p className="text-sm text-slate-600">기록이 없습니다.</p>
                        ) : (
                          <ul className="space-y-2">
                            {[...client.latestMedicationLogs]
                              .sort(
                                (a, b) =>
                                  new Date(b.logTimestamp).getTime() -
                                  new Date(a.logTimestamp).getTime()
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
                                {log.notes && (
                                  <p className="text-xs text-slate-500">{log.notes}</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
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
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <InlineDrugSearch />
        </section>
      )}

      {activePanel === "chat" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <MyChatRooms role="PROVIDER" userId={provider.userId} />
        </section>
      )}
      </main>
      {selectedDrugDetailSeq && (
        <DrugDetailModal
          itemSeq={selectedDrugDetailSeq}
          onClose={() => setSelectedDrugDetailSeq(null)}
        />
      )}
    </div>
  );
}
