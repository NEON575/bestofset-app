import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcSalary, calcPaymentStatus } from "@/lib/calc";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const existing = await prisma.salary.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });

  const body = await req.json();
  const baseSalary = body.baseSalary !== undefined ? parseFloat(body.baseSalary) : existing.baseSalary;
  const bonus = body.bonus !== undefined ? parseFloat(body.bonus) : existing.bonus;
  const paid = body.paid !== undefined ? parseFloat(body.paid) : existing.paid;
  const { total, remaining } = calcSalary(baseSalary, bonus, paid);
  const status = calcPaymentStatus(total, paid);

  const salary = await prisma.salary.update({
    where: { id: params.id },
    data: {
      employeeName: body.employeeName ?? existing.employeeName,
      baseSalary,
      bonus,
      total,
      paid,
      remaining,
      month: body.month ?? existing.month,
      status,
    },
  });

  return NextResponse.json(salary);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  await prisma.salary.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
