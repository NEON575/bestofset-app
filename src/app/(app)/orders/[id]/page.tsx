"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fmtMoney, fmtDate, ORDER_STATUS_LABELS } from "@/lib/format";

interface Step {
  id: string;
  name: string;
  sequence: number;
  status: string;
  completedAt: string | null;
  note: string | null;
}

interface Part {
  id: string;
  name: string;
  material: string | null;
  printColor: string | null;
  printSides: string | null;
  note: string | null;
  sortOrder: number;
  steps: Step[];
}

interface CostItem {
  id: string;
  category: string;
  amount: number;
  note: string | null;
}

interface OrderDetail {
  id: string;
  number: string;
  orderDate: string;
  customer: { name: string };
  productName: string;
  quantity: number;
  finalTotal: number;
  status: string;
  parts: Part[];
  finalSteps: Step[];
  costItems: CostItem[];
}

const emptyPartForm = { name: "", material: "", printColor: "", printSides: "" };

function firstPendingId(steps: Step[]): string | null {
  const sorted = [...steps].sort((a, b) => a.sequence - b.sequence);
  const pending = sorted.find((s) => s.status !== "BITIB");
  return pending ? pending.id : null;
}

function stepBadge(status: string) {
  if (status === "BITIB") return "border-teal text-teal bg-teal/10";
  if (status === "BASLANIB") return "border-yellow text-yellow bg-yellow/10";
  return "border-line text-inksoft";
}

