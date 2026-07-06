import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcSalary, calcPaymentStatus } from "@/lib/calc";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const salaries = await prisma.salary.findMany({
    where: { ...(month ? { month } : {}) },
    orderBy: [{ month: "desc" }, { employeeName: "asc" }],
  });
  return NextResponse.json(salaries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.employeeName || !body.baseSalary || !body.month) {
    return NextResponse.json({ error: "İşçi adı, maaş və ay tələb olunur" }, { status: 400 });
  }
  const baseSalary = parseFloat(body.baseSalary);
  const bonus = parseFloat(body.bonus || 0);
  const paid = parseFloat(body.paid || 0);
  const { total, remaining } = calcSalary(baseSalary, bonus, paid);
  const status = calcPaymentStatus(total, paid);

  const salary = await prisma.salary.create({
    data: {
      employeeName: body.employeeName,
      baseSalary,
      bonus,
      total,
      paid,
      remaining,
      month: body.month,
      status,
    },
  });

  return NextResponse.json(salary, { status: 201 });
}
