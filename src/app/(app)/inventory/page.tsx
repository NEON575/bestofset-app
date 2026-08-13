"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney } from "@/lib/format";
import Modal from "@/components/Modal";

interface Item {
  id: string; name: string; unit: string;
  category: string | null; size: string | null; grammage: number | null; minThreshold: number;
  incoming: number; outgoing: number; balance: number; purchasePrice: number; note: string | null;
}

const emptyForm = {
  name: "", unit: "", category: "", size: "", grammage: "", minThreshold: "0",
  incoming: "0", outgoing: "0", purchasePrice: "0", note: "",
};

/** Aktiv seçim siyahısı + (əgər artıq deaktiv olunmuş dəyər seçilibsə) onun adı. */
function withCurrent(options: string[], current: string): string[] {
  if (current && !options.includes(current)) return [...options, current];
  return options;
}

function isLow(i: Item): boolean {
  return i.balance <= i.minThreshold;
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    const [iRes, uRes, cRes] = await Promise.all([
      fetch("/api/inventory"),
      fetch("/api/settings/options?category=UNIT"),
      fetch("/api/settings/options?category=MATERIAL_CATEGORY"),
    ]);
    setItems(await iRes.json());
    setUnits((await uRes.json()).map((o: { value: string }) => o.value));
    setCategories((await cRes.json()).map((o: { value: string }) => o.value));
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, unit: units[0] || "", category: categories[0] || "" });
    setError(""); setShowModal(true);
  }
  function openEdit(i: Item) {
    setEditing(i);
    setForm({
      name: i.name, unit: i.unit, category: i.category || "", size: i.size || "",
      grammage: i.grammage != null ? String(i.grammage) : "", minThreshold: String(i.minThreshold),
      incoming: String(i.incoming), outgoing: String(i.outgoing),
      purchasePrice: String(i.purchasePrice), note: i.note || "",
    });
    setError(""); setShowModal(true);
  }

  async function save() {
    if (!form.name.trim()) { setError("Material adı tələb olunur"); return; }
    const url = editing ? `/api/inventory/${editing.id}` : "/api/inventory";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setShowModal(false); load();
  }

  async function remove(id: string) {
    if (!confirm("Materialı silmək istədiyinizə əminsiniz?")) return;
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Silinmədi — material sifarişlərdə istifadə olunub"); return; }
    load();
  }

  const visible = filterCategory ? items.filter((i) => i.category === filterCategory) : items;
  const lowCount = items.filter(isLow).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Anbar</h1>
          <p className="text-inksoft text-sm">
            {items.length} material qeydə alınıb{lowCount > 0 && <span className="text-magenta"> · {lowCount} azalıb</span>}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="input !w-auto" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Bütün kateqoriyalar</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={openNew} className="btn">+ Yeni material</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Material</th><th>Kateqoriya</th><th>Ölçü</th><th>Qramaj</th><th>Vahid</th>
              <th>Giriş</th><th>Çıxış</th><th>Qalıq</th><th>Alış qiyməti</th><th></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={10} className="text-center text-inksoft py-8">Material yoxdur</td></tr>}
            <AnimatePresence initial={false}>
              {visible.map((i) => {
                const low = isLow(i);
                return (
                  <motion.tr
                    key={i.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={low ? "bg-magenta/10" : ""}
                  >
                    <td>{i.name}</td>
                    <td className="text-inksoft">{i.category || "—"}</td>
                    <td className="text-inksoft">{i.size || "—"}</td>
                    <td className="font-mono text-inksoft">{i.grammage != null ? i.grammage : "—"}</td>
                    <td>{i.unit}</td>
                    <td className="font-mono">{i.incoming}</td>
                    <td className="font-mono">{i.outgoing}</td>
                    <td className="font-mono font-semibold">
                      {i.balance}
                      {low && <span className="stamp border-magenta text-magenta bg-magenta/10 ml-2">Azdır</span>}
                    </td>
                    <td className="font-mono">{fmtMoney(i.purchasePrice)}</td>
                    <td>
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => openEdit(i)} className="btn-outline !py-1 !px-2 text-xs">Redaktə</button>
                        <button onClick={() => remove(i.id)} className="btn-danger">Sil</button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <Modal show={showModal} maxWidth="max-w-lg">
        <h3 className="text-lg font-bold mb-4">{editing ? "Materialı redaktə et" : "Yeni material"}</h3>
        <div className="mb-3"><label className="block text-xs font-semibold text-inksoft mb-1">Material adı</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className="block text-xs font-semibold text-inksoft mb-1">Kateqoriya</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">— seçin —</option>
              {withCurrent(categories, form.category).map((c) => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-inksoft mb-1">Ölçü vahidi</label>
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {withCurrent(units, form.unit).map((u) => <option key={u} value={u}>{u}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-inksoft mb-1">Ölçü</label>
            <input className="input" placeholder="məs: 64x90 sm" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-inksoft mb-1">Qramaj</label>
            <input type="number" min="0" step="0.01" className="input" placeholder="məs: 80" value={form.grammage} onChange={(e) => setForm({ ...form, grammage: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-inksoft mb-1">Minimum hədd</label>
            <input type="number" min="0" step="0.01" className="input" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-inksoft mb-1">Alış qiyməti (₼)</label>
            <input type="number" min="0" step="0.01" className="input" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><label className="block text-xs font-semibold text-inksoft mb-1">Giriş</label>
            <input type="number" min="0" step="0.01" className="input" value={form.incoming} onChange={(e) => setForm({ ...form, incoming: e.target.value })} /></div>
          <div><label className="block text-xs font-semibold text-inksoft mb-1">Çıxış</label>
            <input type="number" min="0" step="0.01" className="input" value={form.outgoing} onChange={(e) => setForm({ ...form, outgoing: e.target.value })} /></div>
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
