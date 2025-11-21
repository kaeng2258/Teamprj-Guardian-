// =============================
// components/DrugSearchForm.tsx
// =============================
"use client";
import React, { useState } from "react";


export default function DrugSearchForm({ onSearch }: { onSearch: (query: string) => void }) {
const [q, setQ] = useState("");
return (
<form onSubmit={(e) => { e.preventDefault(); if (!q.trim()) return; onSearch(q.trim()); }} style={{display:"flex", gap:8}}>
<input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="약품명/성분명" style={{flex:1, padding:"10px 12px", border:"1px solid #ddd", borderRadius:10}} />
<button type="submit" style={{padding:"10px 16px", borderRadius:10}}>검색</button>
</form>
);
}