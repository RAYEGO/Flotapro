import { NextRequest } from "next/server";
import { z } from "zod";

import {
  decimal,
  jsonBadRequest,
  jsonNotFound,
  jsonOk,
  jsonPrismaError,
  serializeMoney,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const updateExpenseSchema = z.object({
  freightId: z.string().min(1).optional(),
  fecha: z.string().datetime().optional(),
  concepto: z.string().min(2).max(120).optional(),
  monto: z.coerce.number().finite().nonnegative().optional(),
});

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const expense = await prisma.freightExpense.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      include: {
        freight: {
          include: {
            truck: true,
            driver: true,
            customer: true,
            originPoint: true,
            destinationPoint: true,
          },
        },
      },
    });
    if (!expense) return jsonNotFound();
    return jsonOk({ expense: { ...expense, monto: serializeMoney(expense.monto) } });
  } catch (error) {
    return jsonPrismaError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = updateExpenseSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const existing = await prisma.freightExpense.findFirst({
      where: { id: ctx.params.id, companyId },
    });
    if (!existing) return jsonNotFound();

    const nextFreightId = parsed.data.freightId ?? existing.freightId;
    const freight = await prisma.freight.findFirst({
      where: { id: nextFreightId, companyId },
      select: { id: true },
    });
    if (!freight) return jsonBadRequest("Flete inválido");

    const expense = await prisma.freightExpense.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        freightId: nextFreightId,
        fecha: parsed.data.fecha ? new Date(parsed.data.fecha) : undefined,
        monto: parsed.data.monto === undefined ? undefined : decimal(parsed.data.monto, 2),
      },
    });

    return jsonOk({ expense: { ...expense, monto: serializeMoney(expense.monto) } });
  } catch (error) {
    return jsonPrismaError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.freightExpense.findFirst({
      where: { id: ctx.params.id, companyId: auth.session.companyId },
      select: { id: true },
    });
    if (!existing) return jsonNotFound();

    await prisma.freightExpense.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonPrismaError(error);
  }
}
