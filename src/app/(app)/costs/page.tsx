"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney } from "@/lib/format";
import Modal from "@/components/Modal";

interface Order { id: string; number: string; productName: string; finalTotal: number; }
interface Cost {
  id: string;
  orderId: string;
  order: { number: string; productName: string; finalTotal: number };
  paperCost: number;
  printCost: number;
  laminationCost: number;
  cuttingCost: number;
  otherCost: number;
  totalCost: number;
  saleAmount: number;
  profit: number;
}

const emptyForm = { orderId: "", paperCost: "0", printCost: "0", laminationCost: "0", cuttingCost: "0", otherCost: "0" };

export default function CostsPage() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    const [cRes, oRes] = await Promise.all([fetch("/api/costs"), fetch("/api/orders")]);
    setCosts(await cRes.json());
    setOrders(await oRes.json());
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ ...emptyForm, orderId: orders[0]?.id || "" });
    setError("");
    setShowModal(true);
  }

  async function save() {
    if (!form.orderId) { setError("Sifariş seçin"); return; }
    const res = await fetch("/api/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setShowModal(false);
    load();
  }

  const totalSale = costs.reduce((s, c) => s + c.saleAmount, 0);
  const totalCostSum = costs.reduce((s, c) => s + c.totalCost, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Maya Dəyəri</h1>
          <p className="text-inksoft text-sm">
            Satış: {fmtMoney(totalSale)} · Maya dəyəri: {fmtMoney(totalCostSum)} · Mənfəət: {fmtMoney(totalSale - totalCostSum)}
          </p>
        </div>
        <button onClick={openNew} className="btn">+ Hesabla</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sifariş №</th><th>Məhsul</th><th>Kağız</th><th>Çap</th><th>Laminasiya</th><th>Kəsim</th><th>Digər</th>
              <th>Ümumi maya</th><th>Satış</th><th>Mənfəət</th>
            </tr>
          </thead>
          <tbody>
            {costs.length === 0 && (
              <tr><td colSpan={10} className="text-center text-inksoft py-8">Hələ hesablanmış maya dəyəri yoxdur</td></tr>
            )}
            <AnimatePresence initial={false}>
              {costs.map((c) => (
                <motion.tr
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="font-mono">{c.order.number}</td>
                  <td>{c.order.productName}</td>
                  <td className="font-mono">{fmtMoney(c.paperCost)}</td>
                  <td className="font-mono">{fmtMoney(c.printCost)}</td>
                  <td className="font-mono">{fmtMoney(c.laminationCost)}</td>
                  <td className="font-mono">{fmtMoney(c.cuttingCost)}</td>
                  <td className="font-mono">{fmtMoney(c.otherCost)}</td>
                  <td className="font-mono">{fmtMoney(c.totalCost)}</td>
                  <td className="font-mono">{fmtMoney(c.saleAmount)}</td>
                  <td className={`font-mono font-semibold ${c.profit >= 0 ? "text-teal" : "text-magenta"}`}>{fmtMoney(c.profit)}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-lg">
            <h3 className="text-lg font-bold mb-4">Sifariş üçün maya dəyərini hesabla</h3>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-inksoft mb-1">Sifariş</label>
              <select className="input" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
                {orders.map((o) => <option key={o.id} value={o.id}>{o.number} — {o.productName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Kağız xərci</label>
                <input type="number" min="0" step="0.01" className="input" value={form.paperCost} onChange={(e) => setForm({ ...form, paperCost: e.target.value })} /></div>
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Çap xərci</label>
                <input type="number" min="0" step="0.01" className="input" value={form.printCost} onChange={(e) => setForm({ ...form, printCost: e.target.value })} /></div>
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Laminasiya xərci</label>
                <input type="number" min="0" step="0.01" className="input" value={form.laminationCost} onChange={(e) => setForm({ ...form, laminationCost: e.target.value })} /></div>
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Kəsim xərci</label>
                <input type="number" min="0" step="0.01" className="input" value={form.cuttingCost} onChange={(e) => setForm({ ...form, cuttingCost: e.target.value })} /></div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-inksoft mb-1">Digər xərc</label>
              <input type="number" min="0" step="0.01" className="input" value={form.otherCost} onChange={(e) => setForm({ ...form, otherCost: e.target.value })} />
            </div>
            {error && <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">Ləğv et</button>
              <button onClick={save} className="btn">Hesabla və saxla</button>
            </div>
      </Modal>
    </div>
  );
}
