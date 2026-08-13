import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcInventoryBalance, round2 } from "@/lib/calc";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; usageId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const usage = await prisma.materialUsage.findUnique({ where: { id: params.usageId } });
  if (!usage || usage.orderId !== params.id) {
    return NextResponse.json({ error: "İstifadə tapılmadı" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.materialUsage.delete({ where: { id: params.usageId } });
    const item = await tx.inventoryItem.findUnique({ where: { id: usage.itemId } });
    if (item) {
      // Silinəndə çıxış geri qaytarılır (mənfi olmasın deyə 0-da saxlanılır).
      const newOutgoing = round2(Math.max(0, item.outgoing - usage.quantity));
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { outgoing: newOutgoing, balance: calcInventoryBalance(item.incoming, newOutgoing) },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
