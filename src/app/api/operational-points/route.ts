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

const getUbigeoSupport = async () => {
  const [tableRows, columnRows] = await Promise.all([
    prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('Region', 'Province', 'District')
    `,
    prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'OperationalPoint'
        AND column_name IN ('distrito', 'regionId', 'provinceId', 'districtId')
    `,
  ]);

  const columnSet = new Set(columnRows.map((row) => row.column_name));
  return {
    hasUbigeoTables: tableRows.length === 3,
    hasDistritoColumn: columnSet.has("distrito"),
    hasRegionIdColumn: columnSet.has("regionId"),
    hasProvinceIdColumn: columnSet.has("provinceId"),
    hasDistrictIdColumn: columnSet.has("districtId"),
  };
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
    const support = await getUbigeoSupport();
    const select = {
      id: true,
      createdAt: true,
      updatedAt: true,
      companyId: true,
      clienteId: true,
      nombre: true,
      tipo: true,
      direccion: true,
      ciudad: true,
      departamento: true,
      latitud: true,
      longitud: true,
      linkGoogleMaps: true,
      referencia: true,
      cliente: true,
      ...(support.hasDistritoColumn ? { distrito: true } : {}),
      ...(support.hasRegionIdColumn ? { regionId: true } : {}),
      ...(support.hasProvinceIdColumn ? { provinceId: true } : {}),
      ...(support.hasDistrictIdColumn ? { districtId: true } : {}),
    };
    const points = await prisma.operationalPoint.findMany({
      where: { companyId: auth.session.companyId },
      select,
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      points: points.map((p) => ({
        ...p,
        distrito: support.hasDistritoColumn ? p.distrito ?? null : null,
        regionId: support.hasRegionIdColumn ? p.regionId ?? null : null,
        provinceId: support.hasProvinceIdColumn ? p.provinceId ?? null : null,
        districtId: support.hasDistrictIdColumn ? p.districtId ?? null : null,
        latitud: formatCoord(p.latitud),
        longitud: formatCoord(p.longitud),
      })),
    });
  } catch (error) {
    return jsonServerError(error instanceof Error ? error.message : undefined);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = createPointSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const support = await getUbigeoSupport();
    if (parsed.data.clienteId) {
      const client = await prisma.client.findFirst({
        where: { id: parsed.data.clienteId, companyId },
        select: { id: true },
      });
      if (!client) return jsonBadRequest("Cliente inválido");
    }

    let region: { id: number; nombre: string } | null = null;
    let province: { id: number; nombre: string; regionId: number } | null = null;
    let district: { id: number; nombre: string; provinceId: number } | null = null;
    if (support.hasUbigeoTables) {
      if (parsed.data.regionId !== undefined) {
        region = await prisma.region.findFirst({ where: { id: parsed.data.regionId } });
        if (!region) return jsonBadRequest("Región inválida");
      }
      if (parsed.data.provinceId !== undefined) {
        province = await prisma.province.findFirst({
          where: {
            id: parsed.data.provinceId,
            ...(parsed.data.regionId ? { regionId: parsed.data.regionId } : {}),
          },
        });
        if (!province) return jsonBadRequest("Provincia inválida");
      }
      if (parsed.data.districtId !== undefined) {
        district = await prisma.district.findFirst({
          where: {
            id: parsed.data.districtId,
            ...(parsed.data.provinceId ? { provinceId: parsed.data.provinceId } : {}),
          },
        });
        if (!district) return jsonBadRequest("Distrito inválido");
      }
      if (district && !province) {
        province = await prisma.province.findFirst({ where: { id: district.provinceId } });
      }
      if (province && !region) {
        region = await prisma.region.findFirst({ where: { id: province.regionId } });
      }
    }

    const departamento = region?.nombre ?? parsed.data.departamento?.trim();
    const ciudad = province?.nombre ?? parsed.data.ciudad?.trim();
    const distrito =
      district?.nombre ??
      (parsed.data.distrito === "" ? null : parsed.data.distrito?.trim() ?? null);

    if (!departamento) return jsonBadRequest("Selecciona la región");
    if (!ciudad) return jsonBadRequest("Selecciona la provincia");
    if (!distrito) return jsonBadRequest("Selecciona el distrito");

    const data = {
      companyId,
      clienteId: parsed.data.clienteId,
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      direccion: parsed.data.direccion,
      ciudad,
      departamento,
      latitud: parsed.data.latitud === undefined ? null : decimal(parsed.data.latitud, 6),
      longitud: parsed.data.longitud === undefined ? null : decimal(parsed.data.longitud, 6),
      linkGoogleMaps: parsed.data.linkGoogleMaps ? parsed.data.linkGoogleMaps : null,
      referencia: parsed.data.referencia ? parsed.data.referencia : null,
      ...(support.hasDistritoColumn ? { distrito } : {}),
      ...(support.hasRegionIdColumn ? { regionId: region?.id ?? null } : {}),
      ...(support.hasProvinceIdColumn ? { provinceId: province?.id ?? null } : {}),
      ...(support.hasDistrictIdColumn ? { districtId: district?.id ?? null } : {}),
    };

    const point = await prisma.operationalPoint.create({ data });

    return jsonCreated({
      point: {
        ...point,
        latitud: formatCoord(point.latitud),
        longitud: formatCoord(point.longitud),
      },
    });
  } catch (error) {
    return jsonServerError(error instanceof Error ? error.message : undefined);
  }
}
