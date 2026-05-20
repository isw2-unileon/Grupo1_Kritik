export default function RegisterPage() {
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

            <form className="grid gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-sm font-medium text-slate-200">Nombre</span>
                        <input
                            type="text"
                            placeholder="Nicol"
                            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-slate-200">Apellidos</span>
                        <input
                            type="text"
                            placeholder="González Pérez"
                            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="text-sm font-medium text-slate-200">Nombre de usuario</span>
                    <input
                        type="text"
                        placeholder="usuario123"
                        className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                </label>

                <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-sm font-medium text-slate-200">Contraseña</span>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-slate-200">Confirmar contraseña</span>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                    </label>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block">
                        <span className="text-sm font-medium text-slate-200">Fecha de nacimiento</span>
                        <input
                            type="date"
                            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-slate-200">Correo electrónico</span>
                        <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                    </label>
                </div>

                <button
                    type="submit"
                    className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                    Registrarme
                </button>

                <button
                    type="button"
                    className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white transition hover:border-white/25 hover:bg-white/10"
                >
                    Registrarse con Google
                </button>
            </form>
        </div>
    );
}