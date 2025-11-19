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
    <section className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">e약은요 검색</h2>
        <p className="mt-1 text-sm text-emerald-800">
          약품명을 입력하면 바로 등록 가능한 정보를 확인할 수 있습니다.
        </p>
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
          className="flex-1 rounded-md border-none bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          type="submit"
        >
          검색
        </button>
      </form>

      {loading && <p className="text-sm text-emerald-700">검색 중…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!loading && !err && items.length === 0 && q.trim().length > 0 && (
        <p className="text-sm text-slate-600">검색 결과가 없습니다.</p>
      )}

      {/* 검색 결과 */}
      {!loading && !err && items.length > 0 && (
        <ul className="grid gap-3">
          {items.map((it) => (
            <li
              key={it.itemSeq}
              className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
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
                    className="h-16 w-16 rounded object-contain shadow-sm"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-emerald-50 text-xs font-semibold text-emerald-600">
                    이미지 없음
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {it.itemName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {it.entpName?.trim().length ? it.entpName : "제조사 정보 없음"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">품목 코드 #{it.itemSeq}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
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
