// =============================
// components/ManagerClientPicker.tsx
// =============================
"use client";
import React, { useState } from "react";


type Option = { id: number; label: string };


export default function ManagerClientPicker({
managers = [],
clients = [],
onChange,
}: {
managers: Option[];
clients: Option[];
onChange: (v: { managerId?: number; clientId?: number }) => void;
}) {
const [managerId, setManagerId] = useState<number | undefined>();
const [clientId, setClientId] = useState<number | undefined>();


return (
<div style={{display:"flex", gap:12, alignItems:"end", flexWrap:"wrap"}}>
<div>
<label>매니저</label><br/>
<select
value={managerId ?? ""}
onChange={(e) => {
const v = e.target.value ? Number(e.target.value) : undefined;
setManagerId(v);
onChange({ managerId: v, clientId });
}}
>
<option value="">전체</option>
{managers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
</select>
</div>
<div>
<label>클라이언트</label><br/>
<select
value={clientId ?? ""}
onChange={(e) => {
const v = e.target.value ? Number(e.target.value) : undefined;
setClientId(v);
onChange({ managerId, clientId: v });
}}
>
<option value="">전체</option>
{clients.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
</select>
</div>
</div>
);
}
