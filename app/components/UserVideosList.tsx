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
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              ¿Eliminar &quot;{videoToDelete.nameVideo || shortFileName(videoToDelete.fileName)}&quot;? Se borrará de forma permanente.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setVideoToDelete(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Mis videos
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {videos.length} video{videos.length !== 1 ? "s" : ""} subido
          {videos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Aun no has subido ningun video.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {videos.map((video) => (
            <li
              key={video.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {video.nameVideo || shortFileName(video.fileName)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDate(video.dateSubida ?? video.DateSubida)}
                </p>
              </div>
              <button
                onClick={() => handleDeleteClick(video)}
                disabled={deletingId === video.id}
                className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === video.id ? "Eliminando..." : "Eliminar"}
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
    </>
  );
}
