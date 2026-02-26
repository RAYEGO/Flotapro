-- CreateTable
CREATE TABLE "FreightExpense" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "freightId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "FreightExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreightExpense_companyId_fecha_idx" ON "FreightExpense"("companyId", "fecha");
CREATE INDEX "FreightExpense_companyId_freightId_idx" ON "FreightExpense"("companyId", "freightId");

-- AddForeignKey
ALTER TABLE "FreightExpense" ADD CONSTRAINT "FreightExpense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FreightExpense" ADD CONSTRAINT "FreightExpense_freightId_fkey" FOREIGN KEY ("freightId") REFERENCES "Freight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
