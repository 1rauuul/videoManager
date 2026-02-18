import { NextRequest, NextResponse } from "next/server";
import { getVideosByUserId } from "@/app/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const idUser = request.nextUrl.searchParams.get("idUser");
    if (!idUser) {
      return NextResponse.json(
        { error: "idUser es requerido" },
        { status: 400 }
      );
    }

    const videos = await getVideosByUserId(idUser);
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error listando videos:", error);
    return NextResponse.json(
      { error: "Error interno al listar los videos" },
      { status: 500 }
    );
  }
}
