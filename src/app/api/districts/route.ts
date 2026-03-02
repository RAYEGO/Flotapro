import { NextRequest } from "next/server";

import { jsonBadRequest, jsonOk, jsonServerError } from "@/lib/http";
import { requireSession } from "@/lib/tenant";

type UbigeoItem = {
  id_ubigeo: string;
  nombre_ubigeo: string;
  id_padre_ubigeo: string;
};

const UBIGEO_DISTRICTS_URL =
  "https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/distritos.json";

const parseId = (value: string) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
};

const fetchDistrictsFromRemote = async (provinceId: number) => {
  const res = await fetch(UBIGEO_DISTRICTS_URL, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) {
    throw new Error(`Ubigeo fetch failed: ${res.status} ${res.statusText}`);
  }

  const districtsByProvince = (await res.json()) as Record<string, UbigeoItem[]>;
  const districtsRaw = districtsByProvince[String(provinceId)] ?? [];
  const districts = districtsRaw
    .map((item) => ({
      id: parseId(item.id_ubigeo),
      nombre: item.nombre_ubigeo,
      provinceId: parseId(item.id_padre_ubigeo),
    }))
    .filter(
      (item) => item.id !== null && item.provinceId === provinceId,
    ) as { id: number; nombre: string; provinceId: number }[];

  return districts.sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export async function GET(req: NextRequest) {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const provinceIdParam = searchParams.get("provinceId");
  const provinceId = provinceIdParam ? Number(provinceIdParam) : NaN;
  if (!provinceIdParam || Number.isNaN(provinceId)) {
    return jsonBadRequest("Provincia inválida");
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const districts = await prisma.district.findMany({
      where: { provinceId },
      orderBy: { nombre: "asc" },
    });
    if (districts.length > 0) return jsonOk({ districts });
  } catch (error) {
    console.error(error);
  }

  try {
    const districts = await fetchDistrictsFromRemote(provinceId);
    return jsonOk({ districts });
  } catch (error) {
    console.error(error);
    return jsonServerError("No se pudo cargar distritos");
  }
}
