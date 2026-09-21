import bcrypt from "bcrypt";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

// Placeholder-accounts: pas e-mail en wachtwoord hieronder aan (of wijzig ze
// later in de database) voordat je dit script in een echte omgeving draait.
const BEHEERDERS = [
  {
    email: "mehmet@bif.be",
    tijdelijkWachtwoord: "root123",
    naam: "Mehmet Ali Kilic",
    rol: "admin",
  },
  {
    email: "yusuf@bif.be",
    tijdelijkWachtwoord: "root123",
    naam: "Yusuf Can Isik",
    rol: "admin",
  },
  {
    email: "beheerder3@voorbeeld.nl",
    tijdelijkWachtwoord: "WijzigMij123!",
    naam: "Beheerder Drie",
    rol: "admin",
  },
];

// Gedeeld, tijdelijk "lid"-account (rol "lid": alleen leesrechten, geen
// bewerk-/aanmaak-/verwijderknoppen). Later te vervangen door individuele
// accounts per lid.
const LEDEN = [
  {
    gebruikersnaam: "bif",
    tijdelijkWachtwoord: "2026",
    naam: "Lid",
    rol: "lid",
  },
];

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const { email, tijdelijkWachtwoord, naam, rol } of BEHEERDERS) {
    const wachtwoordHash = await bcrypt.hash(tijdelijkWachtwoord, 10);

    await prisma.beheerder.upsert({
      where: { email },
      create: { email, wachtwoordHash, naam, rol },
      update: { wachtwoordHash, naam, rol },
    });

    console.log(
      `Beheerder klaar: ${email} (tijdelijk wachtwoord: ${tijdelijkWachtwoord}, rol: ${rol})`,
    );
  }

  for (const { gebruikersnaam, tijdelijkWachtwoord, naam, rol } of LEDEN) {
    const wachtwoordHash = await bcrypt.hash(tijdelijkWachtwoord, 10);

    await prisma.beheerder.upsert({
      where: { gebruikersnaam },
      create: { gebruikersnaam, wachtwoordHash, naam, rol },
      update: { wachtwoordHash, naam, rol },
    });

    console.log(
      `Lid klaar: ${gebruikersnaam} (tijdelijk wachtwoord: ${tijdelijkWachtwoord}, rol: ${rol})`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
