"use client";

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
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const query = useMemo(() => new URLSearchParams({ month }).toString(), [month]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Resumen</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Ingresos, gastos y alertas de mantenimiento.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          Mes
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          ["Ingresos", summary?.ingresos ?? "—"],
          ["Combustible", summary?.gastoCombustible ?? "—"],
          ["Mantenimiento", summary?.gastoMantenimiento ?? "—"],
          ["Utilidad neta", summary?.utilidadNeta ?? "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="text-xs font-medium text-zinc-500">{label}</div>
            <div className="mt-2 text-lg font-semibold text-zinc-900">
              {loading ? "..." : value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-zinc-900">
          Alertas de mantenimiento
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Planes activos a 500 km o menos del próximo mantenimiento.
        </p>

        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Placa</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Km actual</th>
                <th className="py-2 pr-3">Próximo</th>
                <th className="py-2 pr-3">Restante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td className="py-3 text-zinc-600" colSpan={5}>
                    Cargando...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td className="py-3 text-zinc-600" colSpan={5}>
                    Sin alertas
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pr-3 font-medium text-zinc-900">
                      {a.placa}
                    </td>
                    <td className="py-3 pr-3 text-zinc-700">{a.tipo}</td>
                    <td className="py-3 pr-3 text-zinc-700">
                      {a.kilometrajeActual}
                    </td>
                    <td className="py-3 pr-3 text-zinc-700">{a.proximoKm}</td>
                    <td className="py-3 pr-3 text-zinc-700">{a.restanteKm}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
