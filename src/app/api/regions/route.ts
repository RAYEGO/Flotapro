import { NextRequest } from "next/server";

import { jsonBadRequest, jsonOk, jsonServerError } from "@/lib/http";
import { requireSession } from "@/lib/tenant";

type UbigeoItem = {
  id_ubigeo: string;
  nombre_ubigeo: string;
  id_padre_ubigeo: string;
};

const UBIGEO_REGIONS_URL =
  "https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/departamentos.json";

const parseId = (value: string) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
};

const fetchRegionsFromRemote = async () => {
  const res = await fetch(UBIGEO_REGIONS_URL, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) {
    throw new Error(`Ubigeo fetch failed: ${res.status} ${res.statusText}`);
  }
  const regionsRaw = (await res.json()) as UbigeoItem[];

  const regions = regionsRaw
    .map((item) => ({
      id: parseId(item.id_ubigeo),
      nombre: item.nombre_ubigeo,
    }))
    .filter((item) => item.id !== null) as { id: number; nombre: string }[];

  return regions.sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export async function GET(req: NextRequest) {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;

  try {
    const regions = await fetchRegionsFromRemote();
    return jsonOk({ regions });
  } catch (error) {
    console.error(error);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const regions = await prisma.region.findMany({ orderBy: { nombre: "asc" } });
    return jsonOk({ regions });
  } catch (error) {
    console.error(error);
    return jsonServerError("No se pudo cargar regiones");
  }
}
