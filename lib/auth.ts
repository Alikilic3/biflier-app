import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "E-mail of gebruikersnaam", type: "text" },
        wachtwoord: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier;
        const wachtwoord = credentials?.wachtwoord;

        if (typeof identifier !== "string" || typeof wachtwoord !== "string") {
          return null;
        }

        const beheerder = await prisma.beheerder.findFirst({
          where: {
            OR: [{ email: identifier }, { gebruikersnaam: identifier }],
          },
        });

        if (!beheerder) {
          return null;
        }

        const geldig = await bcrypt.compare(wachtwoord, beheerder.wachtwoordHash);

        if (!geldig) {
          return null;
        }

        return {
          id: String(beheerder.id),
          email: beheerder.email ?? undefined,
          name: beheerder.naam,
          rol: beheerder.rol,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as { rol?: string }).rol = (user as { rol?: string }).rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { rol?: string }).rol = (token as { rol?: string })
          .rol;
      }
      return session;
    },
  },
});
