import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Sifariş "Təhvil verildi" statusuna keçəndə:
 * 1. Təhvil tarixi avtomatik yazılır
 * 2. Satış fakturası avtomatik yaranır (əgər artıq yoxdursa)
 * 3. Eyni sifariş üçün ikinci faktura YARANMIR (unique orderId + yoxlama ilə qorunur)
 * 4. Faktura sahələri sifarişdən köçürülür və bundan sonra sabit qalır
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { invoice: true },
  });
  if (!order) return NextResponse.json({ error: "Sifariş tapılmadı" }, { status: 404 });

  if (order.status === "LEGV_EDILDI") {
    return NextResponse.json({ error: "Ləğv edilmiş sifariş təhvil verilə bilməz" }, { status: 400 });
  }

  const deliveryDate = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "TEHVIL_VERILDI", deliveryDate },
    });

    // Əgər faktura artıq varsa (məsələn əvvəllər qaytarılıb yenidən təhvil verilirsə),
    // yenisini yaratmırıq — mövcud olanı aktivləşdiririk.
    if (order.invoice) {
      const invoice = await tx.invoice.update({
        where: { id: order.invoice.id },
        data: { status: "AKTIV", deliveryDate },
      });
      return { order: updatedOrder, invoice };
    }

    const invoice = await tx.invoice.create({
      data: {
        number: order.number,
        orderId: order.id,
        orderDate: order.orderDate,
        deliveryDate,
        customerId: order.customerId,
        productName: order.productName,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        total: order.total,
        managerName: order.managerName,
        bonusPercent: order.bonusPercent,
        bonusAmount: order.bonusAmount,
        manager2Name: order.manager2Name,
        bonus2Percent: order.bonus2Percent,
        bonus2Amount: order.bonus2Amount,
        finalTotal: order.finalTotal,
        status: "AKTIV",
      },
    });

    return { order: updatedOrder, invoice };
  });

  return NextResponse.json(result);
}
