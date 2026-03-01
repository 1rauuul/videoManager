"use client";

import { useState, useEffect, useCallback } from "react";

export interface VideoItem {
  id: string;
  fileName: string;
  nameVideo?: string;
  userName?: string;
  idUser?: string;
  dateSubida?: string | { _seconds?: number };
  DateSubida?: { _seconds?: number };
}

interface UserVideosListProps {
  idUser: string;
  refreshKey?: number;
}

function formatDate(value: VideoItem["dateSubida"] | VideoItem["DateSubida"]): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._seconds != null) {
    return new Date(value._seconds * 1000).toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "—";
}

function shortFileName(fileName: string): string {
  const parts = fileName.split("/").pop();
  return parts || fileName;
}

export default function UserVideosList({ idUser, refreshKey = 0 }: UserVideosListProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const [deletedVideoName, setDeletedVideoName] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/videos?idUser=${encodeURIComponent(idUser)}`);
      if (!response.ok) throw new Error("Error al cargar los videos");
      const data = await response.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [idUser]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos, refreshKey]);

  const handleDeleteClick = (video: VideoItem) => {
    setVideoToDelete(video);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;
    const name = videoToDelete.nameVideo || shortFileName(videoToDelete.fileName);
    setDeletingId(videoToDelete.id);
    setError("");
    setVideoToDelete(null);
    try {
      const response = await fetch("/api/video", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoToDelete.id, fileName: videoToDelete.fileName }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar");
      }
      await fetchVideos();
      setDeletedVideoName(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el video");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Cargando videos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        {error}
        <button
          onClick={fetchVideos}
          className="mt-2 block text-red-800 underline dark:text-red-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Modal de éxito tras eliminar */}
      {deletedVideoName && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDeletedVideoName(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-xl border border-green-200 bg-white p-6 shadow-xl dark:border-green-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Video eliminado</h3>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  &quot;{deletedVideoName}&quot; fue eliminado correctamente.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDeletedVideoName(null)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {videoToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setVideoToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="delete-dialog-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Eliminar video
            </h3>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              ¿Eliminar &quot;{videoToDelete.nameVideo || shortFileName(videoToDelete.fileName)}&quot;? Se borrará de forma permanente.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setVideoToDelete(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-lg font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-lg font-medium text-white transition-colors hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-base text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Mis videos
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {videos.length} video{videos.length !== 1 ? "s" : ""} subido
          {videos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Aun no has subido ningun video.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-2 py-2 text-center text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Nombre</th>
                <th className="px-2 py-2 text-center text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Fecha de subida</th>
                <th className="px-2 py-2 text-center text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Status</th>
                <th className="px-2 py-2 text-center text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  {/* Nombre del video */}
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                        <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
                        </svg>
                      </div>
                      <span className="truncate max-w-[180px] text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {video.nameVideo || shortFileName(video.fileName)}
                      </span>
                    </div>
                  </td>

                  {/* Fecha de subida */}
                  <td className="px-2 py-2.5 text-center text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {formatDate(video.dateSubida ?? video.DateSubida)}
                  </td>

                  {/* Status */}
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                      Activo
                    </span>
                  </td>

                  {/* Eliminar */}
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => handleDeleteClick(video)}
                      disabled={deletingId === video.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      {deletingId === video.id ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Eliminando...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Eliminar
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </>
  );
}
