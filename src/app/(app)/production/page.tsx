"use client";
import { useEffect, useState } from "react";
import { PRODUCTION_STATUS_LABELS } from "@/lib/format";

interface Order {
  id: string;
  number: string;
  customer: { name: string };
  productName: string;
  quantity: number;
  productionStatus: string;
  status: string;
}

const STAGES = ["DIZAYN", "CAP", "KESIM", "LAMINASIYA", "BITIB"];
const ACTIVE_ORDER_STATUSES = ["GOZLEYIR", "ISDEDIR"];

export default function ProductionPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/orders");
    const data: Order[] = await res.json();
    setOrders(data.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)));
  }

  useEffect(() => { load(); }, []);

  async function advance(o: Order) {
    const idx = STAGES.indexOf(o.productionStatus);
    if (idx === -1 || idx === STAGES.length - 1) return;
    const next = STAGES[idx + 1];
    setBusyId(o.id);
    await fetch(`/api/orders/${o.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productionStatus: next }),
    });
    setBusyId(null);
    load();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">İstehsal</h1>
        <p className="text-inksoft text-sm">{orders.length} aktiv sifariş istehsal xəttində</p>
      </div>

      <div className="grid grid-cols-5 gap-3 items-start">
        {STAGES.map((stage) => {
          const stageOrders = orders.filter((o) => o.productionStatus === stage);
          return (
            <div key={stage} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold">{PRODUCTION_STATUS_LABELS[stage]}</h3>
                <span className="text-xs text-inksoft">{stageOrders.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {stageOrders.length === 0 && (
                  <div className="text-xs text-inksoft text-center py-6 border border-dashed border-line rounded-md">
                    Boşdur
                  </div>
                )}
                {stageOrders.map((o) => (
                  <div key={o.id} className="card p-3">
                    <div className="font-mono text-xs text-inksoft mb-1">{o.number}</div>
                    <div className="font-semibold text-sm mb-1">{o.customer?.name}</div>
                    <div className="text-sm mb-1">{o.productName}</div>
                    <div className="text-xs text-inksoft mb-2">Say: {o.quantity}</div>
                    {stage !== "BITIB" && (
                      <button
                        onClick={() => advance(o)}
                        disabled={busyId === o.id}
                        className="btn-outline !py-1 !px-2 text-xs w-full justify-center"
                      >
                        Növbəti mərhələyə keçir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
