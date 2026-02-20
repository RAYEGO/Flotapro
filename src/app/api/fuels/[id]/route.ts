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

const updateFuelSchema = z.object({
  truckId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  fecha: z.string().datetime().optional(),
  kilometraje: z.number().int().min(0).max(10_000_000).optional(),
  galones: z.coerce.number().positive().optional(),
  precioPorGalon: z.coerce.number().positive().optional(),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const fuel = await prisma.fuel.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      include: { truck: true, driver: true },
    });
    if (!fuel) return jsonNotFound();
    return jsonOk({
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

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = updateFuelSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const existing = await prisma.fuel.findFirst({
      where: { id: ctx.params.id, companyId },
    });
    if (!existing) return jsonNotFound();

    const nextTruckId = parsed.data.truckId ?? existing.truckId;
    const nextDriverId = parsed.data.driverId ?? existing.driverId;

    const [truck, driver] = await Promise.all([
      prisma.truck.findFirst({ where: { id: nextTruckId, companyId }, select: { id: true } }),
      prisma.driver.findFirst({ where: { id: nextDriverId, companyId }, select: { id: true } }),
    ]);
    if (!truck) return jsonBadRequest("Camión inválido");
    if (!driver) return jsonBadRequest("Chofer inválido");

    const galones =
      parsed.data.galones === undefined
        ? existing.galones
        : decimal(parsed.data.galones, 3);
    const precioPorGalon =
      parsed.data.precioPorGalon === undefined
        ? existing.precioPorGalon
        : decimal(parsed.data.precioPorGalon, 3);

    const total = decimal(galones.mul(precioPorGalon).toFixed(2), 2);

    const fuel = await prisma.fuel.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        truckId: nextTruckId,
        driverId: nextDriverId,
        fecha: parsed.data.fecha ? new Date(parsed.data.fecha) : undefined,
        galones,
        precioPorGalon,
        total,
      },
    });

    return jsonOk({
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

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.fuel.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.fuel.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonServerError();
  }
}
