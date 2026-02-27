-- CreateEnum
CREATE TYPE "FreightCalcType" AS ENUM ('VIAJE', 'IDA_VUELTA', 'MENSUAL');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('POR_PAGAR', 'POR_COBRAR');

-- AlterTable
ALTER TABLE "Freight" ADD COLUMN     "direccionPago" "PaymentDirection" NOT NULL DEFAULT 'POR_PAGAR',
ADD COLUMN     "montoBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "montoCalculado" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "montoFinal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "montoPersonalizado" DECIMAL(12,2),
ADD COLUMN     "tipoCalculo" "FreightCalcType" NOT NULL DEFAULT 'VIAJE',
ADD COLUMN     "usarMontoPersonalizado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "modeloPago" "FreightModelType" NOT NULL DEFAULT 'DUENO_PAGA',
ADD COLUMN     "montoBase" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tipoCalculo" "FreightCalcType" NOT NULL DEFAULT 'VIAJE';

UPDATE "Truck"
SET
  "montoBase" = COALESCE("montoPorVueltaDueno", 0),
  "tipoCalculo" = CASE
    WHEN "tipoPago" = 'MENSUAL' THEN 'MENSUAL'::"FreightCalcType"
    ELSE 'VIAJE'::"FreightCalcType"
  END,
  "modeloPago" = CASE
    WHEN "modoOperacion" = 'ALQUILER' THEN 'CHOFER_PAGA'::"FreightModelType"
    ELSE 'DUENO_PAGA'::"FreightModelType"
  END;

UPDATE "Freight"
SET
  "tipoCalculo" = 'VIAJE'::"FreightCalcType",
  "montoBase" = "montoAcordado",
  "montoCalculado" = "montoAcordado",
  "montoFinal" = "montoAcordado",
  "direccionPago" = CASE
    WHEN "tipoModelo" = 'CHOFER_PAGA' THEN 'POR_COBRAR'::"PaymentDirection"
    ELSE 'POR_PAGAR'::"PaymentDirection"
  END;
