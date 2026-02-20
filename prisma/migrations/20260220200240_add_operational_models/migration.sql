-- CreateEnum
CREATE TYPE "TruckOperationMode" AS ENUM ('DIRECTO', 'ALQUILER');

-- CreateEnum
CREATE TYPE "FreightModelType" AS ENUM ('DUENO_PAGA', 'CHOFER_PAGA');

-- AlterTable
ALTER TABLE "Freight" ADD COLUMN     "montoAcordado" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tipoModelo" "FreightModelType" NOT NULL DEFAULT 'DUENO_PAGA';

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "modoOperacion" "TruckOperationMode" NOT NULL DEFAULT 'DIRECTO',
ADD COLUMN     "montoPorVueltaDueno" DECIMAL(12,2);
