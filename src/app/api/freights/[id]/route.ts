import { z } from "zod";
import { NextRequest } from "next/server";

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

const updateFreightSchema = z.object({
  truckId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  fecha: z.string().datetime().optional(),
  cliente: z.string().min(2).max(120).optional(),
  origen: z.string().min(2).max(120).optional(),
  destino: z.string().min(2).max(120).optional(),
  ingreso: z.coerce.number().nonnegative().optional(),
  peajes: z.coerce.number().nonnegative().optional(),
  viaticos: z.coerce.number().nonnegative().optional(),
  otrosGastos: z.coerce.number().nonnegative().optional(),
  tipoModelo: z.enum(["DUENO_PAGA", "CHOFER_PAGA"]).optional(),
  montoAcordado: z.coerce.number().nonnegative().optional(),
  estado: z.enum(["PENDIENTE", "COMPLETADO", "ANULADO"]).optional(),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const freight = await prisma.freight.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      include: { truck: true, driver: true },
    });
    if (!freight) return jsonNotFound();
    return jsonOk({
      freight: {
        ...freight,
        ingreso: serializeMoney(freight.ingreso),
        peajes: serializeMoney(freight.peajes),
        viaticos: serializeMoney(freight.viaticos),
        otrosGastos: serializeMoney(freight.otrosGastos),
        ganancia: serializeMoney(freight.ganancia),
        montoAcordado: serializeMoney(freight.montoAcordado),
      },
    });
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
    const parsed = updateFreightSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const existing = await prisma.freight.findFirst({
      where: { id: ctx.params.id, companyId },
    });
    if (!existing) return jsonNotFound();

    const nextTruckId = parsed.data.truckId ?? existing.truckId;
    const nextDriverId = parsed.data.driverId ?? existing.driverId;

    const [truck, driver] = await Promise.all([
      prisma.truck.findFirst({
        where: { id: nextTruckId, companyId },
        select: { id: true, modoOperacion: true, montoPorVueltaDueno: true },
      }),
      prisma.driver.findFirst({ where: { id: nextDriverId, companyId }, select: { id: true } }),
    ]);
    if (!truck) return jsonBadRequest("Camión inválido");
    if (!driver) return jsonBadRequest("Chofer inválido");

    const tipoModelo =
      parsed.data.tipoModelo ??
      (parsed.data.truckId
        ? truck.modoOperacion === "ALQUILER"
          ? "CHOFER_PAGA"
          : "DUENO_PAGA"
        : existing.tipoModelo);
    const montoAcordadoValue =
      parsed.data.montoAcordado === undefined
        ? tipoModelo === "CHOFER_PAGA" && parsed.data.truckId
          ? truck.montoPorVueltaDueno ?? existing.montoAcordado
          : existing.montoAcordado
        : decimal(parsed.data.montoAcordado, 2);
    const montoAcordadoDecimal = decimal(String(montoAcordadoValue), 2);

    const ingreso =
      tipoModelo === "CHOFER_PAGA"
        ? decimal(0, 2)
        : parsed.data.ingreso === undefined
          ? existing.ingreso
          : decimal(parsed.data.ingreso, 2);
    const peajes =
      tipoModelo === "CHOFER_PAGA"
        ? decimal(0, 2)
        : parsed.data.peajes === undefined
          ? existing.peajes
          : decimal(parsed.data.peajes, 2);
    const viaticos =
      tipoModelo === "CHOFER_PAGA"
        ? decimal(0, 2)
        : parsed.data.viaticos === undefined
          ? existing.viaticos
          : decimal(parsed.data.viaticos, 2);
    const otrosGastos =
      tipoModelo === "CHOFER_PAGA"
        ? decimal(0, 2)
        : parsed.data.otrosGastos === undefined
          ? existing.otrosGastos
          : decimal(parsed.data.otrosGastos, 2);

    const ganancia =
      tipoModelo === "CHOFER_PAGA"
        ? montoAcordadoDecimal
        : ingreso.minus(peajes).minus(viaticos).minus(otrosGastos).minus(montoAcordadoDecimal);

    const freight = await prisma.freight.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        truckId: nextTruckId,
        driverId: nextDriverId,
        fecha: parsed.data.fecha ? new Date(parsed.data.fecha) : undefined,
        ingreso,
        peajes,
        viaticos,
        otrosGastos,
        ganancia,
        tipoModelo,
        montoAcordado: montoAcordadoDecimal,
      },
    });

    return jsonOk({
      freight: {
        ...freight,
        ingreso: serializeMoney(freight.ingreso),
        peajes: serializeMoney(freight.peajes),
        viaticos: serializeMoney(freight.viaticos),
        otrosGastos: serializeMoney(freight.otrosGastos),
        ganancia: serializeMoney(freight.ganancia),
        montoAcordado: serializeMoney(freight.montoAcordado),
      },
    });
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
    const existing = await prisma.freight.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.freight.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonServerError();
  }
}
