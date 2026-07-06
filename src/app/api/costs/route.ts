import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { round2, calcProfit } from "@/lib/calc";

/**
 * Maya dəyəri artıq sifariş-səviyyəli sərbəst xərc sətirləri (CostItem) ilə
 * idarə olunur. Bu endpoint yalnız oxunaqlı xülasə qaytarır: ən azı bir
 * xərc sətri olan hər sifariş üçün ümumi maya, satış (Son Cəm), mənfəət
 * və marja. Xərclər sifariş detal səhifəsində əlavə/silinir.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { costItems: { some: {} } },
    include: {
      customer: { select: { name: true } },
      costItems: { select: { amount: true } },
    },
    orderBy: { orderDate: "desc" },
  });

  const result = orders.map((o) => {
    const totalCost = round2(o.costItems.reduce((s, c) => s + c.amount, 0));
    const saleAmount = o.finalTotal;
    const profit = calcProfit(saleAmount, totalCost);
    const margin = saleAmount > 0 ? round2((profit / saleAmount) * 100) : 0;
    return {
      orderId: o.id,
      number: o.number,
      customerName: o.customer?.name || "—",
      productName: o.productName,
      totalCost,
      saleAmount,
      profit,
      margin,
    };
  });

  return NextResponse.json(result);
}