const STEP_LABELS: Record<string, string> = {
  GOZLEYIR: "Gözləyir",
  BASLANIB: "Başlanıb",
  BITIB: "Bitib",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const [showNewPart, setShowNewPart] = useState(false);
  const [newPartForm, setNewPartForm] = useState(emptyPartForm);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editPartForm, setEditPartForm] = useState(emptyPartForm);
  const [stepInputs, setStepInputs] = useState<Record<string, string>>({});
  const [costTypes, setCostTypes] = useState<string[]>([]);
  const [showNewCost, setShowNewCost] = useState(false);
  const [costForm, setCostForm] = useState({ category: "", amount: "", note: "" });

  async function load() {
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) setOrder(await res.json());
  }

  useEffect(() => {
    load();
    fetch("/api/settings/options?category=COST_TYPE")
      .then((r) => r.json())
      .then((opts: { value: string }[]) => setCostTypes(opts.map((o) => o.value)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function addPart() {
    if (!newPartForm.name.trim()) return;
    const res = await fetch(`/api/orders/${orderId}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPartForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xəta baş verdi");
      return;
    }
    setNewPartForm(emptyPartForm);
    setShowNewPart(false);
    setError("");
    load();
  }

  function openEditPart(p: Part) {
    setEditingPartId(p.id);
    setEditPartForm({
      name: p.name,
      material: p.material || "",
      printColor: p.printColor || "",
      printSides: p.printSides || "",
    });
  }

  async function saveEditPart(partId: string) {
    const res = await fetch(`/api/orders/${orderId}/parts/${partId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editPartForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xəta baş verdi");
      return;
    }
    setEditingPartId(null);
    setError("");
    load();
  }

  async function removePart(partId: string) {
    if (!confirm("Bu iş hissəsini silmək istədiyinizə əminsiniz? Bütün addımları da siləcək.")) return;
    await fetch(`/api/orders/${orderId}/parts/${partId}`, { method: "DELETE" });
    load();
  }

  async function addStep(partId: string | null) {
    const key = partId || "final";
    const name = (stepInputs[key] || "").trim();
    if (!name) return;
    const url = partId
      ? `/api/orders/${orderId}/parts/${partId}/steps`
      : `/api/orders/${orderId}/final-steps`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xəta baş verdi");
      return;
    }
    setStepInputs({ ...stepInputs, [key]: "" });
    setError("");
    load();
  }

  async function removeStep(partId: string | null, stepId: string) {
    if (!confirm("Addımı silmək istədiyinizə əminsiniz?")) return;
    const url = partId
      ? `/api/orders/${orderId}/parts/${partId}/steps/${stepId}`
      : `/api/orders/${orderId}/final-steps/${stepId}`;
    await fetch(url, { method: "DELETE" });
    load();
  }

  async function setStepStatus(partId: string | null, stepId: string, status: string) {
    const url = partId
      ? `/api/orders/${orderId}/parts/${partId}/steps/${stepId}`
      : `/api/orders/${orderId}/final-steps/${stepId}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xəta baş verdi");
      return;
    }
    setError("");
    load();
  }

  async function addCost() {
    const amount = parseFloat(costForm.amount);
    if (!costForm.category || isNaN(amount)) {
      setError("Xərc növü və məbləğ tələb olunur");
      return;
    }
    const res = await fetch(`/api/orders/${orderId}/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: costForm.category, amount, note: costForm.note }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xəta baş verdi");
      return;
    }
    setCostForm({ category: "", amount: "", note: "" });
    setShowNewCost(false);
    setError("");
    load();
  }

  async function removeCost(costId: string) {
    if (!confirm("Bu xərc sətrini silmək istədiyinizə əminsiniz?")) return;
    await fetch(`/api/orders/${orderId}/costs/${costId}`, { method: "DELETE" });
    load();
  }

  if (!order) return <div className="text-inksoft text-sm">Yüklənir...</div>;

  const totalCost = order.costItems.reduce((s, c) => s + c.amount, 0);
  const profit = order.finalTotal - totalCost;

  function renderSteps(steps: Step[], partId: string | null) {
    const activeId = firstPendingId(steps);
    const sorted = [...steps].sort((a, b) => a.sequence - b.sequence);
    const key = partId || "final";
    return (
      <div className="flex flex-col gap-1.5">
        {sorted.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 bg-paperalt rounded-md px-2.5 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`stamp ${stepBadge(s.status)}`}>{STEP_LABELS[s.status]}</span>
              <span className="text-sm truncate">{s.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {s.status === "GOZLEYIR" && s.id === activeId && (
                <button onClick={() => setStepStatus(partId, s.id, "BASLANIB")} className="btn-outline !py-1 !px-2 text-xs">
                  Başla
                </button>
              )}
              {s.status === "BASLANIB" && (
                <button onClick={() => setStepStatus(partId, s.id, "BITIB")} className="btn-outline !py-1 !px-2 text-xs">
                  Bitir
                </button>
              )}
              <button onClick={() => removeStep(partId, s.id)} className="text-magenta text-xs hover:underline">
                Sil
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-1.5 mt-1">
          <input
            className="input !py-1.5 text-sm flex-1"
            placeholder="Yeni addım adı (məs: Çap, Kəsim...)"
            value={stepInputs[key] || ""}
            onChange={(e) => setStepInputs({ ...stepInputs, [key]: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") addStep(partId); }}
          />
          <button onClick={() => addStep(partId)} className="btn-outline !py-1.5 text-xs">
            Addım əlavə et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/orders" className="text-xs text-inksoft hover:underline">← Sifarişlərə qayıt</Link>

      <div className="card p-5 mt-3 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold font-mono mb-1">{order.number}</h1>
            <p className="text-sm text-inksoft">{fmtDate(order.orderDate)}</p>
          </div>
          <span className="stamp border-line text-inksoft">{ORDER_STATUS_LABELS[order.status]}</span>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <div className="text-xs text-inksoft mb-0.5">Müştəri</div>
            <div className="font-semibold">{order.customer?.name}</div>
          </div>
          <div>
            <div className="text-xs text-inksoft mb-0.5">Məhsul</div>
            <div className="font-semibold">{order.productName}</div>
          </div>
          <div>
            <div className="text-xs text-inksoft mb-0.5">Say</div>
            <div className="font-mono">{order.quantity}</div>
          </div>
          <div>
            <div className="text-xs text-inksoft mb-0.5">Son Cəm</div>
            <div className="font-mono font-semibold">{fmtMoney(order.finalTotal)}</div>
          </div>
        </div>
      </div>

      {error && <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-4">{error}</div>}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">İş hissələri</h2>
        <button onClick={() => setShowNewPart(!showNewPart)} className="btn-outline text-xs">
          + Yeni iş hissəsi
        </button>
      </div>

      {showNewPart && (
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-inksoft mb-1">Ad</label>
              <input className="input" placeholder="məs: İç vərəqlər" value={newPartForm.name} onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-inksoft mb-1">Material</label>
              <input className="input" placeholder="məs: 80qr ofset kağız" value={newPartForm.material} onChange={(e) => setNewPartForm({ ...newPartForm, material: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-inksoft mb-1">Çap növü</label>
              <input className="input" placeholder="məs: CMYK rəngli" value={newPartForm.printColor} onChange={(e) => setNewPartForm({ ...newPartForm, printColor: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-inksoft mb-1">Üz sayı</label>
              <input className="input" placeholder="məs: Bir üzlü / İki üzlü" value={newPartForm.printSides} onChange={(e) => setNewPartForm({ ...newPartForm, printSides: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowNewPart(false); setNewPartForm(emptyPartForm); }} className="btn-outline">Ləğv et</button>
            <button onClick={addPart} className="btn">Əlavə et</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-8">
        {order.parts.length === 0 && !showNewPart && (
          <div className="text-sm text-inksoft text-center py-6 border border-dashed border-line rounded-md">
            Hələ iş hissəsi əlavə edilməyib
          </div>
        )}
        {order.parts.map((p) => (
          <div key={p.id} className="card p-4">
            {editingPartId === p.id ? (
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-inksoft mb-1">Ad</label>
                    <input className="input" value={editPartForm.name} onChange={(e) => setEditPartForm({ ...editPartForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-inksoft mb-1">Material</label>
                    <input className="input" value={editPartForm.material} onChange={(e) => setEditPartForm({ ...editPartForm, material: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-inksoft mb-1">Çap növü</label>
                    <input className="input" value={editPartForm.printColor} onChange={(e) => setEditPartForm({ ...editPartForm, printColor: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-inksoft mb-1">Üz sayı</label>
                    <input className="input" value={editPartForm.printSides} onChange={(e) => setEditPartForm({ ...editPartForm, printSides: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingPartId(null)} className="btn-outline">Ləğv et</button>
                  <button onClick={() => saveEditPart(p.id)} className="btn">Yadda saxla</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-inksoft mt-0.5">
                    {[p.material, p.printColor, p.printSides].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openEditPart(p)} className="btn-outline !py-1 !px-2 text-xs">Redaktə</button>
                  <button onClick={() => removePart(p.id)} className="btn-danger">Parçanı sil</button>
                </div>
              </div>
            )}
            {renderSteps(p.steps, p.id)}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-3">Birləşmə mərhələləri</h2>
      <div className="card p-4 mb-8">
        {order.finalSteps.length === 0 && (
          <div className="text-sm text-inksoft text-center py-4">Hələ birləşmə mərhələsi əlavə edilməyib</div>
        )}
        {renderSteps(order.finalSteps, null)}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Maya Dəyəri</h2>
        <button
          onClick={() => {
            setShowNewCost(!showNewCost);
            setCostForm({ category: costTypes[0] || "", amount: "", note: "" });
          }}
          className="btn-outline text-xs"
        >
          + Xərc əlavə et
        </button>
      </div>

      <div className="card p-4">
        {showNewCost && (
          <div className="flex flex-wrap items-end gap-2 mb-3 pb-3 border-b border-line">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-inksoft mb-1">Xərc növü</label>
              <select className="input" value={costForm.category} onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}>
                <option value="">— seçin —</option>
                {costTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-semibold text-inksoft mb-1">Məbləğ (₼)</label>
              <input type="number" min="0" step="0.01" className="input" value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-inksoft mb-1">Qeyd</label>
              <input className="input" value={costForm.note} onChange={(e) => setCostForm({ ...costForm, note: e.target.value })} />
            </div>
            <button onClick={addCost} className="btn">Əlavə et</button>
          </div>
        )}

        {order.costItems.length === 0 && !showNewCost && (
          <div className="text-sm text-inksoft text-center py-4">Hələ xərc əlavə edilməyib</div>
        )}

        <div className="flex flex-col gap-1.5">
          {order.costItems.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 bg-paperalt rounded-md px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm">{c.category}</span>
                {c.note && <span className="text-xs text-inksoft truncate">· {c.note}</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-sm">{fmtMoney(c.amount)}</span>
                <button onClick={() => removeCost(c.id)} className="text-magenta text-xs hover:underline">Sil</button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-3 border-t border-line text-sm">
          <div>
            <div className="text-xs text-inksoft mb-0.5">Ümumi maya dəyəri</div>
            <div className="font-mono font-semibold">{fmtMoney(totalCost)}</div>
          </div>
          <div>
            <div className="text-xs text-inksoft mb-0.5">Satış məbləği</div>
            <div className="font-mono font-semibold">{fmtMoney(order.finalTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-inksoft mb-0.5">Mənfəət</div>
            <div className={`font-mono font-semibold ${profit >= 0 ? "text-teal" : "text-magenta"}`}>{fmtMoney(profit)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
