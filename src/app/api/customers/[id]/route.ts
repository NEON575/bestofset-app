import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: { name: body.name, phone: body.phone || null, note: body.note || null },
  });
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }

  const orderCount = await prisma.order.count({ where: { customerId: params.id } });
  if (orderCount > 0) {
    return NextResponse.json(
      { error: "Bu müştərinin sifarişləri var, əvvəlcə onları silin" },
      { status: 400 }
    );
  }

  await prisma.customer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
