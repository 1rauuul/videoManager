"use client";

import { useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import AuthTabs from "./components/AuthTabs";
import VideoUploader from "./components/VideoUploader";
import UserVideosList from "./components/UserVideosList";

export default function Home() {
  const { data: session, status } = useSession();
  const [videosRefreshKey, setVideosRefreshKey] = useState(0);

  const handleUploadComplete = useCallback(() => {
    setVideosRefreshKey((k) => k + 1);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
        <main className="w-full max-w-md py-16">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Administrador de videos
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Inicia sesion o registrate para subir tus videos
            </p>
          </div>
          <AuthTabs />
        </main>
      </div>
    );
  }

  const user = session!.user;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl py-16">
        {/* Header con info de usuario */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Administrador de videos
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Hola, {user.nombre}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Subir video */}
        <section className="mb-10">
          {/* <h2 className="mb-4 text-lg font-medium text-zinc-800 dark:text-zinc-200">
            Subir video
          </h2> */}
          <VideoUploader
            userName={user.userName}
            idUser={user.id}
            onUploadComplete={handleUploadComplete}
          />
        </section>

        {/* Lista de videos del usuario */}
        <section>
          <UserVideosList idUser={user.id} refreshKey={videosRefreshKey} />
        </section>
      </main>
    </div>
  );
}
