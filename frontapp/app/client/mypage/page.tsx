'use client';

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ClientOverview = {
  userId: number | null;
  email: string;
};

export default function ClientMyPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [client, setClient] = useState<ClientOverview>({
    userId: null,
    email: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const accessToken = window.localStorage.getItem("accessToken");
    const role = window.localStorage.getItem("userRole");

    if (!accessToken || role !== "CLIENT") {
      router.replace("/");
      return;
    }

    const storedEmail = window.localStorage.getItem("userEmail") ?? "";
    const storedUserId = window.localStorage.getItem("userId");
    setClient({
      email: storedEmail,
      userId: storedUserId ? Number(storedUserId) : null,
    });
    setIsReady(true);
  }, [router]);

  const sections = useMemo(
    () => [
      {
        title: "기본 정보",
        description: "로그인한 계정의 기초 정보를 확인하세요.",
        rows: [
          {
            label: "회원 번호",
            value: client.userId ? `#${client.userId}` : "확인 중",
          },
          {
            label: "이메일",
            value: client.email || "확인 중",
          },
        ],
      },
      {
        title: "서비스 이용 현황",
        description: "복약 알림 및 보호자 정보는 추후 연동 예정입니다.",
        rows: [
          { label: "복약 알림", value: "준비 중" },
          { label: "보호자 메모", value: "준비 중" },
        ],
      },
    ],
    [client]
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
          <p className="text-gray-600">클라이언트 정보를 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-xl">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Guardian
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              클라이언트 마이페이지
            </h1>
            <p className="text-sm text-slate-600">
              복약 서비스 이용 현황과 알림 설정을 한곳에서 관리하세요.
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

        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-lg font-semibold text-indigo-900">
            다음 단계 미리 보기
          </h2>
          <p className="mt-2 text-sm text-indigo-700">
            복약 일정, 알림 이력, 담당 제공자와의 커뮤니케이션 도구가 곧 연결될 예정입니다.
            필요한 기능이 있다면 관리자에게 알려주세요.
          </p>
        </section>
      </main>
    </div>
  );
}
