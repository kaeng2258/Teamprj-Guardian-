"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";     
import { useAdminGuard } from "../../hooks/useAdminGuard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

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
  createdAt: string;
  updatedAt?: string | null;
};

// ✅ 로그인 시 localStorage에 저장해둔 구조
type GuardianAuthPayload = {
  userId: number;
  role: string;
  accessToken: string;
  refreshToken: string;
  email: string;
};

export default function AdminDashboardPage() {
    const router = useRouter();   
  // ✅ 관리자 가드
  const ready = useAdminGuard();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
 const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [userKeyword, setUserKeyword] = useState("");
  const [userRole, setUserRole] = useState<UserRoleFilter>("ALL");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

const getAuth = (): GuardianAuthPayload | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("guardian_auth");
  console.log("[AdminDashboard] guardian_auth raw =", raw);  // ⬅ 추가
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuardianAuthPayload;
    console.log("[AdminDashboard] guardian_auth parsed =", parsed); // ⬅ 추가
    return parsed;
  } catch (e) {
    console.error("[AdminDashboard] auth parse error:", e);
    return null;
  }
};

  // ✅ 요약 정보 로드 (ADMIN 가드 통과 후 + 토큰 붙여서 호출)
  useEffect(() => {
    if (!ready) return;
    const auth = getAuth();
    if (auth?.email) {
      setAdminEmail(auth.email);
    }

    (async () => {
      try {
        const auth = getAuth();
        if (!auth) {
          console.warn("[AdminDashboard] auth not found");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/admin/overview`, {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.accessToken}`,
          },
        });

        if (!res.ok) {
          console.error("[AdminDashboard] overview load failed", res.status);
          return;
        }

        const data = await res.json();
        setOverview({
          clientCount: data.clientCount ?? 0,
          managerCount: data.managerCount ?? 0,
          activeMatches: data.activeMatches ?? 0,
        });
      } catch (e) {
        console.error("[AdminDashboard] overview error:", e);
      }
    })();
  }, [ready]);

  const totalUsers = useMemo(() => {
    if (!overview) return 0;
    return overview.clientCount + overview.managerCount;
  }, [overview]);
// ✅ 로그아웃
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("guardian_auth");
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem("userRole");
      window.localStorage.removeItem("userId");
      window.localStorage.removeItem("userEmail");
    }
    router.replace("/");     // 로그인 페이지로 이동
  };
  // ✅ 유저 검색 (토큰 포함)
