"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  id: string;
  category: string;
  value: string;
  active: boolean;
  sortOrder: number;
}

const CATEGORIES = [
  { key: "POSITION", label: "Vəzifələr", placeholder: "məs: Kuryer" },
  { key: "PAYMENT_METHOD", label: "Ödəniş üsulları", placeholder: "məs: PayPal" },
  { key: "UNIT", label: "Ölçü vahidləri", placeholder: "məs: qutu" },
  { key: "COST_TYPE", label: "Xərc növləri", placeholder: "məs: Qablaşdırma" },
];

export default function SettingsPage() {
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [newValue, setNewValue] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});

  async function load() {
    const entries = await Promise.all(
      CATEGORIES.map(async (c) => {
        const res = await fetch(`/api/settings/options?category=${c.key}&all=1`);
        return [c.key, await res.json()] as const;
      })
    );
    setOptions(Object.fromEntries(entries));
  }
  useEffect(() => { load(); }, []);

  async function addValue(category: string) {
    const value = (newValue[category] || "").trim();
    if (!value) return;
    const res = await fetch("/api/settings/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError({ ...error, [category]: d.error || "Xəta baş verdi" });
      return;
    }
    setNewValue({ ...newValue, [category]: "" });
    setError({ ...error, [category]: "" });
    load();
  }

  async function toggleActive(o: Option) {
    await fetch(`/api/settings/options/${o.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !o.active }),
    });
    load();
  }

  async function remove(o: Option) {
    if (!confirm(`"${o.value}" dəyərini silmək istədiyinizə əminsiniz?`)) return;
    await fetch(`/api/settings/options/${o.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Parametrlər</h1>
        <p className="text-inksoft text-sm">Tətbiqdə istifadə olunan siyahıları burada idarə edin.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="card p-4">
            <h2 className="font-semibold text-base mb-3">{c.label}</h2>

            <div className="flex flex-col gap-1.5 mb-3">
              {(options[c.key] || []).length === 0 && (
                <div className="text-xs text-inksoft text-center py-4">Hələ dəyər yoxdur</div>
              )}
              <AnimatePresence initial={false}>
                {(options[c.key] || []).map((o) => (
                  <motion.div
                    key={o.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between gap-2 bg-paperalt rounded-md px-2.5 py-1.5"
                  >
                    <span className={`text-sm truncate ${o.active ? "" : "text-inksoft line-through"}`}>
                      {o.value}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleActive(o)}
                        className="btn-outline !py-1 !px-2 text-xs"
                      >
                        {o.active ? "Deaktiv et" : "Aktivləşdir"}
                      </button>
                      <button onClick={() => remove(o)} className="text-magenta text-xs hover:underline">
                        Sil
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {error[c.key] && (
              <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2 mb-3">
                {error[c.key]}
              </div>
            )}

            <div className="flex gap-1.5">
              <input
                className="input !py-1.5 text-sm flex-1"
                placeholder={c.placeholder}
                value={newValue[c.key] || ""}
                onChange={(e) => setNewValue({ ...newValue, [c.key]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") addValue(c.key); }}
              />
              <button onClick={() => addValue(c.key)} className="btn-outline !py-1.5 text-xs">
                + Yeni dəyər əlavə et
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
