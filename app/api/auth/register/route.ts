import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/app/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, password, nombre, email } = body;

    if (!userName || !password || !nombre || !email) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const user = await createUser({ userName, password, nombre, email });

    return NextResponse.json(
      {
        id: user.id,
        userName: user.userName,
        nombre: user.nombre,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error: errorMessage.includes("ya existe")
          ? errorMessage
          : "Error interno al registrar el usuario",
      },
      { status: errorMessage.includes("ya existe") ? 409 : 500 }
    );
  }
}
