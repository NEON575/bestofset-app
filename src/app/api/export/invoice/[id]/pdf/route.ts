import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { customer: true },
  });
  if (!invoice) return NextResponse.json({ error: "Faktura tapılmadı" }, { status: 404 });

  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 50 });
  doc.on("data", (c) => chunks.push(c));

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(20).text("Bestofset", { align: "left" });
  doc.fontSize(10).fillColor("#666").text("Satış fakturası", { align: "left" });
  doc.moveDown(1.5);

  doc.fillColor("#000").fontSize(13).text(`Faktura №: ${invoice.number}`);
  doc.fontSize(10).fillColor("#333");
  doc.text(`Sifariş tarixi: ${invoice.orderDate.toISOString().slice(0, 10)}`);
  doc.text(
    `Təhvil tarixi: ${invoice.deliveryDate ? invoice.deliveryDate.toISOString().slice(0, 10) : "-"}`
  );
  doc.text(`Müştəri: ${invoice.customer.name}`);
  if (invoice.customer.phone) doc.text(`Telefon: ${invoice.customer.phone}`);
  doc.moveDown();

  doc.fontSize(11).fillColor("#000").text("Məhsul: " + invoice.productName);
  doc.fontSize(10).fillColor("#333");
  doc.text(`Say: ${invoice.quantity}`);
  doc.text(`Ədəd qiyməti: ${invoice.unitPrice.toFixed(2)} ₼`);
  doc.text(`Cəmi: ${invoice.total.toFixed(2)} ₼`);
  if (invoice.bonusAmount) doc.text(`Bonus (${invoice.bonusPercent}%): -${invoice.bonusAmount.toFixed(2)} ₼`);
  if (invoice.bonus2Amount)
    doc.text(`2-ci Bonus (${invoice.bonus2Percent}%): -${invoice.bonus2Amount.toFixed(2)} ₼`);
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor("#000").text(`Son Cəm: ${invoice.finalTotal.toFixed(2)} ₼`);

  if (invoice.note) {
    doc.moveDown();
    doc.fontSize(10).fillColor("#333").text(`Qeyd: ${invoice.note}`);
  }

  doc.end();
  const pdfBuffer = await done;

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="faktura-${invoice.number}.pdf"`,
    },
  });
}
