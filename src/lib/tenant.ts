import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

import { getSessionFromRequest } from "./auth";
import { jsonForbidden, jsonUnauthorized } from "./http";

export async function requireSession(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return { ok: false as const, response: jsonUnauthorized() };
  return { ok: true as const, session };
}

export async function requireAdmin(req: NextRequest) {
  const auth = await requireSession(req);
  if (!auth.ok) return auth;
  if (auth.session.role !== Role.ADMIN) {
    return { ok: false as const, response: jsonForbidden() };
  }
  return auth;
}
