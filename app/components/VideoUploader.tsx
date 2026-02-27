"use client";

import { useState, useRef, useCallback } from "react";

type UploadStatus =
  | "idle"
  | "requesting"
  | "uploading"
  | "registering"
  | "completed"
  | "error";

interface VideoUploaderProps {
  userName: string;
  idUser: string;
  onUploadComplete?: () => void;
}

export default function VideoUploader({ userName, idUser, onUploadComplete }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const resetState = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("video/")) {
      setErrorMessage("Por favor selecciona un archivo de video.");
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  }, []);

  const uploadFile = async () => {
    if (!file) return;

    try {
      // Paso 1: Solicitar Signed URL al servidor
      setStatus("requesting");
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al obtener la URL de subida");
      }

      const { signedUrl, fileName: storedFileName } = await response.json();

      // Paso 2: Subir el video directamente a GCS con XMLHttpRequest
      setStatus("uploading");
      setProgress(0);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Error en la subida: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Error de red al subir el video"));
        xhr.onabort = () => reject(new Error("Subida cancelada"));

        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      xhrRef.current = null;

      // Paso 3: Registrar el video en la API .NET
      setStatus("registering");

      // Extraer el UUID del fileName (formato: "videos/uuid.ext")
      const videoId = storedFileName.split("/").pop()?.split(".")[0] || storedFileName;

      const registerResponse = await fetch("/api/register-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: videoId,
          fileName: storedFileName,
          userName,
          idUser,
          nameVideo: file.name,
        }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json();
        throw new Error(data.error || "Error al registrar el video en la API");
      }

      setStatus("completed");
      onUploadComplete?.();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Error desconocido"
      );
      xhrRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    resetState();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Zona de drop / seleccion de archivo */}
      {status === "idle" && (
        <>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10
              cursor-pointer transition-colors duration-200
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
              }
            `}
          >
            <svg
              className="h-10 w-10 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            <div className="text-center">
              <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                Arrastra un video aqui o haz clic para seleccionar
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                MP4, WebM, OGG, MOV, AVI, MKV
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />
        </>
      )}

      {/* Archivo seleccionado */}
      {file && status === "idle" && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {file.name}
              </p>
              <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            onClick={resetState}
            className="ml-3 shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Boton de subida */}
      {file && status === "idle" && (
        <button
          onClick={uploadFile}
          disabled={!userName || !idUser}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-900"
        >
          Subir video
        </button>
      )}

      {/* Estado: Solicitando URL */}
      {status === "requesting" && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Preparando subida...</p>
        </div>
      )}

      {/* Estado: Subiendo con barra de progreso */}
      {status === "uploading" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-2">
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              Subiendo video...
            </p>
            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {file && (
            <p className="mt-2 text-sm text-zinc-500">
              {file.name} — {formatFileSize(file.size)}
            </p>
          )}
          <button
            onClick={cancelUpload}
            className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Estado: Registrando en API .NET */}
      {status === "registering" && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Registrando video...</p>
        </div>
      )}

      {/* Estado: Completado */}
      {status === "completed" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/30">
          <svg
            className="mx-auto h-10 w-10 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <p className="mt-2 text-lg font-medium text-green-800 dark:text-green-300">
            Video subido y registrado correctamente
          </p>
          <button
            onClick={resetState}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-lg font-medium text-white transition-colors hover:bg-green-700"
          >
            Subir otro video
          </button>
        </div>
      )}

      {/* Estado: Error */}
      {status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
          <svg
            className="mx-auto h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <p className="mt-2 text-lg font-medium text-red-800 dark:text-red-300">
            {errorMessage}
          </p>
          <button
            onClick={resetState}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-lg font-medium text-white transition-colors hover:bg-red-700"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
