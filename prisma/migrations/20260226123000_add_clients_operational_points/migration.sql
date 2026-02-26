-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('EMPRESA', 'AGENCIA', 'EVENTUAL');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "OperationalPointType" AS ENUM ('BALANZA', 'PLANTA', 'MINA', 'PUERTO', 'ALMACEN', 'OTRO');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombreComercial" TEXT NOT NULL,
    "razonSocial" TEXT,
    "ruc" VARCHAR(11),
    "tipo" "ClientType" NOT NULL DEFAULT 'EMPRESA',
    "telefono" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "estado" "ClientStatus" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalPoint" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" "OperationalPointType" NOT NULL DEFAULT 'OTRO',
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "linkGoogleMaps" TEXT,
    "referencia" TEXT,

    CONSTRAINT "OperationalPoint_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Freight" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "originPointId" TEXT,
ADD COLUMN     "destinationPointId" TEXT;

-- CreateIndex
CREATE INDEX "Client_companyId_estado_idx" ON "Client"("companyId", "estado");
CREATE INDEX "Client_companyId_tipo_idx" ON "Client"("companyId", "tipo");
CREATE INDEX "OperationalPoint_companyId_tipo_idx" ON "OperationalPoint"("companyId", "tipo");
CREATE INDEX "OperationalPoint_companyId_clienteId_idx" ON "OperationalPoint"("companyId", "clienteId");
CREATE INDEX "Freight_companyId_customerId_idx" ON "Freight"("companyId", "customerId");
CREATE INDEX "Freight_companyId_originPointId_idx" ON "Freight"("companyId", "originPointId");
CREATE INDEX "Freight_companyId_destinationPointId_idx" ON "Freight"("companyId", "destinationPointId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalPoint" ADD CONSTRAINT "OperationalPoint_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalPoint" ADD CONSTRAINT "OperationalPoint_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_originPointId_fkey" FOREIGN KEY ("originPointId") REFERENCES "OperationalPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_destinationPointId_fkey" FOREIGN KEY ("destinationPointId") REFERENCES "OperationalPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
