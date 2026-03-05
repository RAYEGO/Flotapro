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
    <div className="dashboard-shell fp-dashboard-bg relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(11,60,93,0.16)_0%,rgba(244,246,248,0)_45%)]" />
      <div className="pointer-events-none absolute -top-24 left-10 h-72 w-72 rounded-full bg-primary/12 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 right-8 h-80 w-80 rounded-full bg-secondary/10 blur-[160px]" />
      <div className="relative mx-auto grid max-w-[1760px] grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[var(--sidebar-width)_1fr] max-[1366px]:gap-4 max-[1366px]:px-4 max-[1366px]:py-4">
        <Sidebar />

        <main className="min-w-0 pb-28 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
