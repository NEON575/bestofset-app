"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney, PAYMENT_STATUS_LABELS } from "@/lib/format";
import Modal from "@/components/Modal";

interface Salary {
  id: string;
  employeeName: string;
  baseSalary: number;
  bonus: number;
  total: number;
  paid: number;
  remaining: number;
  month: string;
  status: string;
}

const emptyForm = {
  employeeName: "",
  baseSalary: "",
  bonus: "0",
  paid: "0",
  month: new Date().toISOString().slice(0, 7),
};

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  async function load() {
    const url = monthFilter ? `/api/salaries?month=${monthFilter}` : "/api/salaries";
    const res = await fetch(url);
    setSalaries(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(s: Salary) {
    setEditing(s);
    setForm({
      employeeName: s.employeeName,
      baseSalary: String(s.baseSalary),
      bonus: String(s.bonus),
      paid: String(s.paid),
      month: s.month,
    });
    setError("");
    setShowModal(true);
  }

  async function save() {
    if (!form.employeeName || !form.baseSalary || !form.month) {
      setError("İşçi adı, maaş və ay tələb olunur.");
      return;
    }
    const url = editing ? `/api/salaries/${editing.id}` : "/api/salaries";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Xəta baş verdi");
      return;
    }
    setShowModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("İşçi qeydini silmək istədiyinizə əminsiniz?")) return;
    const res = await fetch(`/api/salaries/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Xəta baş verdi");
      return;
    }
    load();
  }

  const totalThisView = salaries.reduce((s, x) => s + x.total, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Əmək haqqı</h1>
          <p className="text-inksoft text-sm">
            {salaries.length} qeyd · cəmi {fmtMoney(totalThisView)}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="month"
            className="input !w-auto"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
          <button onClick={openNew} className="btn">+ Yeni işçi qeydi</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>İşçi</th>
              <th>Ay</th>
              <th>Sabit maaş</th>
              <th>Bonus</th>
              <th>Cəmi maaş</th>
              <th>Ödənilən</th>
              <th>Qalıq</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {salaries.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-inksoft py-8">
                  Hələ qeyd yoxdur
                </td>
              </tr>
            )}
            <AnimatePresence initial={false}>
              {salaries.map((s) => (
                <motion.tr
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td>{s.employeeName}</td>
                  <td className="font-mono text-inksoft">{s.month}</td>
                  <td className="font-mono">{fmtMoney(s.baseSalary)}</td>
                  <td className="font-mono">{fmtMoney(s.bonus)}</td>
                  <td className="font-mono font-semibold">{fmtMoney(s.total)}</td>
                  <td className="font-mono">{fmtMoney(s.paid)}</td>
                  <td className="font-mono">{fmtMoney(s.remaining)}</td>
                  <td>
                    <span className="stamp">{PAYMENT_STATUS_LABELS[s.status]}</span>
                  </td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => openEdit(s)} className="btn-outline !py-1 !px-2 text-xs">
                        Redaktə
                      </button>
                      <button onClick={() => remove(s.id)} className="btn-danger">
                        Sil
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editing ? "İşçi qeydini redaktə et" : "Yeni işçi qeydi"}
            </h3>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-inksoft mb-1">Ad Soyad</label>
              <input
                className="input"
                value={form.employeeName}
                onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Sabit maaş (₼)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.baseSalary}
                  onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Bonus (₼)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.bonus}
                  onChange={(e) => setForm({ ...form, bonus: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Ödənilən (₼)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.paid}
                  onChange={(e) => setForm({ ...form, paid: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">Ay</label>
                <input
                  type="month"
                  className="input"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="btn-outline">
                Ləğv et
              </button>
              <button onClick={save} className="btn">
                {editing ? "Yadda saxla" : "Əlavə et"}
              </button>
            </div>
      </Modal>
    </div>
  );
}
