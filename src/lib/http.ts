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

export function serializeMoney(value: Prisma.Decimal) {
  return value.toFixed(2);
}

export function decimal(value: string | number, scale?: number) {
  const d = new Prisma.Decimal(value);
  if (typeof scale === "number") return new Prisma.Decimal(d.toFixed(scale));
  return d;
}
