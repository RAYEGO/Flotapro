import { Prisma } from "@prisma/client";

export function jsonOk(data: unknown, init?: ResponseInit) {
  return Response.json(data, { status: 200, ...init });
}

export function jsonCreated(data: unknown, init?: ResponseInit) {
  return Response.json(data, { status: 201, ...init });
}

export function jsonBadRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function jsonUnauthorized() {
  return Response.json({ error: "No autorizado" }, { status: 401 });
}

export function jsonForbidden() {
  return Response.json({ error: "Prohibido" }, { status: 403 });
}

export function jsonNotFound() {
  return Response.json({ error: "No encontrado" }, { status: 404 });
}

export function jsonServerError(message?: string) {
  return Response.json({ error: message ?? "Error interno" }, { status: 500 });
}

export function jsonPrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonBadRequest("Registro duplicado");
    }
    if (error.code === "P2003") {
      return jsonBadRequest("Referencia inválida");
    }
    if (error.code === "P2011") {
      return jsonBadRequest("Campo requerido");
    }
    if (error.code === "P2025") {
      return jsonNotFound();
    }
    if (error.code === "P2000") {
      return jsonBadRequest("Valor demasiado largo");
    }
    return jsonServerError(error.message);
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return jsonBadRequest("Datos inválidos");
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return jsonServerError("Error de conexión a la base de datos");
  }
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return jsonServerError("Error interno de Prisma");
  }
  return jsonServerError(error instanceof Error ? error.message : undefined);
}

export function serializeMoney(value: Prisma.Decimal | null | undefined) {
  if (value === null || value === undefined) return "0.00";
  return value.toFixed(2);
}

export function decimal(value: string | number, scale?: number) {
  const d = new Prisma.Decimal(value);
  if (typeof scale === "number") return new Prisma.Decimal(d.toFixed(scale));
  return d;
}
