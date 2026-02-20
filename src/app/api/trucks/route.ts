import { z } from "zod";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import {
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonServerError,
  serializeMoney,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const createTruckSchema = z.object({
  placa: z.string().min(5).max(12),
  marca: z.string().min(1).max(80),
  modelo: z.string().min(1).max(80),
  anio: z.number().int().min(1950).max(2100),
  tipo: z.string().min(1).max(80),
  kilometrajeActual: z.number().int().min(0).max(10_000_000),
  estado: z.enum(["ACTIVO", "INACTIVO", "TALLER", "VENDIDO"]).optional(),
  modoOperacion: z.enum(["DIRECTO", "ALQUILER"]).optional().default("DIRECTO"),
  montoPorVueltaDueno: z.coerce.number().nonnegative().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const trucks = await prisma.truck.findMany({
      where: { companyId: auth.session.companyId },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      trucks: trucks.map((t) => ({
        ...t,
        montoPorVueltaDueno:
          t.montoPorVueltaDueno === null ? null : serializeMoney(t.montoPorVueltaDueno),
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
    const parsed = createTruckSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const truck = await prisma.truck.create({
      data: { companyId: auth.session.companyId, ...parsed.data },
    });

    return jsonCreated({
      truck: {
        ...truck,
        montoPorVueltaDueno:
          truck.montoPorVueltaDueno === null ? null : serializeMoney(truck.montoPorVueltaDueno),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return jsonBadRequest("Placa ya registrada");
    }
    return jsonServerError();
  }
}
