import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME!;

/**
 * Genera una Signed URL para subir un archivo directamente a GCS desde el navegador.
 *
 * @param fileName - Nombre original del archivo
 * @param contentType - Tipo MIME del archivo (e.g. "video/mp4")
 * @returns Signed URL y nombre unico del archivo en el bucket
 */
export async function generateSignedUrl(
  fileName: string,
  contentType: string
): Promise<{ signedUrl: string; fileName: string }> {
  const extension = fileName.split(".").pop();
  const uniqueFileName = `videos/${uuidv4()}.${extension}`;

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(uniqueFileName);

  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutos
    contentType,
  });

  return { signedUrl, fileName: uniqueFileName };
}

/**
 * Genera una Signed URL de lectura para ver un archivo en GCS.
 *
 * @param fileName - Nombre del archivo en el bucket (ej: "videos/uuid.mp4")
 * @returns Signed URL de lectura (expira en 1 hora)
 */
export async function getReadSignedUrl(fileName: string): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hora
  });

  return signedUrl;
}

/**
 * Elimina un archivo del bucket en GCS.
 *
 * @param fileName - Nombre del archivo en el bucket (ej: "videos/uuid.mp4")
 */
export async function deleteFile(fileName: string): Promise<void> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  await file.delete();
}
