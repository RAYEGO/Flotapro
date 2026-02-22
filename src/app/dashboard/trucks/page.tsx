"use client";

import { Pencil } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Truck = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  kilometrajeActual: number;
  estado: "ACTIVO" | "INACTIVO" | "TALLER" | "VENDIDO";
  modoOperacion: "DIRECTO" | "ALQUILER";
  tipoPago: "VUELTA" | "MENSUAL";
  montoPorVueltaDueno?: string | null;
};

export default function TrucksPage() {
  const [items, setItems] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState<number>(2020);
  const [tipo, setTipo] = useState("");
  const [kilometrajeActual, setKilometrajeActual] = useState("");
  const [estado, setEstado] = useState<Truck["estado"]>("ACTIVO");
  const [modoOperacion, setModoOperacion] = useState<Truck["modoOperacion"]>("DIRECTO");
  const [tipoPago, setTipoPago] = useState<"VUELTA" | "MENSUAL">("VUELTA");
  const [montoPorVueltaDueno, setMontoPorVueltaDueno] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trucks");
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo cargar");
      setItems(data.trucks as Truck[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setPlaca("");
    setMarca("");
    setModelo("");
    setAnio(2020);
    setTipo("");
    setKilometrajeActual("");
    setEstado("ACTIVO");
    setModoOperacion("DIRECTO");
    setTipoPago("VUELTA");
    setMontoPorVueltaDueno("");
    setEditingId(null);
  };

  const startEdit = (truck: Truck) => {
    setEditingId(truck.id);
    setPlaca(truck.placa);
    setMarca(truck.marca);
    setModelo(truck.modelo);
    setAnio(truck.anio);
    setTipo(truck.tipo);
    setKilometrajeActual(String(truck.kilometrajeActual));
    setEstado(truck.estado);
    setModoOperacion(truck.modoOperacion);
    setTipoPago(truck.tipoPago ?? "VUELTA");
    setMontoPorVueltaDueno(truck.montoPorVueltaDueno ?? "");
  };

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(editingId ? `/api/trucks/${editingId}` : "/api/trucks", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          placa,
          marca,
          modelo,
          anio,
          tipo,
          kilometrajeActual: Number(kilometrajeActual),
          estado,
          modoOperacion,
          tipoPago,
          montoPorVueltaDueno:
            montoPorVueltaDueno === "" ? undefined : Number(montoPorVueltaDueno),
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

  async function updateEstado(id: string, nextEstado: Truck["estado"]) {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/trucks/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ estado: nextEstado }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, estado: nextEstado } : item)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setUpdatingId(null);
    }
  }

  const estadoBadge = (estadoValue: Truck["estado"]) => {
    if (estadoValue === "ACTIVO") {
      return { label: "Activo", className: "bg-emerald-100 text-emerald-700" };
    }
    if (estadoValue === "INACTIVO") {
      return { label: "Inactivo", className: "bg-zinc-200 text-zinc-700" };
    }
    if (estadoValue === "TALLER") {
      return { label: "Taller", className: "bg-amber-100 text-amber-700" };
    }
    return { label: "Vendido", className: "bg-blue-100 text-blue-700" };
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-lg font-semibold text-zinc-900">Camiones</h1>
        <p className="mt-1 text-sm text-zinc-600">Registro de unidades.</p>

        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          onSubmit={onCreate}
        >
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Placa"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Año"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            type="number"
            min={1950}
            max={2100}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Km actual (ej. 120000)"
            value={kilometrajeActual}
            onChange={(e) => setKilometrajeActual(e.target.value)}
            type="number"
            min={0}
            required
          />
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={modoOperacion}
            onChange={(e) => {
              const value = e.target.value as Truck["modoOperacion"];
              setModoOperacion(value);
              if (value === "DIRECTO") setMontoPorVueltaDueno("");
            }}
            id="modelo-operacion-camion"
            aria-label="Modo de operación"
            title="Modo de operación"
          >
            <option value="DIRECTO">Directo (dueño paga)</option>
            <option value="ALQUILER">Alquiler (chofer paga)</option>
          </select>
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value as "VUELTA" | "MENSUAL")}
            aria-label="Tipo de pago"
            title="Tipo de pago"
          >
            <option value="VUELTA">Por vuelta</option>
            <option value="MENSUAL">Mensual</option>
          </select>
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 disabled:bg-zinc-50 md:px-4 md:py-3 md:text-base"
            placeholder="Monto"
            value={montoPorVueltaDueno}
            onChange={(e) => setMontoPorVueltaDueno(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            disabled={modoOperacion === "DIRECTO" && !editingId}
          />
          <div className="flex flex-wrap gap-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar camión"}
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
            items.map((t) => {
              const status = estadoBadge(t.estado);
              return (
                <div
                  key={t.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-zinc-900">
                        {t.placa}
                      </div>
                      <div className="mt-1 text-sm text-zinc-600">
                        {t.marca} {t.modelo}
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-zinc-700">
                    <div>
                      Año:{" "}
                      <span className="font-medium text-zinc-900">{t.anio}</span>
                    </div>
                    <div>
                      Kilometraje actual:{" "}
                      <span className="font-medium text-zinc-900">
                        {t.kilometrajeActual}
                      </span>
                    </div>
                    <div className="pt-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Estado
                      </label>
                      <select
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 disabled:bg-zinc-50"
                        value={t.estado}
                        onChange={(e) => updateEstado(t.id, e.target.value as Truck["estado"])}
                        disabled={updatingId === t.id}
                        aria-label="Estado del camión"
                        title="Estado del camión"
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="TALLER">Taller</option>
                        <option value="VENDIDO">Vendido</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                      type="button"
                      aria-label="Editar camión"
                      title="Editar"
                      onClick={() => startEdit(t)}
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
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
                  <th className="py-2 pr-3">Placa</th>
                  <th className="py-2 pr-3">Marca</th>
                  <th className="py-2 pr-3">Modelo</th>
                  <th className="py-2 pr-3">Año</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Km</th>
                  <th className="py-2 pr-3">Modelo</th>
                  <th className="py-2 pr-3">Monto dueño</th>
                  <th className="py-2 pr-3">Acciones</th>
                  <th className="py-2 pr-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="py-3 text-zinc-600" colSpan={10}>
                      Cargando...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-600" colSpan={10}>
                      Sin registros
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 pr-3 font-medium text-zinc-900">
                        {t.placa}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">{t.marca}</td>
                      <td className="py-3 pr-3 text-zinc-700">{t.modelo}</td>
                      <td className="py-3 pr-3 text-zinc-700">{t.anio}</td>
                      <td className="py-3 pr-3 text-zinc-700">{t.tipo}</td>
                      <td className="py-3 pr-3 text-zinc-700">
                        {t.kilometrajeActual}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">
                        {t.modoOperacion === "DIRECTO" ? "Dueño paga" : "Chofer paga"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">
                        {t.montoPorVueltaDueno ?? "—"}
                      </td>
                      <td className="py-3 pr-3">
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                          type="button"
                          aria-label="Editar camión"
                          title="Editar"
                          onClick={() => startEdit(t)}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          className="h-9 rounded-lg border border-zinc-200 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 disabled:bg-zinc-50"
                          value={t.estado}
                          onChange={(e) =>
                            updateEstado(t.id, e.target.value as Truck["estado"])
                          }
                          disabled={updatingId === t.id}
                          aria-label="Estado del camión"
                          title="Estado del camión"
                        >
                          <option value="ACTIVO">Activo</option>
                          <option value="INACTIVO">Inactivo</option>
                          <option value="TALLER">Taller</option>
                          <option value="VENDIDO">Vendido</option>
                        </select>
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
