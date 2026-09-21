-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Beheerder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT,
    "gebruikersnaam" TEXT,
    "wachtwoordHash" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'admin'
);
INSERT INTO "new_Beheerder" ("email", "id", "naam", "wachtwoordHash") SELECT "email", "id", "naam", "wachtwoordHash" FROM "Beheerder";
DROP TABLE "Beheerder";
ALTER TABLE "new_Beheerder" RENAME TO "Beheerder";
CREATE UNIQUE INDEX "Beheerder_email_key" ON "Beheerder"("email");
CREATE UNIQUE INDEX "Beheerder_gebruikersnaam_key" ON "Beheerder"("gebruikersnaam");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
