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
  Settings,
  Truck,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
  const primaryMobileItems = [
    { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
    { href: "/dashboard/trucks", label: "Camiones", icon: Truck },
    { href: "/dashboard/freights", label: "Fletes", icon: Map },
    { href: "/dashboard/maintenance", label: "Mantenimiento", icon: Wrench },
  ];
  const secondaryMobileItems = [
    { href: "/dashboard/drivers", label: "Choferes", icon: Users },
    { href: "/dashboard/fuels", label: "Combustible", icon: Fuel },
    { href: "/dashboard/settings", label: "Configuración", icon: Settings },
  ];

  return (
    <>
      <aside className="md:hidden">
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D1B2C] text-[#8DBBFF] shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
        >
          <UserCircle className="h-6 w-6" strokeWidth={1.5} />
        </button>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="absolute right-4 top-4 w-64 rounded-[24px] bg-[linear-gradient(180deg,_#0F1C2F_0%,_#0B1726_100%)] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
              <div className="space-y-1">
                {secondaryMobileItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors duration-200 ${
                        active
                          ? "bg-[#111F35] text-[#8DBBFF]"
                          : "text-[#9FB2C5] hover:bg-[#111F35]"
                      }`}
                      href={item.href}
                      onClick={() => setIsProfileOpen(false)}
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
              <div className="mt-3 border-t border-white/10 pt-3">
                <form action="/api/auth/logout" method="post">
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-[#9FB2C5] transition-colors duration-200 hover:bg-[#111F35]"
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
        <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          <div className="rounded-[24px] bg-[#0D1B2C] px-2 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-2 px-1">
              {primaryMobileItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    className={`flex min-w-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs transition-colors duration-200 ${
                      active
                        ? "bg-[#111F35] text-[#8DBBFF] shadow-[inset_0_2px_0_0_#7FB5FF]"
                        : "text-[#9FB2C5] hover:bg-[#111F35]"
                    }`}
                    href={item.href}
                  >
                    <Icon
                      className={`h-5 w-5 ${active ? "text-[#7FB5FF]" : "text-[#93A8BB]"}`}
                      strokeWidth={1.5}
                    />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
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
