"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminGuard } from "../../hooks/useAdminGuard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type UserRoleFilter = "ALL" | "CLIENT" | "MANAGER" | "ADMIN";

type AdminOverview = {
  clientCount: number;
  managerCount: number;
  activeMatches: number;
};

type AdminUserSummary = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

type AdminUserDetail = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string | null;
  address?: string | null;
  detailAddress?: string | null;
  zipCode?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

type MedicationAdherencePoint = {
  month: string;
  rate: number;
};

type MedicationPlanSummary = {
  medicineName: string;
  alarmTime?: string | null;
  daysOfWeek?: string[] | null;
};

type UserMedicationSummary = {
  adherenceRate?: number | null;
  plans: MedicationPlanSummary[];
};

type MonthlyAdherenceResponse = {
  points: MedicationAdherencePoint[];
};

// ✅ 로그인 시 localStorage에 저장해둔 구조
type GuardianAuthPayload = {
  userId: number;
  role: string;
  accessToken: string;
  refreshToken: string;
  email: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function roleLabel(roleRaw?: string | null) {
  const r = (roleRaw ?? "").toUpperCase();
  if (r.includes("ADMIN")) return "관리자";
  if (r.includes("MANAGER")) return "관리인";
  if (r.includes("CLIENT")) return "환자";
  return roleRaw ?? "-";
}

function statusLabel(statusRaw?: string | null) {
  const s = (statusRaw ?? "").toUpperCase();
  // 프로젝트에서 쓰는 ENUM에 맞춰 필요 시 추가하세요.
  if (s === "ACTIVE") return "활성";
  if (s === "INACTIVE") return "비활성";
  if (s === "SUSPENDED") return "정지";
  if (s === "WAITING_MATCH") return "매칭 대기";
  return statusRaw ?? "-";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const ready = useAdminGuard();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [adherencePoints, setAdherencePoints] = useState<MedicationAdherencePoint[]>([]);
  const [adherenceError, setAdherenceError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [userKeyword, setUserKeyword] = useState("");
  const [userRole, setUserRole] = useState<UserRoleFilter>("ALL");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userMedication, setUserMedication] = useState<UserMedicationSummary | null>(null);
  const [userMedicationError, setUserMedicationError] = useState<string | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const getAuth = (): GuardianAuthPayload | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("guardian_auth");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GuardianAuthPayload;
    } catch {
      return null;
    }
  };

  const logoutAndRedirect = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("guardian_auth");
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem("userRole");
      window.localStorage.removeItem("userId");
      window.localStorage.removeItem("userEmail");
    }
    router.replace("/"); // 로그인 페이지(또는 홈)로 이동
  }, [router]);

  const fetchWithAuth = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const auth = getAuth();
      if (!auth?.accessToken) {
        logoutAndRedirect();
        throw new Error("로그인 정보가 없습니다. 다시 로그인해주세요.");
      }

      const res = await fetch(url, {
        ...init,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      // ✅ 핵심: 401이면 자동 로그아웃 + 이동
      if (res.status === 401) {
        logoutAndRedirect();
        throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
      }

      return res;
    },
    [logoutAndRedirect]
  );

  useEffect(() => {
    if (!ready) return;

    const auth = getAuth();
    if (auth?.email) setAdminEmail(auth.email);

    (async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/overview`);
        if (!res.ok) throw new Error("요약 정보를 불러오지 못했습니다.");
        const data = await res.json();
        setOverview({
          clientCount: data.clientCount ?? 0,
          managerCount: data.managerCount ?? 0,
          activeMatches: data.activeMatches ?? 0,
        });
      } catch (e) {
        // 401은 fetchWithAuth에서 처리됨
        console.error("[AdminDashboard] overview error:", e);
      }
    })();

    (async () => {
      try {
        setAdherenceError(null);
        const res = await fetchWithAuth(
          `${API_BASE_URL}/api/admin/medication/adherence?months=6`
        );
        if (!res.ok) {
          setAdherenceError("투약 순응도 데이터를 불러오지 못했습니다.");
          return;
        }
        const data: MonthlyAdherenceResponse = await res.json();
        setAdherencePoints(data.points ?? []);
      } catch (e) {
        console.error("[AdminDashboard] adherence error:", e);
        setAdherenceError("투약 순응도 데이터를 불러오지 못했습니다.");
      }
    })();
  }, [ready, fetchWithAuth]);

  const totalUsers = useMemo(() => {
    if (!overview) return 0;
    return overview.clientCount + overview.managerCount;
  }, [overview]);

  const handleLogout = () => logoutAndRedirect();

  const searchUsers = async () => {
    try {
      setUserLoading(true);
      setUserError(null);
      setUsers([]);
      setSelectedUser(null);
      setUserMedication(null);
      setUserMedicationError(null);
      setDeleteError(null);

      const params = new URLSearchParams();
      params.set("keyword", userKeyword.trim());
      if (userRole !== "ALL") params.set("role", userRole);

      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/admin/users?${params.toString()}`
      );

      if (res.status === 403) throw new Error("권한이 없습니다.");
      if (!res.ok) throw new Error("유저 목록을 불러오지 못했습니다.");

      const data: AdminUserSummary[] = await res.json();
      setUsers(data);
    } catch (err: unknown) {
      setUserError(
        err instanceof Error ? err.message : "유저 검색 중 오류가 발생했습니다."
      );
    } finally {
      setUserLoading(false);
    }
  };

  const loadUserDetail = async (userId: number) => {
    try {
      setDetailLoading(true);
      setUserMedication(null);
      setUserMedicationError(null);
      setDeleteError(null);

      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("유저 상세 정보를 불러오지 못했습니다.");

      const data: AdminUserDetail = await res.json();
      setSelectedUser(data);

      const roleUpper = (data.role ?? "").toUpperCase();
      if (roleUpper.includes("CLIENT")) {
        try {
          const medRes = await fetchWithAuth(
            `${API_BASE_URL}/api/admin/users/${userId}/medication-summary`
          );
          if (medRes.ok) {
            const medData: UserMedicationSummary = await medRes.json();
            setUserMedication(medData);
          } else {
            setUserMedication(null);
            setUserMedicationError("복약 정보를 불러오지 못했습니다.");
          }
        } catch {
          setUserMedication(null);
          setUserMedicationError("복약 정보를 불러오지 못했습니다.");
        }
      } else {
        setUserMedication(null);
        setUserMedicationError(null);
      }
    } catch (e) {
      console.error("[AdminDashboard] user detail error:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!confirm("정말 이 유저를 삭제하시겠습니까?")) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "유저 삭제에 실패했습니다.");
      }

      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setSelectedUser(null);
      setUserMedication(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "유저 삭제에 실패했습니다.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">관리자 권한을 확인하는 중입니다...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              관리자 대시보드
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              전체 이용자와 매칭 현황을 관리하고, 각 유저의 상세 정보를 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {adminEmail && (
              <div className="text-right">
                <p className="text-xs text-slate-500">로그인 중인 계정</p>
                <p className="text-sm font-medium text-slate-800">{adminEmail}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              로그아웃
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="전체 이용자"
            value={totalUsers ? `${totalUsers.toLocaleString()}명` : "-"}
            description={
              overview
                ? `환자 ${overview.clientCount} · 관리인 ${overview.managerCount}`
                : ""
            }
          />
          <SummaryCard
            label="환자 수"
            value={overview ? `${overview.clientCount.toLocaleString()}명` : "-"}
          />
          <SummaryCard
            label="관리인 수"
            value={overview ? `${overview.managerCount.toLocaleString()}명` : "-"}
          />
        </section>

        {(adherencePoints.length > 0 || adherenceError) && (
          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  최근 6개월 투약 순응도
                </h2>
                <p className="text-xs text-slate-500">
                  월별 순응도(%)를 막대 그래프로 확인하세요.
                </p>
              </div>
            </div>
            {adherenceError && (
              <p className="mt-3 text-xs text-rose-500">{adherenceError}</p>
            )}
            {!adherenceError && (
              <div className="mt-4 grid gap-3 sm:grid-cols-6">
                {adherencePoints.map((point) => (
                  <AdherenceBar key={point.month} label={point.month} value={point.rate} />
                ))}
                {adherencePoints.length === 0 && (
                  <p className="text-xs text-slate-500">표시할 순응도 데이터가 없습니다.</p>
                )}
              </div>
            )}
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">유저 검색</h2>
                  <p className="text-xs text-slate-500">
                    이름 / 이메일 + 역할로 환자 또는 관리인을 검색합니다.
                  </p>
                </div>
              </div>

              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void searchUsers();
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="이름 또는 이메일을 입력하세요"
                    value={userKeyword}
                    onChange={(e) => setUserKeyword(e.target.value)}
                  />
                  <select
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRoleFilter)}
                  >
                    <option value="ALL">전체</option>
                    <option value="CLIENT">환자</option>
                    <option value="MANAGER">관리인</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
                  disabled={userLoading}
                >
                  {userLoading ? "검색 중..." : "검색"}
                </button>

                {userError && <p className="text-xs text-red-500">{userError}</p>}
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
              <h3 className="text-sm font-semibold text-slate-900">검색 결과</h3>
              <p className="text-xs text-slate-400">
                유저를 클릭하면 오른쪽에서 상세 정보를 확인할 수 있습니다.
              </p>

              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {users.length === 0 && !userLoading && !userError && (
                  <p className="py-3 text-xs text-slate-500">
                    아직 검색된 유저가 없습니다. 조건을 입력하고 검색을 눌러주세요.
                  </p>
                )}

                {users.map((u) => (
                  <article
                    key={u.id}
                    onClick={() => void loadUserDetail(u.id)}
                    className={`cursor-pointer rounded-xl border px-3 py-2 text-xs transition ${
                      selectedUser?.id === u.id
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500">
                        <p>{roleLabel(u.role)}</p>
                        <p className="mt-0.5">{statusLabel(u.status)}</p>
                      </div>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-400">
                      가입일 {formatDateTime(u.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
            <h2 className="text-base font-semibold text-slate-900">선택된 유저 정보</h2>
            <p className="mt-1 text-xs text-slate-500">
              좌측에서 유저를 선택하면 자세한 정보를 확인할 수 있습니다.
            </p>

            {detailLoading && (
              <p className="mt-4 text-sm text-slate-500">불러오는 중...</p>
            )}

            {!detailLoading && !selectedUser && (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                아직 선택된 유저가 없습니다.
              </div>
            )}

            {selectedUser && (
              <div className="mt-5 space-y-4">
                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">기본 정보</h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow label="이름" value={selectedUser.name} />
                    <InfoRow label="이메일" value={selectedUser.email} />
                    <InfoRow label="회원 유형" value={roleLabel(selectedUser.role)} />
                    <InfoRow label="상태" value={statusLabel(selectedUser.status)} />
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">상세 정보</h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow label="전화번호" value={selectedUser.phone || "-"} />
                    <InfoRow label="도로명 주소" value={selectedUser.address || "-"} />
                    <InfoRow label="상세 주소" value={selectedUser.detailAddress || "-"} />
                    <InfoRow label="우편번호" value={selectedUser.zipCode || "-"} />
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">가입/수정일</h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow label="가입일" value={formatDateTime(selectedUser.createdAt)} />
                    <InfoRow label="수정일" value={formatDateTime(selectedUser.updatedAt)} />
                  </div>
                </section>

                {userMedicationError && (
                  <p className="text-xs text-rose-500">{userMedicationError}</p>
                )}

                {userMedication && (
                  <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">복약 정보</h3>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-xs text-slate-500">복약 순응도</span>
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-700">
                        {userMedication.adherenceRate != null
                          ? `${Math.round(userMedication.adherenceRate)}%`
                          : "데이터 없음"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {userMedication.plans.length === 0 && (
                        <p className="text-xs text-slate-500">등록된 복약 계획이 없습니다.</p>
                      )}
                      {userMedication.plans.map((plan, idx) => (
                        <div
                          key={`${plan.medicineName}-${idx}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <p className="font-semibold text-slate-900">{plan.medicineName}</p>
                          <p className="text-xs text-slate-500">
                            {plan.alarmTime ? `알람 ${plan.alarmTime.slice(0, 5)}` : "알람 시간 없음"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {plan.daysOfWeek && plan.daysOfWeek.length > 0
                              ? `요일: ${plan.daysOfWeek.join(", ")}`
                              : "요일 설정 없음"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleDeleteUser()}
                    disabled={deleteLoading}
                    className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-60"
                  >
                    {deleteLoading ? "삭제 중..." : "삭제"}
                  </button>
                  {deleteError && <p className="text-xs text-rose-500">{deleteError}</p>}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  description?: string;
};

function SummaryCard({ label, value, description }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="w-20 shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <span className="flex-1 text-sm text-slate-800">{value}</span>
    </div>
  );
}

function AdherenceBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-32 w-full items-end rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
        <div
          className="w-full rounded-md bg-indigo-500 shadow-sm transition-all"
          style={{ height: `${clamped}%`, minHeight: "4px" }}
        />
      </div>
      <div className="text-center">
        <p className="text-[11px] font-semibold text-slate-900">{Math.round(clamped)}%</p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}
