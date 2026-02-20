-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TruckStatus" AS ENUM ('ACTIVO', 'INACTIVO', 'TALLER', 'VENDIDO');

-- CreateEnum
CREATE TYPE "FreightStatus" AS ENUM ('PENDIENTE', 'COMPLETADO', 'ANULADO');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "ruc" VARCHAR(11),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "kilometrajeActual" INTEGER NOT NULL,
    "estado" "TruckStatus" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "licencia" TEXT NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "telefono" TEXT,
    "truckId" TEXT,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Freight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cliente" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "ingreso" DECIMAL(12,2) NOT NULL,
    "peajes" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "viaticos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otrosGastos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ganancia" DECIMAL(12,2) NOT NULL,
    "estado" "FreightStatus" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "Freight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fuel" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "kilometraje" INTEGER NOT NULL,
    "galones" DECIMAL(10,3) NOT NULL,
    "precioPorGalon" DECIMAL(12,3) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "Fuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePlan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cadaKm" INTEGER NOT NULL,
    "ultimoServicioKm" INTEGER NOT NULL,
    "proximoKm" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "kilometraje" INTEGER NOT NULL,
    "costo" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "Truck_companyId_estado_idx" ON "Truck"("companyId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_companyId_placa_key" ON "Truck"("companyId", "placa");

-- CreateIndex
CREATE INDEX "Driver_companyId_truckId_idx" ON "Driver"("companyId", "truckId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_companyId_dni_key" ON "Driver"("companyId", "dni");

-- CreateIndex
CREATE INDEX "Freight_companyId_fecha_idx" ON "Freight"("companyId", "fecha");

-- CreateIndex
CREATE INDEX "Freight_companyId_truckId_idx" ON "Freight"("companyId", "truckId");

-- CreateIndex
CREATE INDEX "Freight_companyId_driverId_idx" ON "Freight"("companyId", "driverId");

-- CreateIndex
CREATE INDEX "Fuel_companyId_fecha_idx" ON "Fuel"("companyId", "fecha");

-- CreateIndex
CREATE INDEX "Fuel_companyId_truckId_idx" ON "Fuel"("companyId", "truckId");

-- CreateIndex
CREATE INDEX "Fuel_companyId_driverId_idx" ON "Fuel"("companyId", "driverId");

-- CreateIndex
CREATE INDEX "MaintenancePlan_companyId_truckId_activo_idx" ON "MaintenancePlan"("companyId", "truckId", "activo");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_companyId_fecha_idx" ON "MaintenanceRecord"("companyId", "fecha");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_companyId_truckId_idx" ON "MaintenanceRecord"("companyId", "truckId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fuel" ADD CONSTRAINT "Fuel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fuel" ADD CONSTRAINT "Fuel_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fuel" ADD CONSTRAINT "Fuel_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
