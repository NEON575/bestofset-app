import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcTotalCost, calcProfit } from "@/lib/calc";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const costs = await prisma.cost.findMany({
    include: { order: { select: { number: true, productName: true, finalTotal: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(costs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.orderId) return NextResponse.json({ error: "orderId tələb olunur" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order) return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  const parts = {
    paperCost: parseFloat(body.paperCost || 0),
    printCost: parseFloat(body.printCost || 0),
    laminationCost: parseFloat(body.laminationCost || 0),
    cuttingCost: parseFloat(body.cuttingCost || 0),
    otherCost: parseFloat(body.otherCost || 0),
  };
  const totalCost = calcTotalCost(parts);
  const saleAmount = order.finalTotal;
  const profit = calcProfit(saleAmount, totalCost);

  const cost = await prisma.cost.upsert({
    where: { orderId: body.orderId },
    update: { ...parts, totalCost, saleAmount, profit },
    create: { orderId: body.orderId, ...parts, totalCost, saleAmount, profit },
  });

  return NextResponse.json(cost, { status: 201 });
}
