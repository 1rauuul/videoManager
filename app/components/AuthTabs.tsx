"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regInvitationCode, setRegInvitationCode] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordChecks = {
    length: regPassword.length >= 8,
    uppercase: /[A-Z]/.test(regPassword),
    special: /[^a-zA-Z0-9]/.test(regPassword),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = regPassword === regConfirmPassword;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        userName: loginUsername,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Usuario o contraseña incorrectos");
      }
    } catch {
      setError("Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setPasswordTouched(true);
      setError("La contraseña no cumple con los requisitos de seguridad");
      return;
    }

    if (!passwordsMatch) {
      setConfirmTouched(true);
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: regUsername,
          password: regPassword,
          nombre: regNombre,
          email: regEmail,
          invitationCode: regInvitationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrarse");
      }

      // Auto-login tras registro exitoso
      const result = await signIn("credentials", {
        userName: regUsername,
        password: regPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Registro exitoso, pero no se pudo iniciar sesion automaticamente. Inicia sesion manualmente.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tabs */}
      <div className="flex rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => { setActiveTab("login"); setError(""); }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "login"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Iniciar Sesion
        </button>
        <button
          onClick={() => { setActiveTab("register"); setError(""); }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "register"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          Registrarse
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Login Form */}
      {activeTab === "login" && (
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Usuario
            </label>
            <input
              id="login-username"
              type="text"
              required
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-900"
          >
            {loading ? "Iniciando sesion..." : "Iniciar Sesion"}
          </button>
        </form>
      )}

      {/* Register Form */}
      {activeTab === "register" && (
        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reg-invitation-code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Código de invitación
            </label>
            <input
              id="reg-invitation-code"
              type="text"
              required
              value={regInvitationCode}
              onChange={(e) => setRegInvitationCode(e.target.value)}
              placeholder="Pega el codigo que te proporcionaron"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label htmlFor="reg-nombre" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nombre completo
            </label>
            <input
              id="reg-nombre"
              type="text"
              required
              value={regNombre}
              onChange={(e) => setRegNombre(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label htmlFor="reg-username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Usuario
            </label>
            <input
              id="reg-username"
              type="text"
              required
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              placeholder="Elige un nombre de usuario"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Contraseña
            </label>
            <input
              id="reg-password"
              type="password"
              required
              value={regPassword}
              onChange={(e) => { setRegPassword(e.target.value); setPasswordTouched(true); }}
              onBlur={() => setPasswordTouched(true)}
              placeholder="Elige una contraseña"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 ${
                passwordTouched && !isPasswordValid
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-600"
                  : passwordTouched && isPasswordValid
                  ? "border-green-400 focus:border-green-500 focus:ring-green-500/20 dark:border-green-600"
                  : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-zinc-700"
              }`}
            />
            {passwordTouched && (
              <ul className="mt-2 space-y-1">
                <li className={`flex items-center gap-1.5 text-xs ${passwordChecks.length ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  <span>{passwordChecks.length ? "✓" : "✗"}</span>
                  Al menos 8 caracteres
                </li>
                <li className={`flex items-center gap-1.5 text-xs ${passwordChecks.uppercase ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  <span>{passwordChecks.uppercase ? "✓" : "✗"}</span>
                  Al menos una letra mayúscula
                </li>
                <li className={`flex items-center gap-1.5 text-xs ${passwordChecks.special ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  <span>{passwordChecks.special ? "✓" : "✗"}</span>
                  Al menos un carácter especial (!@#$%...)
                </li>
              </ul>
            )}
          </div>
          <div>
            <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              required
              value={regConfirmPassword}
              onChange={(e) => { setRegConfirmPassword(e.target.value); setConfirmTouched(true); }}
              onBlur={() => setConfirmTouched(true)}
              placeholder="Repite tu contraseña"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 ${
                confirmTouched && regConfirmPassword.length > 0 && !passwordsMatch
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-600"
                  : confirmTouched && regConfirmPassword.length > 0 && passwordsMatch
                  ? "border-green-400 focus:border-green-500 focus:ring-green-500/20 dark:border-green-600"
                  : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-zinc-700"
              }`}
            />
            {confirmTouched && regConfirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">Las contraseñas no coinciden</p>
            )}
            {confirmTouched && regConfirmPassword.length > 0 && passwordsMatch && (
              <p className="mt-1.5 text-xs text-green-600 dark:text-green-400">Las contraseñas coinciden</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || (passwordTouched && !isPasswordValid) || (confirmTouched && !passwordsMatch)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-900"
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>
      )}
    </div>
  );
}
