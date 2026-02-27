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
  distrito: string | null;
  latitud: string | null;
  longitud: string | null;
  linkGoogleMaps: string | null;
  referencia: string | null;
  cliente?: { id: string; nombreComercial: string } | null;
};
type UbigeoItem = {
  id_ubigeo: string;
  nombre_ubigeo: string;
  id_padre_ubigeo: string;
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
  const [distrito, setDistrito] = useState("");
  const [regionId, setRegionId] = useState("");
  const [provinciaId, setProvinciaId] = useState("");
  const [distritoId, setDistritoId] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [linkGoogleMaps, setLinkGoogleMaps] = useState("");
  const [referencia, setReferencia] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ubigeoDepartamentos, setUbigeoDepartamentos] = useState<UbigeoItem[]>([]);
  const [ubigeoProvincias, setUbigeoProvincias] = useState<UbigeoItem[]>([]);
  const [ubigeoDistritos, setUbigeoDistritos] = useState<UbigeoItem[]>([]);

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

  useEffect(() => {
    let active = true;
    const loadUbigeo = async () => {
      if (ubigeoDepartamentos.length) return;
      try {
        const [departamentosRes, provinciasRes, distritosRes] = await Promise.all([
          fetch(
            "https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/departamentos.json",
          ),
          fetch(
            "https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/provincias.json",
          ),
          fetch(
            "https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json/distritos.json",
          ),
        ]);
        const [departamentos, provincias, distritos] = await Promise.all([
          departamentosRes.json(),
          provinciasRes.json(),
          distritosRes.json(),
        ]);
        if (!active) return;
        setUbigeoDepartamentos(departamentos as UbigeoItem[]);
        setUbigeoProvincias(provincias as UbigeoItem[]);
        setUbigeoDistritos(distritos as UbigeoItem[]);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Error");
      }
    };
    loadUbigeo();
    return () => {
      active = false;
    };
  }, [ubigeoDepartamentos.length]);

  const resetForm = () => {
    setNombre("");
    setTipo("OTRO");
    setClienteId("");
    setDireccion("");
    setCiudad("");
    setDepartamento("");
    setDistrito("");
    setRegionId("");
    setProvinciaId("");
    setDistritoId("");
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
    setDistrito(point.distrito ?? "");
    const departamentoItem = ubigeoDepartamentos.find(
      (d) => d.nombre_ubigeo === point.departamento,
    );
    const nextRegionId = departamentoItem?.id_ubigeo ?? "";
    const provinciaItem = ubigeoProvincias.find(
      (p) =>
        p.nombre_ubigeo === point.ciudad && (!nextRegionId || p.id_padre_ubigeo === nextRegionId),
    );
    const nextProvinciaId = provinciaItem?.id_ubigeo ?? "";
    const distritoItem = ubigeoDistritos.find(
      (d) =>
        d.nombre_ubigeo === (point.distrito ?? "") &&
        (!nextProvinciaId || d.id_padre_ubigeo === nextProvinciaId),
    );
    setRegionId(nextRegionId);
    setProvinciaId(nextProvinciaId);
    setDistritoId(distritoItem?.id_ubigeo ?? "");
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
    const address = [point.nombre, point.direccion, point.distrito, point.ciudad, point.departamento]
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
            distrito,
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

  const provinciasDisponibles = regionId
    ? ubigeoProvincias.filter((p) => p.id_padre_ubigeo === regionId)
    : [];
  const distritosDisponibles = provinciaId
    ? ubigeoDistritos.filter((d) => d.id_padre_ubigeo === provinciaId)
    : [];

  return (
    <div className="space-y-6 max-[1366px]:space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 max-[1366px]:p-4">
        <h1 className="text-lg font-semibold text-zinc-900">Puntos operativos</h1>
        <p className="mt-1 text-sm text-zinc-600">Registro de ubicaciones de operación.</p>

        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 min-[1600px]:grid-cols-3 max-[1366px]:gap-2"
          onSubmit={onCreate}
        >
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Point["tipo"])}
          >
            <option value="BALANZA">Agencia</option>
            <option value="BALANZA">Balanza</option>
            <option value="PLANTA">Planta Procesadora</option>
            <option value="MINA">Mina</option>
            <option value="PUERTO">Puerto</option>
            <option value="ALMACEN">Almacén</option>
            <option value="ALMACEN">Mercado</option>
            <option value="ALMACEN">Cliente final</option>
            <option value="OTRO">Otro</option>
          </select>
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
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
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-2 md:text-base"
            placeholder="Dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            required
          />
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={regionId}
            onChange={(e) => {
              const nextId = e.target.value;
              setRegionId(nextId);
              const selected = ubigeoDepartamentos.find((d) => d.id_ubigeo === nextId);
              setDepartamento(selected?.nombre_ubigeo ?? "");
              setProvinciaId("");
              setCiudad("");
              setDistritoId("");
              setDistrito("");
            }}
            required
            disabled={ubigeoDepartamentos.length === 0}
          >
            <option value="">
              {ubigeoDepartamentos.length === 0 ? "Cargando regiones..." : "Región"}
            </option>
            {ubigeoDepartamentos.map((d) => (
              <option key={d.id_ubigeo} value={d.id_ubigeo}>
                {d.nombre_ubigeo}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={provinciaId}
            onChange={(e) => {
              const nextId = e.target.value;
              setProvinciaId(nextId);
              const selected = provinciasDisponibles.find((p) => p.id_ubigeo === nextId);
              setCiudad(selected?.nombre_ubigeo ?? "");
              setDistritoId("");
              setDistrito("");
            }}
            required
            disabled={!regionId}
          >
            <option value="">Provincia</option>
            {provinciasDisponibles.map((p) => (
              <option key={p.id_ubigeo} value={p.id_ubigeo}>
                {p.nombre_ubigeo}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={distritoId}
            onChange={(e) => {
              const nextId = e.target.value;
              setDistritoId(nextId);
              const selected = distritosDisponibles.find((d) => d.id_ubigeo === nextId);
              setDistrito(selected?.nombre_ubigeo ?? "");
            }}
            required
            disabled={!provinciaId}
          >
            <option value="">Distrito</option>
            {distritosDisponibles.map((d) => (
              <option key={d.id_ubigeo} value={d.id_ubigeo}>
                {d.nombre_ubigeo}
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Latitud"
            value={latitud}
            onChange={(e) => setLatitud(e.target.value)}
            type="number"
            step="0.000001"
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Longitud"
            value={longitud}
            onChange={(e) => setLongitud(e.target.value)}
            type="number"
            step="0.000001"
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-2 md:text-base"
            placeholder="Link Google Maps"
            value={linkGoogleMaps}
            onChange={(e) => setLinkGoogleMaps(e.target.value)}
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-2 md:text-base"
            placeholder="Referencia"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />

          <div className="flex flex-wrap gap-2 md:col-span-2 min-[1600px]:col-span-3">
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
                      {p.direccion}, {p.distrito ?? "—"}, {p.ciudad}, {p.departamento}
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
            <table className="w-full min-w-[1200px] text-left text-sm max-[1366px]:min-w-0 max-[1366px]:text-xs">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Dirección</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Distrito</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Provincia</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Región</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Latitud</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Longitud</th>
                  <th className="py-2 pr-3">Mapa</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={11}>
                      Cargando...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={11}>
                      Sin registros
                    </td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3 font-medium text-zinc-900 max-[1366px]:py-2">
                        {p.nombre}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">{p.tipo}</td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {p.cliente?.nombreComercial ?? "Sin cliente"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">{p.direccion}</td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {p.distrito ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {p.ciudad}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {p.departamento}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {p.latitud ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {p.longitud ?? "—"}
                      </td>
                      <td className="py-3 pr-3 max-[1366px]:py-2">
                        <a
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          href={buildMapLink(p)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver mapa
                        </a>
                      </td>
                      <td className="py-3 pr-3 max-[1366px]:py-2">
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
