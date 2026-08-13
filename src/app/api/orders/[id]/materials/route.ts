import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcInventoryBalance, round2 } from "@/lib/calc";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  const body = await req.json();
  const quantity = parseFloat(body.quantity);
  if (!body.itemId || isNaN(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "Material və miqdar tələb olunur" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({ where: { id: body.itemId } });
    if (!item) return { error: "Material tapılmadı" as const };

    // Qalıqdan çox istifadə əməliyyatı bloklamır, sadəcə xəbərdarlıq qaytarır.
    const warning =
      quantity > item.balance
        ? `Anbarda qalıq (${item.balance} ${item.unit}) bu istifadə (${quantity} ${item.unit}) üçün kifayət etmir — qalıq mənfi olacaq.`
        : null;

    const usage = await tx.materialUsage.create({
      data: { orderId: params.id, itemId: body.itemId, quantity, note: body.note || null },
    });

    const newOutgoing = round2(item.outgoing + quantity);
    await tx.inventoryItem.update({
      where: { id: item.id },
      data: { outgoing: newOutgoing, balance: calcInventoryBalance(item.incoming, newOutgoing) },
    });

    return { usage, warning };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result, { status: 201 });
}
