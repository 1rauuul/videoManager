import NextAuth from "next-auth";
import { authConfig } from "./app/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
});

export const config = {
  // Protege todas las rutas /api/* excepto /api/auth/* (login, register, NextAuth callbacks)
  matcher: ["/api/((?!auth).*)"],
};
