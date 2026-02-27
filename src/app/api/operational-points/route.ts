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

const formatCoord = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value.toFixed(6) : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(6) : null;
  }
  if (typeof value === "object" && "toFixed" in (value as object)) {
    return (value as { toFixed: (digits: number) => string }).toFixed(6);
  }
  return null;
};

const createPointSchema = z.object({
  nombre: z.string().min(2).max(120),
  tipo: z.enum(["BALANZA", "PLANTA", "MINA", "PUERTO", "ALMACEN", "OTRO"]).optional(),
  clienteId: z.string().min(1).optional(),
  direccion: z.string().min(2).max(160),
  regionId: z.coerce.number().int().positive().optional(),
  provinceId: z.coerce.number().int().positive().optional(),
  districtId: z.coerce.number().int().positive().optional(),
  ciudad: z.string().min(2).max(120).optional(),
  departamento: z.string().min(2).max(120).optional(),
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
        latitud: formatCoord(p.latitud),
        longitud: formatCoord(p.longitud),
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

    let region =
      parsed.data.regionId === undefined
        ? null
        : await prisma.region.findFirst({ where: { id: parsed.data.regionId } });
    if (parsed.data.regionId !== undefined && !region) {
      return jsonBadRequest("Región inválida");
    }
    let province =
      parsed.data.provinceId === undefined
        ? null
        : await prisma.province.findFirst({
            where: {
              id: parsed.data.provinceId,
              ...(parsed.data.regionId ? { regionId: parsed.data.regionId } : {}),
            },
          });
    if (parsed.data.provinceId !== undefined && !province) {
      return jsonBadRequest("Provincia inválida");
    }
    let district =
      parsed.data.districtId === undefined
        ? null
        : await prisma.district.findFirst({
            where: {
              id: parsed.data.districtId,
              ...(parsed.data.provinceId ? { provinceId: parsed.data.provinceId } : {}),
            },
          });
    if (parsed.data.districtId !== undefined && !district) {
      return jsonBadRequest("Distrito inválido");
    }
    if (district && !province) {
      province = await prisma.province.findFirst({ where: { id: district.provinceId } });
    }
    if (province && !region) {
      region = await prisma.region.findFirst({ where: { id: province.regionId } });
    }

    const departamento = region?.nombre ?? parsed.data.departamento?.trim();
    const ciudad = province?.nombre ?? parsed.data.ciudad?.trim();
    const distrito =
      district?.nombre ??
      (parsed.data.distrito === "" ? null : parsed.data.distrito?.trim() ?? null);

    if (!departamento) return jsonBadRequest("Selecciona la región");
    if (!ciudad) return jsonBadRequest("Selecciona la provincia");
    if (!distrito) return jsonBadRequest("Selecciona el distrito");

    const point = await prisma.operationalPoint.create({
      data: {
        companyId,
        clienteId: parsed.data.clienteId,
        nombre: parsed.data.nombre,
        tipo: parsed.data.tipo,
        direccion: parsed.data.direccion,
        ciudad,
        departamento,
        distrito,
        regionId: region?.id ?? null,
        provinceId: province?.id ?? null,
        districtId: district?.id ?? null,
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
        latitud: formatCoord(point.latitud),
        longitud: formatCoord(point.longitud),
      },
    });
  } catch {
    return jsonServerError();
  }
}
