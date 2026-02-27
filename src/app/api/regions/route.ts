import { NextRequest } from "next/server";

import { jsonBadRequest, jsonOk, jsonServerError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

type UbigeoItem = {
  id_ubigeo: string;
  nombre_ubigeo: string;
  id_padre_ubigeo: string;
};

const parseId = (value: string) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
};

const ensureUbigeoSeeded = async () => {
  const count = await prisma.region.count();
  if (count > 0) return;

  const [regionsRes, provincesRes, districtsRes] = await Promise.all([
    fetch("https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/departamentos.json"),
    fetch("https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/provincias.json"),
    fetch("https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/distritos.json"),
  ]);
  const [regionsRaw, provincesRaw, districtsRaw] = await Promise.all([
    regionsRes.json(),
    provincesRes.json(),
    districtsRes.json(),
  ]);

  const regions = (regionsRaw as UbigeoItem[])
    .map((item) => ({
      id: parseId(item.id_ubigeo),
      nombre: item.nombre_ubigeo,
    }))
    .filter((item) => item.id !== null) as { id: number; nombre: string }[];
  const provinces = (provincesRaw as UbigeoItem[])
    .map((item) => ({
      id: parseId(item.id_ubigeo),
      nombre: item.nombre_ubigeo,
      regionId: parseId(item.id_padre_ubigeo),
    }))
    .filter(
      (item) => item.id !== null && item.regionId !== null,
    ) as { id: number; nombre: string; regionId: number }[];
  const districts = (districtsRaw as UbigeoItem[])
    .map((item) => ({
      id: parseId(item.id_ubigeo),
      nombre: item.nombre_ubigeo,
      provinceId: parseId(item.id_padre_ubigeo),
    }))
    .filter(
      (item) => item.id !== null && item.provinceId !== null,
    ) as { id: number; nombre: string; provinceId: number }[];

  await prisma.$transaction(async (tx) => {
    await tx.region.createMany({ data: regions, skipDuplicates: true });
    await tx.province.createMany({ data: provinces, skipDuplicates: true });
    await tx.district.createMany({ data: districts, skipDuplicates: true });
  });
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    await ensureUbigeoSeeded();
    const regions = await prisma.region.findMany({ orderBy: { nombre: "asc" } });
    return jsonOk({ regions });
  } catch {
    return jsonServerError();
  }
}
