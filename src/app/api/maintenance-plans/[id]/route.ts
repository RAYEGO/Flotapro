import { z } from "zod";
import { NextRequest } from "next/server";

import {
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const updatePlanSchema = z.object({
  truckId: z.string().min(1).optional(),
  tipo: z.string().min(2).max(120).optional(),
  cadaKm: z.number().int().min(100).max(1_000_000).optional(),
  ultimoServicioKm: z.number().int().min(0).max(10_000_000).optional(),
  activo: z.boolean().optional(),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const plan = await prisma.maintenancePlan.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      include: { truck: true },
    });
    if (!plan) return jsonNotFound();
    return jsonOk({ plan });
  } catch {
    return jsonServerError();
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = updatePlanSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const existing = await prisma.maintenancePlan.findFirst({
      where: { id: ctx.params.id, companyId },
    });
    if (!existing) return jsonNotFound();

    const nextTruckId = parsed.data.truckId ?? existing.truckId;
    const truck = await prisma.truck.findFirst({
      where: { id: nextTruckId, companyId },
      select: { id: true },
    });
    if (!truck) return jsonBadRequest("Camión inválido");

    const nextCadaKm = parsed.data.cadaKm ?? existing.cadaKm;
    const nextUltimo = parsed.data.ultimoServicioKm ?? existing.ultimoServicioKm;
    const proximoKm = nextUltimo + nextCadaKm;

    const plan = await prisma.maintenancePlan.update({
      where: { id: existing.id },
      data: { ...parsed.data, truckId: nextTruckId, proximoKm },
    });

    return jsonOk({ plan });
  } catch {
    return jsonServerError();
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.maintenancePlan.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.maintenancePlan.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonServerError();
  }
}
