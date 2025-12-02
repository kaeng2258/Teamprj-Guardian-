"use client";

interface AdditionalInfoProps {
  birthDate: string;
  gender: string;
  zipCode: string;
  address: string;
  detailAddress: string;
  setBirthDate: (birthDate: string) => void;
  setGender: (gender: string) => void;
  setZipCode: (zipCode: string) => void;
  setAddress: (address: string) => void;
  setDetailAddress: (detailAddress: string) => void;
  handleAddressSearch: () => void;
}

export default function AdditionalInfo({
  birthDate,
  gender,
  zipCode,
  address,
  detailAddress,
  setBirthDate,
  setGender,
  setZipCode,
  setAddress,
  setDetailAddress,
  handleAddressSearch,
}: AdditionalInfoProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">추가 정보</h2>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">선택</span>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">생년월일</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={`rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${
                birthDate ? "text-slate-900" : "text-slate-400"
              } dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100`}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">성별</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
            >
              <option value="">선택해주세요</option>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200 sm:col-span-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">우편번호</span>
            <input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
              placeholder="우편번호"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">주소</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
              placeholder="주소"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={handleAddressSearch}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
            >
              주소 검색 (다음)
            </button>
          </div>
          <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200 sm:col-span-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">상세 주소</span>
            <input
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/60"
              placeholder="동/호 등"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          현재 주소: {zipCode || "미등록"} / {address || "미등록"} {detailAddress || ""}
        </p>
      </div>
    </div>
  );
}
