import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.userName = (user as any).userName ?? "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.nombre = (user as any).nombre ?? user.name ?? "";
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).userName = token.userName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).nombre = token.nombre;
      return session;
    },
  },
};
