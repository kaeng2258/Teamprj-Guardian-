"use client";

interface PersonalInfoProps {
  name: string;
  email: string;
  setName: (name: string) => void;
}

export default function PersonalInfo({ name, email, setName }: PersonalInfoProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">기본 정보</h2>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">계정</span>
      </div>
      <div className="space-y-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">이메일</span>
          <input
            value={email}
            readOnly
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
            placeholder="이름을 입력하세요"
          />
        </label>
      </div>
    </div>
  );
}

