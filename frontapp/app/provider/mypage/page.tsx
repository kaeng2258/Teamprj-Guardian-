'use client';

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ProviderOverview = {
  userId: number | null;
  email: string;
};

export default function ProviderMyPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [provider, setProvider] = useState<ProviderOverview>({
    userId: null,
    email: "",
  });

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
    setProvider({
      email: storedEmail,
      userId: storedUserId ? Number(storedUserId) : null,
    });
    setIsReady(true);
  }, [router]);

  const sections = useMemo(
    () => [
      {
        title: "담당자 정보",
        description: "현재 로그인한 요양보호사/제공자의 기본 정보를 확인합니다.",
        rows: [
          {
            label: "제공자 번호",
            value: provider.userId ? `#${provider.userId}` : "확인 중",
          },
          {
            label: "이메일",
            value: provider.email || "확인 중",
          },
        ],
      },
      {
        title: "관리 대상자 현황",
        description: "등록된 클라이언트 및 스케줄 관리는 추후 연동 예정입니다.",
        rows: [
          { label: "담당 클라이언트", value: "준비 중" },
          { label: "다음 방문 일정", value: "준비 중" },
        ],
      },
    ],
    [provider]
  );

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
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-xl">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              Guardian Provider
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              환자 관리인 마이페이지
            </h1>
            <p className="text-sm text-slate-600">
              담당 클라이언트의 복약 스케줄과 업무 현황을 관리할 수 있도록 준비 중입니다.
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
          {sections.map((section) => (
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

        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-900">
            서비스 업그레이드 준비 중
          </h2>
          <p className="mt-2 text-sm text-emerald-700">
            방문 일정, 투약 확인, 실시간 보고 등 제공자 전용 기능이 추가될 예정입니다.
            필요한 요구사항이 있다면 관리자에게 요청해주세요.
          </p>
        </section>
      </main>
    </div>
  );
}
