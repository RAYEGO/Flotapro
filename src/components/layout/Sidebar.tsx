"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Fuel,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Settings,
  Truck,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string | null; email: string; role: string } | null>(
    null
  );
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  const navSections = [
    {
      title: "Operaciones",
      items: [
        { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
        { href: "/dashboard/freights", label: "Fletes", icon: Map },
        { href: "/dashboard/operational-points", label: "Puntos operativos", icon: MapPin },
      ],
    },
    {
      title: "Flota",
      items: [
        { href: "/dashboard/trucks", label: "Camiones", icon: Truck },
        { href: "/dashboard/drivers", label: "Choferes", icon: Users },
        { href: "/dashboard/fuels", label: "Combustible", icon: Fuel },
        { href: "/dashboard/maintenance", label: "Mantenimiento", icon: Wrench },
      ],
    },
    {
      title: "Sistema",
      items: [{ href: "/dashboard/settings", label: "Configuración", icon: Settings }],
    },
  ];
  const primaryMobileItems = [
    { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
    { href: "/dashboard/trucks", label: "Camiones", icon: Truck },
    { href: "/dashboard/freights", label: "Fletes", icon: Map },
    { href: "/dashboard/maintenance", label: "Mantenimiento", icon: Wrench },
  ];
  const secondaryMobileItems = [
    { href: "/dashboard/drivers", label: "Choferes", icon: Users },
    { href: "/dashboard/operational-points", label: "Puntos", icon: MapPin },
    { href: "/dashboard/fuels", label: "Combustible", icon: Fuel },
    { href: "/dashboard/settings", label: "Configuración", icon: Settings },
  ];
  const userLabel = user?.name ?? user?.email ?? "Usuario activo";
  const userRole =
    user?.role === "ADMIN"
      ? "Administrador"
      : user?.role === "USER"
        ? "Usuario"
        : "Sesión activa";

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { user?: { name: string | null; email: string; role: string } };
        return data.user ?? null;
      })
      .then((data) => {
        if (active && data) setUser(data);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const shell = document.querySelector(".dashboard-shell");
    if (!(shell instanceof HTMLElement)) return;
    if (isCollapsed) {
      shell.setAttribute("data-sidebar-collapsed", "true");
    } else {
      shell.removeAttribute("data-sidebar-collapsed");
    }
  }, [isCollapsed]);

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
        <nav className="fixed bottom-0 left-0 right-0 z-40">
          <div className="rounded-t-[24px] bg-[#0D1B2C] px-2 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
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

      <aside
        className={`hidden rounded-[24px] bg-[linear-gradient(180deg,_#0F1C2F_0%,_#0B1726_100%)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/5 md:block md:w-[var(--sidebar-width)] md:max-h-[calc(100vh-3rem)] md:overflow-y-auto md:overflow-x-hidden md:overscroll-contain md:sticky md:top-6 md:self-start ${
          isCollapsed ? "p-3 min-[1366px]:p-3" : "p-4 min-[1366px]:p-5 min-[1920px]:p-6"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors duration-200 hover:bg-white/5 ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            <span className="relative h-10 w-10 min-[1920px]:h-12 min-[1920px]:w-12">
              <Image
                src="/logo-flotapro.svg"
                alt="FlotaPro"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </span>
            <span className={`flex min-w-0 flex-col ${isCollapsed ? "hidden" : "min-[1366px]:flex"}`}>
              <span className="text-base font-semibold text-white">FlotaPro</span>
              <span className="text-xs text-[#9FB2C5]">Gestión inteligente</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#9FB2C5] transition hover:bg-white/5 hover:text-[#DCEBFF] min-[1366px]:flex min-[1920px]:hidden"
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>

        <div
          className={`mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 ${
            isCollapsed ? "hidden" : "min-[1366px]:block"
          }`}
        >
          <div className="text-xs uppercase tracking-[0.2em] text-[#7B91AA]">Usuario activo</div>
          <div className="mt-2 flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-[#9FC5FF]" strokeWidth={1.4} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{userLabel}</div>
              <div className="text-xs text-[#9FB2C5]">{userRole}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5 text-sm">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <div
                className={`px-3 text-[11px] uppercase tracking-[0.2em] text-[#6E86A3] ${
                  isCollapsed ? "hidden" : "min-[1366px]:block"
                }`}
              >
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      className={`group flex min-w-0 items-center gap-3 rounded-2xl border-l-4 px-3 py-2 text-[15px] transition-colors duration-200 ${
                        isCollapsed
                          ? "justify-center"
                          : "min-[1366px]:justify-start min-[1366px]:pl-3"
                      } ${
                        active
                          ? "border-[#9FC5FF] bg-[#13263E] text-[#DCEBFF] font-semibold"
                          : "border-transparent text-[#9FB2C5] hover:bg-[#12263D] hover:text-[#D5E6FF]"
                      }`}
                      href={item.href}
                    >
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          active ? "text-[#A7CCFF]" : "text-[#93A8BB]"
                        }`}
                        strokeWidth={1.5}
                      />
                      <span
                        className={`truncate ${
                          isCollapsed ? "hidden" : "hidden min-[1366px]:inline"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <form action="/api/auth/logout" method="post">
            <button
              className={`group flex w-full min-w-0 items-center gap-3 rounded-2xl border-l-4 border-transparent px-3 py-2 text-sm text-[#9FB2C5] transition-colors duration-200 hover:bg-[#12263D] hover:text-[#D5E6FF] ${
                isCollapsed ? "justify-center" : "min-[1366px]:justify-start"
              }`}
              type="submit"
            >
              <LogOut className="h-5 w-5 text-[#93A8BB]" strokeWidth={1.5} />
              <span className={`${isCollapsed ? "hidden" : "hidden min-[1366px]:inline"}`}>
                Salir
              </span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
