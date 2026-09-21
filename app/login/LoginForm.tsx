"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-neutral-700">
          E-mailadres of gebruikersnaam
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>

      <div>
        <label htmlFor="wachtwoord" className="block text-sm font-medium text-neutral-700">
          Wachtwoord
        </label>
        <input
          id="wachtwoord"
          name="wachtwoord"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Bezig..." : "Inloggen"}
      </button>
    </form>
  );
}
