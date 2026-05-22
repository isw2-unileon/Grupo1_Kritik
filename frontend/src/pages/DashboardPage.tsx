import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Home", href: "#home" },
  { name: "Filtros", href: "#filters" },
  { name: "Reseñas hechas", href: "#reviews" },
  { name: "Perfil", href: "#profile" },
  { name: "Configuración", href: "#settings" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="space-y-8">
      <header className="-mt-10 border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/90 text-slate-100 hover:border-white/20 md:hidden"
            aria-controls="main-navigation"
            aria-expanded={isNavOpen}
            aria-label={isNavOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setIsNavOpen((open) => !open)}
          >
            <span className="text-2xl">{isNavOpen ? "×" : "☰"}</span>
          </button>

          <nav
            id="main-navigation"
            className={`${isNavOpen ? "block" : "hidden"} w-full md:block md:w-auto`}
            aria-label="Navegación principal"
          >
            <ul className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="block rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => { logout(); navigate("/"); }}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 md:w-auto"
                >
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-300/20">
                H
              </span>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">hola</p>
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Tu espacio de reseñas ya está listo
              </h1>
              <p className="text-slate-300 sm:text-lg">
                Bienvenido a tu panel principal. Aquí encontrarás recomendaciones, lo que tus amigos han
                valorado y una forma rápida de publicar nuevas reseñas.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Link
              to="/publish-review"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Publicar nueva reseña
            </Link>
          </div>
        </div>
      </section>

      <main className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <section id="home" className="space-y-6">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Recomendaciones</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Sugerencias para ti</h2>
              </div>
              <p className="max-w-xl text-slate-400">
                Explora una selección de reseñas destacadas que te ayudarán a descubrir nuevos lugares y experiencias.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Café La Brisa",
                  category: "Café",
                  summary: "Ambiente cómodo y reseñas muy positivas de otros usuarios.",
                },
                {
                  title: "Cine Urbano",
                  category: "Entretenimiento",
                  summary: "Películas recomendadas para una noche con amigos.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5 transition hover:border-cyan-400/40 hover:bg-slate-950"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-cyan-300">{item.category}</p>
                    </div>
                    <span className="rounded-2xl bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                      Nuevo
                    </span>
                  </div>
                  <p className="mt-4 text-slate-400">{item.summary}</p>
                </article>
              ))}
            </div>
          </article>

          <article id="reviews" className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Revisiones hechas</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Tus reseñas recientes</h2>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-300">
                2 reseñas creadas
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              {[
                {
                  title: "Restaurante Mar y Sol",
                  detail: "Enviado hace 3 días",
                },
                {
                  title: "Hotel Bosque Verde",
                  detail: "Enviado hace 1 semana",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5"
                >
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-slate-400">{item.detail}</p>
                </article>
              ))}
            </div>
          </article>
        </section>

        <aside className="space-y-6">
          <article id="friends-liked" className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Tus amigos lo recomendaron</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">A tus amigos les gustó esto</h2>
            <div className="mt-6 space-y-4">
              {[
                "Restaurante Solar",
                "Galería Verde",
              ].map((item) => (
                <div key={item} className="rounded-[1.5rem] bg-slate-950/80 p-4">
                  <p className="text-lg font-semibold text-white">{item}</p>
                  <p className="mt-2 text-slate-400">Recomendado por 3 amigos cercanos.</p>
                </div>
              ))}
            </div>
          </article>

          <article id="friends-disliked" className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">A tus amigos no les gustó</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Lo que no les encantó</h2>
            <div className="mt-6 space-y-4">
              {[
                "Bar Noche Estelar",
                "Centro Comercial Luna",
              ].map((item) => (
                <div key={item} className="rounded-[1.5rem] bg-slate-950/80 p-4">
                  <p className="text-lg font-semibold text-white">{item}</p>
                  <p className="mt-2 text-slate-400">Comentarios negativos de tu círculo cercano.</p>
                </div>
              ))}
            </div>
          </article>

          <article id="profile" className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Resumen rápido</h2>
            <div className="mt-4 space-y-3 text-slate-300">
              <p>Perfil: Usuario crítico</p>
              <p>Actividad semanal: 4 reseñas</p>
            </div>
          </article>

          <article id="settings" className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Accesos rápidos</h2>
            <p className="mt-3 text-slate-400">Ajustes de cuenta y preferencias de notificaciones aparecerán aquí.</p>
          </article>
        </aside>
      </main>
    </div>
  );
}
