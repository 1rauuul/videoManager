import { NextRequest, NextResponse } from "next/server";
import { createVideoUploaded } from "@/app/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fileName, userName, idUser, nameVideo } = body;

    if (!id || !fileName || !userName || !idUser || !nameVideo) {
      return NextResponse.json(
        { error: "id, fileName, userName, idUser y nameVideo son requeridos" },
        { status: 400 }
      );
    }

    const video = await createVideoUploaded({
      id,
      fileName,
      userName,
      idUser,
      nameVideo,
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error registrando video:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes("no existe") ? 400 : 500 }
    );
  }
}
