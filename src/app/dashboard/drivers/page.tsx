"use client";

import { FormEvent, useEffect, useState } from "react";

type TruckOption = { id: string; placa: string };

type Driver = {
  id: string;
  nombre: string;
  dni: string;
  licencia: string;
  fechaVencimiento: string;
  telefono: string | null;
  truckId: string | null;
  truck?: { id: string; placa: string } | null;
};

export default function DriversPage() {
  const [items, setItems] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [licencia, setLicencia] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [truckId, setTruckId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [driversRes, trucksRes] = await Promise.all([
        fetch("/api/drivers"),
        fetch("/api/trucks"),
      ]);
      const driversData = (await driversRes.json().catch(() => null)) as any;
      if (!driversRes.ok) throw new Error(driversData?.error ?? "No se pudo cargar");
      const trucksData = (await trucksRes.json().catch(() => null)) as any;
      if (!trucksRes.ok) throw new Error(trucksData?.error ?? "No se pudo cargar camiones");

      setItems(driversData.drivers as Driver[]);
      setTrucks((trucksData.trucks as any[]).map((t) => ({ id: t.id, placa: t.placa })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setItems([]);
      setTrucks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toDateValue = (value: string) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  };

  const resetForm = () => {
    setNombre("");
    setDni("");
    setLicencia("");
    setFechaVencimiento("");
    setTelefono("");
    setTruckId("");
    setEditingId(null);
  };

  const startEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setNombre(driver.nombre);
    setDni(driver.dni);
    setLicencia(driver.licencia);
    setFechaVencimiento(toDateValue(driver.fechaVencimiento));
    setTelefono(driver.telefono ?? "");
    setTruckId(driver.truckId ?? "");
  };

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(editingId ? `/api/drivers/${editingId}` : "/api/drivers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombre,
          dni,
          licencia,
          fechaVencimiento: new Date(fechaVencimiento).toISOString(),
          telefono,
          truckId,
        }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar chofer?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo eliminar");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 max-[1366px]:space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 max-[1366px]:p-4">
        <h1 className="text-lg font-semibold text-zinc-900">Choferes</h1>
        <p className="mt-1 text-sm text-zinc-600">Registro de conductores.</p>

        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 min-[1600px]:grid-cols-3 min-[1920px]:grid-cols-4 max-[1366px]:gap-2"
          onSubmit={onCreate}
        >
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            required
            inputMode="numeric"
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Licencia"
            value={licencia}
            onChange={(e) => setLicencia(e.target.value)}
            required
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            type="date"
            required
            aria-label="Vencimiento de licencia"
            title="Vencimiento de licencia"
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            aria-label="Camión asignado"
            title="Camión asignado"
          >
            <option value="">Sin camión</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.placa}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2 md:col-span-2 min-[1600px]:col-span-3 min-[1920px]:col-span-4">
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar chofer"}
            </button>
            {editingId ? (
              <button
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
                type="button"
                onClick={resetForm}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 max-[1366px]:p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Listado</h2>
        <div className="mt-4 space-y-4 md:hidden">
          {loading ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-black/5">
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-black/5">
              Sin registros
            </div>
          ) : (
            items.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="text-base font-semibold text-zinc-900">{d.nombre}</div>
                <div className="mt-2 space-y-1 text-sm text-zinc-700">
                  <div>
                    DNI: <span className="font-medium text-zinc-900">{d.dni}</span>
                  </div>
                  <div>
                    Licencia:{" "}
                    <span className="font-medium text-zinc-900">{d.licencia}</span>
                  </div>
                  <div>
                    Vence:{" "}
                    <span className="font-medium text-zinc-900">
                      {new Date(d.fechaVencimiento).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    Teléfono:{" "}
                    <span className="font-medium text-zinc-900">
                      {d.telefono ?? "—"}
                    </span>
                  </div>
                  <div>
                    Camión:{" "}
                    <span className="font-medium text-zinc-900">
                      {d.truck?.placa ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    type="button"
                    onClick={() => startEdit(d)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    type="button"
                    onClick={() => onDelete(d.id)}
                    disabled={deletingId === d.id}
                  >
                    {deletingId === d.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 hidden md:block">
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm max-[1366px]:min-w-0 max-[1366px]:text-xs">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">DNI</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Licencia</th>
                  <th className="py-2 pr-3">Vence</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Teléfono</th>
                  <th className="py-2 pr-3">Camión</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={7}>
                      Cargando...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={7}>
                      Sin registros
                    </td>
                  </tr>
                ) : (
                  items.map((d) => (
                    <tr key={d.id}>
                      <td className="py-3 pr-3 font-medium text-zinc-900 max-[1366px]:py-2">
                        {d.nombre}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">{d.dni}</td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {d.licencia}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {new Date(d.fechaVencimiento).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {d.telefono ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {d.truck?.placa ?? "—"}
                      </td>
                      <td className="py-3 pr-3 max-[1366px]:py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                            type="button"
                            onClick={() => startEdit(d)}
                          >
                            Editar
                          </button>
                          <button
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                            type="button"
                            onClick={() => onDelete(d.id)}
                            disabled={deletingId === d.id}
                          >
                            {deletingId === d.id ? "Eliminando..." : "Eliminar"}
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
    </div>
  );
}
