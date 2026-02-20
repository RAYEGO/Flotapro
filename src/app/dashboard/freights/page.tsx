"use client";

import { FormEvent, useEffect, useState } from "react";

type TruckOption = { id: string; placa: string };
type DriverOption = { id: string; nombre: string; dni: string };

type Freight = {
  id: string;
  fecha: string;
  cliente: string;
  origen: string;
  destino: string;
  ingreso: string;
  peajes: string;
  viaticos: string;
  otrosGastos: string;
  ganancia: string;
  estado: "PENDIENTE" | "COMPLETADO" | "ANULADO";
  truck?: { id: string; placa: string } | null;
  driver?: { id: string; nombre: string; dni: string } | null;
  truckId: string;
  driverId: string;
};

export default function FreightsPage() {
  const [items, setItems] = useState<Freight[]>([]);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [fecha, setFecha] = useState("");
  const [cliente, setCliente] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [ingreso, setIngreso] = useState<number>(0);
  const [peajes, setPeajes] = useState<number>(0);
  const [viaticos, setViaticos] = useState<number>(0);
  const [otrosGastos, setOtrosGastos] = useState<number>(0);
  const [estado, setEstado] = useState<Freight["estado"]>("PENDIENTE");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [freightsRes, trucksRes, driversRes] = await Promise.all([
        fetch("/api/freights"),
        fetch("/api/trucks"),
        fetch("/api/drivers"),
      ]);
      const freightsData = (await freightsRes.json().catch(() => null)) as any;
      if (!freightsRes.ok) throw new Error(freightsData?.error ?? "No se pudo cargar");
      const trucksData = (await trucksRes.json().catch(() => null)) as any;
      if (!trucksRes.ok) throw new Error(trucksData?.error ?? "No se pudo cargar camiones");
      const driversData = (await driversRes.json().catch(() => null)) as any;
      if (!driversRes.ok) throw new Error(driversData?.error ?? "No se pudo cargar choferes");

      setItems(freightsData.freights as Freight[]);
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/freights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          truckId,
          driverId,
          fecha: new Date(fecha).toISOString(),
          cliente,
          origen,
          destino,
          ingreso,
          peajes,
          viaticos,
          otrosGastos,
          estado,
        }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      setTruckId("");
      setDriverId("");
      setFecha("");
      setCliente("");
      setOrigen("");
      setDestino("");
      setIngreso(0);
      setPeajes(0);
      setViaticos(0);
      setOtrosGastos(0);
      setEstado("PENDIENTE");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-lg font-semibold text-zinc-900">Fletes</h1>
        <p className="mt-1 text-sm text-zinc-600">Control de viajes e ingresos.</p>

        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={onCreate}>
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
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
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
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
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            aria-label="Fecha y hora del viaje"
            title="Fecha y hora del viaje"
          />

          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={estado}
            onChange={(e) => setEstado(e.target.value as Freight["estado"])}
            aria-label="Estado del flete"
            title="Estado del flete"
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="COMPLETADO">COMPLETADO</option>
            <option value="ANULADO">ANULADO</option>
          </select>

          <input
            className="md:col-span-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Origen"
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            required
          />

          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Ingreso"
            value={ingreso}
            onChange={(e) => setIngreso(Number(e.target.value))}
            type="number"
            min={0}
            step="0.01"
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Peajes"
            value={peajes}
            onChange={(e) => setPeajes(Number(e.target.value))}
            type="number"
            min={0}
            step="0.01"
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Viáticos"
            value={viaticos}
            onChange={(e) => setViaticos(Number(e.target.value))}
            type="number"
            min={0}
            step="0.01"
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Otros gastos"
            value={otrosGastos}
            onChange={(e) => setOtrosGastos(Number(e.target.value))}
            type="number"
            min={0}
            step="0.01"
          />

          <button
            className="md:col-span-4 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Guardando..." : "Agregar flete"}
          </button>
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
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Ruta</th>
                <th className="py-2 pr-3">Ingreso</th>
                <th className="py-2 pr-3">Ganancia</th>
                <th className="py-2 pr-3">Estado</th>
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
                    <td className="py-3 pr-3 text-zinc-700">{f.cliente}</td>
                    <td className="py-3 pr-3 text-zinc-700">
                      {f.origen} → {f.destino}
                    </td>
                    <td className="py-3 pr-3 text-zinc-700">{f.ingreso}</td>
                    <td className="py-3 pr-3 text-zinc-700">{f.ganancia}</td>
                    <td className="py-3 pr-3 text-zinc-700">{f.estado}</td>
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
