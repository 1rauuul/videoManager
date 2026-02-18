"use client";

import { useState, useEffect, useCallback } from "react";
import AuthTabs from "./components/AuthTabs";
import VideoUploader from "./components/VideoUploader";
import UserVideosList from "./components/UserVideosList";

interface AuthUser {
  id: string;
  userName: string;
  nombre: string;
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [videosRefreshKey, setVideosRefreshKey] = useState(0);

  // Recuperar sesion de localStorage al cargar
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleAuthSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    localStorage.setItem("user", JSON.stringify(authUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleUploadComplete = useCallback(() => {
    setVideosRefreshKey((k) => k + 1);
  }, []);

  // No autenticado: mostrar login/registro
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
        <main className="w-full max-w-md py-16">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Video Manager
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Inicia sesion o registrate para subir videos
            </p>
          </div>
          <AuthTabs onAuthSuccess={handleAuthSuccess} />
        </main>
      </div>
    );
  }

  // Autenticado: mostrar uploader y lista de videos
  return (
    <div className="min-h-screen bg-zinc-50 px-4 font-sans dark:bg-black">
      <main className="mx-auto max-w-2xl py-16">
        {/* Header con info de usuario */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Video Manager
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Hola, {user.nombre}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cerrar sesion
          </button>
        </div>

        {/* Subir video */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-medium text-zinc-800 dark:text-zinc-200">
            Subir video
          </h2>
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
