import { NextRequest, NextResponse } from "next/server";
import { generateSignedUrl } from "@/app/lib/gcs";

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName y contentType son requeridos" },
        { status: 400 }
      );
    }

    if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          error: `Tipo de archivo no permitido: ${contentType}. Solo se aceptan videos.`,
        },
        { status: 400 }
      );
    }

    const { signedUrl, fileName: storedFileName } = await generateSignedUrl(
      fileName,
      contentType
    );

    return NextResponse.json({ signedUrl, fileName: storedFileName });
  } catch (error) {
    console.error("Error generando signed URL:", error);
    return NextResponse.json(
      { error: "Error interno al generar la URL de subida" },
      { status: 500 }
    );
  }
}
