"use client";

import { FormEvent, useEffect, useState } from "react";

type TruckOption = { id: string; placa: string; kilometrajeActual: number };

type Plan = {
  id: string;
  truckId: string;
  tipo: string;
  cadaKm: number;
  ultimoServicioKm: number;
  proximoKm: number;
  activo: boolean;
  truck?: { id: string; placa: string; kilometrajeActual: number } | null;
};

type Record = {
  id: string;
  truckId: string;
  fecha: string;
  tipo: string;
  kilometraje: number;
  costo: string;
  truck?: { id: string; placa: string } | null;
};

export default function MaintenancePage() {
  const [tab, setTab] = useState<"plans" | "records">("plans");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [records, setRecords] = useState<Record[]>([]);

  const [planTruckId, setPlanTruckId] = useState("");
  const [planTipo, setPlanTipo] = useState("");
  const [cadaKm, setCadaKm] = useState<number>(5000);
  const [ultimoServicioKm, setUltimoServicioKm] = useState("");
  const [planSubmitting, setPlanSubmitting] = useState(false);

  const [recordTruckId, setRecordTruckId] = useState("");
  const [recordFecha, setRecordFecha] = useState("");
  const [recordTipo, setRecordTipo] = useState("");
  const [recordKm, setRecordKm] = useState("");
  const [recordCosto, setRecordCosto] = useState("");
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [trucksRes, plansRes, recordsRes] = await Promise.all([
        fetch("/api/trucks"),
        fetch("/api/maintenance-plans"),
        fetch("/api/maintenance-records"),
      ]);

      const trucksData = (await trucksRes.json().catch(() => null)) as any;
      if (!trucksRes.ok) throw new Error(trucksData?.error ?? "No se pudo cargar camiones");
      const plansData = (await plansRes.json().catch(() => null)) as any;
      if (!plansRes.ok) throw new Error(plansData?.error ?? "No se pudo cargar planes");
      const recordsData = (await recordsRes.json().catch(() => null)) as any;
      if (!recordsRes.ok) throw new Error(recordsData?.error ?? "No se pudo cargar registros");

      setTrucks(
        (trucksData.trucks as any[]).map((t) => ({
          id: t.id,
          placa: t.placa,
          kilometrajeActual: t.kilometrajeActual,
        })),
      );
      setPlans(plansData.plans as Plan[]);
      setRecords(recordsData.records as Record[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setTrucks([]);
      setPlans([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    setPlanSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/maintenance-plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          truckId: planTruckId,
          tipo: planTipo,
          cadaKm,
          ultimoServicioKm: Number(ultimoServicioKm),
          activo: true,
        }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");

      setPlanTruckId("");
      setPlanTipo("");
      setCadaKm(5000);
      setUltimoServicioKm("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setPlanSubmitting(false);
    }
  }

  async function createRecord(e: FormEvent) {
    e.preventDefault();
    setRecordSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/maintenance-records", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          truckId: recordTruckId,
          fecha: new Date(recordFecha).toISOString(),
          tipo: recordTipo,
          kilometraje: Number(recordKm),
          costo: Number(recordCosto),
        }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");

      setRecordTruckId("");
      setRecordFecha("");
      setRecordTipo("");
      setRecordKm("");
      setRecordCosto("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRecordSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-lg font-semibold text-zinc-900">Mantenimiento</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Planes por kilometraje y registro de servicios.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === "plans"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-800"
            }`}
            onClick={() => setTab("plans")}
            type="button"
          >
            Planes
          </button>
          <button
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === "records"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-800"
            }`}
            onClick={() => setTab("records")}
            type="button"
          >
            Registros
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {tab === "plans" ? (
        <>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-zinc-900">Nuevo plan</h2>
            <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={createPlan}>
              <select
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={planTruckId}
                onChange={(e) => setPlanTruckId(e.target.value)}
                required
              >
                <option value="">Camión</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.placa}
                  </option>
                ))}
              </select>
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Tipo (ej. Cambio de aceite)"
                value={planTipo}
                onChange={(e) => setPlanTipo(e.target.value)}
                required
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Cada Km"
                value={cadaKm}
                onChange={(e) => setCadaKm(Number(e.target.value))}
                type="number"
                min={100}
                required
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Último servicio (km)"
                value={ultimoServicioKm}
                onChange={(e) => setUltimoServicioKm(e.target.value)}
                type="number"
                min={0}
                required
              />
              <button
                className="md:col-span-4 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                type="submit"
                disabled={planSubmitting}
              >
                {planSubmitting ? "Guardando..." : "Agregar plan"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-zinc-900">Listado</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr>
                    <th className="py-2 pr-3">Camión</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Cada Km</th>
                    <th className="py-2 pr-3">Último</th>
                    <th className="py-2 pr-3">Próximo</th>
                    <th className="py-2 pr-3">Activo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td className="py-3 text-zinc-600" colSpan={6}>
                        Cargando...
                      </td>
                    </tr>
                  ) : plans.length === 0 ? (
                    <tr>
                      <td className="py-3 text-zinc-600" colSpan={6}>
                        Sin registros
                      </td>
                    </tr>
                  ) : (
                    plans.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 pr-3 font-medium text-zinc-900">
                          {p.truck?.placa ?? "—"}
                        </td>
                        <td className="py-3 pr-3 text-zinc-700">{p.tipo}</td>
                        <td className="py-3 pr-3 text-zinc-700">{p.cadaKm}</td>
                        <td className="py-3 pr-3 text-zinc-700">{p.ultimoServicioKm}</td>
                        <td className="py-3 pr-3 text-zinc-700">{p.proximoKm}</td>
                        <td className="py-3 pr-3 text-zinc-700">{p.activo ? "Sí" : "No"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-zinc-900">Nuevo registro</h2>
            <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5" onSubmit={createRecord}>
              <select
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={recordTruckId}
                onChange={(e) => setRecordTruckId(e.target.value)}
                required
              >
                <option value="">Camión</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.placa}
                  </option>
                ))}
              </select>
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                type="datetime-local"
                value={recordFecha}
                onChange={(e) => setRecordFecha(e.target.value)}
                required
                aria-label="Fecha y hora del servicio"
                title="Fecha y hora del servicio"
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Tipo"
                value={recordTipo}
                onChange={(e) => setRecordTipo(e.target.value)}
                required
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Kilometraje (km)"
                value={recordKm}
                onChange={(e) => setRecordKm(e.target.value)}
                type="number"
                min={0}
                required
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="Costo (monto)"
                value={recordCosto}
                onChange={(e) => setRecordCosto(e.target.value)}
                type="number"
                min={0}
                step="0.01"
                required
              />
              <button
                className="md:col-span-5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                type="submit"
                disabled={recordSubmitting}
              >
                {recordSubmitting ? "Guardando..." : "Agregar registro"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-zinc-900">Listado</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Camión</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Km</th>
                    <th className="py-2 pr-3">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td className="py-3 text-zinc-600" colSpan={5}>
                        Cargando...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td className="py-3 text-zinc-600" colSpan={5}>
                        Sin registros
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 pr-3 text-zinc-700">
                          {new Date(r.fecha).toLocaleString()}
                        </td>
                        <td className="py-3 pr-3 font-medium text-zinc-900">
                          {r.truck?.placa ?? "—"}
                        </td>
                        <td className="py-3 pr-3 text-zinc-700">{r.tipo}</td>
                        <td className="py-3 pr-3 text-zinc-700">{r.kilometraje}</td>
                        <td className="py-3 pr-3 text-zinc-700">{r.costo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
