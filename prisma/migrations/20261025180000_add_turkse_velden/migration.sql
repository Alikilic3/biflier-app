-- AlterTable: optionele Turkse velden, null = toon het Nederlandse veld.
ALTER TABLE "Activiteit" ADD COLUMN "titelTr" TEXT;
ALTER TABLE "Activiteit" ADD COLUMN "locatieTr" TEXT;
ALTER TABLE "Activiteit" ADD COLUMN "beschrijvingTr" TEXT;
