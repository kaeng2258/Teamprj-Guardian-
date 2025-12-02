"use client";

interface SettingsProps {
  pushEnabled: boolean;
  pushStatus: "idle" | "requesting" | "error";
  pushMessage: string;
  theme: "light" | "dark";
  textSize: "normal" | "large";
  handleTogglePush: () => void;
  toggleTheme: () => void;
  toggleTextSize: () => void;
}

export default function Settings({
  pushEnabled,
  pushStatus,
  pushMessage,
  theme,
  textSize,
  handleTogglePush,
  toggleTheme,
  toggleTextSize,
}: SettingsProps) {
  return (
<div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">환경 설정</h2>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">보기·알림</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">모바일 푸시 알림</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">브라우저 푸시를 활성화하여 비상 알림을 받아보세요.</p>
            {pushMessage && (
              <p className={`mt-1 text-xs ${pushStatus === "error" ? "text-rose-500" : "text-emerald-400"}`}>
                {pushMessage}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleTogglePush()}
            disabled={pushStatus === "requesting"}
            className={`relative inline-flex h-7 w-14 items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              pushEnabled ? "border-indigo-500 bg-indigo-600" : "border-slate-200 bg-slate-200 dark:border-slate-600 dark:bg-slate-700"
            } ${pushStatus === "requesting" ? "opacity-60" : "hover:shadow-sm"}`}
            aria-pressed={pushEnabled}
            aria-label="모바일 푸시 알림 설정"
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                pushEnabled ? "translate-x-7 bg-indigo-50" : "translate-x-0"
              }`}
            />
            <span className="sr-only">{pushEnabled ? "푸시 켜짐" : "푸시 꺼짐"}</span>
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">다크 모드</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              인터페이스 색상을 {theme === "dark" ? "밝게" : "어둡게"} 전환합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`relative inline-flex h-7 w-14 items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              theme === "dark"
                ? "border-indigo-500 bg-indigo-600"
                : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700"
            }`}
            aria-pressed={theme === "dark"}
            aria-label="다크 모드 토글"
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                theme === "dark" ? "translate-x-7 bg-indigo-50" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">큰 글씨 모드</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">가독성을 위해 텍스트 크기를 확대합니다.</p>
          </div>
          <button
            type="button"
            onClick={toggleTextSize}
            className={`relative inline-flex h-7 w-14 items-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              textSize === "large"
                ? "border-indigo-500 bg-indigo-600"
                : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700"
            }`}
            aria-pressed={textSize === "large"}
            aria-label="큰 글씨 모드 토글"
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                textSize === "large" ? "translate-x-7 bg-indigo-50" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
