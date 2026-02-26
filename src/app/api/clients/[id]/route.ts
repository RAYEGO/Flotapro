import { NextRequest } from "next/server";
import { z } from "zod";

import {
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const updateClientSchema = z.object({
  nombreComercial: z.string().min(2).max(120).optional(),
  razonSocial: z.string().min(2).max(160).optional().or(z.literal("")),
  ruc: z.string().trim().length(11).optional().or(z.literal("")),
  tipo: z.enum(["EMPRESA", "AGENCIA", "EVENTUAL"]).optional(),
  telefono: z.string().min(6).max(30).optional(),
  correo: z.string().email().optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const client = await prisma.client.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
    });
    if (!client) return jsonNotFound();
    return jsonOk({ client });
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
    const parsed = updateClientSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const existing = await prisma.client.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
    });
    if (!existing) return jsonNotFound();

    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        razonSocial: parsed.data.razonSocial === "" ? null : parsed.data.razonSocial,
        ruc: parsed.data.ruc === "" ? null : parsed.data.ruc,
      },
    });

    return jsonOk({ client });
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
    const existing = await prisma.client.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.client.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonServerError();
  }
}
