import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }

  const body = await req.json();
  const data: any = {};
  if (body.value !== undefined) data.value = body.value;
  if (body.active !== undefined) data.active = body.active;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;

  try {
    const option = await prisma.settingOption.update({ where: { id: params.id }, data });
    return NextResponse.json(option);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Bu dəyər artıq mövcuddur" }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }

  await prisma.settingOption.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
