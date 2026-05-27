import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isEmpty, isValidEmail } from "@/utils/validation";


//Comment to be able to do the merge x2
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

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
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
      <div className="mb-8 space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
          Iniciar sesión
        </p>
        <h1 className="text-3xl font-semibold text-white">Bienvenido de nuevo</h1>
        <p className="text-slate-400">
          Accede con tu usuario o correo electrónico para continuar usando Kritik.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-slate-200">
            Usuario o correo electrónico
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="usuario123"
            required
            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm text-slate-400">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-cyan-300 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
