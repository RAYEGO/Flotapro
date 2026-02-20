import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";

export default async function Home() {
  const token = (await cookies()).get("fp_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  redirect(session ? "/dashboard" : "/login");
}
