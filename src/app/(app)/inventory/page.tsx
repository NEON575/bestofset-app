"use client";
import { useEffect, useState } from "react";
import { fmtMoney } from "@/lib/format";

interface Item {
  id: string; name: string; unit: string; incoming: number; outgoing: number;
  balance: number; purchasePrice: number; note: string | null;
}

const emptyForm = { name: "", unit: "ədəd", incoming: "0", outgoing: "0", purchasePrice: "0", note: "" };

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/inventory");
    setItems(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(emptyForm); setError(""); setShowModal(true); }
  function openEdit(i: Item) {
    setEditing(i);
    setForm({ name: i.name, unit: i.unit, incoming: String(i.incoming), outgoing: String(i.outgoing), purchasePrice: String(i.purchasePrice), note: i.note || "" });
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
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Anbar</h1>
          <p className="text-inksoft text-sm">{items.length} material qeydə alınıb</p>
        </div>
        <button onClick={openNew} className="btn">+ Yeni material</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Material</th><th>Ölçü</th><th>Giriş</th><th>Çıxış</th><th>Qalıq</th><th>Alış qiyməti</th><th></th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={7} className="text-center text-inksoft py-8">Hələ material yoxdur</td></tr>}
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.unit}</td>
                <td className="font-mono">{i.incoming}</td>
                <td className="font-mono">{i.outgoing}</td>
                <td className="font-mono font-semibold">{i.balance}</td>
                <td className="font-mono">{fmtMoney(i.purchasePrice)}</td>
                <td>
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => openEdit(i)} className="btn-outline !py-1 !px-2 text-xs">Redaktə</button>
                    <button onClick={() => remove(i.id)} className="btn-danger">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-8 overflow-y-auto z-50">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? "Materialı redaktə et" : "Yeni material"}</h3>
            <div className="mb-3"><label className="block text-xs font-semibold text-inksoft mb-1">Material adı</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-xs font-semibold text-inksoft mb-1">Ölçü vahidi</label>
                <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
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
          </div>
        </div>
      )}
    </div>
  );
}
