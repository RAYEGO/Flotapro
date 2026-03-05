"use client";

import { FormEvent, useEffect, useState } from "react";

type ClientType = "EMPRESA" | "AGENCIA" | "EVENTUAL";
type ClientStatus = "ACTIVO" | "INACTIVO";

type Client = {
  id: string;
  nombreComercial: string;
  razonSocial: string | null;
  ruc: string | null;
  tipo: ClientType;
  telefono: string;
  correo: string;
  estado: ClientStatus;
};

const tipoLabel: Record<ClientType, string> = {
  EMPRESA: "Empresa",
  AGENCIA: "Agencia",
  EVENTUAL: "Eventual",
};

const estadoLabel: Record<ClientStatus, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
};

export default function ClientsPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [nombreComercial, setNombreComercial] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [ruc, setRuc] = useState("");
  const [tipo, setTipo] = useState<ClientType>("EMPRESA");
  const [estado, setEstado] = useState<ClientStatus>("ACTIVO");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients");
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo cargar");
      setItems((data?.clients ?? []) as Client[]);
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
    setNombreComercial("");
    setRazonSocial("");
    setRuc("");
    setTipo("EMPRESA");
    setEstado("ACTIVO");
    setTelefono("");
    setCorreo("");
    setEditingId(null);
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setNombreComercial(client.nombreComercial);
    setRazonSocial(client.razonSocial ?? "");
    setRuc(client.ruc ?? "");
    setTipo(client.tipo);
    setEstado(client.estado);
    setTelefono(client.telefono);
    setCorreo(client.correo);
  };

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const nombreValue = nombreComercial.trim();
      const telefonoValue = telefono.trim();
      const correoValue = correo.trim();
      const razonValue = razonSocial.trim();
      const rucValue = ruc.trim();

      const res = await fetch(editingId ? `/api/clients/${editingId}` : "/api/clients", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombreComercial: nombreValue,
          razonSocial: razonValue,
          ruc: rucValue,
          tipo,
          telefono: telefonoValue,
          correo: correoValue,
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
    if (!confirm("¿Eliminar cliente?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
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
      <div className="fp-card p-6 max-[1366px]:p-4">
        <h1 className="text-lg font-semibold text-zinc-900">Clientes</h1>
        <p className="mt-1 text-sm text-zinc-600">Registro de clientes.</p>

        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 min-[1600px]:grid-cols-3 min-[1920px]:grid-cols-4 max-[1366px]:gap-2"
          onSubmit={onSave}
        >
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Nombre comercial"
            value={nombreComercial}
            onChange={(e) => setNombreComercial(e.target.value)}
            required
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Razón social"
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="RUC (11 dígitos)"
            value={ruc}
            onChange={(e) => setRuc(e.target.value)}
            inputMode="numeric"
          />
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as ClientType)}
            aria-label="Tipo de cliente"
            title="Tipo de cliente"
          >
            <option value="EMPRESA">Empresa</option>
            <option value="AGENCIA">Agencia</option>
            <option value="EVENTUAL">Eventual</option>
          </select>
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={estado}
            onChange={(e) => setEstado(e.target.value as ClientStatus)}
            aria-label="Estado"
            title="Estado"
          >
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:col-span-2 md:px-4 md:py-2 md:text-base"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            type="email"
            required
          />

          <div className="flex flex-wrap gap-2 md:col-span-2 min-[1600px]:col-span-3 min-[1920px]:col-span-4">
            <button
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60 md:px-4 md:py-3 md:text-base"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar cliente"}
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

      <div className="fp-card p-6 max-[1366px]:p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Listado</h2>
        <div className="mt-4 space-y-4 md:hidden">
          {loading ? (
            <div className="fp-card p-4 text-sm text-zinc-600">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="fp-card p-4 text-sm text-zinc-600">Sin registros</div>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                className="fp-card p-4"
              >
                <div className="text-base font-semibold text-zinc-900">
                  {c.nombreComercial}
                </div>
                <div className="mt-2 space-y-1 text-sm text-zinc-700">
                  <div>
                    Tipo:{" "}
                    <span className="font-medium text-zinc-900">{tipoLabel[c.tipo]}</span>
                  </div>
                  <div>
                    Estado:{" "}
                    <span className="font-medium text-zinc-900">{estadoLabel[c.estado]}</span>
                  </div>
                  <div>
                    RUC: <span className="font-medium text-zinc-900">{c.ruc ?? "—"}</span>
                  </div>
                  <div>
                    Teléfono:{" "}
                    <span className="font-medium text-zinc-900">{c.telefono}</span>
                  </div>
                  <div>
                    Correo: <span className="font-medium text-zinc-900">{c.correo}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    type="button"
                    onClick={() => startEdit(c)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    type="button"
                    onClick={() => onDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 hidden md:block">
          <div className="overflow-auto">
            <table className="w-full min-w-[1050px] text-left text-sm max-[1366px]:min-w-0 max-[1366px]:text-xs">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Nombre comercial</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Razón social</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">RUC</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Teléfono</th>
                  <th className="py-2 pr-3">Correo</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={8}>
                      Cargando...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={8}>
                      Sin registros
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 pr-3 font-medium text-zinc-900 max-[1366px]:py-2">
                        {c.nombreComercial}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {c.razonSocial ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {tipoLabel[c.tipo]}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {estadoLabel[c.estado]}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {c.ruc ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {c.telefono}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {c.correo}
                      </td>
                      <td className="py-3 pr-3 max-[1366px]:py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                            type="button"
                            onClick={() => startEdit(c)}
                          >
                            Editar
                          </button>
                          <button
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                            type="button"
                            onClick={() => onDelete(c.id)}
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id ? "Eliminando..." : "Eliminar"}
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
