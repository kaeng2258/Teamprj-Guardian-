// =============================
// app/drugs/[itemSeq]/page.tsx — e약은요 상세
// =============================
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";


export default function DrugDetailPage() {
const params = useParams();
const itemSeq = String(params.itemSeq);
const [detail, setDetail] = useState<any>(null);
const [err, setErr] = useState<string | null>(null);


useEffect(() => {
(async () => {
try {
const data = await api.drugDetail(itemSeq);
setDetail(data);
} catch (e: any) { setErr(e.message); }
})();
}, [itemSeq]);


if (err) return <p style={{color:"crimson"}}>{err}</p>;
if (!detail) return <p>불러오는 중…</p>;


return (
<div style={{display:"grid", gap:12}}>
<h1>{detail.itemName ?? `상세 (${itemSeq})`}</h1>
{detail.imgUrl && (
<img src={detail.imgUrl} alt={detail.itemName} style={{maxWidth:240, border:"1px solid #eee"}}/>
)}
<div>
<b>품목기준코드:</b> {itemSeq}
</div>
{detail.entpName && <div><b>업체명:</b> {detail.entpName}</div>}
{detail.efficacy && (
<div>
<h3>효능효과</h3>
<div style={{whiteSpace:"pre-wrap"}}>{detail.efficacy}</div>
</div>
)}
{detail.usage && (
<div>
<h3>용법용량</h3>
<div style={{whiteSpace:"pre-wrap"}}>{detail.usage}</div>
</div>
)}
{detail.caution && (
<div>
<h3>주의사항</h3>
<div style={{whiteSpace:"pre-wrap"}}>{detail.caution}</div>
</div>
)}
</div>
);
}