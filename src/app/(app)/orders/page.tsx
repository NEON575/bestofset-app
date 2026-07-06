"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fmtMoney,
  fmtDate,
  ORDER_STATUS_LABELS,
  PRODUCTION_STATUS_LABELS,
} from "@/lib/format";
import { round2, calcBonusAmount } from "@/lib/calc";

interface Customer { id: string; name: string; }
interface Order {
  id: string;
  number: string;
  orderDate: string;
  customerId: string;
  customer: { name: string };
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  managerName: string | null;
  bonusPercent: number;
  bonusAmount: number;
  manager2Name: string | null;
  bonus2Percent: number;
  bonus2Amount: number;
  finalTotal: number;
  productionStatus: string;
  status: string;
  deliveryDate: string | null;
}

const STATUS_OPTIONS = ["GOZLEYIR", "ISDEDIR", "LEGV_EDILDI"]; // TEHVIL_VERILDI ayrıca düymə ilə

const emptyForm = {
  customerId: "",
  productName: "",
  quantity: "1",
  unitPrice: "",
  total: "",
  managerName: "",
  bonusPercent: "0",
  bonusAmount: "0",
  manager2Name: "",
  bonus2Percent: "0",
  bonus2Amount: "0",
  status: "GOZLEYIR",
  orderDate: new Date().toISOString().slice(0, 10),
};

