import { Link } from "react-router-dom";

/**
 * LandingPage — editorial/cinematographic redesign of Kritik.
 * Uses the system tokens defined in src/index.css (@theme):
 *   font-display, bg-ink/surface, text-cream/dim/faint/acid, border-line…
 * Buttons retain their react-router navigation:
 *   "Create free account" -> /register   |   "Already have an account" -> /login
 */

type Step = { n: string; title: string; body: string };

const steps: Step[] = [
  {
    n: "01",
    title: "Busca el título",
    body: "Encuentra el juego, libro, serie o película que quieres reseñar dentro del catálogo.",
  },
  {
    n: "02",
    title: "Da tu veredicto",
    body: "Sí o no. Sin escalas confusas: una decisión clara que se entiende de un vistazo.",
  },
  {
    n: "03",
    title: "Descubre con tu círculo",
    body: "Mira qué recomiendan tus amigos y construye tu propia colección de opiniones.",
  },
];

// Subtle grain for the hero panel (without files or dependencies)
const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function LandingPage() {
  return (
    <div className="space-y-6">
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-line bg-ink p-8 sm:p-12">
        {/* warm glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 420px at 80% -10%, rgba(203,242,78,0.12), transparent 60%), radial-gradient(700px 420px at 0% 110%, rgba(255,90,71,0.08), transparent 60%)",
          }}
        />
        {/* subtle grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: GRAIN_BG }}
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* text */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
              Reseñas honestas · Veredictos claros
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl">
              Una sola pregunta:
              <br />
              <span className="italic text-acid">¿lo recomiendas</span> o no?
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-dim">
              Kritik reúne opiniones auténticas sobre juegos, libros, series y
              películas. Sin medias estrellas ni ruido: cada reseña termina en un
              veredicto que ayuda a tu comunidad a decidir con confianza.
            </p>

            {/* Functional CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-acid px-7 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d7f56e]"
              >
                Crear cuenta gratis
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-line px-7 py-3.5 text-sm font-medium text-cream transition hover:border-cream/35 hover:bg-cream/5"
              >
                Ya tengo cuenta
              </Link>
            </div>

            {/* social proof */}
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-faint">
              <span>
                <b className="font-display text-cream">12.4k</b> reseñas
              </span>
              <span className="hidden h-4 w-px bg-line sm:block" />
              <span>
                <b className="font-display text-cream">83%</b> recomendadas
              </span>
              <span className="hidden h-4 w-px bg-line sm:block" />
              <span>
                <b className="font-display text-cream">4</b> categorías
              </span>
            </div>
          </div>

          {/* verdict-card */}
          <div>
            <article className="rounded-[2rem] border border-line bg-surface p-3 shadow-2xl">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-[#3a2d6b] via-[#5b3b8c] to-[#241b3f]">
                <img
                  src="https://cdn.mos.cms.futurecdn.net/v2/t:0,l:0,cw:1079,ch:607,q:80,w:1079/Jz2CTv2AenNdvM7uf6brPF.jpg"
                  alt="Hollow Knight"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg,transparent 35%,rgba(0,0,0,.55))" }}
                />
                <span className="absolute right-4 top-4 z-10 rounded-full border-[1.5px] border-acid bg-acid/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-acid">
                  Recomendado
                </span>
                <div className="absolute bottom-4 left-4 z-10">
                  <p className="text-[10px] uppercase tracking-[0.34em] text-cream/70">Videojuego</p>
                  <p className="font-display text-2xl font-semibold text-cream">Hollow Knight</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 pb-3 pt-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface2 font-display text-sm font-bold text-acid ring-1 ring-line">
                  M
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-cream">
                    "Una obra maestra silenciosa"
                  </p>
                  <p className="truncate text-xs text-faint">por @marco · hace 2 h</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section>
        <p className="px-1 text-xs font-medium uppercase tracking-[0.34em] text-faint">
          Cómo funciona
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-[2rem] border border-line bg-surface p-7 transition hover:-translate-y-1 hover:border-acid/35"
            >
              <span className="font-mono text-sm text-acid">{s.n}</span>
              <h3 className="mt-3 font-display text-2xl font-semibold text-cream">{s.title}</h3>
              <p className="mt-2 text-dim">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== ABOUT ===================== */}
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-line bg-surface p-8">
          <h2 className="font-display text-3xl font-semibold text-cream">Qué hacemos</h2>
          <p className="mt-4 text-dim">
            Convertimos opiniones dispersas en información útil y accesible. Cada reseña tiene
            contexto, autor y un veredicto que se puede usar con confianza.
          </p>
        </article>
        <article className="rounded-[2rem] border border-line bg-surface p-8">
          <h2 className="font-display text-3xl font-semibold text-cream">Quiénes somos</h2>
          <p className="mt-4 text-dim">
            Un equipo obsesionado con la transparencia y la decisión informada. Construimos un
            espacio donde las opiniones importan de verdad.
          </p>
        </article>
      </section>

      <footer className="text-center">
          <a
            href="https://docs.google.com/presentation/d/1Ow9Re_BpCZswfvMotO8vIE8nVqVdRTYT/edit?usp=sharing&ouid=102955451044475985862&rtpof=true&sd=true"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-faint transition-colors hover:text-cream"
            onClick={(e) => {
              e.preventDefault();
              window.open(e.currentTarget.href, "_blank");
            }}
          >
            Conoce mas sobre nosotros
          </a>
        </footer>
    </div>
  );
}