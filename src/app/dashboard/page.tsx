"use client";

import type { LucideIcon } from "lucide-react";
import { BadgeDollarSign, Percent, ReceiptText, TrendingDown, TrendingUp } from "lucide-react";
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
type KpiDelta = {
  delta: number | null;
};
type KpiCurrency = {
  label: string;
  icon: LucideIcon;
  tone: string;
  isCurrency: true;
  currency?: string;
  number?: string;
} & KpiDelta;
type KpiValue = {
  label: string;
  icon: LucideIcon;
  tone: string;
  isCurrency: false;
  value: string;
} & KpiDelta;

export default function DashboardPage() {
  const [activeTrucks, setActiveTrucks] = useState<number | null>(null);
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [previousSummary, setPreviousSummary] = useState<Summary | null>(null);
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
  const previousMonth = useMemo(() => {
    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return null;
    const date = new Date(Date.UTC(year, monthIndex, 1));
    date.setUTCMonth(date.getUTCMonth() - 1);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }, [month]);
  const toNumber = (value?: string | null) => {
    if (!value) return null;
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const formatCurrencyParts = (value: number | null) => {
    if (value === null) return { currency: undefined, number: undefined };
    const parts = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      maximumFractionDigits: 0,
    }).formatToParts(value);
    const currency = parts.find((part) => part.type === "currency")?.value ?? "S/";
    const number = parts
      .filter((part) => part.type !== "currency")
      .map((part) => part.value)
      .join("")
      .trim();
    return { currency, number };
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
  const prevIngresosNum = toNumber(previousSummary?.ingresos);
  const prevCombustibleNum = toNumber(previousSummary?.gastoCombustible);
  const prevMantenimientoNum = toNumber(previousSummary?.gastoMantenimiento);
  const prevUtilidadNum = toNumber(previousSummary?.utilidadNeta);
  const prevCostosNum =
    prevCombustibleNum === null || prevMantenimientoNum === null
      ? null
      : prevCombustibleNum + prevMantenimientoNum;
  const prevRentabilidadNum =
    prevIngresosNum && prevUtilidadNum !== null ? (prevUtilidadNum / prevIngresosNum) * 100 : null;

  const deltaPercent = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    if (previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };
  const alertStatus = (restanteKm: number) => {
    if (restanteKm <= 0) {
      return { label: "Urgente", className: "bg-danger/15 text-danger" };
    }
    if (restanteKm <= 1000) {
      return { label: "Próximo", className: "bg-accent/20 text-accent" };
    }
    return { label: "OK", className: "bg-secondary/15 text-secondary" };
  };

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const previousQuery = previousMonth ? new URLSearchParams({ month: previousMonth }).toString() : null;
        const [currentRes, previousRes] = await Promise.all([
          fetch(`/api/dashboard/summary?${query}`, {
            headers: { "content-type": "application/json" },
          }),
          previousQuery
            ? fetch(`/api/dashboard/summary?${previousQuery}`, {
                headers: { "content-type": "application/json" },
              })
            : Promise.resolve(null),
        ]);

        if (!currentRes.ok) {
          const data = (await currentRes.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "No se pudo cargar el resumen");
        }

        const currentData = (await currentRes.json()) as {
          month: string;
          summary: Summary;
          maintenanceAlerts: Alert[];
        };
        const previousData =
          previousRes && previousRes.ok
            ? ((await previousRes.json()) as {
                month: string;
                summary: Summary;
                maintenanceAlerts: Alert[];
              })
            : null;

        if (cancelled) return;
        setSummary(currentData.summary);
        setPreviousSummary(previousData?.summary ?? null);
        setAlerts(currentData.maintenanceAlerts);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error");
        setSummary(null);
        setPreviousSummary(null);
        setAlerts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query, previousMonth]);

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
      <div className="fp-card fp-fade-up p-8 max-[1366px]:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark/60">
              {greeting}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-dark max-[1366px]:text-3xl">
              <span className="font-medium text-dark/80">Centro de control</span>{" "}
              <span className="fp-text-gradient font-bold">Flota</span>
            </h1>
            <p className="mt-3 text-base text-dark/70">
              Visión estratégica de ingresos, costos y alertas críticas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-2xl bg-background px-4 py-3 text-sm text-dark transition-all duration-300 border border-primary/10 focus-within:border-accent hover:bg-white">
              Mes
              <input
                className="!bg-transparent !text-dark placeholder:text-dark/40 focus:outline-none appearance-none shadow-none border-0 ring-0 focus:ring-0"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <div className="flex min-w-[150px] flex-col gap-1 rounded-2xl bg-background px-4 py-3 text-sm text-dark ring-1 ring-primary/10">
              <span className="text-xs font-medium uppercase tracking-wider text-dark/60">
                Mes actual
              </span>
              <span className="text-base font-semibold text-dark">{monthLabel}</span>
            </div>
            <div className="flex min-w-[150px] flex-col gap-1 rounded-2xl bg-background px-4 py-3 text-sm text-dark ring-1 ring-primary/10">
              <span className="text-xs font-medium uppercase tracking-wider text-dark/60">
                Camiones activos
              </span>
              <span className="text-base font-semibold text-dark">
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
        {(
          [
            {
              label: "Ingresos",
              ...formatCurrencyParts(ingresosNum),
              icon: BadgeDollarSign,
              tone: "text-primary",
              isCurrency: true,
              delta: deltaPercent(ingresosNum, prevIngresosNum),
            },
            {
              label: "Costos totales",
              ...formatCurrencyParts(costosNum),
              icon: ReceiptText,
              tone: "text-dark",
              isCurrency: true,
              delta: deltaPercent(costosNum, prevCostosNum),
            },
            {
              label: "Utilidad neta",
              ...formatCurrencyParts(utilidadNum),
              icon: TrendingUp,
              tone:
                utilidadNum !== null && utilidadNum < 0 ? "text-danger" : "text-secondary",
              isCurrency: true,
              delta: deltaPercent(utilidadNum, prevUtilidadNum),
            },
            {
              label: "Rentabilidad",
              value: formatPercent(rentabilidadNum),
              icon: Percent,
              tone:
                rentabilidadNum !== null && rentabilidadNum < 0 ? "text-danger" : "text-secondary",
              isCurrency: false,
              delta: deltaPercent(rentabilidadNum, prevRentabilidadNum),
            },
        ] as (KpiCurrency | KpiValue)[]
        ).map((kpi) => {
          const Icon = kpi.icon;
          const deltaValue = kpi.delta;
          const deltaIsUp = deltaValue !== null ? deltaValue >= 0 : null;
          const deltaLabel =
            deltaValue === null ? "—" : `${Math.abs(deltaValue).toFixed(1)}%`;
          return (
            <div
              key={kpi.label}
              className="fp-card fp-fade-up group overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(11,60,93,0.16)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-dark/60">
                  {kpi.label}
                </span>
                <span className="rounded-full bg-primary/10 p-2 ring-1 ring-primary/10">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </span>
              </div>
              <div className={`mt-5 ${kpi.tone}`}>
                {loading ? (
                  <span className="text-3xl font-semibold tracking-tight leading-none">...</span>
                ) : kpi.isCurrency && kpi.currency && kpi.number ? (
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[11px] font-medium text-dark/60">
                      {kpi.currency}
                    </span>
                    <span className="text-4xl font-semibold tracking-tight leading-none break-words max-[1366px]:text-3xl">
                      {kpi.number}
                    </span>
                  </div>
                ) : kpi.isCurrency ? (
                  <span className="text-4xl font-semibold tracking-tight leading-none max-[1366px]:text-3xl">
                    —
                  </span>
                ) : (
                  <span className="text-4xl font-semibold tracking-tight leading-none break-words max-[1366px]:text-3xl">
                    {kpi.value}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-medium text-dark/60">
                <span>Vs mes anterior</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ring-1 ${
                    deltaIsUp === null
                      ? "bg-dark/5 text-dark/70 ring-black/5"
                      : deltaIsUp
                        ? "bg-secondary/10 text-secondary ring-secondary/20"
                        : "bg-danger/10 text-danger ring-danger/20"
                  }`}
                >
                  {deltaIsUp === null ? null : deltaIsUp ? (
                    <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  <span className="font-semibold">{deltaLabel}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fp-card fp-fade-up p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-dark">Alertas de mantenimiento</h2>
            <p className="mt-1 text-sm text-dark/70">
              Planes activos a 1000 km o menos del próximo mantenimiento.
            </p>
          </div>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/20">
            {alerts.length} alertas
          </span>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl bg-background px-4 py-6 text-sm text-zinc-600 ring-1 ring-black/5">
            Cargando alertas...
          </div>
        ) : alerts.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-background px-4 py-6 text-sm text-zinc-600 ring-1 ring-black/5">
            Sin alertas. Todo en orden con los mantenimientos.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {alerts.map((a) => {
              const status = alertStatus(a.restanteKm);
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-black/5 bg-white p-4 shadow-[0_10px_24px_rgba(11,60,93,0.12)] transition-all duration-300 hover:-translate-y-0.5"
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
