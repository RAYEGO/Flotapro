"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ApiError = { error: string };

export default function RegisterPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [ruc, setRuc] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyName, ruc, name, email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiError | null;
        setError(data?.error ?? "No se pudo registrar");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-md px-6 py-14">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex justify-center">
            <img src="/logo-flotapro.svg" alt="FlotaPro" className="h-10 w-auto" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-zinc-900">Crear empresa</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Registra tu empresa y crea el usuario administrador.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Empresa</span>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">RUC (opcional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                inputMode="numeric"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Nombre</span>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Email</span>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Contraseña</span>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <div className="mt-2 text-xs text-zinc-500">
                Mínimo 8 caracteres.
              </div>
            </label>

            {error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Creando..." : "Crear"}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-600">
            ¿Ya tienes cuenta?{" "}
            <Link className="font-medium text-zinc-900 underline" href="/login">
              Ingresar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
