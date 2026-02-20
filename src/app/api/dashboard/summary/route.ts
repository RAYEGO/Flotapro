import { FreightStatus, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import {
  jsonBadRequest,
  jsonOk,
  jsonServerError,
  serializeMoney,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/tenant";

const querySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

function monthRange(month: string) {
  const [y, m] = month.split("-").map((v) => Number(v));
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

export async function GET(req: NextRequest) {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      month: url.searchParams.get("month") ?? undefined,
    });
    if (!parsed.success) return jsonBadRequest("Parámetros inválidos");

    const now = new Date();
    const defaultMonth = `${now.getUTCFullYear()}-${String(
      now.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const month = parsed.data.month ?? defaultMonth;
    const { start, end } = monthRange(month);

    const companyId = auth.session.companyId;

    const [freightAgg, fuelAgg, maintAgg] = await Promise.all([
      prisma.freight.aggregate({
        where: { companyId, fecha: { gte: start, lt: end }, estado: FreightStatus.COMPLETADO },
        _sum: { ingreso: true, ganancia: true },
      }),
      prisma.fuel.aggregate({
        where: { companyId, fecha: { gte: start, lt: end } },
        _sum: { total: true },
      }),
      prisma.maintenanceRecord.aggregate({
        where: { companyId, fecha: { gte: start, lt: end } },
        _sum: { costo: true },
      }),
    ]);

    const ingresos = freightAgg._sum.ingreso ?? new Prisma.Decimal(0);
    const gananciaFletes = freightAgg._sum.ganancia ?? new Prisma.Decimal(0);
    const gastoCombustible = fuelAgg._sum.total ?? new Prisma.Decimal(0);
    const gastoMantenimiento = maintAgg._sum.costo ?? new Prisma.Decimal(0);

    const utilidadNeta = gananciaFletes.minus(gastoCombustible).minus(gastoMantenimiento);

    const thresholdKm = 500;
    const plans = await prisma.maintenancePlan.findMany({
      where: { companyId, activo: true },
      include: { truck: { select: { id: true, placa: true, kilometrajeActual: true } } },
      orderBy: { proximoKm: "asc" },
    });

    const alerts = plans
      .map((p) => {
        const restanteKm = p.proximoKm - p.truck.kilometrajeActual;
        return {
          id: p.id,
          truckId: p.truckId,
          placa: p.truck.placa,
          tipo: p.tipo,
          proximoKm: p.proximoKm,
          kilometrajeActual: p.truck.kilometrajeActual,
          restanteKm,
        };
      })
      .filter((a) => a.restanteKm >= 0 && a.restanteKm <= thresholdKm);

    return jsonOk({
      month,
      summary: {
        ingresos: serializeMoney(ingresos),
        gastoCombustible: serializeMoney(gastoCombustible),
        gastoMantenimiento: serializeMoney(gastoMantenimiento),
        utilidadNeta: serializeMoney(utilidadNeta),
      },
      maintenanceAlerts: alerts,
    });
  } catch {
    return jsonServerError();
  }
}
