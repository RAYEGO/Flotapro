import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import {
  jsonBadRequest,
  jsonOk,
  jsonServerError,
  jsonUnauthorized,
} from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        companyId: true,
        company: { select: { id: true, name: true, ruc: true } },
      },
    });

    if (!user) return jsonUnauthorized();

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return jsonUnauthorized();

    await setSessionCookie({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    return jsonOk({
      company: user.company,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    return jsonServerError();
  }
}
