-- CreateTable
CREATE TABLE "Leerling" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "naam" TEXT NOT NULL,
    "telefoonOuder" TEXT,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "aangemaaktOp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lezing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datum" DATETIME NOT NULL,
    "titel" TEXT,
    "huis" TEXT NOT NULL,
    "imam" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Aanwezigheid" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leerlingId" INTEGER NOT NULL,
    "lezingId" INTEGER NOT NULL,
    "aanwezig" BOOLEAN NOT NULL,
    CONSTRAINT "Aanwezigheid_leerlingId_fkey" FOREIGN KEY ("leerlingId") REFERENCES "Leerling" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Aanwezigheid_lezingId_fkey" FOREIGN KEY ("lezingId") REFERENCES "Lezing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Aanwezigheid_leerlingId_lezingId_key" ON "Aanwezigheid"("leerlingId", "lezingId");
