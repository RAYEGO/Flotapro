import { NextRequest } from "next/server";

import { jsonBadRequest, jsonOk, jsonServerError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

type UbigeoItem = {
  id_ubigeo: string;
  nombre_ubigeo: string;
  id_padre_ubigeo: string;
};

const UBIGEO_PROVINCES_URL =
  "https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/provincias.json";

const parseId = (value: string) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
};

const fetchProvincesFromRemote = async (regionId: number) => {
  const res = await fetch(UBIGEO_PROVINCES_URL, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) {
    throw new Error(`Ubigeo fetch failed: ${res.status} ${res.statusText}`);
  }

  const provincesRaw = (await res.json()) as UbigeoItem[];
  const provinces = provincesRaw
    .map((item) => ({
      id: parseId(item.id_ubigeo),
      nombre: item.nombre_ubigeo,
      regionId: parseId(item.id_padre_ubigeo),
    }))
    .filter((item) => item.id !== null && item.regionId === regionId) as {
    id: number;
    nombre: string;
    regionId: number;
  }[];

  return provinces.sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const regionIdParam = searchParams.get("regionId");
  const regionId = regionIdParam ? Number(regionIdParam) : NaN;
  if (!regionIdParam || Number.isNaN(regionId)) {
    return jsonBadRequest("Región inválida");
  }

  try {
    const provinces = await prisma.province.findMany({
      where: { regionId },
      orderBy: { nombre: "asc" },
    });
    if (provinces.length > 0) return jsonOk({ provinces });
  } catch (error) {
    console.error(error);
  }

  try {
    const provinces = await fetchProvincesFromRemote(regionId);
    return jsonOk({ provinces });
  } catch (error) {
    console.error(error);
    return jsonServerError("No se pudo cargar provincias");
  }
}
