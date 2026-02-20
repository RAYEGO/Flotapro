import { NextRequest } from "next/server";
import { z } from "zod";

import {
  decimal,
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
  jsonServerError,
  serializeMoney,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const updateRecordSchema = z.object({
  truckId: z.string().min(1).optional(),
  fecha: z.string().datetime().optional(),
  tipo: z.string().min(2).max(120).optional(),
  kilometraje: z.number().int().min(0).max(10_000_000).optional(),
  costo: z.coerce.number().nonnegative().optional(),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const record = await prisma.maintenanceRecord.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      include: { truck: true },
    });
    if (!record) return jsonNotFound();
    return jsonOk({ record: { ...record, costo: serializeMoney(record.costo) } });
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
    const parsed = updateRecordSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const existing = await prisma.maintenanceRecord.findFirst({
      where: { id: ctx.params.id, companyId },
    });
    if (!existing) return jsonNotFound();

    const nextTruckId = parsed.data.truckId ?? existing.truckId;
    const truck = await prisma.truck.findFirst({
      where: { id: nextTruckId, companyId },
      select: { id: true },
    });
    if (!truck) return jsonBadRequest("Camión inválido");

    const record = await prisma.maintenanceRecord.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        truckId: nextTruckId,
        fecha: parsed.data.fecha ? new Date(parsed.data.fecha) : undefined,
        costo:
          parsed.data.costo === undefined ? undefined : decimal(parsed.data.costo, 2),
      },
    });

    return jsonOk({ record: { ...record, costo: serializeMoney(record.costo) } });
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
    const existing = await prisma.maintenanceRecord.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.maintenanceRecord.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonServerError();
  }
}
