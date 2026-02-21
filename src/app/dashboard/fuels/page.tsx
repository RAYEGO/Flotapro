"use client";

import { FormEvent, useEffect, useState } from "react";

type TruckOption = { id: string; placa: string };
type DriverOption = { id: string; nombre: string; dni: string };

type Fuel = {
  id: string;
  fecha: string;
  kilometraje: number;
  galones: string;
  precioPorGalon: string;
  total: string;
  truck?: { id: string; placa: string } | null;
  driver?: { id: string; nombre: string; dni: string } | null;
  truckId: string;
  driverId: string;
};

export default function FuelsPage() {
  const [items, setItems] = useState<Fuel[]>([]);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [fecha, setFecha] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [galones, setGalones] = useState("");
  const [precioPorGalon, setPrecioPorGalon] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [fuelsRes, trucksRes, driversRes] = await Promise.all([
        fetch("/api/fuels"),
        fetch("/api/trucks"),
        fetch("/api/drivers"),
      ]);
      const fuelsData = (await fuelsRes.json().catch(() => null)) as any;
      if (!fuelsRes.ok) throw new Error(fuelsData?.error ?? "No se pudo cargar");
      const trucksData = (await trucksRes.json().catch(() => null)) as any;
      if (!trucksRes.ok) throw new Error(trucksData?.error ?? "No se pudo cargar camiones");
      const driversData = (await driversRes.json().catch(() => null)) as any;
      if (!driversRes.ok) throw new Error(driversData?.error ?? "No se pudo cargar choferes");

      setItems(fuelsData.fuels as Fuel[]);
      setTrucks((trucksData.trucks as any[]).map((t) => ({ id: t.id, placa: t.placa })));
      setDrivers(
        (driversData.drivers as any[]).map((d) => ({
          id: d.id,
          nombre: d.nombre,
          dni: d.dni,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setItems([]);
      setTrucks([]);
      setDrivers([]);
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

  const resetForm = () => {
    setTruckId("");
    setDriverId("");
    setFecha("");
    setKilometraje("");
    setGalones("");
    setPrecioPorGalon("");
    setEditingId(null);
  };

  const startEdit = (fuel: Fuel) => {
    setEditingId(fuel.id);
    setTruckId(fuel.truckId);
    setDriverId(fuel.driverId);
    setFecha(toDateTimeLocal(fuel.fecha));
    setKilometraje(String(fuel.kilometraje));
    setGalones(String(fuel.galones));
    setPrecioPorGalon(String(fuel.precioPorGalon));
  };

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(editingId ? `/api/fuels/${editingId}` : "/api/fuels", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          truckId,
          driverId,
          fecha: new Date(fecha).toISOString(),
          kilometraje: Number(kilometraje),
          galones: Number(galones),
          precioPorGalon: Number(precioPorGalon),
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
    if (!confirm("¿Eliminar registro de combustible?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/fuels/${id}`, { method: "DELETE" });
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
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-lg font-semibold text-zinc-900">Combustible</h1>
        <p className="mt-1 text-sm text-zinc-600">Registro de consumos.</p>

        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" onSubmit={onCreate}>
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            required
          >
            <option value="">Camión</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.placa}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            required
          >
            <option value="">Chofer</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.dni})
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            aria-label="Fecha y hora"
            title="Fecha y hora"
          />

          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Kilometraje (km)"
            value={kilometraje}
            onChange={(e) => setKilometraje(e.target.value)}
            type="number"
            min={0}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Galones (ej. 30.5)"
            value={galones}
            onChange={(e) => setGalones(e.target.value)}
            type="number"
            min={0}
            step="0.001"
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Precio/galón (ej. 18.90)"
            value={precioPorGalon}
            onChange={(e) => setPrecioPorGalon(e.target.value)}
            type="number"
            min={0}
            step="0.001"
            required
          />

          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-3">
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar consumo"}
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

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-zinc-900">Listado</h2>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Camión</th>
                <th className="py-2 pr-3">Chofer</th>
                <th className="py-2 pr-3">Km</th>
                <th className="py-2 pr-3">Galones</th>
                <th className="py-2 pr-3">Precio/galón</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td className="py-3 text-zinc-600" colSpan={8}>
                    Cargando...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="py-3 text-zinc-600" colSpan={8}>
                    Sin registros
                  </td>
                </tr>
              ) : (
                items.map((f) => (
                  <tr key={f.id}>
                    <td className="py-3 pr-3 text-zinc-700">
                      {new Date(f.fecha).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 font-medium text-zinc-900">
                      {f.truck?.placa ?? "—"}
                    </td>
                    <td className="py-3 pr-3 text-zinc-700">
                      {f.driver ? `${f.driver.nombre} (${f.driver.dni})` : "—"}
                    </td>
                    <td className="py-3 pr-3 text-zinc-700">{f.kilometraje}</td>
                    <td className="py-3 pr-3 text-zinc-700">{f.galones}</td>
                    <td className="py-3 pr-3 text-zinc-700">{f.precioPorGalon}</td>
                    <td className="py-3 pr-3 text-zinc-700">{f.total}</td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        <button
                          className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                          type="button"
                          onClick={() => startEdit(f)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                          type="button"
                          onClick={() => onDelete(f.id)}
                          disabled={deletingId === f.id}
                        >
                          {deletingId === f.id ? "Eliminando..." : "Eliminar"}
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
  );
}
