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
};

export default function TrucksPage() {
  const [items, setItems] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState<number>(2020);
  const [tipo, setTipo] = useState("");
  const [kilometrajeActual, setKilometrajeActual] = useState("");
  const [estado, setEstado] = useState<Truck["estado"]>("ACTIVO");
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trucks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          placa,
          marca,
          modelo,
          anio,
          tipo,
          kilometrajeActual: Number(kilometrajeActual),
          estado,
        }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      setPlaca("");
      setMarca("");
      setModelo("");
      setTipo("");
      setKilometrajeActual("");
      setEstado("ACTIVO");
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
        <h1 className="text-lg font-semibold text-zinc-900">Camiones</h1>
        <p className="mt-1 text-sm text-zinc-600">Registro de unidades.</p>

        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-7" onSubmit={onCreate}>
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
          <button
            className="md:col-span-7 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Guardando..." : "Agregar camión"}
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
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Placa</th>
                <th className="py-2 pr-3">Marca</th>
                <th className="py-2 pr-3">Modelo</th>
                <th className="py-2 pr-3">Año</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Km</th>
                <th className="py-2 pr-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td className="py-3 text-zinc-600" colSpan={7}>
                    Cargando...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="py-3 text-zinc-600" colSpan={7}>
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
