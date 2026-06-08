import { useState, useRef, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isEmpty, isValidEmail } from "@/utils/validation";
import Card from "@/components/Card";

/**
 * RegisterPage — new theme + loading feedback + timeout.
 *
 * Since `useAuth().register` does not accept an AbortSignal (AuthContext.tsx does
 * not propagate one yet), the timeout is managed at the UI level: after
 * TIMEOUT_MS we mark the operation as abandoned and trigger an error;
 * the background request might continue, but it will no longer affect the user.
 *
 * Once you pass me AuthContext.tsx, this will convert into a real timeout
 * (canceling the fetch) in a future iteration.
 */

const SLOW_HINT_MS = 4500;
const TIMEOUT_MS = 12000;

const inputClass =
  "mt-2 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_4px_rgba(203,242,78,0.14)] disabled:cursor-not-allowed disabled:opacity-60";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birth, setBirth] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  const slowTimer = useRef<number | null>(null);
  const failTimer = useRef<number | null>(null);
  const abandoned = useRef(false);

  // clear timers on unmount
  useEffect(() => {
    return () => {
      if (slowTimer.current !== null) window.clearTimeout(slowTimer.current);
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSlow(false);
    abandoned.current = false;

    if (isEmpty(name)) {
      setError("El nombre es obligatorio");
      return;
    }
    if (isEmpty(email)) {
      setError("El correo electrónico es obligatorio");
      return;
    }
    if (!isValidEmail(email)) {
      setError("El correo electrónico no tiene un formato válido");
      return;
    }
    if (isEmpty(password)) {
      setError("La contraseña es obligatoria");
      return;
    }
    if (isEmpty(confirmPassword)) {
      setError("Debes confirmar la contraseña");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (isEmpty(surname)) {
      setError("Los apellidos son obligatorios");
      return;
    }
    if (isEmpty(userName)) {
      setError("El nombre de usuario es obligatorio");
      return;
    }
    if (userName.trim().length < 2) {
      setError("El nombre de usuario debe tener al menos 2 caracteres");
      return;
    }
    if (isEmpty(birth)) {
      setError("La fecha de nacimiento es obligatoria");
      return;
    }

    setLoading(true);

    slowTimer.current = window.setTimeout(() => setSlow(true), SLOW_HINT_MS);
    failTimer.current = window.setTimeout(() => {
      abandoned.current = true;
      setError(
        "El servidor está tardando demasiado en responder. Comprueba tu conexión e inténtalo de nuevo.",
      );
      setLoading(false);
      setSlow(false);
    }, TIMEOUT_MS);

    try {
      await register({
        email,
        password,
        name,
        surname,
        user_name: userName,
        birth,
      });
      if (abandoned.current) return;
      if (slowTimer.current !== null) window.clearTimeout(slowTimer.current);
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
      navigate("/dashboard");
    } catch (err) {
      if (abandoned.current) return;
      if (slowTimer.current !== null) window.clearTimeout(slowTimer.current);
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
      setError(err instanceof Error ? err.message : "Error al registrarse");
      setLoading(false);
      setSlow(false);
    }
  };

  return (
    <Card className="mx-auto max-w-3xl p-10">
      <div className="mb-8 space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
          Crear cuenta
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-cream">
          Únete a Kritik
        </h1>
        <p className="text-dim">
          Completa tus datos para empezar a compartir veredictos.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-coral/30 bg-coral/10 px-5 py-3 text-sm text-coral"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-cream">Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nicol"
              autoComplete="given-name"
              disabled={loading}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-cream">Apellidos</span>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="González Pérez"
              autoComplete="family-name"
              disabled={loading}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-cream">Nombre de usuario</span>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="usuario123"
            autoComplete="username"
            disabled={loading}
            className={inputClass}
          />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-cream">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-cream">Confirmar contraseña</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-cream">Fecha de nacimiento</span>
            <input
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              disabled={loading}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-cream">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              disabled={loading}
              className={inputClass}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-acid px-5 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#d7f56e] disabled:cursor-not-allowed disabled:opacity-80"
        >
          {loading && <Spinner />}
          <span>{loading ? "Registrando…" : "Registrarme"}</span>
        </button>

        <p
          aria-live="polite"
          className={`min-h-[1.25rem] text-center text-xs transition-opacity duration-300 ${
            slow && loading ? "text-faint opacity-100" : "opacity-0"
          }`}
        >
          Esto está tardando más de lo normal…
        </p>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-3 text-[10px] font-medium uppercase tracking-[0.34em] text-faint">
              O continúa con
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-ink px-5 py-3 text-sm text-cream opacity-50"
        >
          Registrarse con Google
        </button>

        <p className="text-center text-sm text-dim">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-acid hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </Card>
  );
}
