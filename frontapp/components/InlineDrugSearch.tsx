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
    <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
      <h2 className="text-lg font-semibold text-indigo-900">e약은요 검색</h2>
      <p className="mt-1 text-sm text-indigo-700">
        상단에서 약품명을 입력하면 간단히 검색할 수 있습니다.
      </p>

      {/* 검색폼 */}
      <form onSubmit={onSearch} className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="약품명/성분명"
          className="flex-1 rounded-md border border-indigo-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
        />
        <button
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          type="submit"
        >
          검색
        </button>
      </form>

      {loading && <p className="mt-3 text-sm text-indigo-700">검색 중…</p>}
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      {/* 검색 결과 */}
      {!loading && !err && items.length > 0 && (
        <div className="mt-3 grid gap-2">
          {items.map((it) => (
            <div
              key={it.itemSeq}
              className="grid grid-cols-[72px_1fr] gap-3 rounded-md border border-indigo-100 bg-white p-3 cursor-pointer hover:bg-indigo-50 transition"
              onClick={() => setSelectedSeq(it.itemSeq)} // 🔥 클릭 → 모달 오픈
            >
              {it.itemImage ? (
                <img
                  src={it.itemImage}
                  alt={it.itemName}
                  className="h-16 w-16 rounded border border-slate-100 object-contain"
                />
              ) : (
                <div className="h-16 w-16 rounded border border-dashed border-indigo-200" />
              )}

              <div>
                <p className="font-medium text-slate-900">{it.itemName}</p>
                {it.entpName && (
                  <p className="text-xs text-slate-600">{it.entpName}</p>
                )}
              </div>
            </div>
          ))}
        </div>
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
