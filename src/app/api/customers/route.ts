import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      invoices: { where: { status: "AKTIV" }, select: { finalTotal: true } },
      payments: { select: { amount: true } },
      _count: { select: { orders: true } },
    },
  });

  const result = customers.map((c) => {
    const totalSales = c.invoices.reduce((s, i) => s + i.finalTotal, 0);
    const totalPaid = c.payments.reduce((s, p) => s + p.amount, 0);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      note: c.note,
      orderCount: c._count.orders,
      totalSales: Math.round(totalSales * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      debt: Math.round((totalSales - totalPaid) * 100) / 100,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "Ad tələb olunur" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: { name: body.name, phone: body.phone || null, note: body.note || null },
  });

  return NextResponse.json(customer, { status: 201 });
}
