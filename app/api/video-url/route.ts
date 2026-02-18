import { NextRequest, NextResponse } from "next/server";
import { getReadSignedUrl } from "@/app/lib/gcs";

export async function GET(request: NextRequest) {
  try {
    const fileName = request.nextUrl.searchParams.get("fileName");
    if (!fileName) {
      return NextResponse.json(
        { error: "fileName es requerido" },
        { status: 400 }
      );
    }

    const url = await getReadSignedUrl(fileName);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error generando URL de video:", error);
    return NextResponse.json(
      { error: "Error al generar la URL del video" },
      { status: 500 }
    );
  }
}
