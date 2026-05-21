import { Link } from "react-router-dom";

export default function LandingPage() {
    return (
        <div className="space-y-12">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="max-w-3xl space-y-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
                        Bienvenido a Kritik
                    </p>
                    <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                        Opiniones claras para decisiones más seguras
                    </h1>
                    <p className="text-lg leading-8 text-slate-300">
                        Kritik reúne reseñas auténticas y relevantes para que tu comunidad pueda
                        elegir con confianza. Descubre, comparte y crece con una experiencia
                        pensada para ser simple, moderna y confiable.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                            Crear cuenta
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm text-white transition hover:border-white/25 hover:bg-white/10"
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
                    <h2 className="text-2xl font-semibold text-white">Qué hacemos</h2>
                    <p className="mt-4 text-slate-300">
                        Ayudamos a que las reseñas y experiencias de usuarios se conviertan en
                        información útil y accesible. Nuestro objetivo es que cada opinión tenga
                        rango, contexto y seguridad.
                    </p>
                </article>

                <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
                    <h2 className="text-2xl font-semibold text-white">Acerca de nosotros</h2>
                    <p className="mt-4 text-slate-300">
                        Somos un equipo dedicado a crear herramientas que potencien la
                        transparencia y la decisión informada. Construimos un espacio donde
                        las opiniones importan y se pueden usar con confianza.
                    </p>
                </article>
            </section>
        </div>
    );
}