// =============================
// components/ProviderClientPicker.tsx
// =============================
"use client";
import React, { useState } from "react";


type Option = { id: number; label: string };


export default function ProviderClientPicker({
providers = [],
clients = [],
onChange,
}: {
providers: Option[];
clients: Option[];
onChange: (v: { providerId?: number; clientId?: number }) => void;
}) {
const [providerId, setProviderId] = useState<number | undefined>();
const [clientId, setClientId] = useState<number | undefined>();


return (
<div style={{display:"flex", gap:12, alignItems:"end", flexWrap:"wrap"}}>
<div>
<label>프로바이더</label><br/>
<select
value={providerId ?? ""}
onChange={(e) => {
const v = e.target.value ? Number(e.target.value) : undefined;
setProviderId(v);
onChange({ providerId: v, clientId });
}}
>
<option value="">전체</option>
{providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
</select>
</div>
<div>
<label>클라이언트</label><br/>
<select
value={clientId ?? ""}
onChange={(e) => {
const v = e.target.value ? Number(e.target.value) : undefined;
setClientId(v);
onChange({ providerId, clientId: v });
}}
>
<option value="">전체</option>
{clients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
</select>
</div>
</div>
);
}