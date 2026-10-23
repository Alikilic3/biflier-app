import bcrypt from "bcrypt";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../app/generated/prisma/client";

// Placeholder-accounts: pas e-mail en wachtwoord hieronder aan (of wijzig ze
// later in de database) voordat je dit script in een echte omgeving draait.
// Rollen: "admin" (enkel mehmet@bif.be, mag de agenda bewerken) en "leiding"
// (kan inloggen en ziet ook activiteiten met zichtbaarheid "leiding", maar
// kan niets wijzigen).
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
    rol: "leiding",
  },
  {
    email: "beheerder3@voorbeeld.nl",
    tijdelijkWachtwoord: "WijzigMij123!",
    naam: "Beheerder Drie",
    rol: "leiding",
  },
];

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
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

}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
