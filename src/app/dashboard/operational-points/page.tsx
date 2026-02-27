"use client";

import { FormEvent, useEffect, useState } from "react";

type ClientOption = { id: string; nombreComercial: string };

type Point = {
  id: string;
  nombre: string;
  tipo: "BALANZA" | "PLANTA" | "MINA" | "PUERTO" | "ALMACEN" | "OTRO" | "AGENCIA" | "PROCESADOR";
  activo: boolean;
  clienteId: string | null;
  direccion: string;
  ciudad: string;
  departamento: string;
  distrito: string | null;
  regionId: number | null;
  provinceId: number | null;
  districtId: number | null;
  latitud: string | null;
  longitud: string | null;
  linkGoogleMaps: string | null;
  referencia: string | null;
  cliente?: { id: string; nombreComercial: string } | null;
};
type RegionOption = { id: number; nombre: string };
type ProvinceOption = { id: number; nombre: string; regionId: number };
type DistrictOption = { id: number; nombre: string; provinceId: number };

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
  const [activo, setActivo] = useState(true);
  const [direccion, setDireccion] = useState("");
  const [regionId, setRegionId] = useState<number | "">("");
  const [provinciaId, setProvinciaId] = useState<number | "">("");
  const [distritoId, setDistritoId] = useState<number | "">("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");
  const [linkGoogleMaps, setLinkGoogleMaps] = useState("");
  const [referencia, setReferencia] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{
    departamento?: string;
    ciudad?: string;
    distrito?: string;
  } | null>(null);

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
    const loadRegions = async () => {
      setRegionsLoading(true);
      try {
        const res = await fetch("/api/regions");
        const data = (await res.json().catch(() => null)) as any;
        if (!res.ok) throw new Error(data?.error ?? "No se pudo cargar regiones");
        if (!active) return;
        setRegions((data?.regions ?? []) as RegionOption[]);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Error");
        setRegions([]);
      } finally {
        if (!active) return;
        setRegionsLoading(false);
      }
    };
    loadRegions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadProvinces = async () => {
      if (regionId === "") {
        setProvinces([]);
        setDistricts([]);
        return;
      }
      setProvincesLoading(true);
      try {
        const res = await fetch(`/api/provinces?regionId=${regionId}`);
        const data = (await res.json().catch(() => null)) as any;
        if (!res.ok) throw new Error(data?.error ?? "No se pudo cargar provincias");
        if (!active) return;
        setProvinces((data?.provinces ?? []) as ProvinceOption[]);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Error");
        setProvinces([]);
      } finally {
        if (!active) return;
        setProvincesLoading(false);
      }
    };
    loadProvinces();
    return () => {
      active = false;
    };
  }, [regionId]);

  useEffect(() => {
    let active = true;
    const loadDistricts = async () => {
      if (provinciaId === "") {
        setDistricts([]);
        return;
      }
      setDistrictsLoading(true);
      try {
        const res = await fetch(`/api/districts?provinceId=${provinciaId}`);
        const data = (await res.json().catch(() => null)) as any;
        if (!res.ok) throw new Error(data?.error ?? "No se pudo cargar distritos");
        if (!active) return;
        setDistricts((data?.districts ?? []) as DistrictOption[]);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Error");
        setDistricts([]);
      } finally {
        if (!active) return;
        setDistrictsLoading(false);
      }
    };
    loadDistricts();
    return () => {
      active = false;
    };
  }, [provinciaId]);

  const resetForm = () => {
    setNombre("");
    setTipo("OTRO");
    setClienteId("");
    setActivo(true);
    setDireccion("");
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
    setActivo(point.activo);
    setDireccion(point.direccion);
    const regionFallback = regions.find((r) => r.nombre === point.departamento)?.id ?? "";
    const nextRegionId = point.regionId ?? regionFallback;
    setRegionId(nextRegionId);
    setProvinciaId(point.provinceId ?? "");
    setDistritoId(point.districtId ?? "");
    const shouldResolve =
      !point.regionId || !point.provinceId || !point.districtId;
    setPendingLocation(
      shouldResolve
        ? {
            departamento: point.departamento,
            ciudad: point.ciudad,
            distrito: point.distrito ?? "",
          }
        : null,
    );
    setLatitud(point.latitud ?? "");
    setLongitud(point.longitud ?? "");
    setLinkGoogleMaps(point.linkGoogleMaps ?? "");
    setReferencia(point.referencia ?? "");
  };

  useEffect(() => {
    if (!pendingLocation || regionId !== "" || regions.length === 0) return;
    const match = regions.find((r) => r.nombre === pendingLocation.departamento);
    if (match) {
      setRegionId(match.id);
    }
  }, [pendingLocation, regions, regionId]);

  useEffect(() => {
    if (!pendingLocation || provinciaId !== "" || provinces.length === 0) return;
    const match = provinces.find((p) => p.nombre === pendingLocation.ciudad);
    if (match) {
      setProvinciaId(match.id);
    }
  }, [pendingLocation, provinces, provinciaId]);

  useEffect(() => {
    if (!pendingLocation || distritoId !== "" || districts.length === 0) return;
    const match = districts.find((d) => d.nombre === pendingLocation.distrito);
    if (match) {
      setDistritoId(match.id);
      setPendingLocation(null);
    }
  }, [pendingLocation, districts, distritoId]);

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
      const nombreValue = nombre.trim();
      const direccionValue = direccion.trim();
      const linkValue = linkGoogleMaps.trim();
      const referenciaValue = referencia.trim();
      const latNumber = latitud === "" ? null : Number(latitud);
      const lngNumber = longitud === "" ? null : Number(longitud);
      if (!nombreValue) {
        setError("Nombre requerido");
        return;
      }
      if (!direccionValue) {
        setError("Dirección requerida");
        return;
      }
      if (regionId === "") {
        setError("Selecciona la región");
        return;
      }
      if (provinciaId === "") {
        setError("Selecciona la provincia");
        return;
      }
      if (distritoId === "") {
        setError("Selecciona el distrito");
        return;
      }
      if (latNumber !== null && !Number.isFinite(latNumber)) {
        setError("Latitud inválida");
        return;
      }
      if (lngNumber !== null && !Number.isFinite(lngNumber)) {
        setError("Longitud inválida");
        return;
      }
      if (latNumber !== null && (latNumber < -90 || latNumber > 90)) {
        setError("Latitud fuera de rango");
        return;
      }
      if (lngNumber !== null && (lngNumber < -180 || lngNumber > 180)) {
        setError("Longitud fuera de rango");
        return;
      }

      const res = await fetch(
        editingId ? `/api/operational-points/${editingId}` : "/api/operational-points",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            nombre: nombreValue,
            tipo,
            clienteId: editingId ? (clienteId === "" ? "" : clienteId) : clienteId || undefined,
            activo,
            direccion: direccionValue,
            regionId,
            provinceId: provinciaId,
            districtId: distritoId,
            latitud: latNumber === null ? undefined : latNumber,
            longitud: lngNumber === null ? undefined : lngNumber,
            linkGoogleMaps: linkValue,
            referencia: referenciaValue,
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
            <option value="AGENCIA">Agencia</option>
            <option value="BALANZA">Balanza</option>
            <option value="PROCESADOR">Procesador</option>
            <option value="PLANTA">Planta Procesadora</option>
            <option value="MINA">Mina</option>
            <option value="PUERTO">Puerto</option>
            <option value="ALMACEN">Almacén</option>
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
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            Activo
          </label>
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-2 md:text-base"
            placeholder="Dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            required
          />
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={regionId === "" ? "" : String(regionId)}
            onChange={(e) => {
              const nextValue = e.target.value;
              const nextId = nextValue === "" ? "" : Number(nextValue);
              if (nextValue !== "" && Number.isNaN(nextId)) return;
              setRegionId(nextId);
              setProvinciaId("");
              setDistritoId("");
              setPendingLocation(null);
            }}
            required
            disabled={regionsLoading}
          >
            <option value="">
              {regionsLoading ? "Cargando regiones..." : "Región"}
            </option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.nombre}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={provinciaId === "" ? "" : String(provinciaId)}
            onChange={(e) => {
              const nextValue = e.target.value;
              const nextId = nextValue === "" ? "" : Number(nextValue);
              if (nextValue !== "" && Number.isNaN(nextId)) return;
              setProvinciaId(nextId);
              setDistritoId("");
              setPendingLocation(null);
            }}
            required
            disabled={regionId === "" || provincesLoading}
          >
            <option value="">
              {provincesLoading ? "Cargando provincias..." : "Provincia"}
            </option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.nombre}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={distritoId === "" ? "" : String(distritoId)}
            onChange={(e) => {
              const nextValue = e.target.value;
              const nextId = nextValue === "" ? "" : Number(nextValue);
              if (nextValue !== "" && Number.isNaN(nextId)) return;
              setDistritoId(nextId);
              setPendingLocation(null);
            }}
            required
            disabled={provinciaId === "" || districtsLoading}
          >
            <option value="">
              {districtsLoading ? "Cargando distritos..." : "Distrito"}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.nombre}
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
