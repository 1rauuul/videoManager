import { NextRequest, NextResponse } from "next/server";
import { createUser, isValidInvitationCode } from "@/app/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, password, nombre, email, invitationCode } = body;

    if (!userName || !password || !nombre || !email || !invitationCode) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un carácter especial",
        },
        { status: 400 }
      );
    }

    const validCode = await isValidInvitationCode(invitationCode);
    if (!validCode) {
      return NextResponse.json(
        { error: "Codigo de invitacion invalido" },
        { status: 403 }
      );
    }

    const user = await createUser({ userName, password, nombre, email, invitationCode });

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
