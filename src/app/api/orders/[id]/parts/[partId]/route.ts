import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string; partId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const existing = await prisma.productionPart.findUnique({ where: { id: params.partId } });
  if (!existing || existing.orderId !== params.id) {
    return NextResponse.json({ error: "İş hissəsi tapılmadı" }, { status: 404 });
  }

  const body = await req.json();
  const part = await prisma.productionPart.update({
    where: { id: params.partId },
    data: {
      name: body.name ?? existing.name,
      material: body.material !== undefined ? body.material || null : existing.material,
      printColor: body.printColor !== undefined ? body.printColor || null : existing.printColor,
      printSides: body.printSides !== undefined ? body.printSides || null : existing.printSides,
      note: body.note !== undefined ? body.note || null : existing.note,
    },
  });

  return NextResponse.json(part);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; partId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const existing = await prisma.productionPart.findUnique({ where: { id: params.partId } });
  if (!existing || existing.orderId !== params.id) {
    return NextResponse.json({ error: "İş hissəsi tapılmadı" }, { status: 404 });
  }

  await prisma.productionPart.delete({ where: { id: params.partId } });
  return NextResponse.json({ ok: true });
}
