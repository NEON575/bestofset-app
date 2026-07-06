"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney, fmtDate, PAYMENT_STATUS_LABELS } from "@/lib/format";
import Modal from "@/components/Modal";

interface InventoryItem { id: string; name: string; unit: string; }
interface Supplier { id: string; name: string; }
interface Purchase {
  id: string; date: string; supplier: { name: string }; item: { name: string; unit: string };
  quantity: number; price: number; total: number; paymentStatus: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ supplierId: "", itemId: "", quantity: "", price: "", paymentStatus: "ODENILMEYIB" });
  const [error, setError] = useState("");

  async function load() {
    const [pRes, iRes, sRes] = await Promise.all([
      fetch("/api/purchases"),
      fetch("/api/inventory"),
      fetch("/api/suppliers"),
    ]);
    setPurchases(await pRes.json());
    setItems(await iRes.json());
    setSuppliers(await sRes.json());
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ supplierId: suppliers[0]?.id || "", itemId: items[0]?.id || "", quantity: "", price: "", paymentStatus: "ODENILMEYIB" });
    setError(""); setShowModal(true);
  }

  async function save() {
    if (!form.supplierId || !form.itemId || !form.quantity || !form.price) { setError("Təchizatçı, material, say və qiyməti doldurun"); return; }
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
            <AnimatePresence initial={false}>
              {purchases.map((p) => (
                <motion.tr
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="font-mono text-inksoft">{fmtDate(p.date)}</td>
                  <td>{p.supplier?.name || "—"}</td>
                  <td>{p.item.name}</td>
                  <td className="font-mono">{p.quantity} {p.item.unit}</td>
                  <td className="font-mono">{fmtMoney(p.price)}</td>
                  <td className="font-mono">{fmtMoney(p.total)}</td>
                  <td>{PAYMENT_STATUS_LABELS[p.paymentStatus]}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-md">
            <h3 className="text-lg font-bold mb-4">Yeni alış</h3>
            <div className="mb-3"><label className="block text-xs font-semibold text-inksoft mb-1">Təchizatçı</label>
              <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">— seçin —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
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
      </Modal>
    </div>
  );
}
