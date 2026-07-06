"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fmtMoney, fmtDate, ORDER_STATUS_LABELS, PRODUCTION_STATUS_LABELS } from "@/lib/format";
import AnimatedCounter from "@/components/AnimatedCounter";

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
    { label: "Ümumi satış", value: data.totalSales, color: "bg-teal", money: true },
    { label: "Bugünkü satış", value: data.todaySales, color: "bg-cyan", money: true },
    { label: "Aylıq satış", value: data.monthSales, color: "bg-teal", money: true },
    { label: "Ödənilməmiş faktura", value: data.unpaidAmount, color: "bg-magenta", money: true },
    { label: "Qismən ödənilmiş fakturalar", value: data.partiallyPaidCount, color: "bg-yellow" },
    { label: "Müştəri borcları", value: data.customerDebts, color: "bg-magenta", money: true },
    { label: "Ümumi maya dəyəri", value: data.totalCost, color: "bg-inksoft", money: true },
    { label: "Təxmini mənfəət", value: data.totalProfit, color: "bg-ink", money: true },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-inksoft text-sm mb-6">Bestofset mətbəəsinin ümumi vəziyyəti</p>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="card card-hover p-4"
          >
            <p className="text-[11px] uppercase tracking-wide text-inksoft mb-2">{s.label}</p>
            <p className="text-xl font-mono font-semibold">
              <AnimatedCounter value={s.value} duration={1} format={s.money ? fmtMoney : undefined} />
            </p>
            <div className={`w-6 h-1 rounded mt-2 ${s.color}`} />
          </motion.div>
        ))}
      </motion.div>

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
