import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcInventoryBalance } from "@/lib/calc";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const existing = await prisma.inventoryItem.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });

  const body = await req.json();
  const incoming = body.incoming !== undefined ? parseFloat(body.incoming) : existing.incoming;
  const outgoing = body.outgoing !== undefined ? parseFloat(body.outgoing) : existing.outgoing;

  const item = await prisma.inventoryItem.update({
    where: { id: params.id },
    data: {
      name: body.name ?? existing.name,
      unit: body.unit ?? existing.unit,
      category: body.category !== undefined ? body.category || null : existing.category,
      size: body.size !== undefined ? body.size || null : existing.size,
      grammage:
        body.grammage !== undefined
          ? body.grammage === "" ? null : parseFloat(body.grammage)
          : existing.grammage,
      minThreshold: body.minThreshold !== undefined ? parseFloat(body.minThreshold) : existing.minThreshold,
      incoming,
      outgoing,
      balance: calcInventoryBalance(incoming, outgoing),
      purchasePrice: body.purchasePrice !== undefined ? parseFloat(body.purchasePrice) : existing.purchasePrice,
      note: body.note ?? existing.note,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  await prisma.inventoryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
