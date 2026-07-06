import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcOrderAmounts, nextOrderNumber } from "@/lib/calc";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(customerId ? { customerId } : {}),
      ...(from || to
        ? {
            orderDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { customer: { select: { name: true } } },
    orderBy: { orderDate: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  const required = ["customerId", "productName", "quantity", "unitPrice"];
  for (const f of required) {
    if (body[f] === undefined || body[f] === null || body[f] === "") {
      return NextResponse.json({ error: `${f} tələb olunur` }, { status: 400 });
    }
  }

  const amounts = calcOrderAmounts({
    quantity: parseFloat(body.quantity),
    unitPrice: parseFloat(body.unitPrice),
    bonusPercent: parseFloat(body.bonusPercent || 0),
    bonus2Percent: parseFloat(body.bonus2Percent || 0),
  });

  const last = await prisma.order.findFirst({ orderBy: { createdAt: "desc" } });
  const number = nextOrderNumber(last?.number || null);

  const order = await prisma.order.create({
    data: {
      number,
      orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
      customerId: body.customerId,
      productName: body.productName,
      quantity: parseFloat(body.quantity),
      unitPrice: parseFloat(body.unitPrice),
      total: amounts.total,
      managerName: body.managerName || null,
      bonusPercent: parseFloat(body.bonusPercent || 0),
      bonusAmount: amounts.bonusAmount,
      manager2Name: body.manager2Name || null,
      bonus2Percent: parseFloat(body.bonus2Percent || 0),
      bonus2Amount: amounts.bonus2Amount,
      finalTotal: amounts.finalTotal,
      productionStatus: body.productionStatus || "DIZAYN",
      status: body.status || "GOZLEYIR",
    },
  });

  return NextResponse.json(order, { status: 201 });
}
