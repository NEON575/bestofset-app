import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  const [orders, salaries] = await Promise.all([
    prisma.order.findMany({ select: { managerName: true, manager2Name: true } }),
    prisma.salary.findMany({ select: { employeeName: true } }),
  ]);

  const usedNames = new Set<string>();
  for (const o of orders) {
    if (o.managerName) usedNames.add(o.managerName);
    if (o.manager2Name) usedNames.add(o.manager2Name);
  }
  for (const s of salaries) usedNames.add(s.employeeName);

  const result = employees.map((e) => ({ ...e, inUse: usedNames.has(e.name) }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "Ad tələb olunur" }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: { name: body.name, position: body.position || null },
  });

  return NextResponse.json(employee, { status: 201 });
}
