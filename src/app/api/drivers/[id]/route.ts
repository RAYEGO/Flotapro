import { z } from "zod";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import {
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const updateDriverSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  dni: z.string().trim().length(8).optional(),
  licencia: z.string().min(3).max(40).optional(),
  fechaVencimiento: z.string().datetime().optional(),
  telefono: z.string().min(6).max(30).optional().or(z.literal("")),
  truckId: z.string().min(1).optional().or(z.literal("")),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const driver = await prisma.driver.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      include: { truck: true },
    });
    if (!driver) return jsonNotFound();
    return jsonOk({ driver });
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
    const parsed = updateDriverSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const existing = await prisma.driver.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    const truckId =
      parsed.data.truckId === undefined
        ? undefined
        : parsed.data.truckId
          ? parsed.data.truckId
          : null;

    if (typeof truckId === "string") {
      const truck = await prisma.truck.findFirst({
        where: { id: truckId, companyId: auth.session.companyId },
        select: { id: true },
      });
      if (!truck) return jsonBadRequest("Camión inválido");
    }

    const telefono =
      parsed.data.telefono === undefined
        ? undefined
        : parsed.data.telefono
          ? parsed.data.telefono
          : null;

    const driver = await prisma.driver.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        truckId,
        telefono,
        fechaVencimiento: parsed.data.fechaVencimiento
          ? new Date(parsed.data.fechaVencimiento)
          : undefined,
      },
    });

    return jsonOk({ driver });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return jsonBadRequest("DNI ya registrado");
    }
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
    const existing = await prisma.driver.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.driver.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonServerError();
  }
}
