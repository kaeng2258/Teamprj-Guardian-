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
const createEmptyManualMedicine = ()=>({
        name: "",
        productCode: "",
        efficacy: "",
        usageDosage: "",
        caution: "",
        sideEffects: "",
        description: ""
    });
const createPlanFormItemState = ()=>({
        mode: "search",
        manualMedicine: createEmptyManualMedicine(),
        medicineKeyword: "",
        medicineResults: [],
        selectedMedicineId: null,
        dosageAmount: "",
        dosageUnit: "",
        searching: false
    });
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
        items: [
            createPlanFormItemState()
        ],
        alarmTime: "",
        daysOfWeek: [],
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
    const updatePlanFormItem = (clientId, itemIndex, updater, options = {})=>{
        const { resetStatus = false } = options;
        updatePlanForm(clientId, (current)=>{
            const items = [
                ...current.items
            ];
            const target = items[itemIndex] ?? createPlanFormItemState();
            items[itemIndex] = updater(target);
            return {
                ...current,
                items,
                ...resetStatus ? {
                    error: "",
                    message: ""
                } : {}
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
    const handleMedicineSearch = async (clientId, itemIndex)=>{
        const form = planForms[clientId] ?? createInitialFormState();
        const item = form.items[itemIndex];
        if (!item) {
            return;
        }
        const keyword = item.medicineKeyword.trim();
        if (!keyword) {
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: "약품명을 먼저 입력해주세요.",
                    message: ""
                }));
            return;
        }
        updatePlanFormItem(clientId, itemIndex, (current)=>({
                ...current,
                searching: true,
                medicineResults: []
            }), {
            resetStatus: true
        });
        try {
            const response = await fetch(`${API_BASE_URL}/api/medicines/search?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) {
                const message = await extractApiError(response, "약품 정보를 조회할 수 없습니다.");
                throw new Error(message);
            }
            const medicines = await response.json();
            updatePlanFormItem(clientId, itemIndex, (current)=>({
                    ...current,
                    medicineResults: medicines,
                    searching: false
                }));
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: medicines.length === 0 ? "검색 결과가 없습니다." : "",
                    message: ""
                }));
        } catch (error) {
            const message = error instanceof Error ? error.message : "약품 정보를 조회할 수 없습니다.";
            updatePlanFormItem(clientId, itemIndex, (current)=>({
                    ...current,
                    searching: false
                }));
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: message,
                    message: ""
                }));
        }
    };
    const handleSelectMedicine = (clientId, itemIndex, medicine)=>{
        updatePlanFormItem(clientId, itemIndex, (current)=>({
                ...current,
                mode: "search",
                selectedMedicineId: medicine.id,
                medicineKeyword: medicine.name,
                medicineResults: [],
                manualMedicine: createEmptyManualMedicine(),
                searching: false
            }), {
            resetStatus: true
        });
    };
    const handlePlanModeChange = (clientId, itemIndex, mode)=>{
        updatePlanFormItem(clientId, itemIndex, (current)=>{
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
                    searching: false
                };
            }
            return {
                ...current,
                mode,
                medicineKeyword: current.manualMedicine.name.trim(),
                selectedMedicineId: null,
                manualMedicine: createEmptyManualMedicine(),
                searching: false
            };
        }, {
            resetStatus: true
        });
    };
    const handleManualFieldChange = (clientId, itemIndex, field, value)=>{
        updatePlanFormItem(clientId, itemIndex, (current)=>({
                ...current,
                manualMedicine: {
                    ...current.manualMedicine,
                    [field]: value
                }
            }), {
            resetStatus: true
        });
    };
    const handleAddPlanItem = (clientId)=>{
        updatePlanForm(clientId, (current)=>({
                ...current,
                items: [
                    ...current.items,
                    createPlanFormItemState()
                ],
                error: "",
                message: ""
            }));
    };
    const handleRemovePlanItem = (clientId, itemIndex)=>{
        updatePlanForm(clientId, (current)=>{
            if (current.items.length <= 1) {
                return current;
            }
            const nextItems = current.items.filter((_, index)=>index !== itemIndex);
            return {
                ...current,
                items: nextItems.length > 0 ? nextItems : [
                    createPlanFormItemState()
                ],
                error: "",
                message: ""
            };
        });
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
                    error: "",
                    message: ""
                }
            };
        });
    };
    const handlePlanSubmit = async (clientId, event)=>{
        event.preventDefault();
        const form = planForms[clientId] ?? createInitialFormState();
        if (form.items.length === 0) {
            updatePlanForm(clientId, (current)=>({
                    ...current,
                    error: "최소 1개 이상의 약품을 추가해주세요."
                }));
            return;
        }
        for(let index = 0; index < form.items.length; index += 1){
            const item = form.items[index];
            if (!item) {
                continue;
            }
            if (item.mode === "search" && !item.selectedMedicineId) {
                updatePlanForm(clientId, (current)=>({
                        ...current,
                        error: `복약 항목 ${index + 1}의 약품을 검색하여 선택해주세요.`
                    }));
                return;
            }
            if (item.mode === "manual" && !item.manualMedicine.name.trim()) {
                updatePlanForm(clientId, (current)=>({
                        ...current,
                        error: `복약 항목 ${index + 1}의 약품 이름을 입력해주세요.`
                    }));
                return;
            }
            const dosageAmountRaw = item.dosageAmount.trim();
            const dosageAmountValue = Number(dosageAmountRaw);
            if (!dosageAmountRaw || Number.isNaN(dosageAmountValue) || dosageAmountValue <= 0) {
                updatePlanForm(clientId, (current)=>({
                        ...current,
                        error: `복약 항목 ${index + 1}의 복용량을 1 이상으로 입력해주세요.`
                    }));
                return;
            }
            if (!item.dosageUnit.trim()) {
                updatePlanForm(clientId, (current)=>({
                        ...current,
                        error: `복약 항목 ${index + 1}의 복용 단위를 입력해주세요.`
                    }));
                return;
            }
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
            const sanitizeOptional = (value)=>{
                const trimmed = value.trim();
                return trimmed.length > 0 ? trimmed : null;
            };
            const itemsPayload = form.items.map((item)=>{
                const base = {
                    dosageAmount: Number(item.dosageAmount),
                    dosageUnit: item.dosageUnit.trim()
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
                            description: sanitizeOptional(item.manualMedicine.description)
                        }
                    };
                }
                return {
                    ...base,
                    medicineId: item.selectedMedicineId
                };
            });
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/medication/plans/batch`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    alarmTime: form.alarmTime,
                    daysOfWeek: form.daysOfWeek,
                    items: itemsPayload
                })
            });
            if (!response.ok) {
                const message = await extractApiError(response, "복약 일정을 등록하지 못했습니다.");
                throw new Error(message);
            }
            await loadDashboard();
            const successMessage = form.items.length > 1 ? `${form.items.length}개의 복약 일정이 등록되었습니다.` : "복약 일정이 등록되었습니다.";
            setPlanForms((prev)=>({
                    ...prev,
                    [clientId]: {
                        ...createInitialFormState(),
                        message: successMessage
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
                    lineNumber: 1024,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/provider/mypage/page.tsx",
                lineNumber: 1023,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/provider/mypage/page.tsx",
            lineNumber: 1022,
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
                                    lineNumber: 1035,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-3xl font-bold text-slate-900",
                                    children: "환자 관리인 마이페이지"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1038,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-slate-600",
                                    children: "담당 클라이언트의 복약 스케줄을 확인하고 직접 관리할 수 있습니다."
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1041,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1034,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "h-11 rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900",
                            onClick: handleLogout,
                            type: "button",
                            children: "로그아웃"
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1045,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 1033,
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
                                    lineNumber: 1060,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-1 text-sm text-slate-500",
                                    children: section.description
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1063,
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
                                                    lineNumber: 1072,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                    className: "text-sm font-semibold text-slate-900",
                                                    children: row.value
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1075,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, row.label, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1068,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1066,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, section.title, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1056,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 1054,
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
                                        lineNumber: 1088,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-emerald-700",
                                        children: "이름 또는 이메일로 클라이언트를 찾아 배정 여부를 확인하고 배정을 진행하세요."
                                    }, void 0, false, {
                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                        lineNumber: 1091,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/provider/mypage/page.tsx",
                                lineNumber: 1087,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1086,
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
                                    lineNumber: 1103,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",
                                    disabled: searchLoading,
                                    type: "submit",
                                    children: searchLoading ? "검색 중..." : "검색"
                                }, void 0, false, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1114,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1097,
                            columnNumber: 11
                        }, this),
                        searchError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-3 text-sm text-red-600",
                            children: searchError
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1124,
                            columnNumber: 13
                        }, this),
                        searchLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700",
                            children: "검색 중입니다..."
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1128,
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
                                                            lineNumber: 1174,
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
                                                                    lineNumber: 1178,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-emerald-700",
                                                                    children: result.email
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1181,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1177,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1173,
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
                                                    lineNumber: 1184,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1172,
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
                                                    lineNumber: 1195,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        "나이: ",
                                                        ageDisplay
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1196,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        "복약 주기: ",
                                                        cycleDisplay
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1197,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1194,
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
                                                    lineNumber: 1200,
                                                    columnNumber: 23
                                                }, this),
                                                assignMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: `text-sm ${assignMessage.type === "success" ? "text-emerald-700" : "text-red-600"}`,
                                                    children: assignMessage.text
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1209,
                                                    columnNumber: 25
                                                }, this),
                                                !result.assignable && !assignedToCurrent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-red-600",
                                                    children: "다른 제공자에게 배정된 클라이언트입니다."
                                                }, void 0, false, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1220,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1199,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, result.clientId, true, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1168,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1132,
                            columnNumber: 13
                        }, this) : searchKeyword.trim().length > 0 && searchMessage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600",
                            children: searchMessage
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1230,
                            columnNumber: 13
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 1085,
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
                                            lineNumber: 1239,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-emerald-700",
                                            children: "복약 스케줄을 등록하거나 복약 여부를 대신 기록할 수 있습니다."
                                        }, void 0, false, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1242,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1238,
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
                                    lineNumber: 1246,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1237,
                            columnNumber: 11
                        }, this),
                        dashboardLoading && !dashboard ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-white px-4 py-3 text-sm text-emerald-700",
                            children: "복약 정보를 불러오는 중입니다..."
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1257,
                            columnNumber: 13
                        }, this) : dashboardError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600",
                            children: dashboardError
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1261,
                            columnNumber: 13
                        }, this) : !dashboard || dashboard.clients.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 rounded-md bg-white px-4 py-3 text-sm text-emerald-700",
                            children: "현재 배정된 클라이언트가 없습니다. 관리자에게 문의해주세요."
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1265,
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
                                                        lineNumber: 1279,
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
                                                        lineNumber: 1282,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                lineNumber: 1278,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1277,
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
                                                            lineNumber: 1292,
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
                                                                                        lineNumber: 1309,
                                                                                        columnNumber: 37
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        className: "text-sm text-slate-600",
                                                                                        children: `${plan.dosageAmount}${plan.dosageUnit} · ${formatAlarmTime(plan.alarmTime)} · ${plan.daysOfWeek.map(mapDayToLabel).join(", ")}`
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 1312,
                                                                                        columnNumber: 37
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 1308,
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
                                                                                    lineNumber: 1321,
                                                                                    columnNumber: 37
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 1320,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 1307,
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
                                                                                lineNumber: 1336,
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
                                                                                lineNumber: 1342,
                                                                                columnNumber: 35
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 1335,
                                                                        columnNumber: 33
                                                                    }, this),
                                                                    logMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: `mt-2 text-sm ${logMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`,
                                                                        children: logMessage.text
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 1356,
                                                                        columnNumber: 35
                                                                    }, this),
                                                                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: `mt-1 text-xs ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`,
                                                                        children: message.text
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                        lineNumber: 1367,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, plan.id, true, {
                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                lineNumber: 1303,
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
                                                                    lineNumber: 1386,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex flex-col gap-4",
                                                                    children: [
                                                                        form.items.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "flex items-center justify-between",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                                        className: "text-xs font-semibold text-slate-500",
                                                                                                        children: [
                                                                                                            "복약 항목 ",
                                                                                                            index + 1
                                                                                                        ]
                                                                                                    }, void 0, true, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1397,
                                                                                                        columnNumber: 37
                                                                                                    }, this),
                                                                                                    item.mode === "search" && item.selectedMedicineId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                                        className: "text-sm font-medium text-slate-700",
                                                                                                        children: item.medicineKeyword
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1401,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    item.mode === "manual" && item.manualMedicine.name.trim().length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                                        className: "text-sm font-medium text-slate-700",
                                                                                                        children: item.manualMedicine.name
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1407,
                                                                                                        columnNumber: 41
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1396,
                                                                                                columnNumber: 35
                                                                                            }, this),
                                                                                            form.items.length > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>handleRemovePlanItem(client.clientId, index),
                                                                                                className: "rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600",
                                                                                                children: "항목 삭제"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1413,
                                                                                                columnNumber: 37
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 1395,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "flex flex-wrap gap-2",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>handlePlanModeChange(client.clientId, index, "search"),
                                                                                                className: `rounded-md border px-4 py-2 text-xs font-semibold transition ${item.mode === "search" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"}`,
                                                                                                children: "약 검색"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1425,
                                                                                                columnNumber: 35
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>handlePlanModeChange(client.clientId, index, "manual"),
                                                                                                className: `rounded-md border px-4 py-2 text-xs font-semibold transition ${item.mode === "manual" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"}`,
                                                                                                children: "직접 입력"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1438,
                                                                                                columnNumber: 35
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 1424,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    item.mode === "search" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-2 sm:flex-row",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                        className: "flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "약품명으로 검색",
                                                                                                        value: item.medicineKeyword,
                                                                                                        onChange: (event)=>updatePlanFormItem(client.clientId, index, (current)=>({
                                                                                                                    ...current,
                                                                                                                    medicineKeyword: event.target.value,
                                                                                                                    selectedMedicineId: null
                                                                                                                }), {
                                                                                                                resetStatus: true
                                                                                                            })
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1456,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                        className: "rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50",
                                                                                                        disabled: item.searching,
                                                                                                        onClick: (event)=>{
                                                                                                            event.preventDefault();
                                                                                                            handleMedicineSearch(client.clientId, index);
                                                                                                        },
                                                                                                        children: item.searching ? "검색 중..." : "검색"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1473,
                                                                                                        columnNumber: 39
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1455,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            item.medicineResults.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "rounded-md border border-slate-200 bg-white p-2",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                                        className: "text-xs text-slate-500",
                                                                                                        children: "검색 결과를 선택하세요."
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1486,
                                                                                                        columnNumber: 41
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                        className: "mt-2 grid gap-2 sm:grid-cols-2",
                                                                                                        children: item.medicineResults.map((medicine)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                                className: "rounded-md border border-white bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700",
                                                                                                                onClick: (event)=>{
                                                                                                                    event.preventDefault();
                                                                                                                    handleSelectMedicine(client.clientId, index, medicine);
                                                                                                                },
                                                                                                                children: [
                                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                                        className: "font-medium",
                                                                                                                        children: medicine.name
                                                                                                                    }, void 0, false, {
                                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                                        lineNumber: 1503,
                                                                                                                        columnNumber: 47
                                                                                                                    }, this),
                                                                                                                    medicine.productCode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                                        className: "block text-xs text-slate-500",
                                                                                                                        children: medicine.productCode
                                                                                                                    }, void 0, false, {
                                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                                        lineNumber: 1507,
                                                                                                                        columnNumber: 49
                                                                                                                    }, this)
                                                                                                                ]
                                                                                                            }, medicine.id, true, {
                                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                                lineNumber: 1491,
                                                                                                                columnNumber: 45
                                                                                                            }, this))
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1489,
                                                                                                        columnNumber: 41
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1485,
                                                                                                columnNumber: 39
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "space-y-3 rounded-md border border-slate-200 bg-white p-3",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                                className: "text-xs text-slate-500",
                                                                                                children: "검색 결과가 없을 때 직접 약품 정보를 입력하고 등록할 수 있습니다."
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1519,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-1",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                                        className: "text-xs font-medium text-slate-600",
                                                                                                        children: [
                                                                                                            "약품 이름",
                                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                                className: "text-red-500",
                                                                                                                children: "*"
                                                                                                            }, void 0, false, {
                                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                                lineNumber: 1524,
                                                                                                                columnNumber: 46
                                                                                                            }, this)
                                                                                                        ]
                                                                                                    }, void 0, true, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1523,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                        className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "직접 입력할 약품 이름",
                                                                                                        value: item.manualMedicine.name,
                                                                                                        onChange: (event)=>handleManualFieldChange(client.clientId, index, "name", event.target.value)
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1526,
                                                                                                        columnNumber: 39
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1522,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-1",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                                        className: "text-xs font-medium text-slate-600",
                                                                                                        children: "제품 코드 (선택)"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1541,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                        className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "예) 국문 제품 코드",
                                                                                                        value: item.manualMedicine.productCode,
                                                                                                        onChange: (event)=>handleManualFieldChange(client.clientId, index, "productCode", event.target.value)
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1544,
                                                                                                        columnNumber: 39
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1540,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-1",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                                        className: "text-xs font-medium text-slate-600",
                                                                                                        children: "효능 / 효과 (선택)"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1559,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                                                        className: "min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "약품의 주요 효능을 입력하세요.",
                                                                                                        value: item.manualMedicine.efficacy,
                                                                                                        onChange: (event)=>handleManualFieldChange(client.clientId, index, "efficacy", event.target.value)
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1562,
                                                                                                        columnNumber: 39
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1558,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-1",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                                        className: "text-xs font-medium text-slate-600",
                                                                                                        children: "복용 방법 (선택)"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1577,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                                                        className: "min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "예) 1일 3회, 1회 1정 등",
                                                                                                        value: item.manualMedicine.usageDosage,
                                                                                                        onChange: (event)=>handleManualFieldChange(client.clientId, index, "usageDosage", event.target.value)
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1580,
                                                                                                        columnNumber: 39
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1576,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-1",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                                        className: "text-xs font-medium text-slate-600",
                                                                                                        children: "주의 사항 (선택)"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1595,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                                                        className: "min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "주의사항이나 알레르기 정보를 입력하세요.",
                                                                                                        value: item.manualMedicine.caution,
                                                                                                        onChange: (event)=>handleManualFieldChange(client.clientId, index, "caution", event.target.value)
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1598,
                                                                                                        columnNumber: 39
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1594,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-1",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                                        className: "text-xs font-medium text-slate-600",
                                                                                                        children: "부작용 (선택)"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1613,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                                                        className: "min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "예상되는 부작용을 입력하세요.",
                                                                                                        value: item.manualMedicine.sideEffects,
                                                                                                        onChange: (event)=>handleManualFieldChange(client.clientId, index, "sideEffects", event.target.value)
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1616,
                                                                                                        columnNumber: 39
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1612,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-1",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                                        className: "text-xs font-medium text-slate-600",
                                                                                                        children: "비고 (선택)"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1631,
                                                                                                        columnNumber: 39
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                                                        className: "min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "추가 메모를 입력하세요.",
                                                                                                        value: item.manualMedicine.description,
                                                                                                        onChange: (event)=>handleManualFieldChange(client.clientId, index, "description", event.target.value)
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1634,
                                                                                                        columnNumber: 39
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1630,
                                                                                                columnNumber: 37
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 1518,
                                                                                        columnNumber: 35
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
                                                                                                        lineNumber: 1652,
                                                                                                        columnNumber: 37
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                        className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        min: 1,
                                                                                                        type: "number",
                                                                                                        value: item.dosageAmount,
                                                                                                        onChange: (event)=>updatePlanFormItem(client.clientId, index, (current)=>({
                                                                                                                    ...current,
                                                                                                                    dosageAmount: event.target.value
                                                                                                                }), {
                                                                                                                resetStatus: true
                                                                                                            })
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1655,
                                                                                                        columnNumber: 37
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1651,
                                                                                                columnNumber: 35
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex flex-col gap-1",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                                        className: "text-xs font-medium text-slate-600",
                                                                                                        children: "복용 단위"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1674,
                                                                                                        columnNumber: 37
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                        className: "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none",
                                                                                                        placeholder: "ex) 정, 캡슐",
                                                                                                        value: item.dosageUnit,
                                                                                                        onChange: (event)=>updatePlanFormItem(client.clientId, index, (current)=>({
                                                                                                                    ...current,
                                                                                                                    dosageUnit: event.target.value
                                                                                                                }), {
                                                                                                                resetStatus: true
                                                                                                            })
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                        lineNumber: 1677,
                                                                                                        columnNumber: 37
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                                lineNumber: 1673,
                                                                                                columnNumber: 35
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                        lineNumber: 1650,
                                                                                        columnNumber: 33
                                                                                    }, this)
                                                                                ]
                                                                            }, `plan-item-${index}`, true, {
                                                                                fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                lineNumber: 1391,
                                                                                columnNumber: 31
                                                                            }, this)),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            type: "button",
                                                                            onClick: ()=>handleAddPlanItem(client.clientId),
                                                                            className: "rounded-md border border-dashed border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900",
                                                                            children: "+ 약품 항목 추가"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1697,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1389,
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
                                                                            lineNumber: 1706,
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
                                                                            lineNumber: 1709,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1705,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                                                                    className: "flex flex-col gap-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                                                                            className: "text-xs font-medium text-slate-600",
                                                                            children: "복용 요일"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1722,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "grid grid-cols-7 gap-1 sm:gap-2",
                                                                            children: allDays.map((day)=>{
                                                                                const isSelected = form.daysOfWeek.includes(day.value);
                                                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "block",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                            type: "checkbox",
                                                                                            className: "peer sr-only",
                                                                                            checked: isSelected,
                                                                                            onChange: ()=>handleToggleDay(client.clientId, day.value)
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                            lineNumber: 1730,
                                                                                            columnNumber: 37
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                            className: `flex h-10 items-center justify-center rounded-lg border text-xs font-semibold transition ${isSelected ? "border-emerald-500 bg-emerald-100 text-emerald-700 shadow-sm" : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700"} peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500`,
                                                                                            children: day.label
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                            lineNumber: 1738,
                                                                                            columnNumber: 37
                                                                                        }, this)
                                                                                    ]
                                                                                }, day.value, true, {
                                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                                    lineNumber: 1729,
                                                                                    columnNumber: 35
                                                                                }, this);
                                                                            })
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1725,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1721,
                                                                    columnNumber: 27
                                                                }, this),
                                                                form.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-red-600",
                                                                    children: form.error
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1753,
                                                                    columnNumber: 29
                                                                }, this),
                                                                form.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm text-emerald-600",
                                                                    children: form.message
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1756,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300",
                                                                    disabled: form.submitting,
                                                                    type: "submit",
                                                                    children: form.submitting ? "등록 중..." : "복약 일정 등록"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1758,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1382,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1290,
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
                                                            lineNumber: 1768,
                                                            columnNumber: 25
                                                        }, this),
                                                        client.latestMedicationLogs.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-slate-600",
                                                            children: "기록이 없습니다."
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1772,
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
                                                                            lineNumber: 1780,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs text-slate-500",
                                                                            children: formatDateTime(log.logTimestamp)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1781,
                                                                            columnNumber: 33
                                                                        }, this),
                                                                        log.notes && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                            className: "text-xs text-slate-500",
                                                                            children: log.notes
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                                            lineNumber: 1785,
                                                                            columnNumber: 35
                                                                        }, this)
                                                                    ]
                                                                }, log.id, true, {
                                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                                    lineNumber: 1776,
                                                                    columnNumber: 31
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                                            lineNumber: 1774,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                                    lineNumber: 1767,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/provider/mypage/page.tsx",
                                            lineNumber: 1289,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, client.clientId, true, {
                                    fileName: "[project]/app/provider/mypage/page.tsx",
                                    lineNumber: 1273,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/app/provider/mypage/page.tsx",
                            lineNumber: 1269,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/provider/mypage/page.tsx",
                    lineNumber: 1236,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/provider/mypage/page.tsx",
            lineNumber: 1032,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/provider/mypage/page.tsx",
        lineNumber: 1031,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b1713e26._.js.map