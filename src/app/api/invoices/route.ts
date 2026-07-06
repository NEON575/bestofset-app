import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(customerId ? { customerId } : {}),
      ...(from || to
        ? {
            deliveryDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      customer: { select: { name: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = invoices.map((inv) => {
    const paidSum = inv.payments.reduce((s, p) => s + p.amount, 0);
    return { ...inv, paidSum: Math.round(paidSum * 100) / 100 };
  });

  return NextResponse.json(result);
}
