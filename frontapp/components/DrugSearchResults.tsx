// =============================
// components/DrugSearchResults.tsx
// =============================
"use client";
import Link from "next/link";


export default function DrugSearchResults({ items }: { items: { itemSeq: string; itemName: string; entpName?: string; imgUrl?: string }[] }) {
if (!items?.length) return <p>검색 결과 없음</p>;
return (
<div style={{display:"grid", gap:12}}>
{items.map(it => (
<div key={it.itemSeq} style={{display:"grid", gridTemplateColumns:"96px 1fr", gap:12, border:"1px solid #eee", borderRadius:12, padding:12}}>
{it.imgUrl ? <img src={it.imgUrl} alt={it.itemName} style={{width:96, height:96, objectFit:"contain", border:"1px solid #f0f0f0"}}/> : <div style={{width:96, height:96, background:"#fafafa", border:"1px dashed #eee"}}/>}
<div>
<Link href={`/drugs/${it.itemSeq}`}><b>{it.itemName}</b></Link>
{it.entpName && <div style={{color:"#666"}}>{it.entpName}</div>}
</div>
</div>
))}
</div>
);
}