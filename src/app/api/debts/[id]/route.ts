import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcDebtRemaining } from "@/lib/calc";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const existing = await prisma.debt.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });

  const body = await req.json();
  const amount = body.amount !== undefined ? parseFloat(body.amount) : existing.amount;
  const paid = body.paid !== undefined ? parseFloat(body.paid) : existing.paid;
  const remaining = calcDebtRemaining(amount, paid);

  const debt = await prisma.debt.update({
    where: { id: params.id },
    data: {
      party: body.party ?? existing.party,
      type: body.type ?? existing.type,
      amount,
      paid,
      remaining,
      status: remaining <= 0 ? "QAPANIB" : "ACIQ",
      note: body.note ?? existing.note,
    },
  });

  return NextResponse.json(debt);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  await prisma.debt.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
