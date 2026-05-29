import { useState, useRef, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isEmpty, isValidEmail } from "@/utils/validation";
import Card from "@/components/Card";

/**
 * LoginPage — versión con feedback visual de carga + timeout.
 *
 * Flujo de "Entrando…":
 *   t=0          → spinner gira, inputs deshabilitados
 *   t=SLOW_HINT  → aparece el aviso "Esto está tardando más de lo normal…"
 *   t=TIMEOUT    → se aborta visualmente con un error y se vuelve a habilitar el formulario
 *
 * Nota: como AuthContext.login no acepta AbortSignal, el timeout se gestiona
 * a nivel de UI (la petición de fondo puede seguir, pero ya no afectará al
 * usuario porque marcamos la operación como abandonada).
 */

const SLOW_HINT_MS = 4500; //  pista de "está tardando"
const TIMEOUT_MS = 12000; //   abandono con error

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

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  // referencias para limpiar timers desde cualquier rama
  const slowTimer = useRef<number | null>(null);
  const failTimer = useRef<number | null>(null);
  const abandoned = useRef(false);

  const clearTimers = () => {
    if (slowTimer.current !== null) window.clearTimeout(slowTimer.current);
    if (failTimer.current !== null) window.clearTimeout(failTimer.current);
    slowTimer.current = null;
    failTimer.current = null;
  };

  // si el usuario navega fuera mientras carga, no dejamos timers colgando
  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSlow(false);
    abandoned.current = false;

    if (isEmpty(username)) {
      setError("El usuario o correo es obligatorio");
      return;
    }
    if (isEmpty(password)) {
      setError("La contraseña es obligatoria");
      return;
    }
    if (username.includes("@") && !isValidEmail(username)) {
      setError("El correo electrónico no tiene un formato válido");
      return;
    }

    setLoading(true);

    // pista a media carga
    slowTimer.current = window.setTimeout(() => setSlow(true), SLOW_HINT_MS);

    // abandono por timeout
    failTimer.current = window.setTimeout(() => {
      abandoned.current = true;
      setError(
        "El servidor está tardando demasiado en responder. Comprueba tu conexión e inténtalo de nuevo."
      );
      setLoading(false);
      setSlow(false);
    }, TIMEOUT_MS);

    try {
      await login(username, password);
      if (abandoned.current) return; // ya dimos error por timeout, ignoramos
      clearTimers();
      navigate("/dashboard");
    } catch (err) {
      if (abandoned.current) return;
      clearTimers();
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      setLoading(false);
      setSlow(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl p-10">
      <div className="mb-8 space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
          Iniciar sesión
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-cream">
          Hola otra vez
        </h1>
        <p className="text-dim">
          Accede con tu usuario o correo electrónico para continuar.
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

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <label className="block">
          <span className="text-sm font-medium text-cream">
            Usuario o correo electrónico
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="usuario123"
            autoComplete="username"
            disabled={loading}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-cream">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-acid px-5 py-3.5 text-sm font-semibold text-ink transition hover:bg-[#d7f56e] disabled:cursor-not-allowed disabled:opacity-80"
        >
          {loading && <Spinner />}
          <span>{loading ? "Entrando…" : "Entrar"}</span>
        </button>

        {/* aviso de lentitud — reserva espacio para que no salte el layout */}
        <p
          aria-live="polite"
          className={`min-h-[1.25rem] text-center text-xs transition-opacity duration-300 ${
            slow && loading ? "text-faint opacity-100" : "opacity-0"
          }`}
        >
          Esto está tardando más de lo normal…
        </p>

        <p className="text-center text-sm text-dim">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-semibold text-acid hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </Card>
  );
}
