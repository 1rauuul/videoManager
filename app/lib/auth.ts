import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { loginUser } from "./firestore";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userName: string;
      nombre: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
  interface User {
    userName: string;
    nombre: string;
  }
}

declare module "@auth/core/jwt"  {
  interface JWT {
    id: string;
    userName: string;
    nombre: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        userName: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.userName || !credentials?.password) return null;

        const user = await loginUser(
          credentials.userName as string,
          credentials.password as string
        );

        if (!user) return null;

        return {
          id: user.id,
          name: user.nombre,
          email: user.email,
          userName: user.userName,
          nombre: user.nombre,
        };
      },
    }),
  ],
});
