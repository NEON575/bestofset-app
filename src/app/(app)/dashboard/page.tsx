"use client";
import { useEffect, useState } from "react";
import { fmtMoney, fmtDate, ORDER_STATUS_LABELS, PRODUCTION_STATUS_LABELS } from "@/lib/format";

interface DashboardData {
  activeOrderCount: number;
  deliveredOrderCount: number;
  totalSales: number;
  todaySales: number;
  monthSales: number;
  unpaidAmount: number;
  partiallyPaidCount: number;
  customerDebts: number;
  totalCost: number;
  totalProfit: number;
  activeOrders: any[];
  recentInvoices: any[];
  recentPayments: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-inksoft">Yüklənir...</p>;

  const stats = [
    { label: "Aktiv sifariş sayı", value: data.activeOrderCount, color: "bg-cyan" },
    { label: "Təhvil verilmiş sifariş", value: data.deliveredOrderCount, color: "bg-yellow" },
    { label: "Ümumi satış", value: fmtMoney(data.totalSales), color: "bg-teal" },
    { label: "Bugünkü satış", value: fmtMoney(data.todaySales), color: "bg-cyan" },
    { label: "Aylıq satış", value: fmtMoney(data.monthSales), color: "bg-teal" },
    { label: "Ödənilməmiş faktura", value: fmtMoney(data.unpaidAmount), color: "bg-magenta" },
    { label: "Qismən ödənilmiş fakturalar", value: data.partiallyPaidCount, color: "bg-yellow" },
    { label: "Müştəri borcları", value: fmtMoney(data.customerDebts), color: "bg-magenta" },
    { label: "Ümumi maya dəyəri", value: fmtMoney(data.totalCost), color: "bg-inksoft" },
    { label: "Təxmini mənfəət", value: fmtMoney(data.totalProfit), color: "bg-ink" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-inksoft text-sm mb-6">Bestofset mətbəəsinin ümumi vəziyyəti</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-[11px] uppercase tracking-wide text-inksoft mb-2">{s.label}</p>
            <p className="text-xl font-mono font-semibold">{s.value}</p>
            <div className={`w-6 h-1 rounded mt-2 ${s.color}`} />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-base mb-2">Aktiv sifarişlər</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Müştəri</th>
                  <th>Mərhələ</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.activeOrders.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-inksoft py-6">Aktiv sifariş yoxdur</td></tr>
                )}
                {data.activeOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono">{o.number}</td>
                    <td>{o.customer?.name}</td>
                    <td>{PRODUCTION_STATUS_LABELS[o.productionStatus]}</td>
                    <td>{ORDER_STATUS_LABELS[o.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Son fakturalar</h2>
          <div className="table-wrap mb-6">
            <table>
              <thead>
                <tr><th>№</th><th>Müştəri</th><th>Son Cəm</th></tr>
              </thead>
              <tbody>
                {data.recentInvoices.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-inksoft py-6">Faktura yoxdur</td></tr>
                )}
                {data.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-mono">{inv.number}</td>
                    <td>{inv.customer?.name}</td>
                    <td className="font-mono">{fmtMoney(inv.finalTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-semibold text-base mb-2">Son ödənişlər</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Tarix</th><th>Müştəri</th><th>Məbləğ</th></tr>
              </thead>
              <tbody>
                {data.recentPayments.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-inksoft py-6">Ödəniş yoxdur</td></tr>
                )}
                {data.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-inksoft">{fmtDate(p.date)}</td>
                    <td>{p.customer?.name}</td>
                    <td className="font-mono">{fmtMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
