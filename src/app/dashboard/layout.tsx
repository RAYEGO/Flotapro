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
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[260px_1fr]">
        <Sidebar />

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
