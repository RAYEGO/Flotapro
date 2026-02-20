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
  fecha: z.string().datetime(),
  cliente: z.string().min(2).max(120),
  origen: z.string().min(2).max(120),
  destino: z.string().min(2).max(120),
  ingreso: z.coerce.number().nonnegative().optional().default(0),
  peajes: z.coerce.number().nonnegative().optional().default(0),
  viaticos: z.coerce.number().nonnegative().optional().default(0),
  otrosGastos: z.coerce.number().nonnegative().optional().default(0),
  tipoModelo: z.enum(["DUENO_PAGA", "CHOFER_PAGA"]).optional(),
  montoAcordado: z.coerce.number().nonnegative().optional(),
  estado: z.enum(["PENDIENTE", "COMPLETADO", "ANULADO"]).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const freights = await prisma.freight.findMany({
      where: { companyId: auth.session.companyId },
      include: { truck: true, driver: true },
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

    const [truck, driver] = await Promise.all([
      prisma.truck.findFirst({
        where: { id: parsed.data.truckId, companyId },
        select: { id: true, modoOperacion: true, montoPorVueltaDueno: true },
      }),
      prisma.driver.findFirst({
        where: { id: parsed.data.driverId, companyId },
        select: { id: true },
      }),
    ]);

    if (!truck) return jsonBadRequest("Camión inválido");
    if (!driver) return jsonBadRequest("Chofer inválido");

    const tipoModelo =
      parsed.data.tipoModelo ??
      (truck.modoOperacion === "ALQUILER" ? "CHOFER_PAGA" : "DUENO_PAGA");
    const montoAcordado =
      parsed.data.montoAcordado === undefined
        ? truck.montoPorVueltaDueno ?? 0
        : parsed.data.montoAcordado;
    const montoAcordadoDecimal = decimal(String(montoAcordado), 2);

    const ingreso =
      tipoModelo === "CHOFER_PAGA" ? decimal(0, 2) : decimal(parsed.data.ingreso, 2);
    const peajes =
      tipoModelo === "CHOFER_PAGA" ? decimal(0, 2) : decimal(parsed.data.peajes, 2);
    const viaticos =
      tipoModelo === "CHOFER_PAGA" ? decimal(0, 2) : decimal(parsed.data.viaticos, 2);
    const otrosGastos =
      tipoModelo === "CHOFER_PAGA" ? decimal(0, 2) : decimal(parsed.data.otrosGastos, 2);
    const ganancia =
      tipoModelo === "CHOFER_PAGA"
        ? montoAcordadoDecimal
        : ingreso.minus(peajes).minus(viaticos).minus(otrosGastos).minus(montoAcordadoDecimal);

    const freight = await prisma.freight.create({
      data: {
        companyId,
        truckId: parsed.data.truckId,
        driverId: parsed.data.driverId,
        fecha: new Date(parsed.data.fecha),
        cliente: parsed.data.cliente,
        origen: parsed.data.origen,
        destino: parsed.data.destino,
        ingreso,
        peajes,
        viaticos,
        otrosGastos,
        ganancia,
        tipoModelo,
        montoAcordado: montoAcordadoDecimal,
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
      },
    });
  } catch {
    return jsonServerError();
  }
}
