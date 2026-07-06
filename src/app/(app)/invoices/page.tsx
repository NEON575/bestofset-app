"use client";
import { useEffect, useState } from "react";
import {
  fmtMoney,
  fmtDate,
  INVOICE_STATUS_LABELS,
  EQAIME_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/format";

interface Invoice {
  id: string;
  number: string;
  orderDate: string;
  deliveryDate: string | null;
  customer: { name: string };
  productName: string;
  quantity: number;
  unitPrice: number;
  finalTotal: number;
  note: string | null;
  eqaimeStatus: string;
  eqaimeNumber: string | null;
  eqaimeDate: string | null;
  eqaimePaymentStatus: string;
  status: string;
  paidSum: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState<any>({});

  async function load() {
    const res = await fetch("/api/invoices");
    setInvoices(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openEdit(inv: Invoice) {
    setEditing(inv);
    setForm({
      note: inv.note || "",
      eqaimeStatus: inv.eqaimeStatus,
      eqaimeNumber: inv.eqaimeNumber || "",
      eqaimeDate: inv.eqaimeDate ? inv.eqaimeDate.slice(0, 10) : "",
    });
  }

  async function save() {
    if (!editing) return;
    await fetch(`/api/invoices/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditing(null);
    load();
  }

  async function returnToOrder(id: string) {
    if (!confirm("Bu fakturanı sifarişə qaytarım? Faktura silinməyəcək, sadəcə statusu dəyişəcək.")) return;
    await fetch(`/api/invoices/${id}/return`, { method: "POST" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Fakturanı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Xəta baş verdi");
      return;
    }
    load();
  }

  const eqaimeBadge = (status: string) =>
    status === "YAZILIB"
      ? "border-teal text-teal bg-teal/10"
      : "border-magenta text-magenta bg-magenta/10";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Satış Fakturaları</h1>
        <p className="text-inksoft text-sm">{invoices.length} faktura qeydə alınıb</p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Faktura №</th>
              <th>Təhvil tarixi</th>
              <th>Müştəri</th>
              <th>Məhsul</th>
              <th>Son Cəm</th>
              <th>E-qaimə</th>
              <th>Ödəniş</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr><td colSpan={9} className="text-center text-inksoft py-8">Hələ faktura yoxdur</td></tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono">{inv.number}</td>
                <td className="font-mono text-inksoft">{fmtDate(inv.deliveryDate)}</td>
                <td>{inv.customer.name}</td>
                <td>{inv.productName}</td>
                <td className="font-mono font-semibold">{fmtMoney(inv.finalTotal)}</td>
                <td><span className={`stamp ${eqaimeBadge(inv.eqaimeStatus)}`}>{EQAIME_STATUS_LABELS[inv.eqaimeStatus]}</span></td>
                <td>{PAYMENT_STATUS_LABELS[inv.eqaimePaymentStatus]}</td>
                <td>{INVOICE_STATUS_LABELS[inv.status]}</td>
                <td>
                  <div className="flex gap-1.5 justify-end">
                    <a href={`/api/export/invoice/${inv.id}/pdf`} className="btn-outline !py-1 !px-2 text-xs">PDF</a>
                    <button onClick={() => openEdit(inv)} className="btn-outline !py-1 !px-2 text-xs">Redaktə</button>
                    {inv.status === "AKTIV" && (
                      <button onClick={() => returnToOrder(inv.id)} className="btn-danger">Sifarişə qaytar</button>
                    )}
                    {inv.status === "QAYTARILDI" && (
                      <button onClick={() => remove(inv.id)} className="btn-danger">Sil</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-8 overflow-y-auto z-50">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-1">Faktura: {editing.number}</h3>
            <p className="text-xs text-inksoft mb-4">
              Yalnız e-qaimə və qeyd sahələri redaktə oluna bilər. Əsas məbləğ sahələri sifarişdən köçürülüb və sabitdir.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">E-qaimə statusu</label>
                <select className="input" value={form.eqaimeStatus} onChange={(e) => setForm({ ...form, eqaimeStatus: e.target.value })}>
                  <option value="YAZILMAYIB">Yazılmayıb</option>
                  <option value="YAZILIB">Yazılıb</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1">E-qaimə №</label>
                <input className="input" value={form.eqaimeNumber} onChange={(e) => setForm({ ...form, eqaimeNumber: e.target.value })} />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-inksoft mb-1">E-qaimə tarixi</label>
              <input type="date" className="input" value={form.eqaimeDate} onChange={(e) => setForm({ ...form, eqaimeDate: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-inksoft mb-1">Qeyd</label>
              <textarea className="input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <p className="text-[11px] text-inksoft mb-3">
              Ödəniş statusu "Ödənişlər" bölməsindən ödəniş qeyd edəndə avtomatik yenilənir.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-outline">Ləğv et</button>
              <button onClick={save} className="btn">Yadda saxla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
