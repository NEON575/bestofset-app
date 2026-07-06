import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcInventoryBalance, round2 } from "@/lib/calc";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const purchases = await prisma.purchase.findMany({
    include: { item: { select: { name: true, unit: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(purchases);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.itemId || !body.quantity || !body.price) {
    return NextResponse.json({ error: "Material, say və qiymət tələb olunur" }, { status: 400 });
  }
  const quantity = parseFloat(body.quantity);
  const price = parseFloat(body.price);
  const total = round2(quantity * price);

  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        supplier: body.supplier || "—",
        itemId: body.itemId,
        quantity,
        price,
        total,
        paymentStatus: body.paymentStatus || "ODENILMEYIB",
        note: body.note || null,
        date: body.date ? new Date(body.date) : new Date(),
      },
    });

    const item = await tx.inventoryItem.findUnique({ where: { id: body.itemId } });
    if (item) {
      const newIncoming = round2(item.incoming + quantity);
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          incoming: newIncoming,
          balance: calcInventoryBalance(newIncoming, item.outgoing),
          purchasePrice: price,
        },
      });
    }

    return purchase;
  });

  return NextResponse.json(result, { status: 201 });
}
