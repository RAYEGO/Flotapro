"use client";

import { BadgeDollarSign, Percent, ReceiptText, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Summary = {
  ingresos: string;
  gastoCombustible: string;
  gastoMantenimiento: string;
  utilidadNeta: string;
};

type Alert = {
  id: string;
  truckId: string;
  placa: string;
  tipo: string;
  proximoKm: number;
  kilometrajeActual: number;
  restanteKm: number;
};

export default function DashboardPage() {
  const [activeTrucks, setActiveTrucks] = useState<number | null>(null);
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const query = useMemo(() => new URLSearchParams({ month }).toString(), [month]);
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);
  const monthLabel = useMemo(() => {
    const date = new Date(`${month}-01T00:00:00`);
    return date.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  }, [month]);
  const toNumber = (value?: string | null) => {
    if (!value) return null;
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const formatCurrency = (value: number | null) => {
    if (value === null) return "—";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      maximumFractionDigits: 0,
    }).format(value);
  };
  const formatPercent = (value: number | null) => {
    if (value === null) return "—";
    return `${value.toFixed(1)}%`;
  };
  const ingresosNum = toNumber(summary?.ingresos);
  const combustibleNum = toNumber(summary?.gastoCombustible);
  const mantenimientoNum = toNumber(summary?.gastoMantenimiento);
  const utilidadNum = toNumber(summary?.utilidadNeta);
  const costosNum =
    combustibleNum === null || mantenimientoNum === null
      ? null
      : combustibleNum + mantenimientoNum;
  const rentabilidadNum =
    ingresosNum && utilidadNum !== null ? (utilidadNum / ingresosNum) * 100 : null;
  const alertStatus = (restanteKm: number) => {
    if (restanteKm <= 100) {
      return { label: "Urgente", className: "bg-danger/15 text-danger" };
    }
    if (restanteKm <= 300) {
      return { label: "Próximo mantenimiento", className: "bg-accent/20 text-accent" };
    }
    return { label: "OK", className: "bg-secondary/15 text-secondary" };
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/summary?${query}`, {
          headers: { "content-type": "application/json" },
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "No se pudo cargar el resumen");
        }
        const data = (await res.json()) as {
          month: string;
          summary: Summary;
          maintenanceAlerts: Alert[];
        };
        if (cancelled) return;
        setSummary(data.summary);
        setAlerts(data.maintenanceAlerts);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error");
        setSummary(null);
        setAlerts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/trucks", {
          headers: { "content-type": "application/json" },
        });
        if (!res.ok) throw new Error("No se pudo cargar camiones");
        const data = (await res.json()) as { trucks: { estado: string }[] };
        if (cancelled) return;
        setActiveTrucks(data.trucks.filter((t) => t.estado === "ACTIVO").length);
      } catch {
        if (!cancelled) setActiveTrucks(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-[0_20px_50px_rgba(15,42,61,0.08)] ring-1 ring-black/5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary/80">
              {greeting}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-dark">
              Centro de control de flota
            </h1>
            <p className="mt-2 text-sm text-dark/70">
              Visión estratégica de ingresos, costos y alertas críticas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-2xl bg-background px-4 py-3 text-sm text-dark/80 ring-1 ring-black/5">
              Mes
              <input
                className="bg-transparent outline-none"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-sm text-dark/80 ring-1 ring-black/5">
              <span className="text-dark/50">Mes actual</span>
              <span className="font-semibold text-dark">{monthLabel}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-sm text-dark/80 ring-1 ring-black/5">
              <span className="text-dark/50">Camiones activos</span>
              <span className="font-semibold text-dark">
                {activeTrucks === null ? "—" : activeTrucks}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Ingresos",
            value: formatCurrency(ingresosNum),
            icon: BadgeDollarSign,
            tone: "text-primary",
          },
          {
            label: "Costos totales",
            value: formatCurrency(costosNum),
            icon: ReceiptText,
            tone: "text-dark",
          },
          {
            label: "Utilidad neta",
            value: formatCurrency(utilidadNum),
            icon: TrendingUp,
            tone: utilidadNum !== null && utilidadNum < 0 ? "text-danger" : "text-secondary",
          },
          {
            label: "Rentabilidad",
            value: formatPercent(rentabilidadNum),
            icon: Percent,
            tone:
              rentabilidadNum !== null && rentabilidadNum < 0
                ? "text-danger"
                : "text-secondary",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl bg-white p-6 shadow-[0_15px_40px_rgba(15,42,61,0.08)] ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-dark/50">
                  {kpi.label}
                </span>
                <span className="rounded-full bg-background p-2 text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
              </div>
              <div className={`mt-4 text-3xl font-semibold ${kpi.tone}`}>
                {loading ? "..." : kpi.value}
              </div>
              <div className="mt-2 text-xs text-dark/60">
                Vs mes anterior · <span className="font-semibold text-dark/80">—</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-[0_18px_40px_rgba(15,42,61,0.08)] ring-1 ring-black/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-dark">Alertas de mantenimiento</h2>
            <p className="mt-1 text-sm text-dark/70">
              Planes activos a 500 km o menos del próximo mantenimiento.
            </p>
          </div>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            {alerts.length} alertas
          </span>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl bg-background px-4 py-6 text-sm text-dark/70">
            Cargando alertas...
          </div>
        ) : alerts.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-background px-4 py-6 text-sm text-dark/70">
            Sin alertas. Todo en orden con los mantenimientos.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {alerts.map((a) => {
              const status = alertStatus(a.restanteKm);
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-transparent bg-background p-4 shadow-[0_10px_24px_rgba(15,42,61,0.08)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-dark">{a.placa}</p>
                      <p className="text-xs text-dark/60">{a.tipo}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-dark/70">
                    <div>
                      <p className="text-dark/50">Km actual</p>
                      <p className="font-semibold text-dark">{a.kilometrajeActual}</p>
                    </div>
                    <div>
                      <p className="text-dark/50">Próximo</p>
                      <p className="font-semibold text-dark">{a.proximoKm}</p>
                    </div>
                    <div>
                      <p className="text-dark/50">Restante</p>
                      <p className="font-semibold text-dark">{a.restanteKm} km</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
