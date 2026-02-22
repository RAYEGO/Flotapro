-- CreateEnum
CREATE TYPE "TruckPaymentType" AS ENUM ('VUELTA', 'MENSUAL');

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "tipoPago" "TruckPaymentType" NOT NULL DEFAULT 'VUELTA';
