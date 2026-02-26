"use client";

import { FormEvent, useEffect, useState } from "react";

type ClientOption = { id: string; nombreComercial: string };

type Point = {
  id: string;
  nombre: string;
  tipo: "BALANZA" | "PLANTA" | "MINA" | "PUERTO" | "ALMACEN" | "OTRO";
  clienteId: string | null;
  direccion: string;
  ciudad: string;
  departamento: string;
  latitud: string | null;
  longitud: string | null;
  linkGoogleMaps: string | null;
  referencia: string | null;
  cliente?: { id: string; nombreComercial: string } | null;
};

export default function OperationalPointsPage() {
  const [items, setItems] = useState<Point[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Point["tipo"]>("OTRO");
  const [clienteId, setClienteId] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [linkGoogleMaps, setLinkGoogleMaps] = useState("");
  const [referencia, setReferencia] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pointsRes, clientsRes] = await Promise.all([
        fetch("/api/operational-points"),
        fetch("/api/clients"),
      ]);
      const pointsData = (await pointsRes.json().catch(() => null)) as any;
      if (!pointsRes.ok) throw new Error(pointsData?.error ?? "No se pudo cargar");
      const clientsData = (await clientsRes.json().catch(() => null)) as any;
      if (!clientsRes.ok) throw new Error(clientsData?.error ?? "No se pudo cargar clientes");
      setItems(pointsData.points as Point[]);
      setClients(clientsData.clients as ClientOption[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setItems([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setNombre("");
    setTipo("OTRO");
    setClienteId("");
    setDireccion("");
    setCiudad("");
    setDepartamento("");
    setLatitud("");
    setLongitud("");
    setLinkGoogleMaps("");
    setReferencia("");
    setEditingId(null);
  };

  const startEdit = (point: Point) => {
    setEditingId(point.id);
    setNombre(point.nombre);
    setTipo(point.tipo);
    setClienteId(point.clienteId ?? "");
    setDireccion(point.direccion);
    setCiudad(point.ciudad);
    setDepartamento(point.departamento);
    setLatitud(point.latitud ?? "");
    setLongitud(point.longitud ?? "");
    setLinkGoogleMaps(point.linkGoogleMaps ?? "");
    setReferencia(point.referencia ?? "");
  };

  const buildMapLink = (point: Point) => {
    const link = point.linkGoogleMaps?.trim();
    if (link) return link;
    const lat = point.latitud?.trim();
    const lng = point.longitud?.trim();
    if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`;
    const address = [point.nombre, point.direccion, point.ciudad, point.departamento]
      .filter(Boolean)
      .join(", ");
    if (address) return `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
    return "https://www.google.com/maps";
  };

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        editingId ? `/api/operational-points/${editingId}` : "/api/operational-points",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            nombre,
            tipo,
            clienteId: editingId ? (clienteId === "" ? "" : clienteId) : clienteId || undefined,
            direccion,
            ciudad,
            departamento,
            latitud: latitud === "" ? undefined : Number(latitud),
            longitud: longitud === "" ? undefined : Number(longitud),
            linkGoogleMaps,
            referencia,
          }),
        },
      );
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
    if (!confirm("¿Eliminar punto operativo?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/operational-points/${id}`, { method: "DELETE" });
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
        <h1 className="text-lg font-semibold text-zinc-900">Puntos operativos</h1>
        <p className="mt-1 text-sm text-zinc-600">Registro de ubicaciones de operación.</p>

        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" onSubmit={onCreate}>
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Point["tipo"])}
          >
            <option value="BALANZA">Balanza</option>
            <option value="PLANTA">Planta</option>
            <option value="MINA">Mina</option>
            <option value="PUERTO">Puerto</option>
            <option value="ALMACEN">Almacén</option>
            <option value="OTRO">Otro</option>
          </select>
          <select
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-3 md:text-base"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          >
            <option value="">Sin cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombreComercial}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-3 md:text-base"
            placeholder="Dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Ciudad"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Departamento"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Latitud"
            value={latitud}
            onChange={(e) => setLatitud(e.target.value)}
            type="number"
            step="0.000001"
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-3 md:text-base"
            placeholder="Longitud"
            value={longitud}
            onChange={(e) => setLongitud(e.target.value)}
            type="number"
            step="0.000001"
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-3 md:text-base"
            placeholder="Link Google Maps"
            value={linkGoogleMaps}
            onChange={(e) => setLinkGoogleMaps(e.target.value)}
          />
          <input
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-3 md:text-base"
            placeholder="Referencia"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />

          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-3">
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar punto"}
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
            items.map((p) => (
              <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-zinc-900">{p.nombre}</div>
                    <div className="mt-1 text-sm text-zinc-600">{p.tipo}</div>
                  </div>
                  <a
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    href={buildMapLink(p)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver mapa
                  </a>
                </div>
                <div className="mt-3 space-y-1 text-sm text-zinc-700">
                  <div>
                    Cliente:{" "}
                    <span className="font-medium text-zinc-900">
                      {p.cliente?.nombreComercial ?? "Sin cliente"}
                    </span>
                  </div>
                  <div>
                    Dirección:{" "}
                    <span className="font-medium text-zinc-900">
                      {p.direccion}, {p.ciudad}, {p.departamento}
                    </span>
                  </div>
                  <div>
                    Coordenadas:{" "}
                    <span className="font-medium text-zinc-900">
                      {p.latitud ?? "—"}, {p.longitud ?? "—"}
                    </span>
                  </div>
                  <div>
                    Referencia:{" "}
                    <span className="font-medium text-zinc-900">{p.referencia ?? "—"}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    type="button"
                    onClick={() => startEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    type="button"
                    onClick={() => onDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 hidden md:block">
          <div className="overflow-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Dirección</th>
                  <th className="py-2 pr-3">Ciudad</th>
                  <th className="py-2 pr-3">Departamento</th>
                  <th className="py-2 pr-3">Latitud</th>
                  <th className="py-2 pr-3">Longitud</th>
                  <th className="py-2 pr-3">Mapa</th>
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
                  items.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3 font-medium text-zinc-900">{p.nombre}</td>
                      <td className="py-3 pr-3 text-zinc-700">{p.tipo}</td>
                      <td className="py-3 pr-3 text-zinc-700">
                        {p.cliente?.nombreComercial ?? "Sin cliente"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700">{p.direccion}</td>
                      <td className="py-3 pr-3 text-zinc-700">{p.ciudad}</td>
                      <td className="py-3 pr-3 text-zinc-700">{p.departamento}</td>
                      <td className="py-3 pr-3 text-zinc-700">{p.latitud ?? "—"}</td>
                      <td className="py-3 pr-3 text-zinc-700">{p.longitud ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <a
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          href={buildMapLink(p)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver mapa
                        </a>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex gap-2">
                          <button
                            className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                            type="button"
                            onClick={() => startEdit(p)}
                          >
                            Editar
                          </button>
                          <button
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                            type="button"
                            onClick={() => onDelete(p.id)}
                            disabled={deletingId === p.id}
                          >
                            {deletingId === p.id ? "Eliminando..." : "Eliminar"}
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
