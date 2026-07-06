import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Fakturada YALNIZ e-qaimə sahələri, ödəniş statusu və qeyd redaktə edilə bilər.
 * Sifarişdən köçürülən əsas maliyyə sahələri (məhsul, say, qiymət, bonuslar,
 * Son Cəm) bu endpoint vasitəsilə DƏYİŞDİRİLƏ BİLMƏZ — onlar faktura
 * yaranan anda sabitlənir.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  const data: any = {};
  if (body.note !== undefined) data.note = body.note;
  if (body.eqaimeStatus !== undefined) data.eqaimeStatus = body.eqaimeStatus;
  if (body.eqaimeNumber !== undefined) data.eqaimeNumber = body.eqaimeNumber;
  if (body.eqaimeDate !== undefined) data.eqaimeDate = body.eqaimeDate ? new Date(body.eqaimeDate) : null;
  if (body.eqaimePaymentStatus !== undefined) data.eqaimePaymentStatus = body.eqaimePaymentStatus;

  const invoice = await prisma.invoice.update({ where: { id: params.id }, data });
  return NextResponse.json(invoice);
}
