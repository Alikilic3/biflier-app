"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export async function login(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      identifier: formData.get("identifier"),
      wachtwoord: formData.get("wachtwoord"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "E-mailadres/gebruikersnaam of wachtwoord is onjuist.";
    }
    throw error;
  }
}
