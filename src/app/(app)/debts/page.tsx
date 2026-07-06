"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney, fmtDate, DEBT_TYPE_LABELS } from "@/lib/format";
import Modal from "@/components/Modal";

interface Debt {
  id: string; date: string; party: string; type: string; amount: number;
  paid: number; remaining: number; status: string; note: string | null;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ party: "", type: "BIZE_OLAN", amount: "", paid: "0", note: "" });
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/debts");
    setDebts(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ party: "", type: "BIZE_OLAN", amount: "", paid: "0", note: "" });
    setError(""); setShowModal(true);
  }

  async function save() {
    if (!form.party.trim() || !form.amount) { setError("Tərəf və məbləğ tələb olunur"); return; }
    const res = await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setShowModal(false); load();
  }

  async function updatePaid(debt: Debt, newPaid: number) {
    await fetch(`/api/debts/${debt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: newPaid }),
    });
    load();
  }

  const bizeOlan = debts.filter((d) => d.type === "BIZE_OLAN" && d.status === "ACIQ").reduce((s, d) => s + d.remaining, 0);
  const bizimOlan = debts.filter((d) => d.type === "BIZIM_OLAN" && d.status === "ACIQ").reduce((s, d) => s + d.remaining, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Borclar</h1>
          <p className="text-inksoft text-sm">Bizə olan: {fmtMoney(bizeOlan)} · Bizim olan: {fmtMoney(bizimOlan)}</p>
        </div>
        <button onClick={openNew} className="btn">+ Yeni borc</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Tarix</th><th>Tərəf</th><th>Tip</th><th>Məbləğ</th><th>Ödənilən</th><th>Qalıq</th><th>Status</th></tr>
          </thead>
          <tbody>
            {debts.length === 0 && <tr><td colSpan={7} className="text-center text-inksoft py-8">Hələ borc qeydi yoxdur</td></tr>}
            <AnimatePresence initial={false}>
              {debts.map((d) => (
                <motion.tr
                  key={d.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="font-mono text-inksoft">{fmtDate(d.date)}</td>
                  <td>{d.party}</td>
                  <td>{DEBT_TYPE_LABELS[d.type]}</td>
                  <td className="font-mono">{fmtMoney(d.amount)}</td>
                  <td className="font-mono">
                    <input
                      type="number" min="0" step="0.01" defaultValue={d.paid}
                      className="input !w-24 !py-1"
                      onBlur={(e) => updatePaid(d, parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="font-mono font-semibold">{fmtMoney(d.remaining)}</td>
                  <td>
                    <span className={`stamp ${d.status === "ACIQ" ? "border-magenta text-magenta bg-magenta/10" : "border-teal text-teal bg-teal/10"}`}>
                      {d.status === "ACIQ" ? "Açıq" : "Qapanıb"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-md">
            <h3 className="text-lg font-bold mb-4">Yeni borc qeydi</h3>
            <div className="mb-3"><label className="block text-xs font-semibold text-inksoft mb-1">Tərəf (şəxs/şirkət)</label>
              <input className="input" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Borc tipi</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="BIZE_OLAN">Bizə olan borc</option>
                  <option value="BIZIM_OLAN">Bizim olan borc</option>
                </select></div>
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Məbləğ (₼)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div className="mb-3"><label className="block text-xs font-semibold text-inksoft mb-1">Ödənilən (₼)</label>
              <input type="number" min="0" step="0.01" className="input" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} /></div>
            <div className="mb-4"><label className="block text-xs font-semibold text-inksoft mb-1">Qeyd</label>
              <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
            {error && <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">Ləğv et</button>
              <button onClick={save} className="btn">Əlavə et</button>
            </div>
      </Modal>
    </div>
  );
}
