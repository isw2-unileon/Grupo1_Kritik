export default function LoginPage() {
    return (
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
            <div className="mb-8 space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
                    Iniciar sesión
                </p>
                <h1 className="text-3xl font-semibold text-white">Bienvenido de nuevo</h1>
                <p className="text-slate-400">
                    Accede con tu usuario y contraseña para continuar usando Kritik.
                </p>
            </div>

            <form className="space-y-6">
                <label className="block">
                    <span className="text-sm font-medium text-slate-200">Nombre de usuario</span>
                    <input
                        type="text"
                        placeholder="usuario123"
                        className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-slate-200">Contraseña</span>
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                </label>

                <button
                    type="submit"
                    className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                    Entrar
                </button>
            </form>
        </div>
    );
}