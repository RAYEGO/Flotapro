import { z } from "zod";
import { NextRequest } from "next/server";

import {
  decimal,
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonServerError,
  serializeMoney,
} from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/tenant";

const createExpenseSchema = z.object({
  freightId: z.string().min(1),
  fecha: z.string().datetime(),
  concepto: z.string().min(2).max(120),
  monto: z.coerce.number().nonnegative(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const expenses = await prisma.freightExpense.findMany({
      where: { companyId: auth.session.companyId },
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
      orderBy: { fecha: "desc" },
    });

    return jsonOk({
      expenses: expenses.map((e) => ({ ...e, monto: serializeMoney(e.monto) })),
    });
  } catch {
    return jsonServerError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = createExpenseSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const companyId = auth.session.companyId;
    const freight = await prisma.freight.findFirst({
      where: { id: parsed.data.freightId, companyId },
      select: { id: true },
    });
    if (!freight) return jsonBadRequest("Flete inválido");

    const expense = await prisma.freightExpense.create({
      data: {
        companyId,
        freightId: parsed.data.freightId,
        fecha: new Date(parsed.data.fecha),
        concepto: parsed.data.concepto,
        monto: decimal(parsed.data.monto, 2),
      },
    });

    return jsonCreated({
      expense: { ...expense, monto: serializeMoney(expense.monto) },
    });
  } catch {
    return jsonServerError();
  }
}
