import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      purchases: { select: { total: true } },
      _count: { select: { purchases: true } },
    },
  });

  const result = suppliers.map((s) => {
    const totalPurchase = s.purchases.reduce((sum, p) => sum + p.total, 0);
    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      taxId: s.taxId,
      address: s.address,
      note: s.note,
      purchaseCount: s._count.purchases,
      totalPurchase: Math.round(totalPurchase * 100) / 100,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "Ad tələb olunur" }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      taxId: body.taxId || null,
      address: body.address || null,
      note: body.note || null,
    },
  });

  return NextResponse.json(supplier, { status: 201 });
}
