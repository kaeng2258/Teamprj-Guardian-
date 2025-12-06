"use client";

import { useRef } from "react";

interface User {
  id?: number;
  name: string;
}

interface ProfileImageProps {
  profileImageUrl: string;
  saving: boolean;
  user: User | null;
  handleUpload: (file: File | null) => void;
  handleResetImage: () => void;
  role: "CLIENT" | "MANAGER";
}

export default function ProfileImage({
  profileImageUrl,
  saving,
  user,
  handleUpload,
  handleResetImage,
  role,
}: ProfileImageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleResetClick = () => {
    void handleResetImage();
  };

  const roleText = role === "CLIENT" ? "Client" : "Manager";
  const rolePageTitle = role === "CLIENT" ? "클라이언트 마이페이지" : "매니저 마이페이지";
  const roleNameSuffix = role === "CLIENT" ? "님" : " 매니저";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4 sm:gap-6">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-200 bg-indigo-50 text-lg font-semibold text-indigo-700">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="프로필 이미지"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{user?.name?.slice(0, 1).toUpperCase() || "?"}</span>
            )}
          </div>
          <button
            className="absolute -left-1 -bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 shadow-sm ring-4 ring-white transition hover:bg-slate-300"
            type="button"
            onClick={handleUploadClick}
          >
            Img
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleUpload(file);
              event.target.value = "";
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-indigo-600">
            {roleText}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {user?.name ? `${user.name}${roleNameSuffix}` : rolePageTitle}
          </h1>
          <p className="text-sm text-slate-600">
            이름과 프로필 이미지를 변경할 수 있습니다.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUploadClick}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          새 이미지 업로드
        </button>
        <button
          type="button"
          onClick={handleResetClick}
          disabled={saving || !user}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-transparent px-3 py-2 text-sm font-medium leading-4 text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:text-red-500 dark:hover:text-red-400"
        >
          기본 이미지로 변경
        </button>
      </div>
    </div>
  );
}
