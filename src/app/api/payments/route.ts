import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcInvoicePaymentStatus } from "@/lib/calc";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const payments = await prisma.payment.findMany({
    where: { ...(customerId ? { customerId } : {}) },
    include: { customer: { select: { name: true } }, invoice: { select: { number: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.customerId || !body.amount) {
    return NextResponse.json({ error: "Müştəri və məbləğ tələb olunur" }, { status: 400 });
  }
  const amount = parseFloat(body.amount);
  if (amount <= 0) {
    return NextResponse.json({ error: "Məbləğ 0-dan böyük olmalıdır" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      customerId: body.customerId,
      invoiceId: body.invoiceId || null,
      amount,
      method: body.method || "Nağd",
      note: body.note || null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  // Əgər ödəniş konkret fakturaya bağlıdırsa, fakturanın ödəniş statusunu yenilə
  if (body.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      include: { payments: { select: { amount: true } } },
    });
    if (invoice) {
      const paidSum = invoice.payments.reduce((s, p) => s + p.amount, 0);
      const newStatus = calcInvoicePaymentStatus(invoice.finalTotal, paidSum);
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { eqaimePaymentStatus: newStatus },
      });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}
