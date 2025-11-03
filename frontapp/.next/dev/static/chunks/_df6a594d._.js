(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/provider/mypage/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProviderMyPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const API_BASE_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL ?? "http://localhost:8090";
const allDays = [
    {
        value: "MONDAY",
        label: "월"
    },
    {
        value: "TUESDAY",
        label: "화"
    },
    {
        value: "WEDNESDAY",
        label: "수"
    },
    {
        value: "THURSDAY",
        label: "목"
    },
    {
        value: "FRIDAY",
        label: "금"
    },
    {
        value: "SATURDAY",
        label: "토"
    },
    {
        value: "SUNDAY",
        label: "일"
    }
];
async function extractApiError(response, fallback) {
    try {
        const data = await response.clone().json();
        if (data && typeof data === "object" && data !== null && "message" in data) {
            const message = data.message;
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
const createInitialFormState = ()=>({
        medicineKeyword: "",
        medicineResults: [],
        selectedMedicineId: null,
        dosageAmount: "",
        dosageUnit: "",
        alarmTime: "",
        daysOfWeek: [],
        searching: false,
        submitting: false,
        error: "",
        message: ""
    });
function ProviderMyPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [isReady, setIsReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [provider, setProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        userId: null,
        email: ""
    });
    const [dashboard, setDashboard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dashboardLoading, setDashboardLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dashboardError, setDashboardError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [planForms, setPlanForms] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [planMessages, setPlanMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [logProcessing, setLogProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [logMessages, setLogMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [deleteProcessing, setDeleteProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [searchKeyword, setSearchKeyword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [searchResults, setSearchResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [searchLoading, setSearchLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchError, setSearchError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [searchMessage, setSearchMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [assignmentStates, setAssignmentStates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [assignmentMessages, setAssignmentMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const updatePlanForm = (clientId, updater)=>{
        setPlanForms((prev)=>{
            const current = prev[clientId] ?? createInitialFormState();
            return {
                ...prev,
                [clientId]: updater(current)
            };
        });
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProviderMyPage.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const accessToken = window.localStorage.getItem("accessToken");
            const role = window.localStorage.getItem("userRole");
            if (!accessToken || role !== "PROVIDER") {
                router.replace("/");
                return;
            }
            const storedEmail = window.localStorage.getItem("userEmail") ?? "";
            const storedUserId = window.localStorage.getItem("userId");
            setProvider({
                email: storedEmail,
                userId: storedUserId ? Number(storedUserId) : null
            });
            setIsReady(true);
        }
    }["ProviderMyPage.useEffect"], [
        router
    ]);
    const loadDashboard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProviderMyPage.useCallback[loadDashboard]": async ()=>{
            if (!provider.userId) {
                return;
            }
            setDashboardLoading(true);
            setDashboardError("");
            try {
                const response = await fetch(`${API_BASE_URL}/api/providers/${provider.userId}/dashboard`);
                if (!response.ok) {
                    const message = await extractApiError(response, "제공자 대시보드를 불러오지 못했습니다.");
                    throw new Error(message);
                }
                const data = await response.json();
                setDashboard(data);
                setPlanForms({
                    "ProviderMyPage.useCallback[loadDashboard]": (prev)=>{
                        const next = {
                            ...prev
                        };
                        data.clients.forEach({
                            "ProviderMyPage.useCallback[loadDashboard]": (client)=>{
                                if (!next[client.clientId]) {
                                    next[client.clientId] = createInitialFormState();
                                }
                            }
                        }["ProviderMyPage.useCallback[loadDashboard]"]);
                        return next;
                    }
                }["ProviderMyPage.useCallback[loadDashboard]"]);
            } catch (error) {
                const message = error instanceof Error ? error.message : "제공자 대시보드를 불러오지 못했습니다.";
                setDashboardError(message);
                setDashboard(null);
            } finally{
                setDashboardLoading(false);
            }
        }
    }["ProviderMyPage.useCallback[loadDashboard]"], [
        provider.userId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProviderMyPage.useEffect": ()=>{
            if (!isReady || !provider.userId) {
                return;
            }
            loadDashboard();
        }
    }["ProviderMyPage.useEffect"], [
        isReady,
        provider.userId,
        loadDashboard
    ]);
    const summarySections = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ProviderMyPage.useMemo[summarySections]": ()=>{
            return [
                {
                    title: "담당자 정보",
                    description: "현재 로그인한 요양보호사/제공자의 기본 정보입니다.",
                    rows: [
                        {
                            label: "제공자 번호",
                            value: provider.userId ? `#${provider.userId}` : "확인 중"
                        },
                        {
                            label: "이메일",
                            value: provider.email || "확인 중"
                        }
                    ]
                },
                {
                    title: "관리 현황",
                    description: "복약 스케줄, 알림, 클라이언트 매칭 정보를 한눈에 확인하세요.",
                    rows: [
                        {
                            label: "담당 클라이언트",
                            value: dashboardLoading && !dashboard ? "확인 중" : dashboard ? `${dashboard.clients.length}명` : "-"
                        },
                        {
                            label: "대기 중 복약 일정",
                            value: dashboard && dashboard.pendingMedicationCount > 0 ? `${dashboard.pendingMedicationCount}건` : dashboard ? "모두 등록됨" : "-"
                        },
                        {
                            label: "미처리 비상 알림",
                            value: dashboard && dashboard.activeAlertCount > 0 ? `${dashboard.activeAlertCount}건` : dashboard ? "없음" : "-"
                        }
                    ]
                }
            ];
        }
    }["ProviderMyPage.useMemo[summarySections]"], [
        provider,
        dashboard,
        dashboardLoading
    ]);
    const mapDayToLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProviderMyPage.useCallback[mapDayToLabel]": (value)=>{
            const normalized = value.trim().toUpperCase();
            const labels = {
                MONDAY: "월",
                TUESDAY: "화",
                WEDNESDAY: "수",
                THURSDAY: "목",
                FRIDAY: "금",
                SATURDAY: "토",
                SUNDAY: "일"
            };
            return labels[normalized] ?? value;
        }
    }["ProviderMyPage.useCallback[mapDayToLabel]"], []);
    const formatAlarmTime = (value)=>{
        if (!value) {
            return "-";
        }
        return value.slice(0, 5);
    };
    const formatDateTime = (value)=>{
        if (!value) {
            return "-";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "-";
        }
        const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const timePart = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        return `${datePart} ${timePart}`;
    };
    const mapStatusToLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProviderMyPage.useCallback[mapStatusToLabel]": (status)=>{
            const labels = {
                ACTIVE: "활성",
                WAITING_MATCH: "배정 대기",
                SUSPENDED: "이용 중지",
                DEACTIVATED: "비활성"
            };
            return labels[status] ?? status;
        }
    }["ProviderMyPage.useCallback[mapStatusToLabel]"], []);
    const handleClientSearch = async (event)=>{
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
            const response = await fetch(`${API_BASE_URL}/api/providers/${provider.userId}/clients/search?keyword=${encodeURIComponent(keyword)}&size=20`);
            if (!response.ok) {
                const message = await extractApiError(response, "클라이언트를 검색하지 못했습니다.");
                throw new Error(message);
            }
            const data = await response.json();
            setSearchResults(data);
            setSearchMessage(data.length === 0 ? "검색 결과가 없습니다." : "");
        } catch (error) {
            const message = error instanceof Error ? error.message : "클라이언트를 검색하지 못했습니다.";
            setSearchError(message);
            setSearchResults([]);
            setSearchMessage("");
        } finally{
            setSearchLoading(false);
        }
    };
    const handleAssignClient = async (clientId)=>{
        if (!provider.userId) {
            return;
        }
        setAssignmentStates((prev)=>({
                ...prev,
                [clientId]: "loading"
            }));
        setAssignmentMessages((prev)=>({
                ...prev,
                [clientId]: undefined
            }));
        try {
            const response = await fetch(`${API_BASE_URL}/api/providers/${provider.userId}/clients/assignments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    clientId
                })
            });
            if (!response.ok) {
                const message = await extractApiError(response, "클라이언트를 배정하지 못했습니다.");
                throw new Error(message);
            }
            await loadDashboard();
            await handleClientSearch();
            setAssignmentMessages((prev)=>({
                    ...prev,
                    [clientId]: {
                        type: "success",
                        text: "클라이언트가 배정되었습니다."
                    }
                }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "클라이언트를 배정하지 못했습니다.";
            setAssignmentMessages((prev)=>({
                    ...prev,
                    [clientId]: {
                        type: "error",
                        text: message
                    }
                }));
        } finally{
            setAssignmentStates((prev)=>({
                    ...prev,
                    [clientId]: "idle"
                }));
        }
    };
    const handleMedicineSearch = async (clientId)=>{
        const form = planForms[clientId] ?? createInitialFormState();
        const keyword = form.medicineKeyword.trim();
        if (!keyword) {
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: "약품명을 먼저 입력해주세요.",
                    message: ""
                }));
            return;
        }
        updatePlanForm(clientId, (current)=>({
                ...current,
                searching: true,
                error: "",
                message: "",
                medicineResults: []
            }));
        try {
            const response = await fetch(`${API_BASE_URL}/api/medicines/search?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) {
                const message = await extractApiError(response, "약품 정보를 조회할 수 없습니다.");
                throw new Error(message);
            }
            const medicines = await response.json();
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    medicineResults: medicines,
                    searching: false,
                    error: medicines.length === 0 ? "검색 결과가 없습니다." : ""
                }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "약품 정보를 조회할 수 없습니다.";
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    searching: false,
                    error: message
                }));
        }
    };
    const handleSelectMedicine = (clientId, medicine)=>{
        updatePlanForm(clientId, (current)=>({
                ...current,
                selectedMedicineId: medicine.id,
                medicineKeyword: medicine.name,
                medicineResults: [],
                error: "",
                message: ""
            }));
    };
    const handleToggleDay = (clientId, dayValue)=>{
        setPlanForms((prev)=>{
            const form = prev[clientId] ?? createInitialFormState();
            const nextDays = form.daysOfWeek.includes(dayValue) ? form.daysOfWeek.filter((day)=>day !== dayValue) : [
                ...form.daysOfWeek,
                dayValue
            ];
            return {
                ...prev,
                [clientId]: {
                    ...form,
                    daysOfWeek: nextDays,
                    message: ""
                }
            };
        });
    };
    const handlePlanSubmit = async (clientId, event)=>{
        event.preventDefault();
        const form = planForms[clientId] ?? createInitialFormState();
        if (!form.selectedMedicineId) {
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: "약품을 검색하여 선택해주세요."
                }));
            return;
        }
        if (!form.dosageAmount || Number(form.dosageAmount) <= 0) {
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: "복용량을 1 이상으로 입력해주세요."
                }));
            return;
        }
        if (!form.dosageUnit.trim()) {
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: "복용 단위를 입력해주세요."
                }));
            return;
        }
        if (!form.alarmTime) {
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: "알람 시간을 선택해주세요."
                }));
            return;
        }
        if (form.daysOfWeek.length === 0) {
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: "복용 요일을 최소 1개 이상 선택해주세요."
                }));
            return;
        }
        updatePlanForm(clientId, (current)=>({
                ...current,
                submitting: true,
                error: "",
                message: ""
            }));
        try {
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/medication/plans`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    medicineId: form.selectedMedicineId,
                    dosageAmount: Number(form.dosageAmount),
                    dosageUnit: form.dosageUnit,
                    alarmTime: form.alarmTime,
                    daysOfWeek: form.daysOfWeek
                })
            });
            if (!response.ok) {
                const message = await extractApiError(response, "복약 일정을 등록하지 못했습니다.");
                throw new Error(message);
            }
            await loadDashboard();
            setPlanForms((prev)=>({
                    ...prev,
                    [clientId]: {
                        ...createInitialFormState(),
                        message: "복약 일정이 등록되었습니다."
                    }
                }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "복약 일정을 등록하지 못했습니다.";
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    submitting: false,
                    error: message
                }));
        } finally{
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    submitting: false
                }));
        }
    };
    const handleDeletePlan = async (clientId, planId)=>{
        setDeleteProcessing((prev)=>({
                ...prev,
                [planId]: "loading"
            }));
        setPlanMessages((prev)=>({
                ...prev,
                [planId]: undefined
            }));
        try {
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/medication/plans/${planId}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                const message = await extractApiError(response, "복약 일정을 삭제하지 못했습니다.");
                throw new Error(message);
            }
            await loadDashboard();
            setPlanMessages((prev)=>({
                    ...prev,
                    [planId]: {
                        type: "success",
                        text: "복약 일정이 삭제되었습니다."
                    }
                }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "복약 일정을 삭제하지 못했습니다.";
            setPlanMessages((prev)=>({
                    ...prev,
                    [planId]: {
                        type: "error",
                        text: message
                    }
                }));
        } finally{
            setDeleteProcessing((prev)=>({
                    ...prev,
                    [planId]: "idle"
                }));
        }
    };
    const handleRecordMedication = async (clientId, plan)=>{
        setLogProcessing((prev)=>({
                ...prev,
                [plan.id]: "loading"
            }));
        setLogMessages((prev)=>({
                ...prev,
                [plan.id]: undefined
            }));
        try {
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/medication/logs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    medicineId: plan.medicineId,
                    logTimestamp: new Date().toISOString(),
                    notes: "제공자가 복약을 확인했습니다."
                })
            });
            if (!response.ok) {
                const message = await extractApiError(response, "복약 확인을 저장하지 못했습니다.");
                throw new Error(message);
            }
            await loadDashboard();
            setLogMessages((prev)=>({
                    ...prev,
                    [plan.id]: {
                        type: "success",
                        text: "복약 확인이 저장되었습니다."
                    }
                }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "복약 확인을 저장하지 못했습니다.";
            setLogMessages((prev)=>({
                    ...prev,
                    [plan.id]: {
                        type: "error",
                        text: message
                    }
                }));
        } finally{
            setLogProcessing((prev)=>({
                    ...prev,
                    [plan.id]: "idle"
                }));
        }
    };
    const handleLogout = ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("refreshToken");
        window.localStorage.removeItem("userRole");
        window.localStorage.removeItem("userEmail");
        window.localStorage.removeItem("userId");
        router.replace("/");
    };
    if (!isReady) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "flex min-h-screen items-center justify-center bg-slate-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg bg-white px-6 py-8 shadow-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-600",
                    children: "제공자 정보를 불러오는 중입니다..."
                }, void 0, false, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 767,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/provider/mypage/page.tsx",
                lineNumber: 766,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/provider/mypage/page.tsx",
            lineNumber: 765,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-slate-50 px-4 py-10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm font-semibold uppercase tracking-wide text-emerald-600",
                                    children: "Guardian Provider"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 778,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-3xl font-bold text-slate-900",
                                    children: "환자 관리인 마이페이지"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 781,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-600",
                                    children: "담당 클라이언트의 복약 스케줄을 확인하고 직접 관리할 수 있습니다."
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 784,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 777,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "h-11 rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900",
                            onClick: handleLogout,
                            type: "button",
                            children: "로그아웃"
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 788,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 776,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-6 md:grid-cols-2",
                    children: summarySections.map((section)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "rounded-xl border border-slate-200 p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-semibold text-slate-900",
                                    children: section.title
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 803,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-1 text-sm text-slate-500",
                                    children: section.description
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 806,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                    className: "mt-4 space-y-3",
                                    children: section.rows.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                    className: "text-sm font-medium text-slate-600",
                                                    children: row.label
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 815,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                    className: "text-sm font-semibold text-slate-900",
                                                    children: row.value
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 818,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, row.label, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 811,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 809,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, section.title, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 799,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 797,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                    className: "rounded-xl border border-emerald-200 bg-emerald-50 p-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-2 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-semibold text-emerald-900",
                                            children: "담당 클라이언트 복약 관리"
                                        }, void 0, false, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 831,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-emerald-700",
                                            children: "복약 스케줄을 등록하거나 복약 여부를 대신 기록할 수 있습니다."
                                        }, void 0, false, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 834,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 830,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "self-start rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-60",
                                    disabled: dashboardLoading,
                                    onClick: loadDashboard,
                                    type: "button",
                                    children: dashboardLoading ? "새로고침 중..." : "데이터 새로고침"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 838,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 829,
                            columnNumber: 11
                        }, this),
                        dashboardLoading && !dashboard ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-white px-4 py-3 text-sm text-emerald-700",
                            children: "복약 정보를 불러오는 중입니다..."
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 849,
                            columnNumber: 13
                        }, this) : dashboardError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600",
                            children: dashboardError
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 853,
                            columnNumber: 13
                        }, this) : !dashboard || dashboard.clients.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-white px-4 py-3 text-sm text-emerald-700",
                            children: "현재 배정된 클라이언트가 없습니다. 관리자에게 문의해주세요."
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 857,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 space-y-6",
                            children: dashboard.clients.map((client)=>{
                                const form = planForms[client.clientId] ?? createInitialFormState();
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                    className: "rounded-lg border border-white bg-white p-5 shadow-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-xl font-semibold text-slate-900",
                                                        children: [
                                                            client.clientName,
                                                            " 님"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                        lineNumber: 871,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-slate-500",
                                                        children: [
                                                            "복약 일정 ",
                                                            client.medicationPlans.length,
                                                            "건 · 최근 확인",
                                                            " ",
                                                            client.latestMedicationLogs.length,
                                                            "건"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                        lineNumber: 874,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                lineNumber: 870,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 869,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-4",
                                                    children: [
                                                        client.medicationPlans.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600",
                                                            children: "등록된 복약 일정이 없습니다. 아래 양식을 통해 일정을 추가해주세요."
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 884,
                                                            columnNumber: 27
                                                        }, this) : client.medicationPlans.map((plan)=>{
                                                            const message = planMessages[plan.id];
                                                            const logMessage = logMessages[plan.id];
                                                            const latestLog = client.latestMedicationLogs.find((log)=>log.medicineId === plan.medicineId);
                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "rounded-md border border-slate-200 bg-slate-50 p-4",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                        className: "text-lg font-semibold text-slate-900",
                                                                                        children: plan.medicineName
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 901,
                                                                                        columnNumber: 37
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        className: "text-sm text-slate-600",
                                                                                        children: `${plan.dosageAmount}${plan.dosageUnit} · ${formatAlarmTime(plan.alarmTime)} · ${plan.daysOfWeek.map(mapDayToLabel).join(", ")}`
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 904,
                                                                                        columnNumber: 37
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 900,
                                                                                columnNumber: 35
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex gap-2",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                    className: "rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50",
                                                                                    disabled: deleteProcessing[plan.id] === "loading",
                                                                                    onClick: ()=>handleDeletePlan(client.clientId, plan.id),
                                                                                    type: "button",
                                                                                    children: deleteProcessing[plan.id] === "loading" ? "삭제 중..." : "삭제"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 913,
                                                                                    columnNumber: 37
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 912,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 899,
                                                                        columnNumber: 33
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "text-sm text-slate-600",
                                                                                children: [
                                                                                    "최근 확인:",
                                                                                    " ",
                                                                                    latestLog ? `${formatDateTime(latestLog.logTimestamp)}` : "기록 없음"
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 928,
                                                                                columnNumber: 35
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                className: "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",
                                                                                disabled: logProcessing[plan.id] === "loading",
                                                                                onClick: ()=>handleRecordMedication(client.clientId, plan),
                                                                                type: "button",
                                                                                children: logProcessing[plan.id] === "loading" ? "기록 중..." : "복약 확인 기록"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 934,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 927,
                                                                        columnNumber: 33
                                                                    }, this),
                                                                    logMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: `mt-2 text-sm ${logMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`,
                                                                        children: logMessage.text
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 948,
                                                                        columnNumber: 35
                                                                    }, this),
                                                                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: `mt-1 text-xs ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`,
                                                                        children: message.text
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 959,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, plan.id, true, {
                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                lineNumber: 895,
                                                                columnNumber: 31
                                                            }, this);
                                                        }),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                                            className: "space-y-3 rounded-md border border-slate-200 bg-white p-4",
                                                            onSubmit: (event)=>handlePlanSubmit(client.clientId, event),
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                    className: "text-sm font-semibold text-slate-900",
                                                                    children: "복약 일정 추가"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 978,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-col gap-2 sm:flex-row",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                            onChange: (event)=>updatePlanForm(client.clientId, (current)=>({
                                                                                        ...current,
                                                                                        medicineKeyword: event.target.value
                                                                                    })),
                                                                            placeholder: "약품명으로 검색",
                                                                            value: form.medicineKeyword
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 982,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            className: "rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50",
                                                                            disabled: form.searching,
                                                                            onClick: (event)=>{
                                                                                event.preventDefault();
                                                                                handleMedicineSearch(client.clientId);
                                                                            },
                                                                            children: form.searching ? "검색 중..." : "검색"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 993,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 981,
                                                                    columnNumber: 27
                                                                }, this),
                                                                form.medicineResults.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "rounded-md border border-slate-200 bg-slate-50 p-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs text-slate-500",
                                                                            children: "검색 결과를 선택하세요."
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1006,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "mt-2 grid gap-2 sm:grid-cols-2",
                                                                            children: form.medicineResults.map((medicine)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                    className: "rounded-md border border-white bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700",
                                                                                    onClick: (event)=>{
                                                                                        event.preventDefault();
                                                                                        handleSelectMedicine(client.clientId, medicine);
                                                                                    },
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                            className: "font-medium",
                                                                                            children: medicine.name
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                            lineNumber: 1019,
                                                                                            columnNumber: 37
                                                                                        }, this),
                                                                                        medicine.productCode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                            className: "block text-xs text-slate-500",
                                                                                            children: medicine.productCode
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                            lineNumber: 1021,
                                                                                            columnNumber: 39
                                                                                        }, this)
                                                                                    ]
                                                                                }, medicine.id, true, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1011,
                                                                                    columnNumber: 35
                                                                                }, this))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1009,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1005,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "grid gap-3 sm:grid-cols-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex flex-col gap-1",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "text-xs font-medium text-slate-600",
                                                                                    children: "복용량"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1032,
                                                                                    columnNumber: 31
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                    className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                    min: 1,
                                                                                    onChange: (event)=>updatePlanForm(client.clientId, (current)=>({
                                                                                                ...current,
                                                                                                dosageAmount: event.target.value
                                                                                            })),
                                                                                    type: "number",
                                                                                    value: form.dosageAmount
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1035,
                                                                                    columnNumber: 31
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1031,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex flex-col gap-1",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "text-xs font-medium text-slate-600",
                                                                                    children: "복용 단위"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1049,
                                                                                    columnNumber: 31
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                    className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                    onChange: (event)=>updatePlanForm(client.clientId, (current)=>({
                                                                                                ...current,
                                                                                                dosageUnit: event.target.value
                                                                                            })),
                                                                                    placeholder: "ex) 정, 캡슐",
                                                                                    value: form.dosageUnit
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1052,
                                                                                    columnNumber: 31
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1048,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1030,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-col gap-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            className: "text-xs font-medium text-slate-600",
                                                                            children: "알람 시간"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1066,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                            onChange: (event)=>updatePlanForm(client.clientId, (current)=>({
                                                                                        ...current,
                                                                                        alarmTime: event.target.value
                                                                                    })),
                                                                            type: "time",
                                                                            value: form.alarmTime
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1069,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1065,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-col gap-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs font-medium text-slate-600",
                                                                            children: "복용 요일"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1082,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex flex-wrap gap-2",
                                                                            children: allDays.map((day)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "flex items-center gap-1 text-xs text-slate-600",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            checked: form.daysOfWeek.includes(day.value),
                                                                                            className: "rounded border-slate-300 text-emerald-600 focus:ring-emerald-500",
                                                                                            onChange: ()=>handleToggleDay(client.clientId, day.value),
                                                                                            type: "checkbox"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                            lineNumber: 1091,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        day.label
                                                                                    ]
                                                                                }, day.value, true, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1087,
                                                                                    columnNumber: 33
                                                                                }, this))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1085,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1081,
                                                                    columnNumber: 27
                                                                }, this),
                                                                form.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-red-600",
                                                                    children: form.error
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1105,
                                                                    columnNumber: 29
                                                                }, this),
                                                                form.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-emerald-600",
                                                                    children: form.message
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1108,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",
                                                                    disabled: form.submitting,
                                                                    type: "submit",
                                                                    children: form.submitting ? "등록 중..." : "복약 일정 등록"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1110,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 974,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 882,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-3 rounded-md border border-slate-200 bg-white p-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                            className: "text-sm font-semibold text-slate-900",
                                                            children: "최근 복약 확인 기록"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1120,
                                                            columnNumber: 25
                                                        }, this),
                                                        client.latestMedicationLogs.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-slate-600",
                                                            children: "기록이 없습니다."
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1124,
                                                            columnNumber: 27
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                            className: "space-y-2",
                                                            children: client.latestMedicationLogs.slice(0, 5).map((log)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    className: "rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "font-medium",
                                                                            children: log.medicineName
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1132,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs text-slate-500",
                                                                            children: formatDateTime(log.logTimestamp)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1133,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        log.notes && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs text-slate-500",
                                                                            children: log.notes
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1137,
                                                                            columnNumber: 35
                                                                        }, this)
                                                                    ]
                                                                }, log.id, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1128,
                                                                    columnNumber: 31
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1126,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1119,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 881,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, client.clientId, true, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 865,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 861,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 828,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/provider/mypage/page.tsx",
            lineNumber: 775,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/provider/mypage/page.tsx",
        lineNumber: 774,
        columnNumber: 5
    }, this);
}
_s(ProviderMyPage, "Mar3kFguewIOO5svpHL3DTsuu2U=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = ProviderMyPage;
var _c;
__turbopack_context__.k.register(_c, "ProviderMyPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=_df6a594d._.js.map