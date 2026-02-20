import { z } from "zod";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import {
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const createDriverSchema = z.object({
  nombre: z.string().min(2).max(120),
  dni: z.string().trim().length(8),
  licencia: z.string().min(3).max(40),
  fechaVencimiento: z.string().datetime(),
  telefono: z.string().min(6).max(30).optional().or(z.literal("")),
  truckId: z.string().min(1).optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const drivers = await prisma.driver.findMany({
      where: { companyId: auth.session.companyId },
      include: { truck: true },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ drivers });
  } catch {
    return jsonServerError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = createDriverSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const data = parsed.data;
    const truckId = data.truckId ? data.truckId : null;
    const telefono = data.telefono ? data.telefono : null;

    if (truckId) {
      const truck = await prisma.truck.findFirst({
        where: { id: truckId, companyId: auth.session.companyId },
        select: { id: true },
      });
      if (!truck) return jsonBadRequest("Camión inválido");
    }

    const driver = await prisma.driver.create({
      data: {
        companyId: auth.session.companyId,
        nombre: data.nombre,
        dni: data.dni,
        licencia: data.licencia,
        fechaVencimiento: new Date(data.fechaVencimiento),
        telefono,
        truckId,
      },
    });

    return jsonCreated({ driver });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return jsonBadRequest("DNI ya registrado");
    }
    return jsonServerError();
  }
}
