"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminGuard } from "../../hooks/useAdminGuard";
import { clearAuthCookie, readAuth } from "../../lib/auth";

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
  role: "CLIENT" | "MANAGER" | "ADMIN";
};

type AdminUserDetail = AdminUserSummary & {
  createdAt?: string;
  phoneNumber?: string | null;
};

type UserMedicationPlanSummary = {
  medicineName: string;
  alarmTime?: string | null;
  daysOfWeek?: string[];
};

type UserMedicationSummary = {
  adherenceRate: number;
  plans: UserMedicationPlanSummary[];
};

function getAuthToken() {
  const auth = readAuth();
  return auth?.accessToken ?? null;
}

async function fetchWithAuth(url: string, init?: RequestInit) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(init?.headers as any),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...init, headers, cache: "no-store" });
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const isAllowed = useAdminGuard();
  const guardLoading = false; // 로딩 상태를 따로 관리하지 않는 구조라면

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

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

  const filteredUsers = useMemo(() => {
    const kw = userKeyword.trim();
    return users.filter((u) => {
      const okRole = userRole === "ALL" ? true : u.role === userRole;
      const okKw = !kw || (u.name ?? "").includes(kw) || (u.email ?? "").includes(kw);
      return okRole && okKw;
    });
  }, [users, userKeyword, userRole]);

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("guardian_auth");
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem("userRole");
      window.localStorage.removeItem("userEmail");
      window.localStorage.removeItem("userId");
      clearAuthCookie();
    }
    router.replace("/");
  }, [router]);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/overview`);
      if (!res.ok) throw new Error("대시보드 요약 정보를 불러오지 못했습니다.");
      const data = (await res.json()) as AdminOverview;
      setOverview(data);
    } catch (e) {
      console.error("[AdminDashboard] overview error:", e);
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    setUserError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users`);
      if (!res.ok) throw new Error("유저 목록을 불러오지 못했습니다.");
      const data = (await res.json()) as AdminUserSummary[];
      setUsers(data);
    } catch (e) {
      console.error("[AdminDashboard] users error:", e);
      setUsers([]);
      setUserError("유저 목록을 불러오지 못했습니다.");
    } finally {
      setUserLoading(false);
    }
  }, []);

  const loadUserDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setUserMedication(null);
    setUserMedicationError(null);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${id}`);
      if (!res.ok) throw new Error("유저 상세 정보를 불러오지 못했습니다.");
      const detail = (await res.json()) as AdminUserDetail;
      setSelectedUser(detail);

      if (detail.role === "CLIENT") {
        try {
          const medRes = await fetchWithAuth(
            `${API_BASE_URL}/api/admin/users/${id}/medication-summary`
          );
          if (medRes.ok) {
            const med = (await medRes.json()) as UserMedicationSummary;
            setUserMedication(med);
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
  }, []);

  useEffect(() => {
    if (!isAllowed || guardLoading) return;

    // adminEmail 표시용
    try {
      const raw = window.localStorage.getItem("guardian_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        setAdminEmail(parsed?.email ?? null);
      }
    } catch {
      setAdminEmail(null);
    }

    void loadOverview();
    void loadUsers();
  }, [isAllowed, guardLoading, loadOverview, loadUsers]);

  if (guardLoading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-6">
          <h1 className="text-lg font-bold">접근 권한이 없습니다.</h1>
          <p className="mt-2 text-sm text-gray-600">관리자 계정으로 로그인하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">관리자 대시보드</h1>
            <p className="mt-1 text-sm text-slate-600">
              유저/매칭/복약/알림 데이터를 한눈에 확인하고 관리할 수 있습니다.
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
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              로그아웃
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            title="CLIENT"
            value={overviewLoading ? "..." : overview?.clientCount ?? 0}
            subtitle="등록된 사용자(클라이언트)"
          />
          <SummaryCard
            title="MANAGER"
            value={overviewLoading ? "..." : overview?.managerCount ?? 0}
            subtitle="등록된 사용자(보호자)"
          />
          <SummaryCard
            title="ACTIVE MATCH"
            value={overviewLoading ? "..." : overview?.activeMatches ?? 0}
            subtitle="현재 매칭 상태"
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={userKeyword}
                  onChange={(e) => setUserKeyword(e.target.value)}
                  placeholder="이름/이메일 검색"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRoleFilter)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400 sm:w-40"
                >
                  <option value="ALL">전체</option>
                  <option value="CLIENT">CLIENT</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => void loadUsers()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                새로고침
              </button>
            </div>

            <div className="max-h-[560px] overflow-auto">
              {userLoading && (
                <div className="p-4 text-sm text-slate-500">유저 목록 로딩 중...</div>
              )}
              {userError && <div className="p-4 text-sm text-red-600">{userError}</div>}
              {!userLoading && !userError && filteredUsers.length === 0 && (
                <div className="p-4 text-sm text-slate-500">검색 결과가 없습니다.</div>
              )}
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => void loadUserDetail(u.id)}
                  className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${
                    selectedUser?.id === u.id ? "bg-slate-50" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">유저 상세</h2>

            {!selectedUser && (
              <p className="mt-3 text-sm text-slate-500">왼쪽에서 유저를 선택하세요.</p>
            )}

            {selectedUser && (
              <div className="mt-3 space-y-3">
                {detailLoading ? (
                  <p className="text-sm text-slate-500">상세 로딩 중...</p>
                ) : (
                  <>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">이름</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedUser.name}</p>
                      <p className="mt-2 text-xs text-slate-500">이메일</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedUser.email}</p>
                      <p className="mt-2 text-xs text-slate-500">역할</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedUser.role}</p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-900">복약 요약</p>
                      {selectedUser.role !== "CLIENT" ? (
                        <p className="mt-2 text-sm text-slate-500">
                          CLIENT만 복약 요약이 표시됩니다.
                        </p>
                      ) : userMedicationError ? (
                        <p className="mt-2 text-sm text-red-600">{userMedicationError}</p>
                      ) : !userMedication ? (
                        <p className="mt-2 text-sm text-slate-500">불러오는 중...</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-slate-700">
                            30일 복약률:{" "}
                            <span className="font-bold text-slate-900">
                              {userMedication.adherenceRate?.toFixed?.(1) ??
                                userMedication.adherenceRate}
                              %
                            </span>
                          </p>
                          <div className="text-xs text-slate-500">복약 계획</div>
                          <ul className="space-y-1 text-sm text-slate-800">
                            {(userMedication.plans ?? []).map((p, idx) => (
                              <li key={idx} className="rounded-md bg-slate-50 p-2">
                                <div className="font-semibold">{p.medicineName}</div>
                                <div className="text-xs text-slate-600">
                                  {p.alarmTime ?? "-"} / {(p.daysOfWeek ?? []).join(", ") || "-"}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