const searchUsers = async () => {
  try {
    setUserLoading(true);
    setUserError(null);
    setUsers([]);
    setSelectedUser(null);

    const auth = getAuth();
    console.log("[AdminDashboard] searchUsers auth =", auth); 
      if (!auth) {
        setUserError("로그인 정보가 없습니다. 다시 로그인 해주세요.");
        return;
      }

      const params = new URLSearchParams();
      params.set("keyword", userKeyword.trim());
      if (userRole !== "ALL") params.set("role", userRole);

      const res = await fetch(
        `${API_BASE_URL}/api/admin/users?${params.toString()}`,
        {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.accessToken}`,
          },
        }
      );

      if (res.status === 401) {
        throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
      }
      if (res.status === 403) {
        throw new Error("관리자 권한이 없습니다.");
      }
      if (!res.ok) {
        throw new Error("유저 목록을 불러오지 못했습니다.");
      }

      const data: AdminUserSummary[] = await res.json();
      setUsers(data);
    } catch (err: unknown) {
      setUserError(
        err instanceof Error ? err.message : "유저 검색 중 오류가 발생했습니다.",
      );
    } finally {
      setUserLoading(false);
    }
  };

  // ✅ 유저 상세 (토큰 포함)
  const loadUserDetail = async (userId: number) => {
    try {
      setDetailLoading(true);

      const auth = getAuth();
      if (!auth) {
        console.warn("[AdminDashboard] auth not found while loading detail");
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/api/admin/users/${userId}`,
        {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.accessToken}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("사용자 정보를 불러오지 못했습니다.");
      }

      const data: AdminUserDetail = await res.json();
      setSelectedUser(data);
    } catch (e) {
      console.error("[AdminDashboard] user detail error:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // ⛔ 아직 ADMIN 확인 중이면 로딩 화면만
  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          관리자 권한을 확인하는 중입니다...
        </p>
      </main>
    );
  }

  // ✅ 여기부터는 실제 관리자 페이지
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* 상단 헤더 */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              관리자 대시보드
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              전체 이용자와 매칭 현황을 관리하고, 각 유저의 상세 정보를 확인할 수 있습니다.
            </p>
          </div>
          {/* 우측: 로그인한 관리자 정보 + 로그아웃 */}
          <div className="flex items-center gap-3">
            {adminEmail && (
              <div className="text-right">
                <p className="text-xs text-slate-500">로그인 중인 계정</p>
                <p className="text-sm font-medium text-slate-800">
                  {adminEmail}
                </p>
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

        {/* 요약 카드 */}
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
            value={
              overview ? `${overview.clientCount.toLocaleString()}명` : "-"
            }
          />
          <SummaryCard
            label="관리인 수"
            value={
              overview ? `${overview.managerCount.toLocaleString()}명` : "-"
            }
          />
        </section>

        {/* 메인 2컬럼 레이아웃 */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* 좌측: 검색 + 리스트 */}
          <div className="space-y-4">
            {/* 검색 박스 */}
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    유저 검색
                  </h2>
                  <p className="text-xs text-slate-500">
                    이름 / 이메일 + 역할로 환자 또는 관리인을 검색합니다.
                  </p>
                </div>
              </div>

              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  searchUsers();
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
                    onChange={(e) =>
                      setUserRole(e.target.value as UserRoleFilter)
                    }
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
                {userError && (
                  <p className="text-xs text-red-500">{userError}</p>
                )}
              </form>
            </div>

            {/* 검색 결과 리스트 */}
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
              <h3 className="text-sm font-semibold text-slate-900">
                검색 결과
              </h3>
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
                    onClick={() => loadUserDetail(u.id)}
                    className={`cursor-pointer rounded-xl border px-3 py-2 text-xs transition ${
                      selectedUser?.id === u.id
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {u.email}
                        </p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500">
                        <p>{u.role}</p>
                        <p className="mt-0.5">{u.status}</p>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      가입일{" "}
                      {new Date(u.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: 선택된 유저 상세 */}
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
            <h2 className="text-base font-semibold text-slate-900">
              선택된 유저 정보
            </h2>
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
                {/* 기본 정보 카드 */}
                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    기본 정보
                  </h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow label="이름" value={selectedUser.name} />
                    <InfoRow label="이메일" value={selectedUser.email} />
                    <InfoRow label="역할" value={selectedUser.role} />
                    <InfoRow label="상태" value={selectedUser.status} />
                  </div>
                </section>

                {/* 연락처/주소 */}
                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    연락처 / 주소
                  </h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow
                      label="연락처"
                      value={selectedUser.phone || "-"}
                    />
                    <InfoRow
                      label="주소"
                      value={selectedUser.address || "-"}
                    />
                  </div>
                </section>

                {/* 가입/수정 정보 */}
                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    가입 정보
                  </h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow
                      label="가입일"
                      value={new Date(
                        selectedUser.createdAt
                      ).toLocaleString("ko-KR")}
                    />
                    <InfoRow
                      label="마지막 수정"
                      value={
                        selectedUser.updatedAt
                          ? new Date(
                              selectedUser.updatedAt
                            ).toLocaleString("ko-KR")
                          : "-"
                      }
                    />
                  </div>
                </section>
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="w-20 shrink-0 text-xs font-medium text-slate-500">
        {label}
      </span>
      <span className="flex-1 text-sm text-slate-800">{value}</span>
    </div>
  );
}
