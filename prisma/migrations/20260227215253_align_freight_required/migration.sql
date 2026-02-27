/*
  Warnings:

  - You are about to drop the column `cliente` on the `Freight` table. All the data in the column will be lost.
  - You are about to drop the column `destino` on the `Freight` table. All the data in the column will be lost.
  - You are about to drop the column `origen` on the `Freight` table. All the data in the column will be lost.
  - Made the column `customerId` on table `Freight` required. This step will fail if there are existing NULL values in that column.
  - Made the column `originPointId` on table `Freight` required. This step will fail if there are existing NULL values in that column.
  - Made the column `destinationPointId` on table `Freight` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OperationalPointType" ADD VALUE 'AGENCIA';
ALTER TYPE "OperationalPointType" ADD VALUE 'PROCESADOR';

-- DropForeignKey
ALTER TABLE "Freight" DROP CONSTRAINT "Freight_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Freight" DROP CONSTRAINT "Freight_destinationPointId_fkey";

-- DropForeignKey
ALTER TABLE "Freight" DROP CONSTRAINT "Freight_originPointId_fkey";

DELETE FROM "Freight"
WHERE "customerId" IS NULL
   OR "originPointId" IS NULL
   OR "destinationPointId" IS NULL;

-- AlterTable
ALTER TABLE "Freight" DROP COLUMN "cliente",
DROP COLUMN "destino",
DROP COLUMN "origen",
ALTER COLUMN "customerId" SET NOT NULL,
ALTER COLUMN "originPointId" SET NOT NULL,
ALTER COLUMN "destinationPointId" SET NOT NULL;

-- AlterTable
ALTER TABLE "OperationalPoint" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_originPointId_fkey" FOREIGN KEY ("originPointId") REFERENCES "OperationalPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Freight" ADD CONSTRAINT "Freight_destinationPointId_fkey" FOREIGN KEY ("destinationPointId") REFERENCES "OperationalPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
