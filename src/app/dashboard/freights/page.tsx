"use client";

import { FormEvent, useEffect, useState } from "react";

type TruckOption = {
  id: string;
  placa: string;
  modeloPago: "DUENO_PAGA" | "CHOFER_PAGA";
  tipoCalculo: "VIAJE" | "IDA_VUELTA" | "MENSUAL";
  montoBase: string;
};
type DriverOption = { id: string; nombre: string; dni: string };
type ClientOption = { id: string; nombreComercial: string; estado: "ACTIVO" | "INACTIVO" };
type OperationalPointOption = {
  id: string;
  nombre: string;
  tipo: "BALANZA" | "PLANTA" | "MINA" | "PUERTO" | "ALMACEN" | "OTRO";
  clienteId: string | null;
};
type UbigeoItem = {
  id_ubigeo: string;
  nombre_ubigeo: string;
  id_padre_ubigeo: string;
};

type Freight = {
  id: string;
  fecha: string;
  cliente: string;
  origen: string;
  destino: string;
  customerId: string | null;
  originPointId: string | null;
  destinationPointId: string | null;
  ingreso: string;
  peajes: string;
  viaticos: string;
  otrosGastos: string;
  ganancia: string;
  tipoModelo: "DUENO_PAGA" | "CHOFER_PAGA";
  montoAcordado: string;
  tipoCalculo: "VIAJE" | "IDA_VUELTA" | "MENSUAL";
  montoBase: string;
  montoCalculado: string;
  usarMontoPersonalizado: boolean;
  montoPersonalizado: string | null;
  montoFinal: string;
  direccionPago: "POR_PAGAR" | "POR_COBRAR";
  estado: "PENDIENTE" | "COMPLETADO" | "ANULADO";
  truck?: { id: string; placa: string } | null;
  driver?: { id: string; nombre: string; dni: string } | null;
  customer?: { id: string; nombreComercial: string } | null;
  originPoint?: { id: string; nombre: string } | null;
  destinationPoint?: { id: string; nombre: string } | null;
  truckId: string;
  driverId: string;
};

type FreightExpense = {
  id: string;
  fecha: string;
  concepto: string;
  monto: string;
  freightId: string;
  freight?: {
    id: string;
    cliente: string;
    origen: string;
    destino: string;
    customer?: { id: string; nombreComercial: string } | null;
    originPoint?: { id: string; nombre: string } | null;
    destinationPoint?: { id: string; nombre: string } | null;
    truck?: { id: string; placa: string } | null;
    driver?: { id: string; nombre: string; dni: string } | null;
  } | null;
};

