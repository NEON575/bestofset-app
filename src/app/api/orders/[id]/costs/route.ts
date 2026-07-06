import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/calc";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  const body = await req.json();
  const amount = parseFloat(body.amount);
  if (!body.category || isNaN(amount)) {
    return NextResponse.json({ error: "Xərc növü və məbləğ tələb olunur" }, { status: 400 });
  }

  const item = await prisma.costItem.create({
    data: {
      orderId: params.id,
      category: body.category,
      amount: round2(amount),
      note: body.note || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
