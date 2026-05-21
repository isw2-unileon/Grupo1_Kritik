import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password,
        name,
        surname,
        user_name: userName,
        birth,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
      <div className="mb-8 space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
          Crear cuenta
        </p>
        <h1 className="text-3xl font-semibold text-white">Únete a Kritik</h1>
        <p className="text-slate-400">
          Completa tus datos para empezar a compartir reseñas y descubrir opiniones.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nicol"
              required
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Apellidos</span>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="González Pérez"
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Nombre de usuario</span>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="usuario123"
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
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

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Confirmar contraseña</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Fecha de nacimiento</span>
            <input
              type="date"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-950 px-3 text-slate-500">O continúa con</span>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white transition hover:border-white/25 hover:bg-white/10 disabled:opacity-40"
        >
          Registrarse con Google
        </button>

        <p className="text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-cyan-300 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
