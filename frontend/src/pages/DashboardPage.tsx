import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReviewsSection from "@/components/ReviewsSection";
import Card from "@/components/Card";

/* ---------- datos de ejemplo (alineados al dominio: juego/libro/serie/película) ---------- */
const CATS = {
  game: { label: "Videojuego", grad: "from-[#3a2d6b] via-[#5b3b8c] to-[#241b3f]" },
  book: { label: "Libro", grad: "from-[#6b3b2d] via-[#a35a2e] to-[#3f261b]" },
  series: { label: "Serie", grad: "from-[#2d5b6b] via-[#2e88a3] to-[#1b333f]" },
  film: { label: "Película", grad: "from-[#6b2d4a] via-[#a32e5e] to-[#3f1b2c]" },
} as const;
type CatKey = keyof typeof CATS;

type Reco = { name: string; cat: CatKey; verdict: boolean; who: string; text: string };
type Circle = { name: string; cat: CatKey; n: number };

const RECOS: Reco[] = [
  { name: "Severance", cat: "series", verdict: true, who: "@lucia", text: "Tensión perfecta, dirección impecable." },
  { name: "Tunic", cat: "game", verdict: true, who: "@dani", text: "Un secreto detrás de cada esquina." },
  { name: "Poor Things", cat: "film", verdict: false, who: "@sara", text: "Visualmente bella, narrativamente fría." },
  { name: "Pachinko", cat: "book", verdict: true, who: "@marco", text: "Generaciones que se te quedan dentro." },
];
const FRIENDS_YES: Circle[] = [
  { name: "Shogun", cat: "series", n: 4 },
  { name: "Klara y el Sol", cat: "book", n: 3 },
];
const FRIENDS_NO: Circle[] = [
  { name: "Starfall VII", cat: "game", n: 3 },
  { name: "Oppenheimer", cat: "film", n: 2 },
];

const tabs = [
  { label: "Inicio", href: "#dash-top" },
  { label: "Recomendaciones", href: "#dash-reco" },
  { label: "Reseñas hechas", href: "#dash-reviews" },
  { label: "Tu círculo", href: "#dash-friends" },
  { label: "Perfil", href: "#dash-profile" },
];

/* ---------- piezas reutilizables ---------- */
function Cover({ cat, name, className = "" }: { cat: CatKey; name?: string; className?: string }) {
  const c = CATS[cat];
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${c.grad} ${className}`}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-35"
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
      {name && (
        <div className="absolute bottom-3 left-3 z-10">
          <p className="text-[9px] uppercase tracking-[0.34em] text-cream/70">{c.label}</p>
          <p className="font-display text-lg font-semibold leading-tight text-cream">{name}</p>
        </div>
      )}
    </div>
  );
}

function VerdictChip({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="rounded-full border-[1.5px] border-acid bg-acid/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-acid">
      Sí
    </span>
  ) : (
    <span className="rounded-full border-[1.5px] border-coral bg-coral/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
      No
    </span>
  );
}

/* ---------- página ---------- */
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div id="dash-top" className="space-y-6">
      {/* barra de secciones (en página, no duplica el header global) */}
      <nav
        aria-label="Secciones del panel"
        className="flex flex-wrap items-center gap-2 border-b border-line pb-4"
      >
        {tabs.map((t, i) => (
          <a
            key={t.href}
            href={t.href}
            className={
              i === 0
                ? "rounded-full bg-acid px-4 py-1.5 text-sm font-semibold text-ink"
                : "rounded-full px-4 py-1.5 text-sm font-medium text-dim transition hover:bg-cream/5 hover:text-cream"
            }
          >
            {t.label}
          </a>
        ))}
      </nav>

      {/* bienvenida */}
      <Card as="section" className="p-7 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
              Hola{user?.name ? `, ${user.name}` : ""}
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">
              Tu espacio de veredictos está listo
            </h1>
            <p className="mt-3 max-w-xl text-dim">
              Recomendaciones para ti, lo que valora tu círculo y un atajo para publicar.
            </p>
          </div>
          <Link
            to="/publish-review"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-acid px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d7f56e] lg:self-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Publicar reseña
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        {/* columna izquierda */}
        <div className="space-y-6">
          {/* recomendaciones */}
          <Card as="section" id="dash-reco" className="p-7 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
                  Recomendaciones
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">Sugerencias para ti</h2>
              </div>
              <a href="#dash-reco" className="hidden text-sm text-faint transition hover:text-cream sm:block">
                Ver todo →
              </a>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {RECOS.map((r) => (
                <article
                  key={r.name}
                  className="overflow-hidden rounded-3xl border border-line bg-ink/60 transition hover:-translate-y-1 hover:border-acid/35"
                >
                  <Cover cat={r.cat} name={r.name} className="aspect-[16/10]" />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <VerdictChip yes={r.verdict} />
                      <span className="text-xs text-faint">{r.who}</span>
                    </div>
                    <p className="mt-3 text-sm text-dim">"{r.text}"</p>
                  </div>
                </article>
              ))}
            </div>
          </Card>

          {/* tus reseñas (componente existente, intacto) */}
          <Card as="section" id="dash-reviews" className="p-7 sm:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
                  Tu actividad
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">Reseñas hechas</h2>
              </div>
            </div>
            <ReviewsSection />
          </Card>
        </div>

        {/* columna derecha */}
        <aside id="dash-friends" className="space-y-6">
          <Card as="article" className="p-6">
            <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu círculo · Sí</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">A tus amigos les gustó</h2>
            <div className="mt-5 space-y-3">
              {FRIENDS_YES.map((f) => (
                <div key={f.name} className="flex items-center gap-3 rounded-2xl bg-ink/60 p-3 ring-1 ring-line">
                  <Cover cat={f.cat} className="h-12 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{f.name}</p>
                    <p className="text-xs text-faint">Recomendado por {f.n} amigos</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card as="article" className="p-6">
            <p className="text-xs font-medium uppercase tracking-[0.34em] text-coral">Tu círculo · No</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">No les convenció</h2>
            <div className="mt-5 space-y-3">
              {FRIENDS_NO.map((f) => (
                <div key={f.name} className="flex items-center gap-3 rounded-2xl bg-ink/60 p-3 ring-1 ring-line">
                  <Cover cat={f.cat} className="h-12 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{f.name}</p>
                    <p className="text-xs text-faint">Descartado por {f.n} amigos</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card as="article" id="dash-profile" className="p-6">
            <h2 className="font-display text-xl font-semibold">Resumen rápido</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-dim">Perfil</dt>
                <dd className="font-semibold">Crítica activa</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-dim">Veredictos totales</dt>
                <dd className="font-display text-lg font-bold text-acid">47</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-dim">% recomendado</dt>
                <dd className="font-display text-lg font-bold">72%</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
