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
  customerId: z.string().min(1).optional(),
  originPointId: z.string().min(1).optional(),
  destinationPointId: z.string().min(1).optional(),
  fecha: z.string().datetime().optional(),
  ingreso: z.coerce.number().nonnegative().optional(),
  peajes: z.coerce.number().nonnegative().optional(),
  viaticos: z.coerce.number().nonnegative().optional(),
  otrosGastos: z.coerce.number().nonnegative().optional(),
  usarMontoPersonalizado: z.boolean().optional(),
  montoPersonalizado: z.coerce.number().nonnegative().optional(),
  estado: z.enum(["PENDIENTE", "COMPLETADO", "ANULADO"]).optional(),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const freight = await prisma.freight.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      include: { truck: true, driver: true, customer: true, originPoint: true, destinationPoint: true },
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
        montoBase: serializeMoney(freight.montoBase),
        montoCalculado: serializeMoney(freight.montoCalculado),
        montoPersonalizado:
          freight.montoPersonalizado === null ? null : serializeMoney(freight.montoPersonalizado),
        montoFinal: serializeMoney(freight.montoFinal),
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
    const nextCustomerId = parsed.data.customerId ?? existing.customerId;
    const nextOriginPointId = parsed.data.originPointId ?? existing.originPointId;
    const nextDestinationPointId = parsed.data.destinationPointId ?? existing.destinationPointId;

    if (!nextCustomerId) return jsonBadRequest("Cliente requerido");
    if (!nextOriginPointId) return jsonBadRequest("Punto de origen requerido");
    if (!nextDestinationPointId) return jsonBadRequest("Punto de destino requerido");

    const [truck, driver, customer, originPoint, destinationPoint] = await Promise.all([
      prisma.truck.findFirst({
        where: { id: nextTruckId, companyId },
        select: {
          id: true,
          modeloPago: true,
          tipoCalculo: true,
          montoBase: true,
        },
      }),
      prisma.driver.findFirst({ where: { id: nextDriverId, companyId }, select: { id: true } }),
      prisma.client.findFirst({
        where: { id: nextCustomerId, companyId },
        select: { id: true, nombreComercial: true },
      }),
      prisma.operationalPoint.findFirst({
        where: { id: nextOriginPointId, companyId },
        select: { id: true, nombre: true, clienteId: true },
      }),
      prisma.operationalPoint.findFirst({
        where: { id: nextDestinationPointId, companyId },
        select: { id: true, nombre: true, clienteId: true },
      }),
    ]);
    if (!truck) return jsonBadRequest("Camión inválido");
    if (!driver) return jsonBadRequest("Chofer inválido");
    if (!customer) return jsonBadRequest("Cliente inválido");
    if (!originPoint) return jsonBadRequest("Punto de origen inválido");
    if (!destinationPoint) return jsonBadRequest("Punto de destino inválido");
    if (originPoint.clienteId && originPoint.clienteId !== customer.id) {
      return jsonBadRequest("Punto de origen no pertenece al cliente");
    }
    if (destinationPoint.clienteId && destinationPoint.clienteId !== customer.id) {
      return jsonBadRequest("Punto de destino no pertenece al cliente");
    }

    const tipoModelo = truck.modeloPago;
    const tipoCalculo = truck.tipoCalculo;
    const montoBase = decimal(String(truck.montoBase), 2);
    const montoCalculado =
      tipoCalculo === "IDA_VUELTA" ? decimal(montoBase.mul(2).toFixed(2), 2) : montoBase;

    const usarMontoPersonalizado =
      parsed.data.usarMontoPersonalizado ?? existing.usarMontoPersonalizado;
    const montoPersonalizadoValue =
      parsed.data.montoPersonalizado === undefined
        ? existing.montoPersonalizado
        : decimal(parsed.data.montoPersonalizado, 2);
    if (usarMontoPersonalizado && montoPersonalizadoValue === null) {
      return jsonBadRequest("Monto personalizado requerido");
    }
    const montoPersonalizado = usarMontoPersonalizado ? montoPersonalizadoValue : null;
    const montoFinal = usarMontoPersonalizado
      ? decimal(String(montoPersonalizado), 2)
      : montoCalculado;
    const direccionPago = tipoModelo === "CHOFER_PAGA" ? "POR_COBRAR" : "POR_PAGAR";

    const ingreso =
      parsed.data.ingreso === undefined ? existing.ingreso : decimal(parsed.data.ingreso, 2);
    const peajes =
      parsed.data.peajes === undefined ? existing.peajes : decimal(parsed.data.peajes, 2);
    const viaticos =
      parsed.data.viaticos === undefined ? existing.viaticos : decimal(parsed.data.viaticos, 2);
    const otrosGastos =
      parsed.data.otrosGastos === undefined
        ? existing.otrosGastos
        : decimal(parsed.data.otrosGastos, 2);

    const ganancia =
      tipoModelo === "CHOFER_PAGA"
        ? montoFinal
        : ingreso.minus(peajes).minus(viaticos).minus(otrosGastos).minus(montoFinal);

    const freight = await prisma.freight.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        truckId: nextTruckId,
        driverId: nextDriverId,
        customerId: customer.id,
        originPointId: originPoint.id,
        destinationPointId: destinationPoint.id,
        fecha: parsed.data.fecha ? new Date(parsed.data.fecha) : undefined,
        cliente: customer.nombreComercial,
        origen: originPoint.nombre,
        destino: destinationPoint.nombre,
        ingreso,
        peajes,
        viaticos,
        otrosGastos,
        ganancia,
        tipoModelo,
        montoAcordado: montoFinal,
        tipoCalculo,
        montoBase,
        montoCalculado,
        usarMontoPersonalizado,
        montoPersonalizado,
        montoFinal,
        direccionPago,
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
        montoBase: serializeMoney(freight.montoBase),
        montoCalculado: serializeMoney(freight.montoCalculado),
        montoPersonalizado:
          freight.montoPersonalizado === null ? null : serializeMoney(freight.montoPersonalizado),
        montoFinal: serializeMoney(freight.montoFinal),
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
