DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Region') THEN
    CREATE TABLE "Region" (
      "id" INTEGER NOT NULL,
      "nombre" TEXT NOT NULL,
      CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Province') THEN
    CREATE TABLE "Province" (
      "id" INTEGER NOT NULL,
      "nombre" TEXT NOT NULL,
      "regionId" INTEGER NOT NULL,
      CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'District') THEN
    CREATE TABLE "District" (
      "id" INTEGER NOT NULL,
      "nombre" TEXT NOT NULL,
      "provinceId" INTEGER NOT NULL,
      CONSTRAINT "District_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

ALTER TABLE "OperationalPoint" ADD COLUMN IF NOT EXISTS "regionId" INTEGER;
ALTER TABLE "OperationalPoint" ADD COLUMN IF NOT EXISTS "provinceId" INTEGER;
ALTER TABLE "OperationalPoint" ADD COLUMN IF NOT EXISTS "districtId" INTEGER;

CREATE INDEX IF NOT EXISTS "Region_nombre_idx" ON "Region"("nombre");
CREATE INDEX IF NOT EXISTS "Province_regionId_idx" ON "Province"("regionId");
CREATE INDEX IF NOT EXISTS "Province_nombre_idx" ON "Province"("nombre");
CREATE INDEX IF NOT EXISTS "District_provinceId_idx" ON "District"("provinceId");
CREATE INDEX IF NOT EXISTS "District_nombre_idx" ON "District"("nombre");
CREATE INDEX IF NOT EXISTS "OperationalPoint_regionId_idx" ON "OperationalPoint"("regionId");
CREATE INDEX IF NOT EXISTS "OperationalPoint_provinceId_idx" ON "OperationalPoint"("provinceId");
CREATE INDEX IF NOT EXISTS "OperationalPoint_districtId_idx" ON "OperationalPoint"("districtId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Province_regionId_fkey') THEN
    ALTER TABLE "Province" ADD CONSTRAINT "Province_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'District_provinceId_fkey') THEN
    ALTER TABLE "District" ADD CONSTRAINT "District_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperationalPoint_regionId_fkey') THEN
    ALTER TABLE "OperationalPoint" ADD CONSTRAINT "OperationalPoint_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperationalPoint_provinceId_fkey') THEN
    ALTER TABLE "OperationalPoint" ADD CONSTRAINT "OperationalPoint_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperationalPoint_districtId_fkey') THEN
    ALTER TABLE "OperationalPoint" ADD CONSTRAINT "OperationalPoint_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
