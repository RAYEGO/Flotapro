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
    <div className="relative min-h-screen overflow-hidden bg-[#0B1F2E]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, #163E5C 0%, #0F2A3D 40%, #0B1F2E 100%)",
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-10 h-72 w-72 rounded-full bg-[#2C7FD1]/12 blur-[140px]" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="min-w-0 pb-28 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
