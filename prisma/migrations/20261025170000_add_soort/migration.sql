-- CreateTable
CREATE TABLE "Soort" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "naamNl" TEXT NOT NULL,
    "naamTr" TEXT NOT NULL,
    "kleur" TEXT NOT NULL,
    "zichtbaarheid" TEXT NOT NULL DEFAULT 'publiek',
    "kernSoort" BOOLEAN NOT NULL DEFAULT false
);

-- Vier standaardsoorten, met vaste id's zodat de hieronder gemapte
-- bestaande "type"-waarden (lezing/kitap_halkasi/toplanti/overig) naar de
-- juiste soort verwijzen. "Overig" is de kernSoort: niet verwijderbaar,
-- wel hernoembaar (zie app/beheer/soorten/actions.ts).
INSERT INTO "Soort" ("id", "naamNl", "naamTr", "kleur", "zichtbaarheid", "kernSoort") VALUES
    (1, 'Lezing', 'Konferans', '#0b853f', 'publiek', false),
    (2, 'Leeskring', 'Kitap halkası', '#1f5fbf', 'publiek', false),
    (3, 'Vergadering', 'Toplantı (yönetim)', '#6d3fc0', 'leiding', false),
    (4, 'Overig', 'Diğer', '#b45309', 'publiek', true);

-- RedefineTables: SQLite kent geen ALTER TABLE ... DROP COLUMN /
-- ADD COLUMN ... REFERENCES in één stap, dus de tabel wordt herbouwd (het
-- standaard Prisma-patroon voor SQLite). "Activiteit" is op dit moment leeg
-- in de live database, maar de CASE-mapping hieronder zorgt dat een omgeving
-- met bestaande rijen (bv. een latere restore) geen data verliest.
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activiteit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL,
    "soortId" INTEGER NOT NULL,
    "start" DATETIME NOT NULL,
    "einde" DATETIME NOT NULL,
    "heleDag" BOOLEAN NOT NULL DEFAULT false,
    "locatie" TEXT,
    "beschrijving" TEXT,
    "zichtbaarheid" TEXT NOT NULL DEFAULT 'publiek',
    "reeksId" TEXT,
    CONSTRAINT "Activiteit_soortId_fkey" FOREIGN KEY ("soortId") REFERENCES "Soort" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Activiteit" ("id", "titel", "soortId", "start", "einde", "heleDag", "locatie", "beschrijving", "zichtbaarheid", "reeksId")
SELECT
    "id", "titel",
    CASE "type"
        WHEN 'lezing' THEN 1
        WHEN 'kitap_halkasi' THEN 2
        WHEN 'toplanti' THEN 3
        ELSE 4
    END,
    "start", "einde", "heleDag", "locatie", "beschrijving", "zichtbaarheid", "reeksId"
FROM "Activiteit";
DROP TABLE "Activiteit";
ALTER TABLE "new_Activiteit" RENAME TO "Activiteit";
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "Activiteit_start_idx" ON "Activiteit"("start");

-- CreateIndex
CREATE INDEX "Activiteit_reeksId_idx" ON "Activiteit"("reeksId");

-- CreateIndex
CREATE INDEX "Activiteit_soortId_idx" ON "Activiteit"("soortId");
