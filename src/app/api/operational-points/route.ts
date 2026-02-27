import { z } from "zod";
import { NextRequest } from "next/server";

import {
  decimal,
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const createPointSchema = z.object({
  nombre: z.string().min(2).max(120),
  tipo: z.enum(["BALANZA", "PLANTA", "MINA", "PUERTO", "ALMACEN", "OTRO"]).optional(),
  clienteId: z.string().min(1).optional(),
  direccion: z.string().min(2).max(160),
  ciudad: z.string().min(2).max(120),
  departamento: z.string().min(2).max(120),
  distrito: z.string().min(2).max(120).optional().or(z.literal("")),
  latitud: z.coerce.number().finite().min(-90).max(90).optional(),
  longitud: z.coerce.number().finite().min(-180).max(180).optional(),
  linkGoogleMaps: z.string().min(3).max(300).optional().or(z.literal("")),
  referencia: z.string().min(2).max(160).optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const points = await prisma.operationalPoint.findMany({
      where: { companyId: auth.session.companyId },
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      points: points.map((p) => ({
        ...p,
        latitud: p.latitud === null ? null : p.latitud.toFixed(6),
        longitud: p.longitud === null ? null : p.longitud.toFixed(6),
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
    const parsed = createPointSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    if (parsed.data.clienteId) {
      const client = await prisma.client.findFirst({
        where: { id: parsed.data.clienteId, companyId },
        select: { id: true },
      });
      if (!client) return jsonBadRequest("Cliente inválido");
    }

    const point = await prisma.operationalPoint.create({
      data: {
        companyId,
        clienteId: parsed.data.clienteId,
        nombre: parsed.data.nombre,
        tipo: parsed.data.tipo,
        direccion: parsed.data.direccion,
        ciudad: parsed.data.ciudad,
        departamento: parsed.data.departamento,
        distrito: parsed.data.distrito === "" ? null : parsed.data.distrito ?? null,
        latitud:
          parsed.data.latitud === undefined ? null : decimal(parsed.data.latitud, 6),
        longitud:
          parsed.data.longitud === undefined ? null : decimal(parsed.data.longitud, 6),
        linkGoogleMaps: parsed.data.linkGoogleMaps ? parsed.data.linkGoogleMaps : null,
        referencia: parsed.data.referencia ? parsed.data.referencia : null,
      },
    });

    return jsonCreated({
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
