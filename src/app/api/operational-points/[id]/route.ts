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

const updatePointSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  tipo: z.enum(["BALANZA", "PLANTA", "MINA", "PUERTO", "ALMACEN", "OTRO"]).optional(),
  clienteId: z.string().min(1).optional().or(z.literal("")),
  direccion: z.string().min(2).max(160).optional(),
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
        latitud: formatCoord(point.latitud),
        longitud: formatCoord(point.longitud),
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

    let region: { id: number; nombre: string } | null = null;
    let province: { id: number; nombre: string; regionId: number } | null = null;
    let district: { id: number; nombre: string; provinceId: number } | null = null;

    const hasUbigeoChange =
      parsed.data.regionId !== undefined ||
      parsed.data.provinceId !== undefined ||
      parsed.data.districtId !== undefined;

    const candidateRegionId = parsed.data.regionId ?? existing.regionId ?? undefined;
    const candidateProvinceId = parsed.data.provinceId ?? existing.provinceId ?? undefined;
    const candidateDistrictId = parsed.data.districtId ?? existing.districtId ?? undefined;

    if (hasUbigeoChange) {
      if (candidateDistrictId !== undefined) {
        district = await prisma.district.findFirst({
          where: {
            id: candidateDistrictId,
            ...(candidateProvinceId ? { provinceId: candidateProvinceId } : {}),
          },
        });
        if (!district) return jsonBadRequest("Distrito inválido");
      }
      if (candidateProvinceId !== undefined) {
        province = await prisma.province.findFirst({
          where: {
            id: candidateProvinceId,
            ...(candidateRegionId ? { regionId: candidateRegionId } : {}),
          },
        });
        if (!province) return jsonBadRequest("Provincia inválida");
      }
      if (!province && district) {
        province = await prisma.province.findFirst({ where: { id: district.provinceId } });
      }
      if (candidateRegionId !== undefined) {
        region = await prisma.region.findFirst({ where: { id: candidateRegionId } });
        if (!region) return jsonBadRequest("Región inválida");
      }
      if (!region && province) {
        region = await prisma.region.findFirst({ where: { id: province.regionId } });
      }
    }

    const departamento =
      region?.nombre ?? parsed.data.departamento?.trim() ?? existing.departamento;
    const ciudad = province?.nombre ?? parsed.data.ciudad?.trim() ?? existing.ciudad;
    const distrito =
      district?.nombre ??
      (parsed.data.distrito === "" ? null : parsed.data.distrito?.trim() ?? existing.distrito);

    if (hasUbigeoChange) {
      if (!departamento) return jsonBadRequest("Selecciona la región");
      if (!ciudad) return jsonBadRequest("Selecciona la provincia");
      if (!distrito) return jsonBadRequest("Selecciona el distrito");
    }

    const point = await prisma.operationalPoint.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        clienteId: nextClienteId,
        departamento,
        ciudad,
        distrito,
        regionId: region?.id ?? (hasUbigeoChange ? null : existing.regionId),
        provinceId: province?.id ?? (hasUbigeoChange ? null : existing.provinceId),
        districtId: district?.id ?? (hasUbigeoChange ? null : existing.districtId),
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
        latitud: formatCoord(point.latitud),
        longitud: formatCoord(point.longitud),
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
