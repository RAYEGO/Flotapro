import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("fp_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-sm font-semibold text-zinc-900">
            FlotaPro
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="text-sm font-medium text-zinc-700 underline" type="submit">
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[220px_1fr]">
        <nav className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="space-y-1 text-sm">
            <Link className="block rounded-lg px-3 py-2 text-zinc-900 hover:bg-zinc-50" href="/dashboard">
              Resumen
            </Link>
            <Link className="block rounded-lg px-3 py-2 text-zinc-900 hover:bg-zinc-50" href="/dashboard/trucks">
              Camiones
            </Link>
            <Link className="block rounded-lg px-3 py-2 text-zinc-900 hover:bg-zinc-50" href="/dashboard/drivers">
              Choferes
            </Link>
            <Link className="block rounded-lg px-3 py-2 text-zinc-900 hover:bg-zinc-50" href="/dashboard/freights">
              Fletes
            </Link>
            <Link className="block rounded-lg px-3 py-2 text-zinc-900 hover:bg-zinc-50" href="/dashboard/fuels">
              Combustible
            </Link>
            <Link className="block rounded-lg px-3 py-2 text-zinc-900 hover:bg-zinc-50" href="/dashboard/maintenance">
              Mantenimiento
            </Link>
          </div>
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
