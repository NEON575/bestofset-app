"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney } from "@/lib/format";
import Modal from "@/components/Modal";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  taxId: string | null;
  address: string | null;
  note: string | null;
  purchaseCount: number;
  totalPurchase: number;
}

const emptyForm = { name: "", phone: "", taxId: "", address: "", note: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/suppliers");
    setSuppliers(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      phone: s.phone || "",
      taxId: s.taxId || "",
      address: s.address || "",
      note: s.note || "",
    });
    setError("");
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim()) { setError("Ad boş ola bilməz"); return; }
    const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
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
    if (!confirm("Təchizatçını silmək istədiyinizə əminsiniz?")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Təchizatçılar</h1>
          <p className="text-inksoft text-sm">{suppliers.length} təchizatçı qeydə alınıb</p>
        </div>
        <button onClick={openNew} className="btn">+ Yeni təchizatçı</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ad</th><th>Telefon</th><th>VÖEN</th><th>Ünvan</th><th>Alış sayı</th><th>Ümumi alış məbləği</th><th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr><td colSpan={7} className="text-center text-inksoft py-8">Hələ təchizatçı yoxdur</td></tr>
            )}
            <AnimatePresence initial={false}>
              {suppliers.map((s) => (
                <motion.tr
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td>{s.name}</td>
                  <td className="font-mono">{s.phone || "—"}</td>
                  <td className="font-mono">{s.taxId || "—"}</td>
                  <td className="text-inksoft">{s.address || "—"}</td>
                  <td className="font-mono">{s.purchaseCount}</td>
                  <td className="font-mono font-semibold">{fmtMoney(s.totalPurchase)}</td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => openEdit(s)} className="btn-outline !py-1 !px-2 text-xs">Redaktə</button>
                      <button onClick={() => remove(s.id)} className="btn-danger">Sil</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-md">
        <h3 className="text-lg font-bold mb-4">{editing ? "Təchizatçını redaktə et" : "Yeni təchizatçı"}</h3>
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
        <div className="mb-3">
          <label className="block text-xs font-semibold text-inksoft mb-1">Ünvan</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
