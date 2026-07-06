import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcInventoryBalance } from "@/lib/calc";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.unit) {
    return NextResponse.json({ error: "Ad və ölçü vahidi tələb olunur" }, { status: 400 });
  }
  const incoming = parseFloat(body.incoming || 0);
  const outgoing = parseFloat(body.outgoing || 0);

  const item = await prisma.inventoryItem.create({
    data: {
      name: body.name,
      unit: body.unit,
      incoming,
      outgoing,
      balance: calcInventoryBalance(incoming, outgoing),
      purchasePrice: parseFloat(body.purchasePrice || 0),
      note: body.note || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
