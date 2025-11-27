"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { DrugDetailModal } from "@/components/DrugDetailModal";

type InlineDrugItem = {
  itemSeq: string;
  itemName: string;
  entpName?: string;
  itemImage?: string;
};

export function InlineDrugSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<InlineDrugItem[]>([]);

  // 🔥 선택된 약품 코드 → 모달 띄우기
  const [selectedSeq, setSelectedSeq] = useState<string | null>(null);

  const getInitials = (name: string) =>
    name.trim().slice(0, 2).toUpperCase() || "??";

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await (api as any).drugSearchSimple(q.trim(), 10);
      setItems(data.items);
    } catch (e: any) {
      setErr(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-slate-900">e약은요 검색</p>
          <p className="mt-1 text-sm text-slate-600">
            약품명·성분명을 입력하면 상세 정보를 빠르게 확인할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 검색폼 */}
      <form
        onSubmit={onSearch}
        className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="약품명 · 성분명"
          className="flex-1 rounded-lg border border-emerald-100 bg-white/90 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        <button
          className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          type="submit"
          disabled={loading}
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {loading && <p className="text-sm text-emerald-700">검색 중…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!loading && !err && items.length === 0 && q.trim().length > 0 && (
        <p className="text-sm text-slate-600">검색 결과가 없습니다.</p>
      )}

      {/* 검색 결과 */}
      {!loading && !err && items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <li
              key={it.itemSeq}
              className="group h-full rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => setSelectedSeq(it.itemSeq)}
                className="flex w-full items-center gap-3 text-left"
              >
                {it.itemImage ? (
                  <img
                    src={it.itemImage}
                    alt={it.itemName}
                    className="h-16 w-16 shrink-0 rounded-xl border border-emerald-50 bg-white object-contain shadow-sm"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-emerald-50 bg-emerald-50 text-xs font-semibold uppercase text-emerald-700">
                    {getInitials(it.itemName)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                    {it.itemName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {it.entpName?.trim().length ? it.entpName : "제조사 정보 없음"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">품목 코드 #{it.itemSeq}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                  자세히
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 🔥 모달 출력 */}
      {selectedSeq && (
        <DrugDetailModal
          itemSeq={selectedSeq}
          onClose={() => setSelectedSeq(null)}
        />
      )}
    </section>
  );
}
