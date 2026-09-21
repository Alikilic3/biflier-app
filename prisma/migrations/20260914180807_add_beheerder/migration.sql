-- CreateTable
CREATE TABLE "Beheerder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "wachtwoordHash" TEXT NOT NULL,
    "naam" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Beheerder_email_key" ON "Beheerder"("email");
