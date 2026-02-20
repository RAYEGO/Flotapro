import { z } from "zod";
import { NextRequest } from "next/server";

import {
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const createPlanSchema = z.object({
  truckId: z.string().min(1),
  tipo: z.string().min(2).max(120),
  cadaKm: z.number().int().min(100).max(1_000_000),
  ultimoServicioKm: z.number().int().min(0).max(10_000_000),
  activo: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const plans = await prisma.maintenancePlan.findMany({
      where: { companyId: auth.session.companyId },
      include: { truck: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ plans });
  } catch {
    return jsonServerError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = createPlanSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const truck = await prisma.truck.findFirst({
      where: { id: parsed.data.truckId, companyId },
      select: { id: true },
    });
    if (!truck) return jsonBadRequest("Camión inválido");

    const proximoKm = parsed.data.ultimoServicioKm + parsed.data.cadaKm;

    const plan = await prisma.maintenancePlan.create({
      data: {
        companyId,
        truckId: parsed.data.truckId,
        tipo: parsed.data.tipo,
        cadaKm: parsed.data.cadaKm,
        ultimoServicioKm: parsed.data.ultimoServicioKm,
        proximoKm,
        activo: parsed.data.activo,
      },
    });

    return jsonCreated({ plan });
  } catch {
    return jsonServerError();
  }
}
