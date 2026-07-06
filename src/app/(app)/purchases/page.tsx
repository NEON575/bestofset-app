"use client";
import { useEffect, useState } from "react";
import { fmtMoney, fmtDate, PAYMENT_STATUS_LABELS } from "@/lib/format";

interface InventoryItem { id: string; name: string; unit: string; }
interface Purchase {
  id: string; date: string; supplier: string; item: { name: string; unit: string };
  quantity: number; price: number; total: number; paymentStatus: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ supplier: "", itemId: "", quantity: "", price: "", paymentStatus: "ODENILMEYIB" });
  const [error, setError] = useState("");

  async function load() {
    const [pRes, iRes] = await Promise.all([fetch("/api/purchases"), fetch("/api/inventory")]);
    setPurchases(await pRes.json());
    setItems(await iRes.json());
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ supplier: "", itemId: items[0]?.id || "", quantity: "", price: "", paymentStatus: "ODENILMEYIB" });
    setError(""); setShowModal(true);
  }

  async function save() {
    if (!form.itemId || !form.quantity || !form.price) { setError("Material, say və qiyməti doldurun"); return; }
    const res = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setShowModal(false); load();
  }

  const total = purchases.reduce((s, p) => s + p.total, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Alışlar</h1>
          <p className="text-inksoft text-sm">{purchases.length} alış · cəmi {fmtMoney(total)}</p>
        </div>
        <button onClick={openNew} className="btn">+ Yeni alış</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Tarix</th><th>Təchizatçı</th><th>Material</th><th>Say</th><th>Qiymət</th><th>Cəmi</th><th>Ödəniş statusu</th></tr>
          </thead>
          <tbody>
            {purchases.length === 0 && <tr><td colSpan={7} className="text-center text-inksoft py-8">Hələ alış yoxdur</td></tr>}
            {purchases.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-inksoft">{fmtDate(p.date)}</td>
                <td>{p.supplier}</td>
                <td>{p.item.name}</td>
                <td className="font-mono">{p.quantity} {p.item.unit}</td>
                <td className="font-mono">{fmtMoney(p.price)}</td>
                <td className="font-mono">{fmtMoney(p.total)}</td>
                <td>{PAYMENT_STATUS_LABELS[p.paymentStatus]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-8 overflow-y-auto z-50">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Yeni alış</h3>
            <div className="mb-3"><label className="block text-xs font-semibold text-inksoft mb-1">Təchizatçı</label>
              <input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
            <div className="mb-3"><label className="block text-xs font-semibold text-inksoft mb-1">Material</label>
              <select className="input" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Say</label>
                <input type="number" min="0" step="0.01" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Qiymət (₼)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>
            <div className="mb-4"><label className="block text-xs font-semibold text-inksoft mb-1">Ödəniş statusu</label>
              <select className="input" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                <option value="ODENILMEYIB">Ödənilməyib</option>
                <option value="QISMEN_ODENILIB">Qismən ödənilib</option>
                <option value="ODENILIB">Ödənilib</option>
              </select></div>
            {error && <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">Ləğv et</button>
              <button onClick={save} className="btn">Alışı qeyd et</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
