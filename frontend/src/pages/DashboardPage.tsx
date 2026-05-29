import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReviewsSection from "@/components/ReviewsSection";
import Card from "@/components/Card";
import { searchProducts, type Product } from "@/services/api";

/* ---------- datos de ejemplo (recomendaciones y círculo: aún no hay API) ---------- */
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

const TABS = [
  { id: "inicio", label: "Inicio" },
  { id: "recomendaciones", label: "Recomendaciones" },
  { id: "resenas", label: "Reseñas hechas" },
  { id: "circulo", label: "Tu círculo" },
  { id: "perfil", label: "Perfil" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ---------- piezas reutilizables ---------- */
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

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

/* ---------- secciones del panel ---------- */
function Recommendations({ onSeeAll }: { onSeeAll?: () => void }) {
  return (
    <Card as="section" className="p-7 sm:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Recomendaciones</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Sugerencias para ti</h2>
        </div>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="hidden text-sm text-faint transition hover:text-cream sm:block"
          >
            Ver todo →
          </button>
        )}
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
  );
}

function Reviews() {
  return (
    <Card as="section" className="p-7 sm:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu actividad</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Reseñas hechas</h2>
        </div>
      </div>
      <ReviewsSection />
    </Card>
  );
}

function FriendsYes() {
  return (
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
  );
}

function FriendsNo() {
  return (
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
  );
}

function Profile() {
  return (
    <Card as="article" className="p-6">
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
  );
}

/* ---------- página ---------- */
export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("inicio");

  // búsqueda en el catálogo (API real: searchProducts)
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const items = await searchProducts(q, controller.signal);
        setResults(items);
        setSearching(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return; // superseado
        setResults([]);
        setSearching(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const isSearching = query.trim().length >= 2;

  const renderTab = () => {
    switch (activeTab) {
      case "inicio":
        return (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <Recommendations onSeeAll={() => setActiveTab("recomendaciones")} />
              <Reviews />
            </div>
            <aside className="space-y-6">
              <FriendsYes />
              <FriendsNo />
              <Profile />
            </aside>
          </div>
        );
      case "recomendaciones":
        return <Recommendations />;
      case "resenas":
        return <Reviews />;
      case "circulo":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <FriendsYes />
            <FriendsNo />
          </div>
        );
      case "perfil":
        return <div className="max-w-md"><Profile /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
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

      {/* buscador del catálogo */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una serie, película, videojuego o libro…"
          autoComplete="off"
          aria-label="Buscar en el catálogo"
          className="w-full rounded-2xl border border-line bg-surface py-3.5 pl-12 pr-11 text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_4px_rgba(203,242,78,0.14)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isSearching ? (
        /* ---------- resultados de búsqueda ---------- */
        <Card as="section" className="p-7 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
                Búsqueda en el catálogo
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                Resultados para “{query.trim()}”
              </h2>
            </div>
            {searching && (
              <span className="text-acid">
                <Spinner />
              </span>
            )}
          </div>

          {results.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {results.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-ink/60 p-3"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface2 font-display text-lg font-bold text-acid ring-1 ring-line">
                    {p.Name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cream">{p.Name}</p>
                    <p className="text-xs text-faint">En el catálogo</p>
                  </div>
                  <Link
                    to="/publish-review"
                    className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-cream transition hover:border-acid/35 hover:bg-cream/5"
                  >
                    Reseñar
                  </Link>
                </div>
              ))}
            </div>
          ) : searching ? (
            <p className="mt-6 text-dim">Buscando…</p>
          ) : (
            <p className="mt-6 text-dim">
              No se encontró ningún título con ese nombre. Solo aparecen productos ya
              registrados en el catálogo.
            </p>
          )}
        </Card>
      ) : (
        /* ---------- vista normal con pestañas ---------- */
        <>
          <nav
            aria-label="Secciones del panel"
            className="flex flex-wrap items-center gap-2 border-b border-line pb-4"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                aria-current={activeTab === t.id ? "page" : undefined}
                className={
                  activeTab === t.id
                    ? "rounded-full bg-acid px-4 py-1.5 text-sm font-semibold text-ink"
                    : "rounded-full px-4 py-1.5 text-sm font-medium text-dim transition hover:bg-cream/5 hover:text-cream"
                }
              >
                {t.label}
              </button>
            ))}
          </nav>

          {renderTab()}
        </>
      )}
    </div>
  );
}
