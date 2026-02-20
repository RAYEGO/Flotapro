"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

type ApiError = { error: string };

const BG_IMAGE_URL =
  "https://images.unsplash.com/photo-1738507869660-b44ea20ab037?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
          />
          <div className="absolute inset-0 bg-zinc-950/40" />
          <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="text-sm text-zinc-600">Cargando...</div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") ?? "/dashboard", [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiError | null;
        setError(data?.error ?? "No se pudo iniciar sesión");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
      />
      <div className="absolute inset-0 bg-zinc-950/40" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white/95 p-6 shadow-sm ring-1 ring-black/10 backdrop-blur">
          <h1 className="text-xl font-semibold text-zinc-900">Ingresar</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Accede a tu empresa en FlotaPro.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
                autoComplete="current-password"
              />
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
              {submitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-600">
            ¿No tienes cuenta?{" "}
            <Link className="font-medium text-zinc-900 underline" href="/register">
              Crear empresa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
