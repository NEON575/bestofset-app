import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Mərhələnin adı tələb olunur" }, { status: 400 });

  const last = await prisma.productionStep.findFirst({
    where: { orderId: params.id },
    orderBy: { sequence: "desc" },
  });

  const step = await prisma.productionStep.create({
    data: {
      orderId: params.id,
      name: body.name,
      sequence: (last?.sequence ?? 0) + 1,
      note: body.note || null,
    },
  });

  return NextResponse.json(step, { status: 201 });
}
