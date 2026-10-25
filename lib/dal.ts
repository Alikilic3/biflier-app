import "server-only";
import { auth } from "@/lib/auth";

export type Beheerder = {
  id: string;
  name?: string | null;
  email?: string | null;
  rol: string;
};

export async function getBeheerder(): Promise<Beheerder | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return session.user as Beheerder;
}

export async function requireBeheerder() {
  const beheerder = await getBeheerder();

  if (!beheerder) {
    throw new Error("Niet ingelogd: alleen beheerders mogen deze actie uitvoeren.");
  }

  return beheerder;
}

export async function requireAdmin() {
  const beheerder = await requireBeheerder();

  if (beheerder.rol !== "admin") {
    throw new Error("Niet toegestaan: alleen admins mogen deze actie uitvoeren.");
  }

  return beheerder;
}

// De agenda-beheerpagina mag enkel door het eigenaarsaccount gebruikt worden.
// Dit is bewust hardcoded op het e-mailadres (niet enkel op rol "admin"):
// ook als er later meerdere admin-accounts bijkomen, blijft agendabeheer
// voorbehouden aan deze ene eigenaar. Elke server action onder
// app/beheer/agenda roept dit aan, niet enkel de UI.
const EIGENAAR_EMAIL = "mehmet@bif.be";

export async function requireEigenaar() {
  const beheerder = await requireBeheerder();

  if (beheerder.email !== EIGENAAR_EMAIL) {
    throw new Error("Niet toegestaan: enkel de eigenaar mag de agenda beheren.");
  }

  return beheerder;
}

// Voor UI-beslissingen (bv. de "Soorten beheren"-knop tonen) die geen
// Error willen gooien als er niet ingelogd is — in tegenstelling tot
// requireEigenaar(), dat server actions beveiligt.
export async function isEigenaar(): Promise<boolean> {
  const beheerder = await getBeheerder();
  return beheerder?.email === EIGENAAR_EMAIL;
}
