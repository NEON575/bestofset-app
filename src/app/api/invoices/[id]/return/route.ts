import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * "Sifarişə qaytar" düyməsi:
 * - Faktura SİLİNMİR, statusu "QAYTARILDI" olur
 * - Sifariş statusu "İşdədir" olur və yenidən aktiv sifarişlər siyahısında görünür
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Faktura tapılmadı" }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    const updatedInvoice = await tx.invoice.update({
      where: { id: params.id },
      data: { status: "QAYTARILDI" },
    });
    const updatedOrder = await tx.order.update({
      where: { id: invoice.orderId },
      data: { status: "ISDEDIR", deliveryDate: null },
    });
    return { invoice: updatedInvoice, order: updatedOrder };
  });

  return NextResponse.json(result);
}
