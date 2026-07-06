import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Kateqoriya boşdursa avtomatik yaranan başlanğıc dəyərlər. */
const DEFAULTS: Record<string, string[]> = {
  POSITION: ["Menecer", "Dizayner", "Çapçı", "Anbar işçisi"],
  PAYMENT_METHOD: ["Nağd", "Kart", "Bank köçürməsi"],
  UNIT: ["ədəd", "vərəq", "m", "m2", "kq", "litr", "rulon"],
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const includeInactive = searchParams.get("all") === "1";
  if (!category) return NextResponse.json({ error: "category tələb olunur" }, { status: 400 });

  const existingCount = await prisma.settingOption.count({ where: { category } });
  if (existingCount === 0 && DEFAULTS[category]) {
    await prisma.settingOption.createMany({
      data: DEFAULTS[category].map((value, i) => ({ category, value, sortOrder: i })),
      skipDuplicates: true,
    });
  }

  const options = await prisma.settingOption.findMany({
    where: { category, ...(includeInactive ? {} : { active: true }) },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.category || !body.value) {
    return NextResponse.json({ error: "category və value tələb olunur" }, { status: 400 });
  }

  const last = await prisma.settingOption.findFirst({
    where: { category: body.category },
    orderBy: { sortOrder: "desc" },
  });

  try {
    const option = await prisma.settingOption.create({
      data: {
        category: body.category,
        value: body.value,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json(option, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Bu dəyər artıq mövcuddur" }, { status: 400 });
    }
    throw e;
  }
}
