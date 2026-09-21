-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aanwezigheid" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leerlingId" INTEGER NOT NULL,
    "lezingId" INTEGER NOT NULL,
    "aanwezig" BOOLEAN NOT NULL,
    CONSTRAINT "Aanwezigheid_leerlingId_fkey" FOREIGN KEY ("leerlingId") REFERENCES "Leerling" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Aanwezigheid_lezingId_fkey" FOREIGN KEY ("lezingId") REFERENCES "Lezing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Aanwezigheid" ("aanwezig", "id", "leerlingId", "lezingId") SELECT "aanwezig", "id", "leerlingId", "lezingId" FROM "Aanwezigheid";
DROP TABLE "Aanwezigheid";
ALTER TABLE "new_Aanwezigheid" RENAME TO "Aanwezigheid";
CREATE UNIQUE INDEX "Aanwezigheid_leerlingId_lezingId_key" ON "Aanwezigheid"("leerlingId", "lezingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
