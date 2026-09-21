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
