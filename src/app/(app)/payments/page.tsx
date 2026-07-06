"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney, fmtDate } from "@/lib/format";
import Modal from "@/components/Modal";

interface Customer { id: string; name: string; }
interface Payment {
  id: string;
  date: string;
  customer: { name: string };
  invoice: { number: string } | null;
  amount: number;
  method: string;
  note: string | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerId: "", amount: "", method: "", note: "" });
  const [error, setError] = useState("");

  async function load() {
    const [pRes, cRes, mRes] = await Promise.all([
      fetch("/api/payments"),
      fetch("/api/customers"),
      fetch("/api/settings/options?category=PAYMENT_METHOD"),
    ]);
    setPayments(await pRes.json());
    setCustomers(await cRes.json());
    setMethods((await mRes.json()).map((o: { value: string }) => o.value));
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ customerId: customers[0]?.id || "", amount: "", method: methods[0] || "", note: "" });
    setError("");
    setShowModal(true);
  }

  async function save() {
    const amount = parseFloat(form.amount);
    if (!form.customerId || !amount || amount <= 0) {
      setError("Müştəri seçin və məbləği düzgün daxil edin.");
      return;
    }
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setShowModal(false);
    load();
  }

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Ödənişlər</h1>
          <p className="text-inksoft text-sm">{payments.length} ödəniş · cəmi {fmtMoney(total)}</p>
        </div>
        <button onClick={openNew} className="btn">+ Yeni ödəniş</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Tarix</th><th>Müştəri</th><th>Faktura №</th><th>Üsul</th><th>Qeyd</th><th>Məbləğ</th></tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={6} className="text-center text-inksoft py-8">Hələ ödəniş yoxdur</td></tr>
            )}
            <AnimatePresence initial={false}>
              {payments.map((p) => (
                <motion.tr
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="font-mono text-inksoft">{fmtDate(p.date)}</td>
                  <td>{p.customer.name}</td>
                  <td className="font-mono">{p.invoice?.number || "—"}</td>
                  <td>{p.method}</td>
                  <td className="text-inksoft">{p.note || "—"}</td>
                  <td className="font-mono">{fmtMoney(p.amount)}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-md">
            <h3 className="text-lg font-bold mb-4">Yeni ödəniş</h3>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-inksoft mb-1">Müştəri</label>
              <select className="input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Məbləğ (₼)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Üsul</label>
                <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  {methods.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-inksoft mb-1">Qeyd</label>
              <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            {error && <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">Ləğv et</button>
              <button onClick={save} className="btn">Əlavə et</button>
            </div>
      </Modal>
    </div>
  );
}
