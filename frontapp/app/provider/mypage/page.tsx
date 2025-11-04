"use client";

import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8090";

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

type PlanFormState = {
  medicineKeyword: string;
  medicineResults: MedicineSummary[];
  selectedMedicineId: number | null;
  dosageAmount: string;
  dosageUnit: string;
  alarmTime: string;
  daysOfWeek: string[];
  mode: "search" | "manual";
  manualMedicine: ManualMedicineForm;
  searching: boolean;
  submitting: boolean;
  error: string;
  message: string;
};

type PlanActionMessage = {
  type: "success" | "error";
  text: string;
};

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
  medicineKeyword: "",
  medicineResults: [],
  selectedMedicineId: null,
  dosageAmount: "",
  dosageUnit: "",
  alarmTime: "",
  daysOfWeek: [],
  mode: "search",
  manualMedicine: createEmptyManualMedicine(),
  searching: false,
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
      setDashboard(data);
      setPlanForms((prev) => {
        const next = { ...prev };
        data.clients.forEach((client) => {
          if (!next[client.clientId]) {
            next[client.clientId] = createInitialFormState();
          }
        });
        return next;
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
  }, [provider.userId]);

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
      setAssignmentMessages((prev) => ({
        ...prev,
        [clientId]: { type: "success", text: "클라이언트가 배정되었습니다." },
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

  const handleMedicineSearch = async (clientId: number) => {
    const form = planForms[clientId] ?? createInitialFormState();
    const keyword = form.medicineKeyword.trim();
    if (!keyword) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "약품명을 먼저 입력해주세요.",
        message: "",
      }));
      return;
    }

    updatePlanForm(clientId, (current) => ({
      ...current,
      searching: true,
      error: "",
      message: "",
      medicineResults: [],
    }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/medicines/search?keyword=${encodeURIComponent(
          keyword
        )}`
      );
      if (!response.ok) {
        const message = await extractApiError(
          response,
          "약품 정보를 조회할 수 없습니다."
        );
        throw new Error(message);
      }

      const medicines: MedicineSummary[] = await response.json();
      updatePlanForm(clientId, (current) => ({
        ...current,
        medicineResults: medicines,
        searching: false,
        error: medicines.length === 0 ? "검색 결과가 없습니다." : "",
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "약품 정보를 조회할 수 없습니다.";
      updatePlanForm(clientId, (current) => ({
        ...current,
        searching: false,
        error: message,
      }));
    }
  };

  const handleSelectMedicine = (clientId: number, medicine: MedicineSummary) => {
    updatePlanForm(clientId, (current) => ({
      ...current,
      mode: "search",
      selectedMedicineId: medicine.id,
      medicineKeyword: medicine.name,
      medicineResults: [],
      manualMedicine: createEmptyManualMedicine(),
      error: "",
      message: "",
    }));
  };

  const handlePlanModeChange = (clientId: number, mode: "search" | "manual") => {
    updatePlanForm(clientId, (current) => {
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
          error: "",
          message: "",
        };
      }

      return {
        ...current,
        mode,
        medicineKeyword: current.manualMedicine.name.trim(),
        selectedMedicineId: null,
        manualMedicine: createEmptyManualMedicine(),
        error: "",
        message: "",
      };
    });
  };

  const handleManualFieldChange = (
    clientId: number,
    field: keyof ManualMedicineForm,
    value: string
  ) => {
    updatePlanForm(clientId, (current) => ({
      ...current,
      manualMedicine: {
        ...current.manualMedicine,
        [field]: value,
      },
      error: "",
      message: "",
    }));
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
    const isManualMode = form.mode === "manual";
    if (!isManualMode && !form.selectedMedicineId) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "약품을 검색하여 선택해주세요.",
      }));
      return;
    }

    if (isManualMode && !form.manualMedicine.name.trim()) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "직접 입력할 약품 이름을 입력해주세요.",
      }));
      return;
    }

    if (!form.dosageAmount || Number(form.dosageAmount) <= 0) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "복용량을 1 이상으로 입력해주세요.",
      }));
      return;
    }

    if (!form.dosageUnit.trim()) {
      updatePlanForm(clientId, (current) => ({
        ...current,
        error: "복용 단위를 입력해주세요.",
      }));
      return;
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

      const payload =
        form.mode === "manual"
          ? {
              manualMedicine: {
                name: form.manualMedicine.name.trim(),
                productCode: sanitizeOptional(form.manualMedicine.productCode),
                efficacy: sanitizeOptional(form.manualMedicine.efficacy),
                usageDosage: sanitizeOptional(form.manualMedicine.usageDosage),
                caution: sanitizeOptional(form.manualMedicine.caution),
                sideEffects: sanitizeOptional(form.manualMedicine.sideEffects),
                description: sanitizeOptional(form.manualMedicine.description),
              },
            }
          : {
              medicineId: form.selectedMedicineId,
            };

      const response = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/medication/plans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            dosageAmount: Number(form.dosageAmount),
            dosageUnit: form.dosageUnit,
            alarmTime: form.alarmTime,
            daysOfWeek: form.daysOfWeek,
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
      setPlanForms((prev) => ({
        ...prev,
        [clientId]: {
          ...createInitialFormState(),
          mode: "search",
          message: "복약 일정이 등록되었습니다.",
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
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-xl">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              Guardian Provider
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              환자 관리인 마이페이지
            </h1>
            <p className="text-sm text-slate-600">
              담당 클라이언트의 복약 스케줄을 확인하고 직접 관리할 수 있습니다.
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
          {summarySections.map((section) => (
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

        <section className="rounded-xl border border-emerald-200 bg-white p-6">
          <div className="flex flex-col gap-2 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-emerald-900">
                클라이언트 검색 및 배정
              </h2>
              <p className="text-sm text-emerald-700">
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
              className="flex-1 rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
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
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
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
            <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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
                    className="rounded-lg border border-emerald-100 bg-emerald-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-emerald-900">
                          {result.name} 님
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-white px-2 py-1 font-medium text-emerald-600">
                            {statusLabel}
                          </span>
                          <span className="text-emerald-700">{result.email}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-emerald-700">
                        현재 배정:
                        {" "}
                        {assignedToOther
                          ? `${result.assignedProviderName ?? "다른 제공자"} (${result.assignedProviderEmail ?? "정보 없음"})`
                          : assignedToCurrent
                          ? "현재 담당 중"
                          : "없음"}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-emerald-800 sm:grid-cols-2">
                      <p>주소: {addressDisplay}</p>
                      <p>나이: {ageDisplay}</p>
                      <p>복약 주기: {cycleDisplay}</p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
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
                              ? "text-emerald-700"
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
            <div className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {searchMessage}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex flex-col gap-2 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-emerald-900">
                담당 클라이언트 복약 관리
              </h2>
              <p className="text-sm text-emerald-700">
                복약 스케줄을 등록하거나 복약 여부를 대신 기록할 수 있습니다.
              </p>
            </div>
            <button
              className="self-start rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={dashboardLoading}
              onClick={loadDashboard}
              type="button"
            >
              {dashboardLoading ? "새로고침 중..." : "데이터 새로고침"}
            </button>
          </div>

          {dashboardLoading && !dashboard ? (
            <div className="mt-4 rounded-md bg-white px-4 py-3 text-sm text-emerald-700">
              복약 정보를 불러오는 중입니다...
            </div>
          ) : dashboardError ? (
            <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {dashboardError}
            </div>
          ) : !dashboard || dashboard.clients.length === 0 ? (
            <div className="mt-4 rounded-md bg-white px-4 py-3 text-sm text-emerald-700">
              현재 배정된 클라이언트가 없습니다. 관리자에게 문의해주세요.
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {dashboard.clients.map((client) => {
                const form = planForms[client.clientId] ?? createInitialFormState();
                return (
                  <article
                    key={client.clientId}
                    className="rounded-lg border border-white bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {client.clientName} 님
                        </h3>
                        <p className="text-sm text-slate-500">
                          복약 일정 {client.medicationPlans.length}건 · 최근 확인{" "}
                          {client.latestMedicationLogs.length}건
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
                      <div className="space-y-4">
                        {client.medicationPlans.length === 0 ? (
                          <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            등록된 복약 일정이 없습니다. 아래 양식을 통해 일정을 추가해주세요.
                          </div>
                        ) : (
                          client.medicationPlans.map((plan) => {
                            const message = planMessages[plan.id];
                            const logMessage = logMessages[plan.id];
                            const latestLog = client.latestMedicationLogs.find(
                              (log) => log.medicineId === plan.medicineId
                            );
                            return (
                              <div
                                key={plan.id}
                                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <h4 className="text-lg font-semibold text-slate-900">
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
                                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                    disabled={logProcessing[plan.id] === "loading"}
                                    onClick={() =>
                                      handleRecordMedication(client.clientId, plan)
                                    }
                                    type="button"
                                  >
                                    {logProcessing[plan.id] === "loading"
                                      ? "기록 중..."
                                      : "복약 확인 기록"}
                                  </button>
                                </div>
                                {logMessage && (
                                  <p
                                    className={`mt-2 text-sm ${
                                      logMessage.type === "success"
                                        ? "text-emerald-600"
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
                                        ? "text-emerald-600"
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
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handlePlanModeChange(client.clientId, "search")
                                }
                                className={`rounded-md border px-4 py-2 text-xs font-semibold transition ${
                                  form.mode === "search"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                                }`}
                              >
                                약 검색
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePlanModeChange(client.clientId, "manual")
                                }
                                className={`rounded-md border px-4 py-2 text-xs font-semibold transition ${
                                  form.mode === "manual"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                                }`}
                              >
                                직접 입력
                              </button>
                            </div>

                            {form.mode === "search" ? (
                              <>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <input
                                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                    onChange={(event) =>
                                      updatePlanForm(client.clientId, (current) => ({
                                        ...current,
                                        medicineKeyword: event.target.value,
                                        selectedMedicineId: null,
                                      }))
                                    }
                                    placeholder="약품명으로 검색"
                                    value={form.medicineKeyword}
                                  />
                                  <button
                                    className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={form.searching}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      handleMedicineSearch(client.clientId);
                                    }}
                                  >
                                    {form.searching ? "검색 중..." : "검색"}
                                  </button>
                                </div>
                                {form.medicineResults.length > 0 && (
                                  <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                                    <p className="text-xs text-slate-500">
                                      검색 결과를 선택하세요.
                                    </p>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                      {form.medicineResults.map((medicine) => (
                                        <button
                                          key={medicine.id}
                                          className="rounded-md border border-white bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                                          onClick={(event) => {
                                            event.preventDefault();
                                            handleSelectMedicine(client.clientId, medicine);
                                          }}
                                        >
                                          <span className="font-medium">
                                            {medicine.name}
                                          </span>
                                          {medicine.productCode && (
                                            <span className="block text-xs text-slate-500">
                                              {medicine.productCode}
                                            </span>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">
                                  검색 결과가 없을 때 직접 약품 정보를 입력하고 등록할 수 있습니다.
                                </p>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-600">
                                    약품 이름<span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                      handleManualFieldChange(
                                        client.clientId,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                    placeholder="직접 입력할 약품 이름"
                                    value={form.manualMedicine.name}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-600">
                                    제품 코드 (선택)
                                  </label>
                                  <input
                                    className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                      handleManualFieldChange(
                                        client.clientId,
                                        "productCode",
                                        event.target.value
                                      )
                                    }
                                    placeholder="예) 국문 제품 코드"
                                    value={form.manualMedicine.productCode}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-600">
                                    효능 / 효과 (선택)
                                  </label>
                                  <textarea
                                    className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                      handleManualFieldChange(
                                        client.clientId,
                                        "efficacy",
                                        event.target.value
                                      )
                                    }
                                    placeholder="약품의 주요 효능을 입력하세요."
                                    value={form.manualMedicine.efficacy}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-600">
                                    복용 방법 (선택)
                                  </label>
                                  <textarea
                                    className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                      handleManualFieldChange(
                                        client.clientId,
                                        "usageDosage",
                                        event.target.value
                                      )
                                    }
                                    placeholder="예) 1일 3회, 1회 1정 등"
                                    value={form.manualMedicine.usageDosage}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-600">
                                    주의 사항 (선택)
                                  </label>
                                  <textarea
                                    className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                      handleManualFieldChange(
                                        client.clientId,
                                        "caution",
                                        event.target.value
                                      )
                                    }
                                    placeholder="주의사항이나 알레르기 정보를 입력하세요."
                                    value={form.manualMedicine.caution}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-600">
                                    부작용 (선택)
                                  </label>
                                  <textarea
                                    className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                      handleManualFieldChange(
                                        client.clientId,
                                        "sideEffects",
                                        event.target.value
                                      )
                                    }
                                    placeholder="예상되는 부작용을 입력하세요."
                                    value={form.manualMedicine.sideEffects}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-medium text-slate-600">
                                    비고 (선택)
                                  </label>
                                  <textarea
                                    className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                                      handleManualFieldChange(
                                        client.clientId,
                                        "description",
                                        event.target.value
                                      )
                                    }
                                    placeholder="추가 메모를 입력하세요."
                                    value={form.manualMedicine.description}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-slate-600">
                                복용량
                              </label>
                              <input
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                min={1}
                                onChange={(event) =>
                                  updatePlanForm(client.clientId, (current) => ({
                                    ...current,
                                    dosageAmount: event.target.value,
                                  }))
                                }
                                type="number"
                                value={form.dosageAmount}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-slate-600">
                                복용 단위
                              </label>
                              <input
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                onChange={(event) =>
                                  updatePlanForm(client.clientId, (current) => ({
                                    ...current,
                                    dosageUnit: event.target.value,
                                  }))
                                }
                                placeholder="ex) 정, 캡슐"
                                value={form.dosageUnit}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-600">
                              알람 시간
                            </label>
                            <input
                              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
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
                                          ? "border-emerald-500 bg-emerald-100 text-emerald-700 shadow-sm"
                                          : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
                                      } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500`}
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
                            <p className="text-sm text-emerald-600">{form.message}</p>
                          )}
                          <button
                            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
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
                            {client.latestMedicationLogs.slice(0, 5).map((log) => (
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
      </main>
    </div>
  );
}
