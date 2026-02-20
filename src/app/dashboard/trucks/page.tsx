"use client";

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
  montoPorVueltaDueno?: string | null;
};

export default function TrucksPage() {
  const [items, setItems] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState<number>(2020);
  const [tipo, setTipo] = useState("");
  const [kilometrajeActual, setKilometrajeActual] = useState("");
  const [estado, setEstado] = useState<Truck["estado"]>("ACTIVO");
  const [modoOperacion, setModoOperacion] = useState<Truck["modoOperacion"]>("DIRECTO");
  const [montoPorVueltaDueno, setMontoPorVueltaDueno] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar camión?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/trucks/${id}`, { method: "DELETE" });
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
        <h1 className="text-lg font-semibold text-zinc-900">Camiones</h1>
        <p className="mt-1 text-sm text-zinc-600">Registro de unidades.</p>

        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-9" onSubmit={onCreate}>
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Placa"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Año"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            type="number"
            min={1950}
            max={2100}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            placeholder="Km actual (ej. 120000)"
            value={kilometrajeActual}
            onChange={(e) => setKilometrajeActual(e.target.value)}
            type="number"
            min={0}
            required
          />
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={estado}
            onChange={(e) => setEstado(e.target.value as Truck["estado"])}
            aria-label="Estado del camión"
            title="Estado del camión"
          >
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
            <option value="TALLER">TALLER</option>
            <option value="VENDIDO">VENDIDO</option>
          </select>
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
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
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 disabled:bg-zinc-50"
            placeholder="Monto por vuelta dueño"
            value={montoPorVueltaDueno}
            onChange={(e) => setMontoPorVueltaDueno(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            disabled={modoOperacion === "DIRECTO"}
          />
          <div className="md:col-span-9 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar camión"}
            </button>
            {editingId ? (
              <button
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
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
                <th className="py-2 pr-3">Placa</th>
                <th className="py-2 pr-3">Marca</th>
                <th className="py-2 pr-3">Modelo</th>
                <th className="py-2 pr-3">Año</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Km</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Modelo</th>
                <th className="py-2 pr-3">Monto dueño</th>
                <th className="py-2 pr-3">Acciones</th>
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
                    <td className="py-3 pr-3 text-zinc-700">{t.estado}</td>
                    <td className="py-3 pr-3 text-zinc-700">
                      {t.modoOperacion === "DIRECTO" ? "Dueño paga" : "Chofer paga"}
                    </td>
                    <td className="py-3 pr-3 text-zinc-700">
                      {t.montoPorVueltaDueno ?? "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        <button
                          className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                          type="button"
                          onClick={() => startEdit(t)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                          type="button"
                          onClick={() => onDelete(t.id)}
                          disabled={deletingId === t.id}
                        >
                          {deletingId === t.id ? "Eliminando..." : "Eliminar"}
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
