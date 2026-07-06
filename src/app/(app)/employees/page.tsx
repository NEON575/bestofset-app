"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/Modal";

interface Employee {
  id: string;
  name: string;
  position: string | null;
  active: boolean;
  inUse: boolean;
}

const emptyForm = { name: "", position: "" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/employees");
    setEmployees(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }
  function openEdit(e: Employee) {
    setEditing(e);
    setForm({ name: e.name, position: e.position || "" });
    setError("");
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim()) { setError("Ad boş ola bilməz"); return; }
    const url = editing ? `/api/employees/${editing.id}` : "/api/employees";
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

  async function toggleActive(e: Employee) {
    await fetch(`/api/employees/${e.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !e.active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("İşçini silmək istədiyinizə əminsiniz?")) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">İşçilər</h1>
          <p className="text-inksoft text-sm">{employees.length} işçi qeydə alınıb</p>
        </div>
        <button onClick={openNew} className="btn">+ Yeni işçi</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Ad</th><th>Vəzifə</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr><td colSpan={4} className="text-center text-inksoft py-8">Hələ işçi yoxdur</td></tr>
            )}
            <AnimatePresence initial={false}>
              {employees.map((e) => (
                <motion.tr
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td>{e.name}</td>
                  <td className="text-inksoft">{e.position || "—"}</td>
                  <td>
                    <span className={`stamp ${e.active ? "border-teal text-teal bg-teal/10" : "border-line text-inksoft"}`}>
                      {e.active ? "Aktiv" : "Deaktiv"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => openEdit(e)} className="btn-outline !py-1 !px-2 text-xs">Redaktə</button>
                      <button onClick={() => toggleActive(e)} className="btn-outline !py-1 !px-2 text-xs">
                        {e.active ? "Deaktiv et" : "Aktivləşdir"}
                      </button>
                      {!e.inUse && (
                        <button onClick={() => remove(e.id)} className="btn-danger">Sil</button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-md">
        <h3 className="text-lg font-bold mb-4">{editing ? "İşçini redaktə et" : "Yeni işçi"}</h3>
        <div className="mb-3">
          <label className="block text-xs font-semibold text-inksoft mb-1">Ad Soyad</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-inksoft mb-1">Vəzifə</label>
          <input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
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
