// =============================
// app/drugs/search/page.tsx — e약은요 검색
// =============================
"use client";
import React, { useState } from "react";
import DrugSearchForm from "@/components/DrugSearchForm";
import DrugSearchResults from "@/components/DrugSearchResults";
import { api } from "@/lib/api";


export default function DrugSearchPage() {
const [items, setItems] = useState<{ itemSeq: string; itemName: string; entpName?: string; imgUrl?: string }[]>([]);
const [err, setErr] = useState<string | null>(null);
const [loading, setLoading] = useState(false);


const onSearch = async (q: string) => {
setLoading(true); setErr(null);
try {
const data = await api.drugSearch(q, 1, 20);
setItems(data.items);
} catch (e: any) { setErr(e.message); }
finally { setLoading(false); }
};


return (
<div style={{display:"grid", gap:16}}>
<h1>e약은요 검색</h1>
<DrugSearchForm onSearch={onSearch} />
{loading && <p>검색 중…</p>}
{err && <p style={{color:"crimson"}}>{err}</p>}
<DrugSearchResults items={items} />
</div>
);
}