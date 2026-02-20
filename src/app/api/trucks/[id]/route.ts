import { z } from "zod";
import { NextRequest } from "next/server";

import {
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const updateTruckSchema = z.object({
  placa: z.string().min(5).max(12).optional(),
  marca: z.string().min(1).max(80).optional(),
  modelo: z.string().min(1).max(80).optional(),
  anio: z.number().int().min(1950).max(2100).optional(),
  tipo: z.string().min(1).max(80).optional(),
  kilometrajeActual: z.number().int().min(0).max(10_000_000).optional(),
  estado: z.enum(["ACTIVO", "INACTIVO", "TALLER", "VENDIDO"]).optional(),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const truck = await prisma.truck.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
    });
    if (!truck) return jsonNotFound();
    return jsonOk({ truck });
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
    const parsed = updateTruckSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const existing = await prisma.truck.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    const truck = await prisma.truck.update({
      where: { id: existing.id },
      data: parsed.data,
    });

    return jsonOk({ truck });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return jsonBadRequest("Placa ya registrada");
    }
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
    const existing = await prisma.truck.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.truck.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonServerError();
  }
}
