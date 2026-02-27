import { NextRequest } from "next/server";
import { z } from "zod";

import {
  decimal,
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const updatePointSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  tipo: z.enum(["BALANZA", "PLANTA", "MINA", "PUERTO", "ALMACEN", "OTRO"]).optional(),
  clienteId: z.string().min(1).optional().or(z.literal("")),
  direccion: z.string().min(2).max(160).optional(),
  ciudad: z.string().min(2).max(120).optional(),
  departamento: z.string().min(2).max(120).optional(),
  distrito: z.string().min(2).max(120).optional().or(z.literal("")),
  latitud: z.coerce.number().finite().min(-90).max(90).optional(),
  longitud: z.coerce.number().finite().min(-180).max(180).optional(),
  linkGoogleMaps: z.string().min(3).max(300).optional().or(z.literal("")),
  referencia: z.string().min(2).max(160).optional().or(z.literal("")),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const point = await prisma.operationalPoint.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      include: { cliente: true },
    });
    if (!point) return jsonNotFound();
    return jsonOk({
      point: {
        ...point,
        latitud: point.latitud === null ? null : point.latitud.toFixed(6),
        longitud: point.longitud === null ? null : point.longitud.toFixed(6),
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
    const parsed = updatePointSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const existing = await prisma.operationalPoint.findFirst({
      where: { id: ctx.params.id, companyId },
    });
    if (!existing) return jsonNotFound();

    const nextClienteId =
      parsed.data.clienteId === "" ? null : parsed.data.clienteId ?? existing.clienteId;
    if (nextClienteId) {
      const client = await prisma.client.findFirst({
        where: { id: nextClienteId, companyId },
        select: { id: true },
      });
      if (!client) return jsonBadRequest("Cliente inválido");
    }

    const point = await prisma.operationalPoint.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        clienteId: nextClienteId,
        distrito: parsed.data.distrito === "" ? null : parsed.data.distrito,
        latitud: parsed.data.latitud === undefined ? undefined : decimal(parsed.data.latitud, 6),
        longitud:
          parsed.data.longitud === undefined ? undefined : decimal(parsed.data.longitud, 6),
        linkGoogleMaps:
          parsed.data.linkGoogleMaps === "" ? null : parsed.data.linkGoogleMaps,
        referencia: parsed.data.referencia === "" ? null : parsed.data.referencia,
      },
    });

    return jsonOk({
      point: {
        ...point,
        latitud: point.latitud === null ? null : point.latitud.toFixed(6),
        longitud: point.longitud === null ? null : point.longitud.toFixed(6),
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
    const existing = await prisma.operationalPoint.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.operationalPoint.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonServerError();
  }
}
