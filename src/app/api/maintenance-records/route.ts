import { z } from "zod";
import { NextRequest } from "next/server";

import {
  decimal,
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonServerError,
  serializeMoney,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const createRecordSchema = z.object({
  truckId: z.string().min(1),
  fecha: z.string().datetime(),
  tipo: z.string().min(2).max(120),
  kilometraje: z.number().int().min(0).max(10_000_000),
  costo: z.coerce.number().nonnegative(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const records = await prisma.maintenanceRecord.findMany({
      where: { companyId: auth.session.companyId },
      include: { truck: true },
      orderBy: { fecha: "desc" },
    });

    return jsonOk({
      records: records.map((r) => ({ ...r, costo: serializeMoney(r.costo) })),
    });
  } catch {
    return jsonServerError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = createRecordSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const truck = await prisma.truck.findFirst({
      where: { id: parsed.data.truckId, companyId },
      select: { id: true },
    });
    if (!truck) return jsonBadRequest("Camión inválido");

    const costo = decimal(parsed.data.costo, 2);

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceRecord.create({
        data: {
          companyId,
          truckId: parsed.data.truckId,
          fecha: new Date(parsed.data.fecha),
          tipo: parsed.data.tipo,
          kilometraje: parsed.data.kilometraje,
          costo,
        },
      });

      const plan = await tx.maintenancePlan.findFirst({
        where: {
          companyId,
          truckId: parsed.data.truckId,
          tipo: parsed.data.tipo,
          activo: true,
        },
      });

      if (plan) {
        await tx.maintenancePlan.update({
          where: { id: plan.id },
          data: {
            ultimoServicioKm: parsed.data.kilometraje,
            proximoKm: parsed.data.kilometraje + plan.cadaKm,
          },
        });
      }

      return created;
    });

    return jsonCreated({
      record: { ...record, costo: serializeMoney(record.costo) },
    });
  } catch {
    return jsonServerError();
  }
}
