import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; costId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const item = await prisma.costItem.findUnique({ where: { id: params.costId } });
  if (!item || item.orderId !== params.id) {
    return NextResponse.json({ error: "Xərc sətri tapılmadı" }, { status: 404 });
  }

  await prisma.costItem.delete({ where: { id: params.costId } });
  return NextResponse.json({ ok: true });
}
