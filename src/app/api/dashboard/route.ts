import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/calc";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeOrderCount,
    deliveredOrderCount,
    invoices,
    todayInvoices,
    monthInvoices,
    debts,
    costs,
    activeOrders,
    recentInvoices,
    recentPayments,
  ] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["GOZLEYIR", "ISDEDIR"] } } }),
    prisma.order.count({ where: { status: "TEHVIL_VERILDI" } }),
    prisma.invoice.findMany({
      where: { status: "AKTIV" },
      select: { finalTotal: true, eqaimePaymentStatus: true, payments: { select: { amount: true } } },
    }),
    prisma.invoice.findMany({
      where: { status: "AKTIV", deliveryDate: { gte: startOfDay } },
      select: { finalTotal: true },
    }),
    prisma.invoice.findMany({
      where: { status: "AKTIV", deliveryDate: { gte: startOfMonth } },
      select: { finalTotal: true },
    }),
    prisma.debt.findMany({ where: { status: "ACIQ" } }),
    prisma.costItem.findMany({
      select: { orderId: true, amount: true, order: { select: { finalTotal: true } } },
    }),
    prisma.order.findMany({
      where: { status: { in: ["GOZLEYIR", "ISDEDIR"] } },
      include: { customer: { select: { name: true } } },
      orderBy: { orderDate: "desc" },
      take: 10,
    }),
    prisma.invoice.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.payment.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 8,
    }),
  ]);

  const totalSales = invoices.reduce((s, i) => s + i.finalTotal, 0);
  const todaySales = todayInvoices.reduce((s, i) => s + i.finalTotal, 0);
  const monthSales = monthInvoices.reduce((s, i) => s + i.finalTotal, 0);

  let unpaidAmount = 0;
  let partiallyPaidCount = 0;
  invoices.forEach((inv) => {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    if (inv.eqaimePaymentStatus === "QISMEN_ODENILIB") partiallyPaidCount++;
    if (inv.eqaimePaymentStatus !== "ODENILIB") unpaidAmount += inv.finalTotal - paid;
  });

  const customerDebts = debts
    .filter((d) => d.type === "BIZE_OLAN")
    .reduce((s, d) => s + d.remaining, 0);

  // Xərc sətirlərini sifariş üzrə qruplaşdır: hər sifarişin satışı (Son Cəm)
  // bir dəfə, maya dəyəri isə həmin sifarişin bütün sətirlərinin cəmidir.
  const perOrder = new Map<string, { cost: number; sale: number }>();
  for (const c of costs) {
    const e = perOrder.get(c.orderId) || { cost: 0, sale: c.order.finalTotal };
    e.cost += c.amount;
    perOrder.set(c.orderId, e);
  }
  let totalCost = 0;
  let totalProfit = 0;
  for (const { cost, sale } of perOrder.values()) {
    totalCost += cost;
    totalProfit += sale - cost;
  }

  return NextResponse.json({
    activeOrderCount,
    deliveredOrderCount,
    totalSales: round2(totalSales),
    todaySales: round2(todaySales),
    monthSales: round2(monthSales),
    unpaidAmount: round2(unpaidAmount),
    partiallyPaidCount,
    customerDebts: round2(customerDebts),
    totalCost: round2(totalCost),
    totalProfit: round2(totalProfit),
    activeOrders,
    recentInvoices,
    recentPayments,
  });
}
