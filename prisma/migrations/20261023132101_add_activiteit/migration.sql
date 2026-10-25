-- CreateTable
CREATE TABLE "Activiteit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "einde" DATETIME NOT NULL,
    "heleDag" BOOLEAN NOT NULL DEFAULT false,
    "locatie" TEXT,
    "beschrijving" TEXT,
    "zichtbaarheid" TEXT NOT NULL DEFAULT 'publiek',
    "reeksId" TEXT
);

-- CreateIndex
CREATE INDEX "Activiteit_start_idx" ON "Activiteit"("start");

-- CreateIndex
CREATE INDEX "Activiteit_reeksId_idx" ON "Activiteit"("reeksId");
