"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { fmtMoney } from "@/lib/format";

interface CostRow {
  orderId: string;
  number: string;
  customerName: string;
  productName: string;
  totalCost: number;
  saleAmount: number;
  profit: number;
  margin: number;
}

export default function CostsPage() {
  const [rows, setRows] = useState<CostRow[]>([]);

  async function load() {
    const res = await fetch("/api/costs");
    setRows(await res.json());
  }
  useEffect(() => { load(); }, []);

  const totalSale = rows.reduce((s, r) => s + r.saleAmount, 0);
  const totalCostSum = rows.reduce((s, r) => s + r.totalCost, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Maya Dəyəri</h1>
          <p className="text-inksoft text-sm">
            Satış: {fmtMoney(totalSale)} · Maya dəyəri: {fmtMoney(totalCostSum)} · Mənfəət: {fmtMoney(totalSale - totalCostSum)}
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sifariş №</th><th>Müştəri</th><th>Məhsul</th>
              <th>Ümumi maya</th><th>Satış</th><th>Mənfəət</th><th>Marja %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center text-inksoft py-8">Hələ xərc əlavə edilmiş sifariş yoxdur</td></tr>
            )}
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.tr
                  key={r.orderId}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="font-mono">
                    <Link href={`/orders/${r.orderId}`} className="text-accent hover:underline">{r.number}</Link>
                  </td>
                  <td>{r.customerName}</td>
                  <td>{r.productName}</td>
                  <td className="font-mono">{fmtMoney(r.totalCost)}</td>
                  <td className="font-mono">{fmtMoney(r.saleAmount)}</td>
                  <td className={`font-mono font-semibold ${r.profit >= 0 ? "text-teal" : "text-magenta"}`}>{fmtMoney(r.profit)}</td>
                  <td className={`font-mono ${r.profit >= 0 ? "text-teal" : "text-magenta"}`}>{r.margin}%</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
