import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

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
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-primary text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-4">
          <form action="/api/auth/logout" method="post">
            <button className="text-sm font-medium text-white/90 underline" type="submit">
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[220px_1fr]">
        <Sidebar />

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
