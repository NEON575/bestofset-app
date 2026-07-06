import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const orders = await prisma.order.findMany({
    include: { customer: { select: { name: true } } },
    orderBy: { orderDate: "desc" },
  });

  const rows = orders.map((o) => ({
    "Sifariş №": o.number,
    "Sifariş tarixi": o.orderDate.toISOString().slice(0, 10),
    "Müştəri": o.customer.name,
    "Məhsulun adı": o.productName,
    "Say": o.quantity,
    "Ədəd qiyməti": o.unitPrice,
    "Cəmi": o.total,
    "Menecer": o.managerName || "",
    "Bonus %": o.bonusPercent,
    "Bonus məbləği": o.bonusAmount,
    "2-ci Menecer": o.manager2Name || "",
    "2-ci Bonus %": o.bonus2Percent,
    "2-ci Bonus məbləği": o.bonus2Amount,
    "Son Cəm": o.finalTotal,
    "İstehsal Statusu": o.productionStatus,
    "Status": o.status,
    "Təhvil tarixi": o.deliveryDate ? o.deliveryDate.toISOString().slice(0, 10) : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sifarişlər");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sifarisler.xlsx"`,
    },
  });
}
