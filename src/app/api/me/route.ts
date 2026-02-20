import { NextRequest } from "next/server";

import { jsonOk, jsonUnauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;
  const session = auth.session;

  const user = await prisma.user.findFirst({
    where: { id: session.userId, companyId: session.companyId },
    select: { id: true, email: true, name: true, role: true, companyId: true },
  });

  if (!user) return jsonUnauthorized();
  return jsonOk({ user });
}