/** Boş sətir və ya rəqəm olmayan dəyəri ədədə çevirir, olmasa null qaytarır. */
function toNum(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [oRes, cRes] = await Promise.all([fetch("/api/orders"), fetch("/api/customers")]);
    setOrders(await oRes.json());
    setCustomers(await cRes.json());
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, customerId: customers[0]?.id || "" });
    setError("");
    setShowModal(true);
  }

  function openEdit(o: Order) {
    setEditing(o);
    setForm({
      customerId: o.customerId,
      productName: o.productName,
      quantity: String(o.quantity),
      unitPrice: String(o.unitPrice),
      total: String(o.total),
      managerName: o.managerName || "",
      bonusPercent: String(o.bonusPercent),
      bonusAmount: String(o.bonusAmount),
      manager2Name: o.manager2Name || "",
      bonus2Percent: String(o.bonus2Percent),
      bonus2Amount: String(o.bonus2Amount),
      status: o.status === "TEHVIL_VERILDI" ? "ISDEDIR" : o.status,
      orderDate: o.orderDate.slice(0, 10),
    });
    setError("");
    setShowModal(true);
  }

  // Say, Ədəd qiyməti, Cəmi bir-birini qarşılıqlı hesablayır: hər hansı ikisi
  // bilinirsə üçüncüsü avtomatik çıxarılır. Total dəyişəndə bonus məbləğləri
  // də mövcud Bonus % əsasında yenidən hesablanır.
  function recalcBonuses(total: number | null, base: any) {
    const bonusPercent = toNum(base.bonusPercent);
    const bonus2Percent = toNum(base.bonus2Percent);
    return {
      bonusAmount: total !== null && bonusPercent !== null ? String(calcBonusAmount(total, bonusPercent)) : base.bonusAmount,
      bonus2Amount: total !== null && bonus2Percent !== null ? String(calcBonusAmount(total, bonus2Percent)) : base.bonus2Amount,
    };
  }

  function onQuantityChange(v: string) {
    const quantity = toNum(v);
    const unitPrice = toNum(form.unitPrice);
    const total = toNum(form.total);
    let newTotal = form.total;
    let newUnitPrice = form.unitPrice;
    if (quantity !== null && unitPrice !== null) {
      newTotal = String(round2(quantity * unitPrice));
    } else if (quantity !== null && quantity !== 0 && total !== null) {
      newUnitPrice = String(round2(total / quantity));
    }
    const bonuses = recalcBonuses(toNum(newTotal), form);
    setForm({ ...form, quantity: v, total: newTotal, unitPrice: newUnitPrice, ...bonuses });
  }

  function onUnitPriceChange(v: string) {
    const unitPrice = toNum(v);
    const quantity = toNum(form.quantity);
    const total = toNum(form.total);
    let newTotal = form.total;
    let newQuantity = form.quantity;
    if (unitPrice !== null && quantity !== null) {
      newTotal = String(round2(quantity * unitPrice));
    } else if (unitPrice !== null && unitPrice !== 0 && total !== null) {
      newQuantity = String(round2(total / unitPrice));
    }
    const bonuses = recalcBonuses(toNum(newTotal), form);
    setForm({ ...form, unitPrice: v, total: newTotal, quantity: newQuantity, ...bonuses });
  }

  function onTotalChange(v: string) {
    const total = toNum(v);
    const quantity = toNum(form.quantity);
    const unitPrice = toNum(form.unitPrice);
    let newQuantity = form.quantity;
    let newUnitPrice = form.unitPrice;
    if (total !== null && quantity !== null && quantity !== 0) {
      newUnitPrice = String(round2(total / quantity));
    } else if (total !== null && unitPrice !== null && unitPrice !== 0) {
      newQuantity = String(round2(total / unitPrice));
    }
    const bonuses = recalcBonuses(total, form);
    setForm({ ...form, total: v, quantity: newQuantity, unitPrice: newUnitPrice, ...bonuses });
  }

  // Bonus % və Bonus məbləği bir-birini Cəmi əsasında qarşılıqlı hesablayır.
  function onBonusPercentChange(v: string) {
    const percent = toNum(v);
    const total = toNum(form.total);
    const newAmount = percent !== null && total !== null ? String(calcBonusAmount(total, percent)) : form.bonusAmount;
    setForm({ ...form, bonusPercent: v, bonusAmount: newAmount });
  }

  function onBonusAmountChange(v: string) {
    const amount = toNum(v);
    const total = toNum(form.total);
    const newPercent = amount !== null && total !== null && total !== 0 ? String(round2((amount / total) * 100)) : form.bonusPercent;
    setForm({ ...form, bonusAmount: v, bonusPercent: newPercent });
  }

  function onBonus2PercentChange(v: string) {
    const percent = toNum(v);
    const total = toNum(form.total);
    const newAmount = percent !== null && total !== null ? String(calcBonusAmount(total, percent)) : form.bonus2Amount;
    setForm({ ...form, bonus2Percent: v, bonus2Amount: newAmount });
  }

  function onBonus2AmountChange(v: string) {
    const amount = toNum(v);
    const total = toNum(form.total);
    const newPercent = amount !== null && total !== null && total !== 0 ? String(round2((amount / total) * 100)) : form.bonus2Percent;
    setForm({ ...form, bonus2Amount: v, bonus2Percent: newPercent });
  }

  async function save() {
    if (!form.customerId || !form.productName || !form.unitPrice) {
      setError("Müştəri, məhsul adı və qiymət tələb olunur.");
      return;
    }
    setSaving(true);
    const url = editing ? `/api/orders/${editing.id}` : "/api/orders";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xəta baş verdi");
      return;
    }
    setShowModal(false);
    load();
  }

  async function deliver(id: string) {
    if (!confirm("Bu sifarişi təhvil verilmiş kimi qeyd edim? Avtomatik faktura yaranacaq.")) return;
    const res = await fetch(`/api/orders/${id}/deliver`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Xəta baş verdi");
      return;
    }
    load();
  }

  async function remove(id: string) {
    if (!confirm("Sifarişi silmək istədiyinizə əminsiniz?")) return;
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Xəta baş verdi");
      return;
    }
    load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Sifarişlər</h1>
          <p className="text-inksoft text-sm">{orders.length} sifariş qeydə alınıb</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/orders" className="btn-outline">Excel export</a>
          <button onClick={openNew} className="btn">+ Yeni sifariş</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sifariş №</th>
              <th>Tarix</th>
              <th>Müştəri</th>
              <th>Məhsul</th>
              <th>Say</th>
              <th>Ədəd qiyməti</th>
              <th>Cəmi</th>
              <th>Menecer</th>
              <th>Bonus %</th>
              <th>Bonus məbləği</th>
              <th>2-ci Menecer</th>
              <th>2-ci Bonus %</th>
              <th>2-ci Bonus məbləği</th>
              <th>Son Cəm</th>
              <th>İstehsal Statusu</th>
              <th>Status</th>
              <th>Təhvil tarixi</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={18} className="text-center text-inksoft py-8">Hələ sifariş yoxdur</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="font-mono">
                  <Link href={`/orders/${o.id}`} className="text-cyan hover:underline">{o.number}</Link>
                </td>
                <td className="font-mono text-inksoft">{fmtDate(o.orderDate)}</td>
                <td>{o.customer?.name}</td>
                <td>{o.productName}</td>
                <td className="font-mono">{o.quantity}</td>
                <td className="font-mono">{fmtMoney(o.unitPrice)}</td>
                <td className="font-mono">{fmtMoney(o.total)}</td>
                <td>{o.managerName || "—"}</td>
                <td className="font-mono">{o.bonusPercent}%</td>
                <td className="font-mono">{fmtMoney(o.bonusAmount)}</td>
                <td>{o.manager2Name || "—"}</td>
                <td className="font-mono">{o.bonus2Percent}%</td>
                <td className="font-mono">{fmtMoney(o.bonus2Amount)}</td>
                <td className="font-mono font-semibold">{fmtMoney(o.finalTotal)}</td>
                <td><span className="stamp">{PRODUCTION_STATUS_LABELS[o.productionStatus]}</span></td>
                <td><span className="stamp">{ORDER_STATUS_LABELS[o.status]}</span></td>
                <td className="font-mono text-inksoft">{fmtDate(o.deliveryDate)}</td>
                <td>
                  <div className="flex gap-1.5 justify-end">
                    {o.status !== "TEHVIL_VERILDI" && o.status !== "LEGV_EDILDI" && (
                      <button onClick={() => deliver(o.id)} className="btn-outline !py-1 !px-2 text-xs">Təhvil ver</button>
                    )}
                    <button onClick={() => openEdit(o)} className="btn-outline !py-1 !px-2 text-xs">Redaktə</button>
                    <button onClick={() => remove(o.id)} className="btn-danger">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-8 overflow-y-auto z-50">
          <div className="card w-full max-w-2xl p-6">
            <h3 className="text-lg font-bold mb-1">{editing ? "Sifarişi redaktə et" : "Yeni sifariş"}</h3>
            <p className="text-xs text-inksoft mb-4">Excel-dəki "Sifarişlər" tabına uyğun bütün sahələr.</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Müştəri</label>
                <select className="input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">Seçin</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Sifariş tarixi</label>
                <input type="date" className="input" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-inksoft mb-1">Məhsulun adı</label>
              <input className="input" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Say</label>
                <input type="number" min="0" step="0.01" className="input" value={form.quantity} onChange={(e) => onQuantityChange(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Ədəd qiyməti (₼)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.unitPrice} onChange={(e) => onUnitPriceChange(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Cəmi (₼)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.total} onChange={(e) => onTotalChange(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Menecer</label>
                <input className="input" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Bonus %</label>
                <input type="number" min="0" step="0.01" className="input" value={form.bonusPercent} onChange={(e) => onBonusPercentChange(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Bonus məbləği (₼)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.bonusAmount} onChange={(e) => onBonusAmountChange(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">2-ci Menecer</label>
                <input className="input" value={form.manager2Name} onChange={(e) => setForm({ ...form, manager2Name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">2-ci Bonus %</label>
                <input type="number" min="0" step="0.01" className="input" value={form.bonus2Percent} onChange={(e) => onBonus2PercentChange(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">2-ci Bonus məbləği (₼)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.bonus2Amount} onChange={(e) => onBonus2AmountChange(e.target.value)} />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-inksoft mb-1">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
              </select>
              <p className="text-[11px] text-inksoft mt-1">"Təhvil verildi" üçün siyahıdakı "Təhvil ver" düyməsini istifadə edin. İstehsal statusu istehsal bölməsindən idarə olunur.</p>
            </div>

            {error && <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-3">{error}</div>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">Ləğv et</button>
              <button onClick={save} disabled={saving} className="btn">{editing ? "Yadda saxla" : "Sifarişi yarat"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
