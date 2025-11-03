module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/provider/mypage/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProviderMyPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8090";
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
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [isReady, setIsReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [provider, setProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        userId: null,
        email: "",
        name: ""
    });
    const [dashboard, setDashboard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dashboardLoading, setDashboardLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dashboardError, setDashboardError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [planForms, setPlanForms] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [planMessages, setPlanMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [logProcessing, setLogProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [logMessages, setLogMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [deleteProcessing, setDeleteProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [searchKeyword, setSearchKeyword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [searchResults, setSearchResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [searchLoading, setSearchLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchError, setSearchError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [searchMessage, setSearchMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [assignmentStates, setAssignmentStates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [assignmentMessages, setAssignmentMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const updatePlanForm = (clientId, updater)=>{
        setPlanForms((prev)=>{
            const current = prev[clientId] ?? createInitialFormState();
            return {
                ...prev,
                [clientId]: updater(current)
            };
        });
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) {
            return;
        }
        //TURBOPACK unreachable
        ;
        const accessToken = undefined;
        const role = undefined;
        const storedEmail = undefined;
        const storedUserId = undefined;
        const userId = undefined;
    }, [
        router
    ]);
    const loadDashboard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
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
            setPlanForms((prev)=>{
                const next = {
                    ...prev
                };
                data.clients.forEach((client)=>{
                    if (!next[client.clientId]) {
                        next[client.clientId] = createInitialFormState();
                    }
                });
                return next;
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "제공자 대시보드를 불러오지 못했습니다.";
            setDashboardError(message);
            setDashboard(null);
        } finally{
            setDashboardLoading(false);
        }
    }, [
        provider.userId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isReady || !provider.userId) {
            return;
        }
        loadDashboard();
    }, [
        isReady,
        provider.userId,
        loadDashboard
    ]);
    const summarySections = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return [
            {
                title: "담당자 정보",
                description: "현재 로그인한 요양보호사/제공자의 기본 정보입니다.",
                rows: [
                    {
                        label: "이름",
                        value: provider.name || "확인 중"
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
    }, [
        provider,
        dashboard,
        dashboardLoading
    ]);
    const mapDayToLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((value)=>{
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
    }, []);
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
    const mapStatusToLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((status)=>{
        const labels = {
            ACTIVE: "활성",
            WAITING_MATCH: "배정 대기",
            SUSPENDED: "이용 중지",
            DEACTIVATED: "비활성"
        };
        return labels[status] ?? status;
    }, []);
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
            if (searchKeyword.trim()) {
                await handleClientSearch();
            }
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
        if ("TURBOPACK compile-time truthy", 1) {
            return;
        }
        //TURBOPACK unreachable
        ;
    };
    if (!isReady) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "flex min-h-screen items-center justify-center bg-slate-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg bg-white px-6 py-8 shadow-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-600",
                    children: "제공자 정보를 불러오는 중입니다..."
                }, void 0, false, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 798,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/provider/mypage/page.tsx",
                lineNumber: 797,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/provider/mypage/page.tsx",
            lineNumber: 796,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-slate-50 px-4 py-10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-xl",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm font-semibold uppercase tracking-wide text-emerald-600",
                                    children: "Guardian Provider"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 809,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-3xl font-bold text-slate-900",
                                    children: "환자 관리인 마이페이지"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 812,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-600",
                                    children: "담당 클라이언트의 복약 스케줄을 확인하고 직접 관리할 수 있습니다."
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 815,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 808,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "h-11 rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900",
                            onClick: handleLogout,
                            type: "button",
                            children: "로그아웃"
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 819,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 807,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-6 md:grid-cols-2",
                    children: summarySections.map((section)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "rounded-xl border border-slate-200 p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-semibold text-slate-900",
                                    children: section.title
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 834,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-1 text-sm text-slate-500",
                                    children: section.description
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 837,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                    className: "mt-4 space-y-3",
                                    children: section.rows.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                    className: "text-sm font-medium text-slate-600",
                                                    children: row.label
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 846,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                    className: "text-sm font-semibold text-slate-900",
                                                    children: row.value
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 849,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, row.label, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 842,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 840,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, section.title, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 830,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 828,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                    className: "rounded-xl border border-emerald-200 bg-white p-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-2 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-lg font-semibold text-emerald-900",
                                        children: "클라이언트 검색 및 배정"
                                    }, void 0, false, {
                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                        lineNumber: 862,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-emerald-700",
                                        children: "이름 또는 이메일로 클라이언트를 찾아 배정 여부를 확인하고 배정을 진행하세요."
                                    }, void 0, false, {
                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                        lineNumber: 865,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/provider/mypage/page.tsx",
                                lineNumber: 861,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 860,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            className: "mt-4 flex flex-col gap-3 sm:flex-row sm:items-center",
                            onSubmit: (event)=>{
                                void handleClientSearch(event);
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "flex-1 rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                    onChange: (event)=>{
                                        setSearchKeyword(event.target.value);
                                        if (searchError) {
                                            setSearchError("");
                                        }
                                    },
                                    placeholder: "클라이언트 이름 또는 이메일",
                                    value: searchKeyword
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 877,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",
                                    disabled: searchLoading,
                                    type: "submit",
                                    children: searchLoading ? "검색 중..." : "검색"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 888,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 871,
                            columnNumber: 11
                        }, this),
                        searchError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-3 text-sm text-red-600",
                            children: searchError
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 898,
                            columnNumber: 13
                        }, this),
                        searchLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700",
                            children: "검색 중입니다..."
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 902,
                            columnNumber: 13
                        }, this) : searchResults.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 space-y-3",
                            children: searchResults.map((result)=>{
                                const assignedToCurrent = result.currentlyAssigned && result.assignedProviderId === provider.userId;
                                const assignedToOther = result.currentlyAssigned && result.assignedProviderId !== provider.userId;
                                const assignState = assignmentStates[result.clientId];
                                const buttonDisabled = assignState === "loading" || assignedToCurrent || !result.assignable;
                                let buttonLabel = "배정하기";
                                if (assignState === "loading") {
                                    buttonLabel = "배정 중...";
                                } else if (assignedToCurrent) {
                                    buttonLabel = "이미 배정됨";
                                } else if (!result.assignable) {
                                    buttonLabel = "배정 불가";
                                }
                                const addressDisplay = result.address && result.address.trim().length > 0 ? result.address : "미등록";
                                const ageDisplay = typeof result.age === "number" && result.age > 0 ? `${result.age}세` : "미등록";
                                const cycleDisplay = result.medicationCycle && result.medicationCycle.trim().length > 0 ? result.medicationCycle : "미등록";
                                const statusLabel = mapStatusToLabel(result.status);
                                const assignMessage = assignmentMessages[result.clientId];
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                    className: "rounded-lg border border-emerald-100 bg-emerald-50 p-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-lg font-semibold text-emerald-900",
                                                            children: [
                                                                result.name,
                                                                " 님"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 948,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "mt-1 flex flex-wrap items-center gap-2 text-xs",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "rounded-full bg-white px-2 py-1 font-medium text-emerald-600",
                                                                    children: statusLabel
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 952,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-emerald-700",
                                                                    children: result.email
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 955,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 951,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 947,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-right text-xs text-emerald-700",
                                                    children: [
                                                        "현재 배정:",
                                                        " ",
                                                        assignedToOther ? `${result.assignedProviderName ?? "다른 제공자"} (${result.assignedProviderEmail ?? "정보 없음"})` : assignedToCurrent ? "현재 담당 중" : "없음"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 958,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 946,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-3 grid gap-2 text-sm text-emerald-800 sm:grid-cols-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        "주소: ",
                                                        addressDisplay
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 969,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        "나이: ",
                                                        ageDisplay
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 970,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        "복약 주기: ",
                                                        cycleDisplay
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 971,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 968,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    className: "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",
                                                    disabled: buttonDisabled,
                                                    onClick: ()=>handleAssignClient(result.clientId),
                                                    type: "button",
                                                    children: buttonLabel
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 974,
                                                    columnNumber: 23
                                                }, this),
                                                assignMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: `text-sm ${assignMessage.type === "success" ? "text-emerald-700" : "text-red-600"}`,
                                                    children: assignMessage.text
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 983,
                                                    columnNumber: 25
                                                }, this),
                                                !result.assignable && !assignedToCurrent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-red-600",
                                                    children: "다른 제공자에게 배정된 클라이언트입니다."
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 994,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 973,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, result.clientId, true, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 942,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 906,
                            columnNumber: 13
                        }, this) : searchKeyword.trim().length > 0 && searchMessage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600",
                            children: searchMessage
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1004,
                            columnNumber: 13
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 859,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                    className: "rounded-xl border border-emerald-200 bg-emerald-50 p-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-2 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-semibold text-emerald-900",
                                            children: "담당 클라이언트 복약 관리"
                                        }, void 0, false, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1013,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-emerald-700",
                                            children: "복약 스케줄을 등록하거나 복약 여부를 대신 기록할 수 있습니다."
                                        }, void 0, false, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1016,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1012,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "self-start rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-60",
                                    disabled: dashboardLoading,
                                    onClick: loadDashboard,
                                    type: "button",
                                    children: dashboardLoading ? "새로고침 중..." : "데이터 새로고침"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1020,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1011,
                            columnNumber: 11
                        }, this),
                        dashboardLoading && !dashboard ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-white px-4 py-3 text-sm text-emerald-700",
                            children: "복약 정보를 불러오는 중입니다..."
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1031,
                            columnNumber: 13
                        }, this) : dashboardError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600",
                            children: dashboardError
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1035,
                            columnNumber: 13
                        }, this) : !dashboard || dashboard.clients.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-white px-4 py-3 text-sm text-emerald-700",
                            children: "현재 배정된 클라이언트가 없습니다. 관리자에게 문의해주세요."
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1039,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 space-y-6",
                            children: dashboard.clients.map((client)=>{
                                const form = planForms[client.clientId] ?? createInitialFormState();
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                    className: "rounded-lg border border-white bg-white p-5 shadow-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-xl font-semibold text-slate-900",
                                                        children: [
                                                            client.clientName,
                                                            " 님"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                        lineNumber: 1053,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                                                        lineNumber: 1056,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                lineNumber: 1052,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1051,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-4",
                                                    children: [
                                                        client.medicationPlans.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600",
                                                            children: "등록된 복약 일정이 없습니다. 아래 양식을 통해 일정을 추가해주세요."
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1066,
                                                            columnNumber: 27
                                                        }, this) : client.medicationPlans.map((plan)=>{
                                                            const message = planMessages[plan.id];
                                                            const logMessage = logMessages[plan.id];
                                                            const latestLog = client.latestMedicationLogs.find((log)=>log.medicineId === plan.medicineId);
                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "rounded-md border border-slate-200 bg-slate-50 p-4",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                        className: "text-lg font-semibold text-slate-900",
                                                                                        children: plan.medicineName
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 1083,
                                                                                        columnNumber: 37
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        className: "text-sm text-slate-600",
                                                                                        children: `${plan.dosageAmount}${plan.dosageUnit} · ${formatAlarmTime(plan.alarmTime)} · ${plan.daysOfWeek.map(mapDayToLabel).join(", ")}`
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 1086,
                                                                                        columnNumber: 37
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 1082,
                                                                                columnNumber: 35
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex gap-2",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                    className: "rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50",
                                                                                    disabled: deleteProcessing[plan.id] === "loading",
                                                                                    onClick: ()=>handleDeletePlan(client.clientId, plan.id),
                                                                                    type: "button",
                                                                                    children: deleteProcessing[plan.id] === "loading" ? "삭제 중..." : "삭제"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1095,
                                                                                    columnNumber: 37
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 1094,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 1081,
                                                                        columnNumber: 33
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                className: "text-sm text-slate-600",
                                                                                children: [
                                                                                    "최근 확인:",
                                                                                    " ",
                                                                                    latestLog ? `${formatDateTime(latestLog.logTimestamp)}` : "기록 없음"
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 1110,
                                                                                columnNumber: 35
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                className: "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",
                                                                                disabled: logProcessing[plan.id] === "loading",
                                                                                onClick: ()=>handleRecordMedication(client.clientId, plan),
                                                                                type: "button",
                                                                                children: logProcessing[plan.id] === "loading" ? "기록 중..." : "복약 확인 기록"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 1116,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 1109,
                                                                        columnNumber: 33
                                                                    }, this),
                                                                    logMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: `mt-2 text-sm ${logMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`,
                                                                        children: logMessage.text
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 1130,
                                                                        columnNumber: 35
                                                                    }, this),
                                                                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: `mt-1 text-xs ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`,
                                                                        children: message.text
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 1141,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, plan.id, true, {
                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                lineNumber: 1077,
                                                                columnNumber: 31
                                                            }, this);
                                                        }),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                                            className: "space-y-3 rounded-md border border-slate-200 bg-white p-4",
                                                            onSubmit: (event)=>handlePlanSubmit(client.clientId, event),
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                    className: "text-sm font-semibold text-slate-900",
                                                                    children: "복약 일정 추가"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1160,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-col gap-2 sm:flex-row",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                            onChange: (event)=>updatePlanForm(client.clientId, (current)=>({
                                                                                        ...current,
                                                                                        medicineKeyword: event.target.value
                                                                                    })),
                                                                            placeholder: "약품명으로 검색",
                                                                            value: form.medicineKeyword
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1164,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            className: "rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50",
                                                                            disabled: form.searching,
                                                                            onClick: (event)=>{
                                                                                event.preventDefault();
                                                                                handleMedicineSearch(client.clientId);
                                                                            },
                                                                            children: form.searching ? "검색 중..." : "검색"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1175,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1163,
                                                                    columnNumber: 27
                                                                }, this),
                                                                form.medicineResults.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "rounded-md border border-slate-200 bg-slate-50 p-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs text-slate-500",
                                                                            children: "검색 결과를 선택하세요."
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1188,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "mt-2 grid gap-2 sm:grid-cols-2",
                                                                            children: form.medicineResults.map((medicine)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                    className: "rounded-md border border-white bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700",
                                                                                    onClick: (event)=>{
                                                                                        event.preventDefault();
                                                                                        handleSelectMedicine(client.clientId, medicine);
                                                                                    },
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                            className: "font-medium",
                                                                                            children: medicine.name
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                            lineNumber: 1201,
                                                                                            columnNumber: 37
                                                                                        }, this),
                                                                                        medicine.productCode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                            className: "block text-xs text-slate-500",
                                                                                            children: medicine.productCode
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                            lineNumber: 1203,
                                                                                            columnNumber: 39
                                                                                        }, this)
                                                                                    ]
                                                                                }, medicine.id, true, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1193,
                                                                                    columnNumber: 35
                                                                                }, this))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1191,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1187,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "grid gap-3 sm:grid-cols-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex flex-col gap-1",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "text-xs font-medium text-slate-600",
                                                                                    children: "복용량"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1214,
                                                                                    columnNumber: 31
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                                                                    lineNumber: 1217,
                                                                                    columnNumber: 31
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1213,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex flex-col gap-1",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "text-xs font-medium text-slate-600",
                                                                                    children: "복용 단위"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1231,
                                                                                    columnNumber: 31
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                    className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                    onChange: (event)=>updatePlanForm(client.clientId, (current)=>({
                                                                                                ...current,
                                                                                                dosageUnit: event.target.value
                                                                                            })),
                                                                                    placeholder: "ex) 정, 캡슐",
                                                                                    value: form.dosageUnit
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1234,
                                                                                    columnNumber: 31
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1230,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1212,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-col gap-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                            className: "text-xs font-medium text-slate-600",
                                                                            children: "알람 시간"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1248,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                            onChange: (event)=>updatePlanForm(client.clientId, (current)=>({
                                                                                        ...current,
                                                                                        alarmTime: event.target.value
                                                                                    })),
                                                                            type: "time",
                                                                            value: form.alarmTime
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1251,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1247,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-col gap-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs font-medium text-slate-600",
                                                                            children: "복용 요일"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1264,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex flex-wrap gap-2",
                                                                            children: allDays.map((day)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "flex items-center gap-1 text-xs text-slate-600",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            checked: form.daysOfWeek.includes(day.value),
                                                                                            className: "rounded border-slate-300 text-emerald-600 focus:ring-emerald-500",
                                                                                            onChange: ()=>handleToggleDay(client.clientId, day.value),
                                                                                            type: "checkbox"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                            lineNumber: 1273,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        day.label
                                                                                    ]
                                                                                }, day.value, true, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1269,
                                                                                    columnNumber: 33
                                                                                }, this))
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1267,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1263,
                                                                    columnNumber: 27
                                                                }, this),
                                                                form.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-red-600",
                                                                    children: form.error
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1287,
                                                                    columnNumber: 29
                                                                }, this),
                                                                form.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-emerald-600",
                                                                    children: form.message
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1290,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",
                                                                    disabled: form.submitting,
                                                                    type: "submit",
                                                                    children: form.submitting ? "등록 중..." : "복약 일정 등록"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1292,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1156,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1064,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-3 rounded-md border border-slate-200 bg-white p-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                            className: "text-sm font-semibold text-slate-900",
                                                            children: "최근 복약 확인 기록"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1302,
                                                            columnNumber: 25
                                                        }, this),
                                                        client.latestMedicationLogs.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-slate-600",
                                                            children: "기록이 없습니다."
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1306,
                                                            columnNumber: 27
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                            className: "space-y-2",
                                                            children: client.latestMedicationLogs.slice(0, 5).map((log)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    className: "rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "font-medium",
                                                                            children: log.medicineName
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1314,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs text-slate-500",
                                                                            children: formatDateTime(log.logTimestamp)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1315,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        log.notes && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs text-slate-500",
                                                                            children: log.notes
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1319,
                                                                            columnNumber: 35
                                                                        }, this)
                                                                    ]
                                                                }, log.id, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1310,
                                                                    columnNumber: 31
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1308,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1301,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1063,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, client.clientId, true, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1047,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1043,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 1010,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/provider/mypage/page.tsx",
            lineNumber: 806,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/provider/mypage/page.tsx",
        lineNumber: 805,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b1713e26._.js.map