import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcOrderAmounts } from "@/lib/calc";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      invoice: true,
      cost: true,
      parts: { orderBy: { sortOrder: "asc" }, include: { steps: { orderBy: { sequence: "asc" } } } },
      finalSteps: { orderBy: { sequence: "asc" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });

  // Təhvil verilmiş sifarişin əsas maliyyə sahələri dəyişdirilə bilməz —
  // faktura artıq yaranıb və sabit qalmalıdır.
  if (existing.status === "TEHVIL_VERILDI") {
    const allowedWhenDelivered = ["productionStatus"];
    const body = await req.json();
    const updateData: any = {};
    for (const k of Object.keys(body)) {
      if (allowedWhenDelivered.includes(k)) updateData[k] = body[k];
    }
    const order = await prisma.order.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json(order);
  }

  const body = await req.json();
  const quantity = body.quantity !== undefined ? parseFloat(body.quantity) : existing.quantity;
  const unitPrice = body.unitPrice !== undefined ? parseFloat(body.unitPrice) : existing.unitPrice;
  const bonusPercent = body.bonusPercent !== undefined ? parseFloat(body.bonusPercent) : existing.bonusPercent;
  const bonus2Percent = body.bonus2Percent !== undefined ? parseFloat(body.bonus2Percent) : existing.bonus2Percent;
  const amounts = calcOrderAmounts({
    quantity,
    unitPrice,
    bonusPercent,
    bonus2Percent,
    total: body.total !== undefined && body.total !== "" ? parseFloat(body.total) : undefined,
    bonusAmount:
      body.bonusAmount !== undefined && body.bonusAmount !== "" ? parseFloat(body.bonusAmount) : undefined,
    bonus2Amount:
      body.bonus2Amount !== undefined && body.bonus2Amount !== "" ? parseFloat(body.bonus2Amount) : undefined,
  });

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      orderDate: body.orderDate ? new Date(body.orderDate) : existing.orderDate,
      customerId: body.customerId || existing.customerId,
      productName: body.productName ?? existing.productName,
      quantity,
      unitPrice,
      total: amounts.total,
      managerName: body.managerName ?? existing.managerName,
      bonusPercent,
      bonusAmount: amounts.bonusAmount,
      manager2Name: body.manager2Name ?? existing.manager2Name,
      bonus2Percent,
      bonus2Amount: amounts.bonus2Amount,
      finalTotal: amounts.finalTotal,
      productionStatus: body.productionStatus ?? existing.productionStatus,
      status: body.status ?? existing.status,
    },
  });

  return NextResponse.json(order);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { orderId: params.id } });
  if (invoice) {
    const error =
      invoice.status === "AKTIV"
        ? "Bu sifarişin aktiv fakturası var — əvvəlcə \"Fakturalar\" bölməsində \"Sifarişə qaytar\" düyməsi ilə fakturanı ləğv edin."
        : "Bu sifarişin qaytarılmış fakturası var — sifarişi silmək üçün əvvəlcə \"Fakturalar\" bölməsində həmin fakturanı silin.";
    return NextResponse.json({ error }, { status: 400 });
  }

  await prisma.order.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
