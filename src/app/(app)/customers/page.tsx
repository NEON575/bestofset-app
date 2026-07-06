"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney } from "@/lib/format";
import Modal from "@/components/Modal";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  taxId: string | null;
  note: string | null;
  orderCount: number;
  totalSales: number;
  totalPaid: number;
  debt: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", taxId: "", note: "" });
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/customers");
    setCustomers(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "", phone: "", taxId: "", note: "" });
    setError("");
    setShowModal(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || "", taxId: c.taxId || "", note: c.note || "" });
    setError("");
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim()) { setError("Ad boş ola bilməz"); return; }
    const url = editing ? `/api/customers/${editing.id}` : "/api/customers";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setShowModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Müştərini silmək istədiyinizə əminsiniz?")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Müştərilər</h1>
          <p className="text-inksoft text-sm">{customers.length} müştəri qeydə alınıb</p>
        </div>
        <button onClick={openNew} className="btn">+ Yeni müştəri</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ad</th><th>VÖEN</th><th>Telefon</th><th>Sifariş sayı</th><th>Ümumi satış</th><th>Ödənilib</th><th>Borc</th><th></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={8} className="text-center text-inksoft py-8">Hələ müştəri yoxdur</td></tr>
            )}
            <AnimatePresence initial={false}>
              {customers.map((c) => (
                <motion.tr
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td>{c.name}</td>
                  <td className="font-mono">{c.taxId || "—"}</td>
                  <td className="font-mono">{c.phone || "—"}</td>
                  <td className="font-mono">{c.orderCount}</td>
                  <td className="font-mono">{fmtMoney(c.totalSales)}</td>
                  <td className="font-mono">{fmtMoney(c.totalPaid)}</td>
                  <td>
                    <span className={`stamp ${c.debt > 0 ? "border-magenta text-magenta bg-magenta/10" : "border-teal text-teal bg-teal/10"}`}>
                      {fmtMoney(Math.max(0, c.debt))}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => openEdit(c)} className="btn-outline !py-1 !px-2 text-xs">Redaktə</button>
                      <button onClick={() => remove(c.id)} className="btn-danger">Sil</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-md">
            <h3 className="text-lg font-bold mb-4">{editing ? "Müştərini redaktə et" : "Yeni müştəri"}</h3>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-inksoft mb-1">Ad</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Telefon</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">VÖEN</label>
                <input className="input" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-inksoft mb-1">Qeyd</label>
              <textarea className="input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            {error && <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-3">{error}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">Ləğv et</button>
              <button onClick={save} className="btn">{editing ? "Yadda saxla" : "Əlavə et"}</button>
            </div>
      </Modal>
    </div>
  );
}
