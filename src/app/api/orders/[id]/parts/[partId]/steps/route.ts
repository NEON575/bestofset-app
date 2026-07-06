import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string; partId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const part = await prisma.productionPart.findUnique({ where: { id: params.partId } });
  if (!part || part.orderId !== params.id) {
    return NextResponse.json({ error: "İş hissəsi tapılmadı" }, { status: 404 });
  }

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Addımın adı tələb olunur" }, { status: 400 });

  const last = await prisma.productionStep.findFirst({
    where: { partId: params.partId },
    orderBy: { sequence: "desc" },
  });

  const step = await prisma.productionStep.create({
    data: {
      partId: params.partId,
      name: body.name,
      sequence: (last?.sequence ?? 0) + 1,
      note: body.note || null,
    },
  });

  return NextResponse.json(step, { status: 201 });
}
