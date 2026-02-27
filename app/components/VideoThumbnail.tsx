"use client";

import { useState, useEffect } from "react";

interface VideoThumbnailProps {
  fileName: string;
}

export default function VideoThumbnail({ fileName }: VideoThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchUrl() {
      try {
        const res = await fetch(
          `/api/video-url?fileName=${encodeURIComponent(fileName)}`
        );
        if (!res.ok) throw new Error("No se pudo obtener la URL");
        const data = await res.json();
        if (!cancelled) setUrl(data.url);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchUrl();
    return () => {
      cancelled = true;
    };
  }, [fileName]);

  if (error) {
    return (
      <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/40">
        <svg
          className="h-4 w-4 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z"
          />
        </svg>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="h-10 w-16 shrink-0 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
    );
  }

  return (
    <video
      src={url}
      preload="metadata"
      muted
      playsInline
      className="h-10 w-16 shrink-0 rounded-md object-cover bg-zinc-100 dark:bg-zinc-800"
    />
  );
}