export default function FreightsPage() {
  const [items, setItems] = useState<Freight[]>([]);
  const [expenses, setExpenses] = useState<FreightExpense[]>([]);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [customers, setCustomers] = useState<ClientOption[]>([]);
  const [points, setPoints] = useState<OperationalPointOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [fecha, setFecha] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [originPointId, setOriginPointId] = useState("");
  const [destinationPointId, setDestinationPointId] = useState("");
  const [ingreso, setIngreso] = useState("");
  const [peajes, setPeajes] = useState("");
  const [viaticos, setViaticos] = useState("");
  const [otrosGastos, setOtrosGastos] = useState("");
  const [montoAutomatico, setMontoAutomatico] = useState("");
  const [usarMontoPersonalizado, setUsarMontoPersonalizado] = useState(false);
  const [montoPersonalizado, setMontoPersonalizado] = useState("");
  const [estado, setEstado] = useState<Freight["estado"]>("PENDIENTE");
  const [submitting, setSubmitting] = useState(false);
  const [expenseFreightId, setExpenseFreightId] = useState("");
  const [expenseFecha, setExpenseFecha] = useState("");
  const [expenseConcepto, setExpenseConcepto] = useState("");
  const [expenseMonto, setExpenseMonto] = useState("");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [clientNombreComercial, setClientNombreComercial] = useState("");
  const [clientRazonSocial, setClientRazonSocial] = useState("");
  const [clientRuc, setClientRuc] = useState("");
  const [clientTipo, setClientTipo] = useState<"EMPRESA" | "AGENCIA" | "EVENTUAL">("EMPRESA");
  const [clientEstado, setClientEstado] = useState<ClientOption["estado"]>("ACTIVO");
  const [clientTelefono, setClientTelefono] = useState("");
  const [clientCorreo, setClientCorreo] = useState("");
  const [clientSubmitting, setClientSubmitting] = useState(false);
  const [pointNombre, setPointNombre] = useState("");
  const [pointTipo, setPointTipo] = useState<OperationalPointOption["tipo"]>("OTRO");
  const [pointClienteId, setPointClienteId] = useState("");
  const [pointDireccion, setPointDireccion] = useState("");
  const [pointCiudad, setPointCiudad] = useState("");
  const [pointDepartamento, setPointDepartamento] = useState("");
  const [pointDistrito, setPointDistrito] = useState("");
  const [pointRegionId, setPointRegionId] = useState("");
  const [pointProvinciaId, setPointProvinciaId] = useState("");
  const [pointDistritoId, setPointDistritoId] = useState("");
  const [pointLink, setPointLink] = useState("");
  const [pointReferencia, setPointReferencia] = useState("");
  const [pointSubmitting, setPointSubmitting] = useState(false);
  const [ubigeoDepartamentos, setUbigeoDepartamentos] = useState<UbigeoItem[]>([]);
  const [ubigeoProvincias, setUbigeoProvincias] = useState<UbigeoItem[]>([]);
  const [ubigeoDistritos, setUbigeoDistritos] = useState<UbigeoItem[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [freightsRes, trucksRes, driversRes, expensesRes, clientsRes, pointsRes] =
        await Promise.all([
          fetch("/api/freights"),
          fetch("/api/trucks"),
          fetch("/api/drivers"),
          fetch("/api/freight-expenses"),
          fetch("/api/clients"),
          fetch("/api/operational-points"),
        ]);
      const freightsData = (await freightsRes.json().catch(() => null)) as any;
      if (!freightsRes.ok) throw new Error(freightsData?.error ?? "No se pudo cargar");
      const trucksData = (await trucksRes.json().catch(() => null)) as any;
      if (!trucksRes.ok) throw new Error(trucksData?.error ?? "No se pudo cargar camiones");
      const driversData = (await driversRes.json().catch(() => null)) as any;
      if (!driversRes.ok) throw new Error(driversData?.error ?? "No se pudo cargar choferes");
      const expensesData = (await expensesRes.json().catch(() => null)) as any;
      if (!expensesRes.ok) throw new Error(expensesData?.error ?? "No se pudo cargar gastos");
      const clientsData = (await clientsRes.json().catch(() => null)) as any;
      if (!clientsRes.ok) throw new Error(clientsData?.error ?? "No se pudo cargar clientes");
      const pointsData = (await pointsRes.json().catch(() => null)) as any;
      if (!pointsRes.ok)
        throw new Error(pointsData?.error ?? "No se pudo cargar puntos operativos");

      setItems(freightsData.freights as Freight[]);
      setExpenses(expensesData.expenses as FreightExpense[]);
      setTrucks(
        (trucksData.trucks as any[]).map((t) => ({
          id: t.id,
          placa: t.placa,
          modeloPago: t.modeloPago ?? "DUENO_PAGA",
          tipoCalculo: t.tipoCalculo ?? "VIAJE",
          montoBase: t.montoBase ?? "0",
        })),
      );
      setDrivers(
        (driversData.drivers as any[]).map((d) => ({
          id: d.id,
          nombre: d.nombre,
          dni: d.dni,
        })),
      );
      setCustomers(clientsData.clients as ClientOption[]);
      setPoints(
        (pointsData.points as any[]).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          tipo: p.tipo,
          clienteId: p.clienteId ?? null,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setItems([]);
      setExpenses([]);
      setTrucks([]);
      setDrivers([]);
      setCustomers([]);
      setPoints([]);
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

  const toDateTimeLocal = (value: string) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const calcularMontoAutomatico = (truck: TruckOption | undefined) => {
    if (!truck) return "";
    const base = Number(truck.montoBase ?? 0);
    const multiplicador = truck.tipoCalculo === "IDA_VUELTA" ? 2 : 1;
    if (Number.isNaN(base)) return "0.00";
    return (base * multiplicador).toFixed(2);
  };

  const resetForm = () => {
    setTruckId("");
    setDriverId("");
    setFecha("");
    setCustomerId("");
    setOriginPointId("");
    setDestinationPointId("");
    setIngreso("");
    setPeajes("");
    setViaticos("");
    setOtrosGastos("");
    setMontoAutomatico("");
    setUsarMontoPersonalizado(false);
    setMontoPersonalizado("");
    setEstado("PENDIENTE");
    setEditingId(null);
  };

  const startEdit = (freight: Freight) => {
    setEditingId(freight.id);
    setTruckId(freight.truckId);
    setDriverId(freight.driverId);
    setFecha(toDateTimeLocal(freight.fecha));
    setCustomerId(freight.customerId ?? "");
    setOriginPointId(freight.originPointId ?? "");
    setDestinationPointId(freight.destinationPointId ?? "");
    setIngreso(String(freight.ingreso));
    setPeajes(String(freight.peajes));
    setViaticos(String(freight.viaticos));
    setOtrosGastos(String(freight.otrosGastos));
    setMontoAutomatico(String(freight.montoCalculado));
    setUsarMontoPersonalizado(freight.usarMontoPersonalizado);
    setMontoPersonalizado(freight.montoPersonalizado ?? "");
    setEstado(freight.estado);
  };

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (usarMontoPersonalizado && (montoPersonalizado === "" || Number.isNaN(Number(montoPersonalizado)))) {
        setError("Monto personalizado requerido");
        return;
      }
      if (!customerId) {
        setError("Selecciona un cliente");
        return;
      }
      if (!originPointId) {
        setError("Selecciona el punto de origen");
        return;
      }
      if (!destinationPointId) {
        setError("Selecciona el punto de destino");
        return;
      }

      const res = await fetch(editingId ? `/api/freights/${editingId}` : "/api/freights", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          truckId,
          driverId,
          customerId,
          originPointId,
          destinationPointId,
          fecha: new Date(fecha).toISOString(),
          usarMontoPersonalizado,
          montoPersonalizado:
            usarMontoPersonalizado && montoPersonalizado !== ""
              ? Number(montoPersonalizado)
              : undefined,
          ingreso: Number(ingreso),
          peajes: peajes === "" ? 0 : Number(peajes),
          viaticos: viaticos === "" ? 0 : Number(viaticos),
          otrosGastos: otrosGastos === "" ? 0 : Number(otrosGastos),
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
    if (!confirm("¿Eliminar flete?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/freights/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo eliminar");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setDeletingId(null);
    }
  }

  const resetClientForm = () => {
    setClientNombreComercial("");
    setClientRazonSocial("");
    setClientRuc("");
    setClientTipo("EMPRESA");
    setClientEstado("ACTIVO");
    setClientTelefono("");
    setClientCorreo("");
  };

  const resetPointForm = () => {
    setPointNombre("");
    setPointTipo("OTRO");
    setPointClienteId("");
    setPointDireccion("");
    setPointCiudad("");
    setPointDepartamento("");
    setPointDistrito("");
    setPointRegionId("");
    setPointProvinciaId("");
    setPointDistritoId("");
    setPointLink("");
    setPointReferencia("");
  };

  async function onCreateClient(e: FormEvent) {
    e.preventDefault();
    setClientSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombreComercial: clientNombreComercial,
          razonSocial: clientRazonSocial,
          ruc: clientRuc,
          tipo: clientTipo,
          telefono: clientTelefono,
          correo: clientCorreo,
          estado: clientEstado,
        }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear cliente");
      await load();
      setCustomerId(data.client?.id ?? "");
      setShowClientModal(false);
      resetClientForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setClientSubmitting(false);
    }
  }

  async function onCreatePoint(e: FormEvent) {
    e.preventDefault();
    setPointSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/operational-points", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombre: pointNombre,
          tipo: pointTipo,
          clienteId: pointClienteId === "" ? undefined : pointClienteId,
          direccion: pointDireccion,
          ciudad: pointCiudad,
          departamento: pointDepartamento,
          distrito: pointDistrito,
          linkGoogleMaps: pointLink,
          referencia: pointReferencia,
        }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo crear punto");
      await load();
      if (!originPointId) {
        setOriginPointId(data.point?.id ?? "");
      } else if (!destinationPointId) {
        setDestinationPointId(data.point?.id ?? "");
      }
      setShowPointModal(false);
      resetPointForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setPointSubmitting(false);
    }
  }

  const resetExpenseForm = () => {
    setExpenseFreightId("");
    setExpenseFecha("");
    setExpenseConcepto("");
    setExpenseMonto("");
    setEditingExpenseId(null);
  };

  const startEditExpense = (expense: FreightExpense) => {
    setEditingExpenseId(expense.id);
    setExpenseFreightId(expense.freightId);
    setExpenseFecha(toDateTimeLocal(expense.fecha));
    setExpenseConcepto(expense.concepto);
    setExpenseMonto(String(expense.monto));
  };

  async function onCreateExpense(e: FormEvent) {
    e.preventDefault();
    setExpenseSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        editingExpenseId ? `/api/freight-expenses/${editingExpenseId}` : "/api/freight-expenses",
        {
          method: editingExpenseId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            freightId: expenseFreightId,
            fecha: new Date(expenseFecha).toISOString(),
            concepto: expenseConcepto,
            monto: Number(expenseMonto),
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar gasto");
      resetExpenseForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setExpenseSubmitting(false);
    }
  }

  async function onDeleteExpense(id: string) {
    if (!confirm("¿Eliminar gasto?")) return;
    setDeletingExpenseId(id);
    setError(null);
    try {
      const res = await fetch(`/api/freight-expenses/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo eliminar gasto");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setDeletingExpenseId(null);
    }
  }

  const selectedTruck = trucks.find((t) => t.id === truckId);
  const tipoCalculoLabel =
    selectedTruck?.tipoCalculo === "IDA_VUELTA"
      ? "Ida y vuelta"
      : selectedTruck?.tipoCalculo === "MENSUAL"
        ? "Mensual"
        : "Viaje";
  const getCustomerName = (freight: Freight) =>
    freight.customer?.nombreComercial ?? freight.cliente ?? "—";
  const getOriginName = (freight: Freight) => freight.originPoint?.nombre ?? freight.origen ?? "—";
  const getDestinationName = (freight: Freight) =>
    freight.destinationPoint?.nombre ?? freight.destino ?? "—";
  const getRoute = (freight: Freight) => `${getOriginName(freight)} → ${getDestinationName(freight)}`;
  const getExpenseCustomerName = (freight: FreightExpense["freight"]) =>
    freight?.customer?.nombreComercial ?? freight?.cliente ?? "—";
  const getExpenseRoute = (freight: FreightExpense["freight"]) => {
    const origen = freight?.originPoint?.nombre ?? freight?.origen ?? "—";
    const destino = freight?.destinationPoint?.nombre ?? freight?.destino ?? "—";
    return `${origen} → ${destino}`;
  };
  const provinciasDisponibles = pointRegionId
    ? ubigeoProvincias.filter((p) => p.id_padre_ubigeo === pointRegionId)
    : [];
  const distritosDisponibles = pointProvinciaId
    ? ubigeoDistritos.filter((d) => d.id_padre_ubigeo === pointProvinciaId)
    : [];

  return (
    <div className="space-y-6 max-[1366px]:space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 max-[1366px]:p-4">
        <h1 className="text-lg font-semibold text-zinc-900">Fletes</h1>
        <p className="mt-1 text-sm text-zinc-600">Control de viajes e ingresos.</p>

        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 min-[1600px]:grid-cols-3 min-[1920px]:grid-cols-4 max-[1366px]:gap-2"
          onSubmit={onCreate}
        >
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={truckId}
            onChange={(e) => {
              const nextId = e.target.value;
              setTruckId(nextId);
              const selected = trucks.find((t) => t.id === nextId);
              setMontoAutomatico(calcularMontoAutomatico(selected));
            }}
            required
          >
            <option value="">Camión</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.placa}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            required
          >
            <option value="">Chofer</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.dni})
              </option>
            ))}
          </select>

          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            aria-label="Fecha y hora del viaje"
            title="Fecha y hora del viaje"
          />

          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Pago chofer/dueño"
            value={montoAutomatico}
            readOnly
            aria-label="Pago chofer o dueño"
            title="Pago chofer o dueño"
          />

          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Tipo de cálculo"
            value={tipoCalculoLabel}
            readOnly
            aria-label="Tipo de cálculo"
            title="Tipo de cálculo"
          />

          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={estado}
            onChange={(e) => setEstado(e.target.value as Freight["estado"])}
            aria-label="Estado del flete"
            title="Estado del flete"
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="COMPLETADO">COMPLETADO</option>
            <option value="ANULADO">ANULADO</option>
          </select>

          <label className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 md:px-4 md:py-2 md:text-base">
            <input
              type="checkbox"
              checked={usarMontoPersonalizado}
              onChange={(e) => {
                const next = e.target.checked;
                setUsarMontoPersonalizado(next);
                if (!next) {
                  setMontoPersonalizado("");
                  return;
                }
                if (montoPersonalizado === "" && montoAutomatico !== "") {
                  setMontoPersonalizado(montoAutomatico);
                }
              }}
            />
            Usar pago personalizado
          </label>

          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base disabled:bg-zinc-50"
            placeholder="Pago personalizado chofer/dueño"
            value={montoPersonalizado}
            onChange={(e) => setMontoPersonalizado(e.target.value)}
            disabled={!usarMontoPersonalizado}
            type="number"
            min={0}
            step="0.01"
          />

          <div className="flex items-center gap-2 md:col-span-2">
            <select
              className="h-10 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (e.target.value === "") {
                  setOriginPointId("");
                  setDestinationPointId("");
                }
              }}
              required
            >
              <option value="">Cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombreComercial}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
              type="button"
              onClick={() => {
                resetClientForm();
                setShowClientModal(true);
              }}
            >
              Nuevo
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-10 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
              value={originPointId}
              onChange={(e) => setOriginPointId(e.target.value)}
              required
            >
              <option value="">Punto origen</option>
              {(customerId
                ? points.filter((p) => !p.clienteId || p.clienteId === customerId)
                : points
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
              type="button"
              onClick={() => {
                resetPointForm();
                setPointClienteId(customerId);
                setShowPointModal(true);
              }}
            >
              Nuevo
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-10 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
              value={destinationPointId}
              onChange={(e) => setDestinationPointId(e.target.value)}
              required
            >
              <option value="">Punto destino</option>
              {(customerId
                ? points.filter((p) => !p.clienteId || p.clienteId === customerId)
                : points
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
              type="button"
              onClick={() => {
                resetPointForm();
                setPointClienteId(customerId);
                setShowPointModal(true);
              }}
            >
              Nuevo
            </button>
          </div>

          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 disabled:bg-zinc-50 md:px-4 md:py-2 md:text-base"
            placeholder="Monto flete"
            value={ingreso}
            onChange={(e) => setIngreso(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            required
          />

          <div className="flex flex-wrap gap-2 md:col-span-2 min-[1600px]:col-span-3 min-[1920px]:col-span-4">
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar flete"}
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
        <h2 className="text-sm font-semibold text-zinc-900">Gastos por flete</h2>

        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 min-[1600px]:grid-cols-3 min-[1920px]:grid-cols-4 max-[1366px]:gap-2"
          onSubmit={onCreateExpense}
        >
          <p className="text-sm text-zinc-600 md:col-span-2 min-[1600px]:col-span-3 min-[1920px]:col-span-4">
            Puede colocar gastos como viáticos, peajes y otros gastos.
          </p>
          <select
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            value={expenseFreightId}
            onChange={(e) => setExpenseFreightId(e.target.value)}
            required
          >
            <option value="">Flete</option>
            {items.map((f) => (
              <option key={f.id} value={f.id}>
                {(f.truck?.placa ?? "—") + " - " + getCustomerName(f)}
              </option>
            ))}
          </select>

          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
            type="datetime-local"
            value={expenseFecha}
            onChange={(e) => setExpenseFecha(e.target.value)}
            required
            aria-label="Fecha del gasto"
            title="Fecha del gasto"
          />

          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Concepto"
            value={expenseConcepto}
            onChange={(e) => setExpenseConcepto(e.target.value)}
            required
          />

          <input
            className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 placeholder:text-zinc-400 md:px-4 md:py-2 md:text-base"
            placeholder="Monto"
            value={expenseMonto}
            onChange={(e) => setExpenseMonto(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            required
          />

          <div className="flex flex-wrap gap-2 md:col-span-2 min-[1600px]:col-span-3 min-[1920px]:col-span-4">
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
              type="submit"
              disabled={expenseSubmitting}
            >
              {expenseSubmitting
                ? "Guardando..."
                : editingExpenseId
                  ? "Guardar cambios"
                  : "Agregar gasto"}
            </button>
            {editingExpenseId ? (
              <button
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
                type="button"
                onClick={resetExpenseForm}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-4 space-y-4 md:hidden">
          {loading ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-black/5">
              Cargando...
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-black/5">
              Sin gastos
            </div>
          ) : (
            expenses.map((e) => (
              <div
                key={e.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-zinc-900">
                      {e.freight?.truck?.placa ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {new Date(e.fecha).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">{e.monto}</div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-zinc-700">
                  <div>
                    Cliente:{" "}
                    <span className="font-medium text-zinc-900">
                      {getExpenseCustomerName(e.freight)}
                    </span>
                  </div>
                  <div>
                    Ruta:{" "}
                    <span className="font-medium text-zinc-900">
                      {getExpenseRoute(e.freight)}
                    </span>
                  </div>
                  <div>
                    Concepto:{" "}
                    <span className="font-medium text-zinc-900">{e.concepto}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    type="button"
                    onClick={() => startEditExpense(e)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    type="button"
                    onClick={() => onDeleteExpense(e.id)}
                    disabled={deletingExpenseId === e.id}
                  >
                    {deletingExpenseId === e.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 hidden md:block">
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-left text-sm max-[1366px]:min-w-0 max-[1366px]:text-xs">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Camión</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Ruta</th>
                  <th className="py-2 pr-3">Concepto</th>
                  <th className="py-2 pr-3">Monto</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={7}>
                      Cargando...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={7}>
                      Sin gastos
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {new Date(e.fecha).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 font-medium text-zinc-900 max-[1366px]:py-2">
                        {e.freight?.truck?.placa ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {getExpenseCustomerName(e.freight)}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {getExpenseRoute(e.freight)}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">{e.concepto}</td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">{e.monto}</td>
                      <td className="py-3 pr-3 max-[1366px]:py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                            type="button"
                            onClick={() => startEditExpense(e)}
                          >
                            Editar
                          </button>
                          <button
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                            type="button"
                            onClick={() => onDeleteExpense(e.id)}
                            disabled={deletingExpenseId === e.id}
                          >
                            {deletingExpenseId === e.id ? "Eliminando..." : "Eliminar"}
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
            items.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-zinc-900">
                      {f.truck?.placa ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {new Date(f.fecha).toLocaleString()}
                    </div>
                    {f.usarMontoPersonalizado ? (
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        Override
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">{f.ganancia}</div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-zinc-700">
                  <div>
                    Chofer:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.driver ? `${f.driver.nombre} (${f.driver.dni})` : "—"}
                    </span>
                  </div>
                  <div>
                    Cliente:{" "}
                    <span className="font-medium text-zinc-900">{getCustomerName(f)}</span>
                  </div>
                  <div>
                    Ruta:{" "}
                    <span className="font-medium text-zinc-900">
                      {getRoute(f)}
                    </span>
                  </div>
                  <div>
                    Modelo:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.tipoModelo === "DUENO_PAGA" ? "Dueño paga" : "Chofer paga"}
                    </span>
                  </div>
                  <div>
                    Tipo cálculo:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.tipoCalculo === "IDA_VUELTA"
                        ? "Ida y vuelta"
                        : f.tipoCalculo === "MENSUAL"
                          ? "Mensual"
                          : "Viaje"}
                    </span>
                  </div>
                  <div>
                    Monto flete:{" "}
                    <span className="font-medium text-zinc-900">{f.ingreso}</span>
                  </div>
                  <div>
                    Pago chofer/dueño:{" "}
                    <span
                      className={
                        f.usarMontoPersonalizado
                          ? "font-medium text-zinc-900"
                          : "font-semibold text-emerald-700"
                      }
                    >
                      {f.montoCalculado}
                    </span>
                  </div>
                  <div>
                    Monto final:{" "}
                    <span className="font-semibold text-emerald-700">{f.montoFinal}</span>
                  </div>
                  <div>
                    Dirección:{" "}
                    <span className="font-medium text-zinc-900">
                      {f.direccionPago === "POR_COBRAR" ? "Por cobrar" : "Por pagar"}
                    </span>
                  </div>
                  <div>
                    Estado:{" "}
                    <span className="font-medium text-zinc-900">{f.estado}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    type="button"
                    onClick={() => startEdit(f)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    type="button"
                    onClick={() => onDelete(f.id)}
                    disabled={deletingId === f.id}
                  >
                    {deletingId === f.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 hidden md:block">
          <div className="overflow-auto">
            <table className="w-full min-w-[1180px] text-left text-sm max-[1366px]:min-w-0 max-[1366px]:text-xs">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Camión</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Chofer</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Ruta</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Modelo</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Tipo cálculo</th>
                  <th className="py-2 pr-3">Monto flete</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Pago chofer/dueño</th>
                  <th className="py-2 pr-3">Monto final</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Dirección</th>
                  <th className="py-2 pr-3">Ganancia</th>
                  <th className="py-2 pr-3 max-[1366px]:hidden">Estado</th>
                  <th className="py-2 pr-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={14}>
                      Cargando...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-600 max-[1366px]:py-2" colSpan={14}>
                      Sin registros
                    </td>
                  </tr>
                ) : (
                  items.map((f) => (
                    <tr key={f.id}>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {new Date(f.fecha).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 font-medium text-zinc-900 max-[1366px]:py-2">
                        {f.truck?.placa ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {f.driver ? `${f.driver.nombre} (${f.driver.dni})` : "—"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">{getCustomerName(f)}</td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">
                        {getRoute(f)}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {f.tipoModelo === "DUENO_PAGA" ? "Dueño paga" : "Chofer paga"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {f.tipoCalculo === "IDA_VUELTA"
                          ? "Ida y vuelta"
                          : f.tipoCalculo === "MENSUAL"
                            ? "Mensual"
                            : "Viaje"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">{f.ingreso}</td>
                      <td className="py-3 pr-3 max-[1366px]:hidden max-[1366px]:py-2">
                        <span
                          className={
                            f.usarMontoPersonalizado
                              ? "text-zinc-700"
                              : "font-semibold text-emerald-700"
                          }
                        >
                          {f.montoCalculado}
                        </span>
                      </td>
                      <td className="py-3 pr-3 max-[1366px]:py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-700">{f.montoFinal}</span>
                          {f.usarMontoPersonalizado ? (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                              Override
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">
                        {f.direccionPago === "POR_COBRAR" ? "Por cobrar" : "Por pagar"}
                      </td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:py-2">{f.ganancia}</td>
                      <td className="py-3 pr-3 text-zinc-700 max-[1366px]:hidden max-[1366px]:py-2">{f.estado}</td>
                      <td className="py-3 pr-3 max-[1366px]:py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-xs font-medium text-zinc-700 hover:text-zinc-900"
                            type="button"
                            onClick={() => startEdit(f)}
                          >
                            Editar
                          </button>
                          <button
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                            type="button"
                            onClick={() => onDelete(f.id)}
                            disabled={deletingId === f.id}
                          >
                            {deletingId === f.id ? "Eliminando..." : "Eliminar"}
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
      {showClientModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg max-[1366px]:p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-zinc-900">Nuevo cliente</h3>
              <button
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                type="button"
                onClick={() => setShowClientModal(false)}
              >
                Cerrar
              </button>
            </div>
            <form
              className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 max-[1366px]:gap-2"
              onSubmit={onCreateClient}
            >
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                placeholder="Nombre comercial"
                value={clientNombreComercial}
                onChange={(e) => setClientNombreComercial(e.target.value)}
                required
              />
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                placeholder="Razón social"
                value={clientRazonSocial}
                onChange={(e) => setClientRazonSocial(e.target.value)}
              />
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                placeholder="RUC"
                value={clientRuc}
                onChange={(e) => setClientRuc(e.target.value)}
              />
              <select
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                value={clientTipo}
                onChange={(e) => setClientTipo(e.target.value as typeof clientTipo)}
              >
                <option value="EMPRESA">Empresa</option>
                <option value="AGENCIA">Agencia</option>
                <option value="EVENTUAL">Eventual</option>
              </select>
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                placeholder="Teléfono"
                value={clientTelefono}
                onChange={(e) => setClientTelefono(e.target.value)}
                required
              />
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                placeholder="Correo"
                value={clientCorreo}
                onChange={(e) => setClientCorreo(e.target.value)}
                type="email"
                required
              />
              <select
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:col-span-2 md:px-4 md:py-2 md:text-base"
                value={clientEstado}
                onChange={(e) => setClientEstado(e.target.value as ClientOption["estado"])}
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
                  type="submit"
                  disabled={clientSubmitting}
                >
                  {clientSubmitting ? "Guardando..." : "Guardar cliente"}
                </button>
                <button
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
                  type="button"
                  onClick={() => setShowClientModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {showPointModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg max-[1366px]:p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-zinc-900">Nuevo punto operativo</h3>
              <button
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                type="button"
                onClick={() => setShowPointModal(false)}
              >
                Cerrar
              </button>
            </div>
            <form
              className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 min-[1600px]:grid-cols-3 max-[1366px]:gap-2"
              onSubmit={onCreatePoint}
            >
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                placeholder="Nombre"
                value={pointNombre}
                onChange={(e) => setPointNombre(e.target.value)}
                required
              />
              <select
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                value={pointTipo}
                onChange={(e) => setPointTipo(e.target.value as OperationalPointOption["tipo"])}
              >
                <option value="BALANZA">Balanza</option>
                <option value="PLANTA">Planta</option>
                <option value="MINA">Mina</option>
                <option value="PUERTO">Puerto</option>
                <option value="ALMACEN">Almacén</option>
                <option value="OTRO">Otro</option>
              </select>
              <select
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                value={pointClienteId}
                onChange={(e) => setPointClienteId(e.target.value)}
              >
                <option value="">Sin cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreComercial}
                  </option>
                ))}
              </select>
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base min-[1600px]:col-span-2"
                placeholder="Dirección"
                value={pointDireccion}
                onChange={(e) => setPointDireccion(e.target.value)}
                required
              />
              <select
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:px-4 md:py-2 md:text-base"
                value={pointRegionId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setPointRegionId(nextId);
                  const selected = ubigeoDepartamentos.find((d) => d.id_ubigeo === nextId);
                  setPointDepartamento(selected?.nombre_ubigeo ?? "");
                  setPointProvinciaId("");
                  setPointCiudad("");
                  setPointDistritoId("");
                  setPointDistrito("");
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
                value={pointProvinciaId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setPointProvinciaId(nextId);
                  const selected = provinciasDisponibles.find((p) => p.id_ubigeo === nextId);
                  setPointCiudad(selected?.nombre_ubigeo ?? "");
                  setPointDistritoId("");
                  setPointDistrito("");
                }}
                required
                disabled={!pointRegionId}
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
                value={pointDistritoId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setPointDistritoId(nextId);
                  const selected = distritosDisponibles.find((d) => d.id_ubigeo === nextId);
                  setPointDistrito(selected?.nombre_ubigeo ?? "");
                }}
                required
                disabled={!pointProvinciaId}
              >
                <option value="">Distrito</option>
                {distritosDisponibles.map((d) => (
                  <option key={d.id_ubigeo} value={d.id_ubigeo}>
                    {d.nombre_ubigeo}
                  </option>
                ))}
              </select>
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:col-span-2 md:px-4 md:py-2 md:text-base"
                placeholder="Link Google Maps"
                value={pointLink}
                onChange={(e) => setPointLink(e.target.value)}
              />
              <input
                className="h-10 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 md:col-span-2 md:px-4 md:py-2 md:text-base"
                placeholder="Referencia"
                value={pointReferencia}
                onChange={(e) => setPointReferencia(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-3">
                <button
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 md:px-4 md:py-3 md:text-base"
                  type="submit"
                  disabled={pointSubmitting}
                >
                  {pointSubmitting ? "Guardando..." : "Guardar punto"}
                </button>
                <button
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 md:px-4 md:py-3 md:text-base"
                  type="button"
                  onClick={() => setShowPointModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
