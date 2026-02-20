"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Fuel,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="rounded-[24px] bg-[#0F2A3D] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-1 ring-white/5">
      <Link href="/dashboard" className="flex items-center px-3 py-4">
        <span className="relative hidden h-10 w-40 md:block">
          <Image
            src="/logo.png"
            alt="FlotaPro"
            fill
            sizes="160px"
            className="object-contain"
            priority
          />
        </span>
        <span className="relative h-10 w-10 md:hidden">
          <Image
            src="/logo.png"
            alt="FlotaPro"
            fill
            sizes="40px"
            className="object-contain"
          />
        </span>
      </Link>

      <div className="space-y-1 text-sm">
        <Link
          className={`group flex items-center justify-center gap-3 rounded-xl border-l-[3px] px-3 py-2 pl-2 text-white/80 transition-colors duration-200 hover:bg-[#163E5C] md:justify-start ${
            isActive("/dashboard")
              ? "border-[#F4A300] bg-[#163E5C] text-white font-semibold"
              : "border-transparent"
          }`}
          href="/dashboard"
        >
          <LayoutDashboard
            className={`h-5 w-5 ${isActive("/dashboard") ? "text-[#F4A300]" : "text-white"}`}
            strokeWidth={1.5}
          />
          <span className="hidden md:inline">Resumen</span>
        </Link>
        <Link
          className={`group flex items-center justify-center gap-3 rounded-xl border-l-[3px] px-3 py-2 pl-2 text-white/80 transition-colors duration-200 hover:bg-[#163E5C] md:justify-start ${
            isActive("/dashboard/trucks")
              ? "border-[#F4A300] bg-[#163E5C] text-white font-semibold"
              : "border-transparent"
          }`}
          href="/dashboard/trucks"
        >
          <Truck
            className={`h-5 w-5 ${isActive("/dashboard/trucks") ? "text-[#F4A300]" : "text-white"}`}
            strokeWidth={1.5}
          />
          <span className="hidden md:inline">Camiones</span>
        </Link>
        <Link
          className={`group flex items-center justify-center gap-3 rounded-xl border-l-[3px] px-3 py-2 pl-2 text-white/80 transition-colors duration-200 hover:bg-[#163E5C] md:justify-start ${
            isActive("/dashboard/drivers")
              ? "border-[#F4A300] bg-[#163E5C] text-white font-semibold"
              : "border-transparent"
          }`}
          href="/dashboard/drivers"
        >
          <Users
            className={`h-5 w-5 ${isActive("/dashboard/drivers") ? "text-[#F4A300]" : "text-white"}`}
            strokeWidth={1.5}
          />
          <span className="hidden md:inline">Choferes</span>
        </Link>
        <Link
          className={`group flex items-center justify-center gap-3 rounded-xl border-l-[3px] px-3 py-2 pl-2 text-white/80 transition-colors duration-200 hover:bg-[#163E5C] md:justify-start ${
            isActive("/dashboard/freights")
              ? "border-[#F4A300] bg-[#163E5C] text-white font-semibold"
              : "border-transparent"
          }`}
          href="/dashboard/freights"
        >
          <Map
            className={`h-5 w-5 ${isActive("/dashboard/freights") ? "text-[#F4A300]" : "text-white"}`}
            strokeWidth={1.5}
          />
          <span className="hidden md:inline">Fletes</span>
        </Link>
        <Link
          className={`group flex items-center justify-center gap-3 rounded-xl border-l-[3px] px-3 py-2 pl-2 text-white/80 transition-colors duration-200 hover:bg-[#163E5C] md:justify-start ${
            isActive("/dashboard/fuels")
              ? "border-[#F4A300] bg-[#163E5C] text-white font-semibold"
              : "border-transparent"
          }`}
          href="/dashboard/fuels"
        >
          <Fuel
            className={`h-5 w-5 ${isActive("/dashboard/fuels") ? "text-[#F4A300]" : "text-white"}`}
            strokeWidth={1.5}
          />
          <span className="hidden md:inline">Combustible</span>
        </Link>
        <Link
          className={`group flex items-center justify-center gap-3 rounded-xl border-l-[3px] px-3 py-2 pl-2 text-white/80 transition-colors duration-200 hover:bg-[#163E5C] md:justify-start ${
            isActive("/dashboard/maintenance")
              ? "border-[#F4A300] bg-[#163E5C] text-white font-semibold"
              : "border-transparent"
          }`}
          href="/dashboard/maintenance"
        >
          <Wrench
            className={`h-5 w-5 ${isActive("/dashboard/maintenance") ? "text-[#F4A300]" : "text-white"}`}
            strokeWidth={1.5}
          />
          <span className="hidden md:inline">Mantenimiento</span>
        </Link>
        <Link
          className={`group flex items-center justify-center gap-3 rounded-xl border-l-[3px] px-3 py-2 pl-2 text-white/80 transition-colors duration-200 hover:bg-[#163E5C] md:justify-start ${
            isActive("/dashboard/settings")
              ? "border-[#F4A300] bg-[#163E5C] text-white font-semibold"
              : "border-transparent"
          }`}
          href="/dashboard/settings"
        >
          <Settings
            className={`h-5 w-5 ${isActive("/dashboard/settings") ? "text-[#F4A300]" : "text-white"}`}
            strokeWidth={1.5}
          />
          <span className="hidden md:inline">Configuración</span>
        </Link>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <form action="/api/auth/logout" method="post">
          <button
            className="group flex w-full items-center justify-center gap-3 rounded-xl border-l-[3px] border-transparent px-3 py-2 pl-2 text-sm text-white/80 transition-colors duration-200 hover:bg-[#163E5C] md:justify-start"
            type="submit"
          >
            <LogOut className="h-5 w-5 text-white" strokeWidth={1.5} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
