import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcDebtRemaining } from "@/lib/calc";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const debts = await prisma.debt.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(debts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.party || !body.type || !body.amount) {
    return NextResponse.json({ error: "Tərəf, borc tipi və məbləğ tələb olunur" }, { status: 400 });
  }
  const amount = parseFloat(body.amount);
  const paid = parseFloat(body.paid || 0);
  const remaining = calcDebtRemaining(amount, paid);

  const debt = await prisma.debt.create({
    data: {
      party: body.party,
      type: body.type,
      amount,
      paid,
      remaining,
      status: remaining <= 0 ? "QAPANIB" : "ACIQ",
      note: body.note || null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  return NextResponse.json(debt, { status: 201 });
}
