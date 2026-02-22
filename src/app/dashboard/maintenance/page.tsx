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
  const [planActivo, setPlanActivo] = useState(true);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [planSubmitting, setPlanSubmitting] = useState(false);

  const [recordTruckId, setRecordTruckId] = useState("");
  const [recordFecha, setRecordFecha] = useState("");
  const [recordTipo, setRecordTipo] = useState("");
  const [recordKm, setRecordKm] = useState("");
  const [recordCosto, setRecordCosto] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
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

  const toDateTimeLocal = (value: string) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const resetPlanForm = () => {
    setPlanTruckId("");
    setPlanTipo("");
    setCadaKm(5000);
    setUltimoServicioKm("");
    setPlanActivo(true);
    setEditingPlanId(null);
  };

  const startEditPlan = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanTruckId(plan.truckId);
    setPlanTipo(plan.tipo);
    setCadaKm(plan.cadaKm);
    setUltimoServicioKm(String(plan.ultimoServicioKm));
    setPlanActivo(plan.activo);
  };

  const getTruckKm = (plan: Plan) => {
    if (plan.truck?.kilometrajeActual !== undefined) return plan.truck.kilometrajeActual;
    const truck = trucks.find((t) => t.id === plan.truckId);
    return truck ? truck.kilometrajeActual : null;
  };

  const getProximoKm = (plan: Plan) => plan.ultimoServicioKm + plan.cadaKm;

  const getRestanteKm = (plan: Plan) => {
    const kmActual = getTruckKm(plan);
    if (kmActual === null) return null;
    return getProximoKm(plan) - kmActual;
  };

  const getStatus = (restanteKm: number | null) => {
    if (restanteKm === null) {
      return { label: "—", className: "bg-zinc-100 text-zinc-600" };
    }
    if (restanteKm <= 0) {
      return { label: "Urgente", className: "bg-red-100 text-red-700" };
    }
    if (restanteKm <= 1000) {
      return { label: "Próximo", className: "bg-amber-100 text-amber-700" };
    }
    return { label: "OK", className: "bg-emerald-100 text-emerald-700" };
  };

  const resetRecordForm = () => {
    setRecordTruckId("");
    setRecordFecha("");
    setRecordTipo("");
    setRecordKm("");
    setRecordCosto("");
    setEditingRecordId(null);
  };

  const startEditRecord = (record: Record) => {
    setEditingRecordId(record.id);
    setRecordTruckId(record.truckId);
    setRecordFecha(toDateTimeLocal(record.fecha));
    setRecordTipo(record.tipo);
    setRecordKm(String(record.kilometraje));
    setRecordCosto(String(record.costo));
  };

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    setPlanSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        editingPlanId ? `/api/maintenance-plans/${editingPlanId}` : "/api/maintenance-plans",
        {
          method: editingPlanId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            truckId: planTruckId,
            tipo: planTipo,
            cadaKm,
            ultimoServicioKm: Number(ultimoServicioKm),
            activo: planActivo,
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");

      resetPlanForm();
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
      const res = await fetch(
        editingRecordId
          ? `/api/maintenance-records/${editingRecordId}`
          : "/api/maintenance-records",
        {
          method: editingRecordId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            truckId: recordTruckId,
            fecha: new Date(recordFecha).toISOString(),
            tipo: recordTipo,
            kilometraje: Number(recordKm),
            costo: Number(recordCosto),
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");

      resetRecordForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRecordSubmitting(false);
    }
  }

  async function onDeletePlan(id: string) {
    if (!confirm("¿Eliminar plan de mantenimiento?")) return;
    setDeletingPlanId(id);
    setError(null);
    try {
      const res = await fetch(`/api/maintenance-plans/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo eliminar");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setDeletingPlanId(null);
    }
  }

  async function onDeleteRecord(id: string) {
    if (!confirm("¿Eliminar registro de mantenimiento?")) return;
    setDeletingRecordId(id);
    setError(null);
    try {
      const res = await fetch(`/api/maintenance-records/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo eliminar");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setDeletingRecordId(null);
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
            <form
              className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"
              onSubmit={createPlan}
            >
              <select
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
                value={planTruckId}
                onChange={(e) => setPlanTruckId(e.target.value)}
                required
              >
                <option value="">Selecciona camión</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.placa}
                  </option>
                ))}
              </select>
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
                placeholder="Tipo (ej. Cambio de aceite)"
                value={planTipo}
                onChange={(e) => setPlanTipo(e.target.value)}
                required
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
                placeholder="Cada km (frecuencia)"
                value={cadaKm}
                onChange={(e) => setCadaKm(Number(e.target.value))}
                type="number"
                min={100}
                required
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
                placeholder="Último servicio (km)"
                value={ultimoServicioKm}
                onChange={(e) => setUltimoServicioKm(e.target.value)}
                type="number"
                min={0}
                required
              />
              <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-4">
                <button
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
                  type="submit"
                  disabled={planSubmitting}
                >
                  {planSubmitting ? "Guardando..." : editingPlanId ? "Guardar cambios" : "Agregar plan"}
                </button>
                {editingPlanId ? (
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
                    type="button"
                    onClick={resetPlanForm}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-zinc-900">Listado</h2>
            <div className="mt-4 space-y-4 md:hidden">
              {loading ? (
                <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-black/5">
                  Cargando...
                </div>
              ) : plans.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-black/5">
                  Sin registros
                </div>
              ) : (
                plans.map((p) => {
                  const kmActual = getTruckKm(p);
                  const proximoKm = getProximoKm(p);
                  const restanteKm = getRestanteKm(p);
                  const status = getStatus(restanteKm);
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-zinc-900">
                            {p.truck?.placa ?? "—"}
                          </div>
                          <div className="mt-1 text-sm text-zinc-600">{p.tipo}</div>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-zinc-700">
                        <div>
                          Km actual:{" "}
                          <span className="font-medium text-zinc-900">
                            {kmActual ?? "—"}
                          </span>
                        </div>
                        <div>
                          Próximo mantenimiento:{" "}
                          <span className="font-medium text-zinc-900">{proximoKm}</span>
                        </div>
                        <div>
                          Km restantes:{" "}
                          <span className="font-medium text-zinc-900">
                            {restanteKm === null ? "—" : restanteKm}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          type="button"
                          onClick={() => startEditPlan(p)}
                        >
                          Editar
                        </button>
                        <button
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                          type="button"
                          onClick={() => onDeletePlan(p.id)}
                          disabled={deletingPlanId === p.id}
                        >
                          {deletingPlanId === p.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-4 hidden md:block">
              <div className="overflow-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="text-xs text-zinc-500">
                    <tr>
                      <th className="py-2 pr-3">Camión</th>
                      <th className="py-2 pr-3">Tipo de servicio</th>
                      <th className="py-2 pr-3">Km actual</th>
                      <th className="py-2 pr-3">Próximo mantenimiento</th>
                      <th className="py-2 pr-3">Km restantes</th>
                      <th className="py-2 pr-3">Estado</th>
                      <th className="py-2 pr-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr>
                        <td className="py-3 text-zinc-600" colSpan={7}>
                          Cargando...
                        </td>
                      </tr>
                    ) : plans.length === 0 ? (
                      <tr>
                        <td className="py-3 text-zinc-600" colSpan={7}>
                          Sin registros
                        </td>
                      </tr>
                    ) : (
                      plans.map((p) => (
                        <tr key={p.id}>
                          {(() => {
                            const kmActual = getTruckKm(p);
                            const proximoKm = getProximoKm(p);
                            const restanteKm = getRestanteKm(p);
                            const status = getStatus(restanteKm);
                            return (
                              <>
                          <td className="py-3 pr-3 font-medium text-zinc-900">
                            {p.truck?.placa ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-zinc-700">{p.tipo}</td>
                          <td className="py-3 pr-3 text-zinc-700">{kmActual ?? "—"}</td>
                          <td className="py-3 pr-3 text-zinc-700">{proximoKm}</td>
                          <td className="py-3 pr-3 text-zinc-700">
                            {restanteKm === null ? "—" : restanteKm}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex gap-2">
                              <button
                                className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                                type="button"
                                onClick={() => startEditPlan(p)}
                              >
                                Editar
                              </button>
                              <button
                                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                                type="button"
                                onClick={() => onDeletePlan(p.id)}
                                disabled={deletingPlanId === p.id}
                              >
                                {deletingPlanId === p.id ? "Eliminando..." : "Eliminar"}
                              </button>
                            </div>
                          </td>
                              </>
                            );
                          })()}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-zinc-900">Nuevo registro</h2>
            <form
              className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              onSubmit={createRecord}
            >
              <select
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
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
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
                type="datetime-local"
                value={recordFecha}
                onChange={(e) => setRecordFecha(e.target.value)}
                required
                aria-label="Fecha y hora del servicio"
                title="Fecha y hora del servicio"
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
                placeholder="Tipo"
                value={recordTipo}
                onChange={(e) => setRecordTipo(e.target.value)}
                required
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
                placeholder="Kilometraje (km)"
                value={recordKm}
                onChange={(e) => setRecordKm(e.target.value)}
                type="number"
                min={0}
                required
              />
              <input
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
                placeholder="Costo (monto)"
                value={recordCosto}
                onChange={(e) => setRecordCosto(e.target.value)}
                type="number"
                min={0}
                step="0.01"
                required
              />
              <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-3 xl:col-span-4">
                <button
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
                  type="submit"
                  disabled={recordSubmitting}
                >
                  {recordSubmitting ? "Guardando..." : editingRecordId ? "Guardar cambios" : "Agregar registro"}
                </button>
                {editingRecordId ? (
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
                    type="button"
                    onClick={resetRecordForm}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-zinc-900">Listado</h2>
            <div className="mt-4 space-y-4 md:hidden">
              {loading ? (
                <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-black/5">
                  Cargando...
                </div>
              ) : records.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-black/5">
                  Sin registros
                </div>
              ) : (
                records.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-zinc-900">
                          {r.truck?.placa ?? "—"}
                        </div>
                        <div className="mt-1 text-sm text-zinc-600">
                          {new Date(r.fecha).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">{r.costo}</div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-zinc-700">
                      <div>
                        Tipo: <span className="font-medium text-zinc-900">{r.tipo}</span>
                      </div>
                      <div>
                        Km:{" "}
                        <span className="font-medium text-zinc-900">{r.kilometraje}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        type="button"
                        onClick={() => startEditRecord(r)}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                        type="button"
                        onClick={() => onDeleteRecord(r.id)}
                        disabled={deletingRecordId === r.id}
                      >
                        {deletingRecordId === r.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 hidden md:block">
              <div className="overflow-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="text-xs text-zinc-500">
                    <tr>
                      <th className="py-2 pr-3">Fecha</th>
                      <th className="py-2 pr-3">Camión</th>
                      <th className="py-2 pr-3">Tipo</th>
                      <th className="py-2 pr-3">Km</th>
                      <th className="py-2 pr-3">Costo</th>
                      <th className="py-2 pr-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {loading ? (
                      <tr>
                        <td className="py-3 text-zinc-600" colSpan={6}>
                          Cargando...
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td className="py-3 text-zinc-600" colSpan={6}>
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
                          <td className="py-3 pr-3">
                            <div className="flex gap-2">
                              <button
                                className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                                type="button"
                                onClick={() => startEditRecord(r)}
                              >
                                Editar
                              </button>
                              <button
                                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                                type="button"
                                onClick={() => onDeleteRecord(r.id)}
                                disabled={deletingRecordId === r.id}
                              >
                                {deletingRecordId === r.id ? "Eliminando..." : "Eliminar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
