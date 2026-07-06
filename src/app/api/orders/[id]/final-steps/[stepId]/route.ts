import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertStepTransition, StepStatus } from "@/lib/production";

export async function PUT(req: NextRequest, { params }: { params: { id: string; stepId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const steps = await prisma.productionStep.findMany({ where: { orderId: params.id } });
  const step = steps.find((s) => s.id === params.stepId);
  if (!step) return NextResponse.json({ error: "Mərhələ tapılmadı" }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (body.note !== undefined) data.note = body.note || null;

  if (body.status !== undefined) {
    try {
      assertStepTransition(steps, params.stepId, body.status as StepStatus);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    data.status = body.status;
    data.completedAt = body.status === "BITIB" ? new Date() : null;
  }

  const updated = await prisma.productionStep.update({ where: { id: params.stepId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; stepId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const step = await prisma.productionStep.findUnique({ where: { id: params.stepId } });
  if (!step || step.orderId !== params.id) {
    return NextResponse.json({ error: "Mərhələ tapılmadı" }, { status: 404 });
  }

  await prisma.productionStep.delete({ where: { id: params.stepId } });
  return NextResponse.json({ ok: true });
}
