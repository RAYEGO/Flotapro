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

const createFuelSchema = z.object({
  truckId: z.string().min(1),
  driverId: z.string().min(1),
  fecha: z.string().datetime(),
  kilometraje: z.number().int().min(0).max(10_000_000),
  galones: z.coerce.number().positive(),
  precioPorGalon: z.coerce.number().positive(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const fuels = await prisma.fuel.findMany({
      where: { companyId: auth.session.companyId },
      include: { truck: true, driver: true },
      orderBy: { fecha: "desc" },
    });

    return jsonOk({
      fuels: fuels.map((f) => ({
        ...f,
        galones: f.galones.toFixed(3),
        precioPorGalon: f.precioPorGalon.toFixed(3),
        total: serializeMoney(f.total),
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
    const parsed = createFuelSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;

    const [truck, driver] = await Promise.all([
      prisma.truck.findFirst({
        where: { id: parsed.data.truckId, companyId },
        select: { id: true },
      }),
      prisma.driver.findFirst({
        where: { id: parsed.data.driverId, companyId },
        select: { id: true },
      }),
    ]);

    if (!truck) return jsonBadRequest("Camión inválido");
    if (!driver) return jsonBadRequest("Chofer inválido");

    const galones = decimal(parsed.data.galones, 3);
    const precioPorGalon = decimal(parsed.data.precioPorGalon, 3);
    const total = decimal(galones.mul(precioPorGalon).toFixed(2), 2);

    const fuel = await prisma.fuel.create({
      data: {
        companyId,
        truckId: parsed.data.truckId,
        driverId: parsed.data.driverId,
        fecha: new Date(parsed.data.fecha),
        kilometraje: parsed.data.kilometraje,
        galones,
        precioPorGalon,
        total,
      },
    });

    return jsonCreated({
      fuel: {
        ...fuel,
        galones: fuel.galones.toFixed(3),
        precioPorGalon: fuel.precioPorGalon.toFixed(3),
        total: serializeMoney(fuel.total),
      },
    });
  } catch {
    return jsonServerError();
  }
}
