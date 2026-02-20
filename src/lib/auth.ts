import { Role } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export type Session = {
  userId: string;
  companyId: string;
  role: Role;
};

const SESSION_COOKIE = "fp_session";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return new TextEncoder().encode("dev-secret-change-me");
    }
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: Session) {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ companyId: session.companyId, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt(now)
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = payload.sub;
    const companyId = payload.companyId;
    const role = payload.role;

    if (typeof userId !== "string") return null;
    if (typeof companyId !== "string") return null;
    if (role !== Role.ADMIN && role !== Role.USER) return null;

    return { userId, companyId, role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(
  req: NextRequest,
): Promise<Session | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(session: Session) {
  const token = await createSessionToken(session);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
