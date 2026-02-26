import { z } from "zod";
import { NextRequest } from "next/server";

import {
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonServerError,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const createClientSchema = z.object({
  nombreComercial: z.string().min(2).max(120),
  razonSocial: z.string().min(2).max(160).optional().or(z.literal("")),
  ruc: z.string().trim().length(11).optional().or(z.literal("")),
  tipo: z.enum(["EMPRESA", "AGENCIA", "EVENTUAL"]).optional(),
  telefono: z.string().min(6).max(30),
  correo: z.string().email(),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const clients = await prisma.client.findMany({
      where: { companyId: auth.session.companyId },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ clients });
  } catch {
    return jsonServerError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = createClientSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const client = await prisma.client.create({
      data: {
        companyId: auth.session.companyId,
        nombreComercial: parsed.data.nombreComercial,
        razonSocial: parsed.data.razonSocial ? parsed.data.razonSocial : null,
        ruc: parsed.data.ruc ? parsed.data.ruc : null,
        tipo: parsed.data.tipo,
        telefono: parsed.data.telefono,
        correo: parsed.data.correo,
        estado: parsed.data.estado,
      },
    });

    return jsonCreated({ client });
  } catch {
    return jsonServerError();
  }
}
