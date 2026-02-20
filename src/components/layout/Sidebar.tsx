import Image from "next/image";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-black/10 transition-all duration-300">
      <Link href="/dashboard" className="flex items-center px-3 py-4">
        <span className="relative hidden h-10 w-40 md:block">
          <Image
            src="/logo.png"
            alt="FlotaPro"
            fill
            sizes="160px"
            className="object-contain"
            priority
          />
        </span>
        <span className="relative h-10 w-10 md:hidden">
          <Image
            src="/logo.png"
            alt="FlotaPro"
            fill
            sizes="40px"
            className="object-contain"
          />
        </span>
      </Link>

      <div className="space-y-1 text-sm">
        <Link
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10 md:justify-start"
          href="/dashboard"
        >
          <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3.172 3 10.5V21a1 1 0 0 0 1 1h5v-7h6v7h5a1 1 0 0 0 1-1V10.5l-9-7.328Z" />
          </svg>
          <span className="hidden md:inline">Resumen</span>
        </Link>
        <Link
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10 md:justify-start"
          href="/dashboard/trucks"
        >
          <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6h1.5a2 2 0 0 1 1.6.8l1.9 2.533A2 2 0 0 1 21 17.5V19a1 1 0 0 1-1 1h-1a2.5 2.5 0 0 1-5 0H9.5a2.5 2.5 0 0 1-5 0H4a1 1 0 0 1-1-1V7Zm13 8V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v8h12Zm3.8 1-1.6-2.133A1 1 0 0 0 17.5 13H16v3h3.8ZM7 19.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Zm8 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
          </svg>
          <span className="hidden md:inline">Camiones</span>
        </Link>
        <Link
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10 md:justify-start"
          href="/dashboard/drivers"
        >
          <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm-7 15a7 7 0 0 1 14 0v1H5v-1Z" />
          </svg>
          <span className="hidden md:inline">Choferes</span>
        </Link>
        <Link
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10 md:justify-start"
          href="/dashboard/freights"
        >
          <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.8 4.2A1 1 0 0 1 3 19.4V4Zm5 5a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H9Zm0-3a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H9Z" />
          </svg>
          <span className="hidden md:inline">Fletes</span>
        </Link>
        <Link
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10 md:justify-start"
          href="/dashboard/fuels"
        >
          <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H6Zm8 6h1.586l1.707 1.707A1 1 0 0 0 18 11h1v6a2 2 0 0 1-2 2h-1V9ZM6 7h6v4H6V7Z" />
          </svg>
          <span className="hidden md:inline">Combustible</span>
        </Link>
        <Link
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10 md:justify-start"
          href="/dashboard/maintenance"
        >
          <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.14 12.936a7 7 0 0 0-8.076-8.076l2.12 2.12-2.121 2.122-4.95-4.95L7.235 3.03A7 7 0 0 0 4.94 12.93l-1.768 1.768a2.5 2.5 0 0 0 3.536 3.536l1.768-1.768a7.001 7.001 0 0 0 8.082-8.082l-2.12 2.12-2.12-2.12 4.95-4.95 1.872 1.872-4.95 4.95 2.12 2.12 2.12-2.12Z" />
          </svg>
          <span className="hidden md:inline">Mantenimiento</span>
        </Link>
      </div>
    </aside>
  );
}
