"use client";

import Image from "next/image";
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
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
          />
          <div className="absolute inset-0 bg-background/85" />
          <div className="pointer-events-none absolute -top-28 left-10 h-80 w-80 rounded-full bg-accent/10 blur-[160px]" />
          <div className="pointer-events-none absolute -bottom-36 right-8 h-96 w-96 rounded-full bg-secondary/10 blur-[170px]" />
          <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
            <div className="fp-glass-card w-full max-w-md p-6">
              <div className="text-sm text-dark/70">Cargando...</div>
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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
      />
      <div className="absolute inset-0 bg-background/85" />
      <div className="pointer-events-none absolute -top-28 left-10 h-80 w-80 rounded-full bg-accent/10 blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-36 right-8 h-96 w-96 rounded-full bg-secondary/10 blur-[170px]" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <div className="fp-glass-card w-full max-w-md p-7 sm:p-8">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="FlotaPro"
              width={520}
              height={140}
              className="h-20 w-auto max-w-[280px] sm:h-24 sm:max-w-[340px]"
              priority
            />
          </div>
          <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-accent/80" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-dark">Ingresar</h1>
          <p className="mt-2 text-sm text-dark/70">
            Accede a tu empresa en FlotaPro.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-dark/80">Email</span>
              <input
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-dark outline-none placeholder:text-dark/40 focus:border-accent focus:ring-2 focus:ring-accent/15"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-dark/80">Contraseña</span>
              <input
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-dark outline-none placeholder:text-dark/40 focus:border-accent focus:ring-2 focus:ring-accent/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <div className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger ring-1 ring-danger/20">
                {error}
              </div>
            ) : null}

            <button
              className="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(11,60,93,0.22)] transition-colors hover:bg-primary/90 disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 text-sm text-dark/70">
            ¿No tienes cuenta?{" "}
            <Link className="font-semibold text-primary underline decoration-accent/70 underline-offset-4" href="/register">
              Crear empresa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
