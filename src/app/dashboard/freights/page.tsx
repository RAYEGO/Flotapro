"use client";

import { FormEvent, useEffect, useState } from "react";

type TruckOption = {
  id: string;
  placa: string;
  modeloPago: "DUENO_PAGA" | "CHOFER_PAGA";
  tipoCalculo: "VIAJE" | "IDA_VUELTA" | "MENSUAL";
  montoBase: string;
};
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
  tipoModelo: "DUENO_PAGA" | "CHOFER_PAGA";
  montoAcordado: string;
  tipoCalculo: "VIAJE" | "IDA_VUELTA" | "MENSUAL";
  montoBase: string;
  montoCalculado: string;
  usarMontoPersonalizado: boolean;
  montoPersonalizado: string | null;
  montoFinal: string;
  direccionPago: "POR_PAGAR" | "POR_COBRAR";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [fecha, setFecha] = useState("");
  const [cliente, setCliente] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [ingreso, setIngreso] = useState("");
  const [peajes, setPeajes] = useState("");
  const [viaticos, setViaticos] = useState("");
  const [otrosGastos, setOtrosGastos] = useState("");
  const [montoAutomatico, setMontoAutomatico] = useState("");
  const [usarMontoPersonalizado, setUsarMontoPersonalizado] = useState(false);
  const [montoPersonalizado, setMontoPersonalizado] = useState("");
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
      setTrucks(
        (trucksData.trucks as any[]).map((t) => ({
          id: t.id,
          placa: t.placa,
          modeloPago: t.modeloPago ?? "DUENO_PAGA",
          tipoCalculo: t.tipoCalculo ?? "VIAJE",
          montoBase: t.montoBase ?? "0",
        })),
      );
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

  const calcularMontoAutomatico = (truck: TruckOption | undefined) => {
    if (!truck) return "";
    const base = Number(truck.montoBase ?? 0);
    const multiplicador = truck.tipoCalculo === "IDA_VUELTA" ? 2 : 1;
    if (Number.isNaN(base)) return "0.00";
    return (base * multiplicador).toFixed(2);
  };

  const resetForm = () => {
    setTruckId("");
    setDriverId("");
    setFecha("");
    setCliente("");
    setOrigen("");
    setDestino("");
    setIngreso("");
    setPeajes("");
    setViaticos("");
    setOtrosGastos("");
    setMontoAutomatico("");
    setUsarMontoPersonalizado(false);
    setMontoPersonalizado("");
    setEstado("PENDIENTE");
    setEditingId(null);
  };

  const startEdit = (freight: Freight) => {
    setEditingId(freight.id);
    setTruckId(freight.truckId);
    setDriverId(freight.driverId);
    setFecha(toDateTimeLocal(freight.fecha));
    setCliente(freight.cliente);
    setOrigen(freight.origen);
    setDestino(freight.destino);
    setIngreso(String(freight.ingreso));
    setPeajes(String(freight.peajes));
    setViaticos(String(freight.viaticos));
    setOtrosGastos(String(freight.otrosGastos));
    setMontoAutomatico(String(freight.montoCalculado));
    setUsarMontoPersonalizado(freight.usarMontoPersonalizado);
    setMontoPersonalizado(freight.montoPersonalizado ?? "");
    setEstado(freight.estado);
  };

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const selectedTruck = trucks.find((t) => t.id === truckId);
      const isChoferPaga = selectedTruck?.modeloPago === "CHOFER_PAGA";
      const res = await fetch(editingId ? `/api/freights/${editingId}` : "/api/freights", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          truckId,
          driverId,
          fecha: new Date(fecha).toISOString(),
          cliente,
          origen,
          destino,
          usarMontoPersonalizado,
          montoPersonalizado:
            usarMontoPersonalizado && montoPersonalizado !== ""
              ? Number(montoPersonalizado)
              : undefined,
          ingreso: isChoferPaga ? 0 : Number(ingreso),
          peajes: isChoferPaga ? 0 : peajes === "" ? 0 : Number(peajes),
          viaticos: isChoferPaga ? 0 : viaticos === "" ? 0 : Number(viaticos),
          otrosGastos:
            isChoferPaga ? 0 : otrosGastos === "" ? 0 : Number(otrosGastos),
          estado,
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
    if (!confirm("¿Eliminar flete?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/freights/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo eliminar");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setDeletingId(null);
    }
  }

  const selectedTruck = trucks.find((t) => t.id === truckId);
  const isChoferPaga = selectedTruck?.modeloPago === "CHOFER_PAGA";
  const tipoCalculoLabel =
    selectedTruck?.tipoCalculo === "IDA_VUELTA"
      ? "Ida y vuelta"
      : selectedTruck?.tipoCalculo === "MENSUAL"
        ? "Mensual"
        : "Viaje";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-lg font-semibold text-zinc-900">Fletes</h1>
        <p className="mt-1 text-sm text-zinc-600">Control de viajes e ingresos.</p>

        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          onSubmit={onCreate}
        >
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={truckId}
            onChange={(e) => {
              const nextId = e.target.value;
              setTruckId(nextId);
              const selected = trucks.find((t) => t.id === nextId);
              setMontoAutomatico(calcularMontoAutomatico(selected));
            }}
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
            aria-label="Fecha y hora del viaje"
            title="Fecha y hora del viaje"
          />

          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Monto automático"
            value={montoAutomatico}
            readOnly
            aria-label="Monto automático"
            title="Monto automático"
          />

          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Tipo de cálculo"
            value={tipoCalculoLabel}
            readOnly
            aria-label="Tipo de cálculo"
            title="Tipo de cálculo"
          />

          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={estado}
            onChange={(e) => setEstado(e.target.value as Freight["estado"])}
            aria-label="Estado del flete"
            title="Estado del flete"
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="COMPLETADO">COMPLETADO</option>
            <option value="ANULADO">ANULADO</option>
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 md:px-4 md:py-3 md:text-base">
            <input
              type="checkbox"
              checked={usarMontoPersonalizado}
              onChange={(e) => setUsarMontoPersonalizado(e.target.checked)}
            />
            Usar monto personalizado
          </label>

          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base disabled:bg-zinc-50"
            placeholder="Monto personalizado"
            value={montoPersonalizado}
            onChange={(e) => setMontoPersonalizado(e.target.value)}
            disabled={!usarMontoPersonalizado}
            type="number"
            min={0}
            step="0.01"
          />

          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-3 md:text-base"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Origen"
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            required
          />

          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 disabled:bg-zinc-50 md:px-4 md:py-3 md:text-base"
            placeholder="Ingreso (monto)"
            value={ingreso}
            onChange={(e) => setIngreso(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            required={!isChoferPaga}
            disabled={isChoferPaga}
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 disabled:bg-zinc-50 md:px-4 md:py-3 md:text-base"
            placeholder="Peajes (monto)"
            value={peajes}
            onChange={(e) => setPeajes(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            disabled={isChoferPaga}
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 disabled:bg-zinc-50 md:px-4 md:py-3 md:text-base"
            placeholder="Viáticos (monto)"
            value={viaticos}
            onChange={(e) => setViaticos(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            disabled={isChoferPaga}
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 disabled:bg-zinc-50 md:px-4 md:py-3 md:text-base"
            placeholder="Otros gastos (monto)"
            value={otrosGastos}
            onChange={(e) => setOtrosGastos(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            disabled={isChoferPaga}
          />

          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar flete"}
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
            items.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-zinc-900">
                      {f.truck?.placa ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {new Date(f.fecha).toLocaleString()}
                    </div>
                    {f.usarMontoPersonalizado ? (
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        Override
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">{f.ganancia}</div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-zinc-700">
                  <div>
                    Chofer:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.driver ? `${f.driver.nombre} (${f.driver.dni})` : "—"}
                    </span>
                  </div>
                  <div>
                    Cliente:{" "}
                    <span className="font-medium text-zinc-900">{f.cliente}</span>
                  </div>
                  <div>
                    Ruta:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.origen} → {f.destino}
                    </span>
                  </div>
                  <div>
                    Modelo:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.tipoModelo === "DUENO_PAGA" ? "Dueño paga" : "Chofer paga"}
                    </span>
                  </div>
                  <div>
                    Tipo cálculo:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.tipoCalculo === "IDA_VUELTA"
                        ? "Ida y vuelta"
                        : f.tipoCalculo === "MENSUAL"
                          ? "Mensual"
                          : "Viaje"}
                    </span>
                  </div>
                  <div>
                    Ingreso:{" "}
                    <span className="font-medium text-zinc-900">{f.ingreso}</span>
                  </div>
                  <div>
                    Monto automático:{" "}
                    <span
                      className={
                        f.usarMontoPersonalizado
                          ? "font-medium text-zinc-900"
                          : "font-semibold text-emerald-700"
                      }
                    >
                      {f.montoCalculado}
                    </span>
                  </div>
                  <div>
                    Monto final:{" "}
                    <span className="font-semibold text-emerald-700">{f.montoFinal}</span>
                  </div>
                  <div>
                    Dirección:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.direccionPago === "POR_COBRAR" ? "Por cobrar" : "Por pagar"}
                    </span>
                  </div>
                  <div>
                    Estado:{" "}
                    <span className="font-medium text-zinc-900">{f.estado}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    type="button"
                    onClick={() => startEdit(f)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    type="button"
                    onClick={() => onDelete(f.id)}
                    disabled={deletingId === f.id}
                  >
                    {deletingId === f.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 hidden md:block">
          <div className="overflow-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Camión</th>
                  <th className="py-2 pr-3">Chofer</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Ruta</th>
                  <th className="py-2 pr-3">Modelo</th>
                  <th className="py-2 pr-3">Tipo cálculo</th>
                  <th className="py-2 pr-3">Ingreso</th>
                  <th className="py-2 pr-3">Monto automático</th>
                  <th className="py-2 pr-3">Monto final</th>
                  <th className="py-2 pr-3">Dirección</th>
                  <th className="py-2 pr-3">Ganancia</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="py-3 text-zinc-600" colSpan={14}>
                      Cargando...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-600" colSpan={14}>
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
                      <td className="py-3 pr-3 text-zinc-700">
                        {f.tipoModelo === "DUENO_PAGA" ? "Dueño paga" : "Chofer paga"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">
                        {f.tipoCalculo === "IDA_VUELTA"
                          ? "Ida y vuelta"
                          : f.tipoCalculo === "MENSUAL"
                            ? "Mensual"
                            : "Viaje"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">{f.ingreso}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={
                            f.usarMontoPersonalizado
                              ? "text-zinc-700"
                              : "font-semibold text-emerald-700"
                          }
                        >
                          {f.montoCalculado}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-700">{f.montoFinal}</span>
                          {f.usarMontoPersonalizado ? (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                              Override
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">
                        {f.direccionPago === "POR_COBRAR" ? "Por cobrar" : "Por pagar"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">{f.ganancia}</td>
                      <td className="py-3 pr-3 text-zinc-700">{f.estado}</td>
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
    </div>
  );
}
