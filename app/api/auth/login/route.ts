import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/app/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, password } = body;

    if (!userName || !password) {
      return NextResponse.json(
        { error: "Usuario y contrasena son requeridos" },
        { status: 400 }
      );
    }

    const user = await loginUser(userName, password);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario o contrasena incorrectos" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: user.id,
      userName: user.userName,
      nombre: user.nombre,
      email: user.email,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno al iniciar sesion" },
      { status: 500 }
    );
  }
}
