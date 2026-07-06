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
  if (!body.name) return NextResponse.json({ error: "Ad tələb olunur" }, { status: 400 });

  const last = await prisma.productionPart.findFirst({
    where: { orderId: params.id },
    orderBy: { sortOrder: "desc" },
  });

  const part = await prisma.productionPart.create({
    data: {
      orderId: params.id,
      name: body.name,
      material: body.material || null,
      printColor: body.printColor || null,
      printSides: body.printSides || null,
      note: body.note || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(part, { status: 201 });
}
