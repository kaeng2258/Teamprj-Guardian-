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

// ??濡쒓렇????localStorage????ν빐??援ъ“
type GuardianAuthPayload = {
  userId: number;
  role: string;
  accessToken: string;
  refreshToken: string;
  email: string;
};

export default function AdminDashboardPage() {
    const router = useRouter();   
  // ??愿由ъ옄 媛??
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
  console.log("[AdminDashboard] guardian_auth raw =", raw);  // 燧?異붽?
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuardianAuthPayload;
    console.log("[AdminDashboard] guardian_auth parsed =", parsed); // 燧?異붽?
    return parsed;
  } catch (e) {
    console.error("[AdminDashboard] auth parse error:", e);
    return null;
  }
};

  // ???붿빟 ?뺣낫 濡쒕뱶 (ADMIN 媛???듦낵 ??+ ?좏겙 遺숈뿬???몄텧)
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

    (async () => {
      try {
        const auth = getAuth();
        if (!auth) return;
        setAdherenceError(null);
        const res = await fetch(
          `${API_BASE_URL}/api/admin/medication/adherence?months=6`,
          {
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth.accessToken}`,
            },
          },
        );
        if (!res.ok) {
          setAdherenceError("?ъ빟 ?쒖쓳???곗씠?곕? 遺덈윭?ㅼ? 紐삵뻽?듬땲??");
          return;
        }
        const data: MonthlyAdherenceResponse = await res.json();
        setAdherencePoints(data.points ?? []);
      } catch (e) {
        setAdherenceError("?ъ빟 ?쒖쓳???곗씠?곕? 遺덈윭?ㅼ? 紐삵뻽?듬땲??");
      }
    })();
  }, [ready]);

  const totalUsers = useMemo(() => {
    if (!overview) return 0;
    return overview.clientCount + overview.managerCount;
  }, [overview]);
// ??濡쒓렇?꾩썐
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("guardian_auth");
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem("userRole");
      window.localStorage.removeItem("userId");
      window.localStorage.removeItem("userEmail");
    }
    router.replace("/");     // 濡쒓렇???섏씠吏濡??대룞
  };
  // ???좎? 寃??(?좏겙 ?ы븿)
const searchUsers = async () => {
  try {
    setUserLoading(true);
    setUserError(null);
    setUsers([]);
    setSelectedUser(null);
    setUserMedication(null);
    setUserMedicationError(null);
    setDeleteError(null);

    const auth = getAuth();
    if (!auth) {
      setUserError('??? ??? ????. ?? ???????.');
      return;
    }

    const params = new URLSearchParams();
    params.set('keyword', userKeyword.trim());
    if (userRole !== 'ALL') params.set('role', userRole);

    const res = await fetch(`${API_BASE_URL}/api/admin/users?${params.toString()}`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

    if (res.status === 401) throw new Error('??? ???????. ?? ???????');
    if (res.status === 403) throw new Error('??? ??? ????.');
    if (!res.ok) throw new Error('??? ??? ???? ?????.');

    const data: AdminUserSummary[] = await res.json();
    setUsers(data);
  } catch (err: unknown) {
    setUserError(err instanceof Error ? err.message : '??? ?? ? ??? ??????.');
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

    const auth = getAuth();
    if (!auth) {
      console.warn('[AdminDashboard] auth not found while loading detail');
      setDetailLoading(false);
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

    if (!res.ok) {
      throw new Error('??? ??? ???? ?????.');
    }

    const data: AdminUserDetail = await res.json();
    setSelectedUser(data);

    const roleUpper = data.role?.toUpperCase() ?? '';
    if (roleUpper.includes('CLIENT')) {
      try {
        const medRes = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/medication-summary`,
          {
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.accessToken}`,
            },
          });
        if (medRes.ok) {
          const medData: UserMedicationSummary = await medRes.json();
          setUserMedication(medData);
        } else {
          setUserMedication(null);
          setUserMedicationError('??/??? ???? ???? ?????.');
        }
      } catch (err) {
        setUserMedication(null);
        setUserMedicationError('??/??? ???? ???? ?????.');
      }
    } else {
      setUserMedication(null);
      setUserMedicationError(null);
    }
  } catch (e) {
    console.error('[AdminDashboard] user detail error:', e);
  } finally {
    setDetailLoading(false);
  }
};

const handleDeleteUser = async () => {
  if (!selectedUser) return;
  if (!confirm('?? ??? ????????? ?? ? ??? ? ????.')) return;

  try {
    setDeleteLoading(true);
    setDeleteError(null);
    const auth = getAuth();
    if (!auth) {
      setDeleteError('?? ??? ?? ? ????.');
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${selectedUser.id}`, {
      method: 'DELETE',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || '?? ??? ??????.');
    }
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setSelectedUser(null);
    setUserMedication(null);
  } catch (err) {
    setDeleteError(err instanceof Error ? err.message : '?? ??? ??????.');
  } finally {
    setDeleteLoading(false);
  }
};

  // ???좎? ?곸꽭 (?좏겙 ?ы븿)
  
  // ???꾩쭅 ADMIN ?뺤씤 以묒씠硫?濡쒕뵫 ?붾㈃留?
  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          愿由ъ옄 沅뚰븳???뺤씤?섎뒗 以묒엯?덈떎...
        </p>
      </main>
    );
  }

  // ???ш린遺?곕뒗 ?ㅼ젣 愿由ъ옄 ?섏씠吏
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* ?곷떒 ?ㅻ뜑 */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              愿由ъ옄 ??쒕낫??
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              ?꾩껜 ?댁슜?먯? 留ㅼ묶 ?꾪솴??愿由ы븯怨? 媛??좎????곸꽭 ?뺣낫瑜??뺤씤?????덉뒿?덈떎.
            </p>
          </div>
          {/* ?곗륫: 濡쒓렇?명븳 愿由ъ옄 ?뺣낫 + 濡쒓렇?꾩썐 */}
          <div className="flex items-center gap-3">
            {adminEmail && (
              <div className="text-right">
                <p className="text-xs text-slate-500">濡쒓렇??以묒씤 怨꾩젙</p>
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
              濡쒓렇?꾩썐
            </button>
          </div>
        </header>

        {/* ?붿빟 移대뱶 */}
        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="?꾩껜 ?댁슜??
            value={totalUsers ? `${totalUsers.toLocaleString()}紐? : "-"}
            description={
              overview
                ? `?섏옄 ${overview.clientCount} 쨌 愿由ъ씤 ${overview.managerCount}`
                : ""
            }
          />
          <SummaryCard
            label="?섏옄 ??
            value={
              overview ? `${overview.clientCount.toLocaleString()}紐? : "-"
            }
          />
          <SummaryCard
            label="愿由ъ씤 ??
            value={
              overview ? `${overview.managerCount.toLocaleString()}紐? : "-"
            }
          />
        </section>

        {/* ?ъ빟 ?쒖쓳??(理쒓렐 6媛쒖썡) */}
        {(adherencePoints.length > 0 || adherenceError) && (
          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  理쒓렐 6媛쒖썡 ?ъ빟 ?쒖쓳??
                </h2>
                <p className="text-xs text-slate-500">
                  ?붾퀎 ?쒖쓳??%)瑜?留됰? 洹몃옒?꾨줈 ?뺤씤?섏꽭??
                </p>
              </div>
            </div>
            {adherenceError && (
              <p className="mt-3 text-xs text-rose-500">{adherenceError}</p>
            )}
            {!adherenceError && (
              <div className="mt-4 grid gap-3 sm:grid-cols-6">
                {adherencePoints.map((point) => (
                  <AdherenceBar
                    key={point.month}
                    label={point.month}
                    value={point.rate}
                  />
                ))}
                {adherencePoints.length === 0 && (
                  <p className="text-xs text-slate-500">
                    ?쒖떆???쒖쓳???곗씠?곌? ?놁뒿?덈떎.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* 硫붿씤 2而щ읆 ?덉씠?꾩썐 */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* 醫뚯륫: 寃??+ 由ъ뒪??*/}
          <div className="space-y-4">
            {/* 寃??諛뺤뒪 */}
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    ?좎? 寃??
                  </h2>
                  <p className="text-xs text-slate-500">
                    ?대쫫 / ?대찓??+ ??븷濡??섏옄 ?먮뒗 愿由ъ씤??寃?됲빀?덈떎.
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
                    placeholder="?대쫫 ?먮뒗 ?대찓?쇱쓣 ?낅젰?섏꽭??
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
                    <option value="ALL">?꾩껜</option>
                    <option value="CLIENT">?섏옄</option>
                    <option value="MANAGER">愿由ъ씤</option>
                    <option value="ADMIN">愿由ъ옄</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
                  disabled={userLoading}
                >
                  {userLoading ? "寃??以?.." : "寃??}
                </button>
                {userError && (
                  <p className="text-xs text-red-500">{userError}</p>
                )}
              </form>
            </div>

            {/* 寃??寃곌낵 由ъ뒪??*/}
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
              <h3 className="text-sm font-semibold text-slate-900">
                寃??寃곌낵
              </h3>
              <p className="text-xs text-slate-400">
                ?좎?瑜??대┃?섎㈃ ?ㅻⅨ履쎌뿉???곸꽭 ?뺣낫瑜??뺤씤?????덉뒿?덈떎.
              </p>

              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {users.length === 0 && !userLoading && !userError && (
                  <p className="py-3 text-xs text-slate-500">
                    ?꾩쭅 寃?됰맂 ?좎?媛 ?놁뒿?덈떎. 議곌굔???낅젰?섍퀬 寃?됱쓣 ?뚮윭二쇱꽭??
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
                      媛?낆씪{" "}
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

          {/* ?곗륫: ?좏깮???좎? ?곸꽭 */}
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6">
            <h2 className="text-base font-semibold text-slate-900">
              ?좏깮???좎? ?뺣낫
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              醫뚯륫?먯꽌 ?좎?瑜??좏깮?섎㈃ ?먯꽭???뺣낫瑜??뺤씤?????덉뒿?덈떎.
            </p>

            {detailLoading && (
              <p className="mt-4 text-sm text-slate-500">遺덈윭?ㅻ뒗 以?..</p>
            )}

            {!detailLoading && !selectedUser && (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                ?꾩쭅 ?좏깮???좎?媛 ?놁뒿?덈떎.
              </div>
            )}

            {selectedUser && (
              <div className="mt-5 space-y-4">
                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">?? ??</h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow label="??" value={selectedUser.name} />
                    <InfoRow label="???" value={selectedUser.email} />
                    <InfoRow label="??" value={selectedUser.role} />
                    <InfoRow label="??" value={selectedUser.status} />
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">???? / ??</h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow label="??" value={selectedUser.phone || "-"} />
                    <InfoRow label="??" value={selectedUser.address || "-"} />
                    <InfoRow label="?? ??" value={selectedUser.detailAddress || "-"} />
                    <InfoRow label="????" value={selectedUser.zipCode || "-"} />
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">??/?? ??</h3>
                  <div className="mt-3 grid gap-y-2 text-sm text-slate-700">
                    <InfoRow
                      label="???"
                      value={new Date(selectedUser.createdAt).toLocaleString('ko-KR')}
                    />
                    <InfoRow
                      label="??? ??"
                      value={selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString('ko-KR') : '-'}
                    />
                  </div>
                </section>

                {userMedicationError && (
                  <p className="text-xs text-rose-500">{userMedicationError}</p>
                )}

                {userMedication && (
                  <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">?? / ???</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-xs text-slate-500">?? ???</span>
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-700">
                        {userMedication.adherenceRate != null ? `${Math.round(userMedication.adherenceRate)}%` : '?? ??'}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {userMedication.plans.length === 0 && (
                        <p className="text-xs text-slate-500">??? ?? ??? ????.</p>
                      )}
                      {userMedication.plans.map((plan, idx) => (
                        <div
                          key={`${plan.medicineName}-${idx}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <p className="font-semibold text-slate-900">{plan.medicineName}</p>
                          <p className="text-xs text-slate-500">
                            {plan.alarmTime ? `?? ${plan.alarmTime.slice(0, 5)}` : '?? ?? ??'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {plan.daysOfWeek && plan.daysOfWeek.length > 0
                              ? `??: ${plan.daysOfWeek.join(', ')}`
                              : '?? ?? ??'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={deleteLoading}
                    className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-60"
                  >
                    {deleteLoading ? '?? ?...' : '?? ??'}
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

function AdherenceBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-32 w-full items-end rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
        <div
          className="w-full rounded-md bg-indigo-500 shadow-sm transition-all"
          style={{
            height: `${clamped}%`,
            minHeight: "4px",
          }}
        />
      </div>
      <div className="text-center">
        <p className="text-[11px] font-semibold text-slate-900">
          {Math.round(clamped)}%
        </p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

