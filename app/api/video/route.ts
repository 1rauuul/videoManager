import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "@/app/lib/gcs";
import { deleteVideoUploaded } from "@/app/lib/firestore";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, fileName } = body;

    if (!id || !fileName) {
      return NextResponse.json(
        { error: "id y fileName son requeridos" },
        { status: 400 }
      );
    }

    // Eliminar primero de GCS, luego de Firestore
    await deleteFile(fileName);
    await deleteVideoUploaded(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error eliminando video:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
