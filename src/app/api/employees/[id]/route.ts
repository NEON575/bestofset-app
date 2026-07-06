import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.position !== undefined) data.position = body.position || null;
  if (body.active !== undefined) data.active = body.active;

  const employee = await prisma.employee.update({ where: { id: params.id }, data });
  return NextResponse.json(employee);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: params.id } });
  if (!employee) return NextResponse.json({ error: "İşçi tapılmadı" }, { status: 404 });

  const [orderCount, salaryCount] = await Promise.all([
    prisma.order.count({
      where: { OR: [{ managerName: employee.name }, { manager2Name: employee.name }] },
    }),
    prisma.salary.count({ where: { employeeName: employee.name } }),
  ]);

  if (orderCount > 0 || salaryCount > 0) {
    return NextResponse.json(
      { error: "Bu işçi sifariş və ya əmək haqqı qeydlərində istifadə olunub, silinə bilməz — deaktiv edin" },
      { status: 400 }
    );
  }

  await prisma.employee.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
