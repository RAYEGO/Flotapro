import { Prisma, Role } from "@prisma/client";
import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import { jsonBadRequest, jsonCreated, jsonServerError } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  companyName: z.string().min(2).max(120),
  ruc: z.string().trim().length(11).optional().or(z.literal("")),
  email: z.string().email(),
  name: z.string().min(2).max(120),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  try {
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) return jsonBadRequest("Datos inválidos");

    const { companyName, ruc, email, name, password } = parsed.data;

    const passwordHash = await hashPassword(password);

    const result = await prisma.company.create({
      data: {
        name: companyName,
        ruc: ruc ? ruc : null,
        users: {
          create: {
            email: email.toLowerCase(),
            name,
            passwordHash,
            role: Role.ADMIN,
          },
        },
      },
      include: { users: true },
    });

    const user = result.users[0];

    await setSessionCookie({
      userId: user.id,
      companyId: result.id,
      role: user.role,
    });

    return jsonCreated({
      company: { id: result.id, name: result.name, ruc: result.ruc },
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return jsonBadRequest("Email ya registrado");
    }
    if (err instanceof Prisma.PrismaClientInitializationError) {
      return jsonServerError(
        "No se pudo conectar a la base de datos. Revisa DATABASE_URL y que PostgreSQL esté corriendo.",
      );
    }
    return jsonServerError();
  }
}
