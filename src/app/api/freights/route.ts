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

const createFreightSchema = z.object({
  truckId: z.string().min(1),
  driverId: z.string().min(1),
  customerId: z.string().min(1),
  originPointId: z.string().min(1),
  destinationPointId: z.string().min(1),
  fecha: z.string().datetime(),
  ingreso: z.coerce.number().finite().nonnegative().optional().default(0),
  peajes: z.coerce.number().finite().nonnegative().optional().default(0),
  viaticos: z.coerce.number().finite().nonnegative().optional().default(0),
  otrosGastos: z.coerce.number().finite().nonnegative().optional().default(0),
  usarMontoPersonalizado: z.boolean().optional().default(false),
  montoPersonalizado: z.coerce.number().finite().nonnegative().optional(),
  estado: z.enum(["PENDIENTE", "COMPLETADO", "ANULADO"]).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const freights = await prisma.freight.findMany({
      where: { companyId: auth.session.companyId },
      include: { truck: true, driver: true, customer: true, originPoint: true, destinationPoint: true },
      orderBy: { fecha: "desc" },
    });

    return jsonOk({
      freights: freights.map((f) => ({
        ...f,
        ingreso: serializeMoney(f.ingreso),
        peajes: serializeMoney(f.peajes),
        viaticos: serializeMoney(f.viaticos),
        otrosGastos: serializeMoney(f.otrosGastos),
        ganancia: serializeMoney(f.ganancia),
        montoAcordado: serializeMoney(f.montoAcordado),
        montoBase: serializeMoney(f.montoBase),
        montoCalculado: serializeMoney(f.montoCalculado),
        montoPersonalizado:
          f.montoPersonalizado === null ? null : serializeMoney(f.montoPersonalizado),
        montoFinal: serializeMoney(f.montoFinal),
      })),
    });
  } catch {
    return jsonServerError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = createFreightSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;

    const [truck, driver, customer, originPoint, destinationPoint] = await Promise.all([
      prisma.truck.findFirst({
        where: { id: parsed.data.truckId, companyId },
        select: {
          id: true,
          modeloPago: true,
          tipoCalculo: true,
          montoBase: true,
        },
      }),
      prisma.driver.findFirst({
        where: { id: parsed.data.driverId, companyId },
        select: { id: true },
      }),
      prisma.client.findFirst({
        where: { id: parsed.data.customerId, companyId },
        select: { id: true, nombreComercial: true },
      }),
      prisma.operationalPoint.findFirst({
        where: { id: parsed.data.originPointId, companyId },
        select: { id: true, nombre: true, clienteId: true },
      }),
      prisma.operationalPoint.findFirst({
        where: { id: parsed.data.destinationPointId, companyId },
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

    if (parsed.data.usarMontoPersonalizado && parsed.data.montoPersonalizado === undefined) {
      return jsonBadRequest("Monto personalizado requerido");
    }

    const tipoModelo = truck.modeloPago;
    const tipoCalculo = truck.tipoCalculo;
    const montoBaseValue = truck.montoBase ?? 0;
    const montoBase = decimal(String(montoBaseValue), 2);
    const montoCalculado =
      tipoCalculo === "IDA_VUELTA" ? decimal(montoBase.mul(2).toFixed(2), 2) : montoBase;
    const usarMontoPersonalizado = parsed.data.usarMontoPersonalizado ?? false;
    const montoPersonalizado = usarMontoPersonalizado
      ? decimal(String(parsed.data.montoPersonalizado), 2)
      : null;
    const montoFinal = usarMontoPersonalizado
      ? decimal(montoPersonalizado?.toFixed(2) ?? "0", 2)
      : montoCalculado;
    const direccionPago = tipoModelo === "CHOFER_PAGA" ? "POR_COBRAR" : "POR_PAGAR";

    const ingreso = decimal(parsed.data.ingreso, 2);
    const peajes = decimal(parsed.data.peajes, 2);
    const viaticos = decimal(parsed.data.viaticos, 2);
    const otrosGastos = decimal(parsed.data.otrosGastos, 2);
    const ganancia =
      tipoModelo === "CHOFER_PAGA"
        ? montoFinal
        : ingreso.minus(peajes).minus(viaticos).minus(otrosGastos).minus(montoFinal);

    const freight = await prisma.freight.create({
      data: {
        companyId,
        truckId: parsed.data.truckId,
        driverId: parsed.data.driverId,
        customerId: customer.id,
        originPointId: originPoint.id,
        destinationPointId: destinationPoint.id,
        fecha: new Date(parsed.data.fecha),
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
        estado: parsed.data.estado,
      },
    });

    return jsonCreated({
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
