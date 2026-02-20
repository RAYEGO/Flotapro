"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Fuel,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Settings,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  const navItems = [
    { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
    { href: "/dashboard/trucks", label: "Camiones", icon: Truck },
    { href: "/dashboard/drivers", label: "Choferes", icon: Users },
    { href: "/dashboard/freights", label: "Fletes", icon: Map },
    { href: "/dashboard/fuels", label: "Combustible", icon: Fuel },
    { href: "/dashboard/maintenance", label: "Mantenimiento", icon: Wrench },
    { href: "/dashboard/settings", label: "Configuración", icon: Settings },
  ];

  return (
    <>
      <aside className="md:hidden">
        <div className="flex items-center justify-between rounded-[24px] bg-[#0D1B2C] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#8DBBFF] hover:bg-white/10"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Link href="/dashboard" className="flex items-center justify-center">
            <span className="relative h-10 w-32">
              <Image
                src="/logo-flotapro.svg"
                alt="FlotaPro"
                fill
                sizes="128px"
                className="object-contain"
                priority
              />
            </span>
          </Link>
          <span className="h-10 w-10" />
        </div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="absolute inset-y-0 left-0 w-72 bg-[linear-gradient(180deg,_#0F1C2F_0%,_#0B1726_100%)] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <span className="relative h-10 w-32">
                  <Image
                    src="/logo-flotapro.svg"
                    alt="FlotaPro"
                    fill
                    sizes="128px"
                    className="object-contain"
                    priority
                  />
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/10"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
              <div className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      className={`flex items-center gap-3 rounded-2xl border-l-2 px-4 py-3 text-[15px] transition-colors duration-200 ${
                        active
                          ? "border-[#7FB5FF] bg-[#111F35] text-[#8DBBFF]"
                          : "border-transparent text-[#9FB2C5] hover:bg-[#111F35]"
                      }`}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Icon
                        className={`h-5 w-5 ${active ? "text-[#7FB5FF]" : "text-[#93A8BB]"}`}
                        strokeWidth={1.5}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <form action="/api/auth/logout" method="post">
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[#9FB2C5] transition-colors duration-200 hover:bg-[#111F35]"
                    type="submit"
                  >
                    <LogOut className="h-5 w-5 text-[#93A8BB]" strokeWidth={1.5} />
                    <span>Salir</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </aside>

      <aside className="hidden rounded-[24px] bg-[linear-gradient(180deg,_#0F1C2F_0%,_#0B1726_100%)] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/5 md:block">
        <Link href="/dashboard" className="flex items-center justify-center py-4">
          <span className="relative hidden h-16 w-56 md:block">
            <Image
              src="/logo-flotapro.svg"
              alt="FlotaPro"
              fill
              sizes="224px"
              className="object-contain"
              priority
            />
          </span>
        </Link>

        <div className="space-y-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                className={`group flex items-center justify-center gap-3 rounded-2xl border-l-2 px-3 py-2 pl-2 text-[15px] transition-colors duration-200 md:justify-start ${
                  active
                    ? "border-[#7FB5FF] bg-[#111F35] text-[#8DBBFF] font-semibold"
                    : "border-transparent text-[#9FB2C5] hover:bg-[#111F35]"
                }`}
                href={item.href}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-[#7FB5FF]" : "text-[#93A8BB]"}`}
                  strokeWidth={1.5}
                />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <form action="/api/auth/logout" method="post">
            <button
              className="group flex w-full items-center justify-center gap-3 rounded-2xl border-l-2 border-transparent px-3 py-2 pl-2 text-sm text-[#9FB2C5] transition-colors duration-200 hover:bg-[#111F35] md:justify-start"
              type="submit"
            >
              <LogOut className="h-5 w-5 text-[#93A8BB]" strokeWidth={1.5} />
              <span className="hidden md:inline">Salir</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
