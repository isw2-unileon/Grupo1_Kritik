import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReviewsSection from "@/components/ReviewsSection";
import Card from "@/components/Card";
import { searchProducts, getReviews, type Product, type Review } from "@/services/api";

/* ---------- datos de ejemplo (recomendaciones y círculo: aún no hay API) ---------- */
const CATS = {
  game: { label: "Videojuego", grad: "from-[#3a2d6b] via-[#5b3b8c] to-[#241b3f]" },
  book: { label: "Libro", grad: "from-[#6b3b2d] via-[#a35a2e] to-[#3f261b]" },
  series: { label: "Serie", grad: "from-[#2d5b6b] via-[#2e88a3] to-[#1b333f]" },
  film: { label: "Película", grad: "from-[#6b2d4a] via-[#a32e5e] to-[#3f1b2c]" },
} as const;
type CatKey = keyof typeof CATS;

// etiqueta de tipo para las recomendaciones de ejemplo (al abrir su ficha)
const CAT_TO_TYPE: Record<CatKey, string> = {
  game: "Videojuego",
  book: "Libro",
  series: "Serie",
  film: "Película",
};

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
  const navigate = useNavigate();
  // abre la ficha del título con sus datos (de ejemplo) vía router state
  const open = (r: Reco) =>
    navigate(`/product/${encodeURIComponent(r.name)}`, {
      state: {
        product: {
          id: r.name,
          Name: r.name,
          Type: CAT_TO_TYPE[r.cat],
          Genre: [] as string[],
          Description: r.text,
        },
      },
    });

  return (
    <Card as="section" className="p-7 ring-1 ring-inset ring-acid/30 sm:p-8">
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
            role="button"
            tabIndex={0}
            onClick={() => open(r)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(r);
              }
            }}
            className="cursor-pointer overflow-hidden rounded-3xl border border-line bg-ink/60 transition hover:-translate-y-1 hover:border-acid/35"
          >
            <Cover cat={r.cat} name={r.name} className="aspect-[16/10]" />
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <VerdictChip yes={r.verdict} />
                <span className="text-xs text-faint">{r.who}</span>
              </div>
              <p className="mt-3 text-sm text-dim">"{r.text}"</p>
              <Link
                to="/publish-review"
                state={{
                  product: {
                    id: r.name,
                    Name: r.name,
                    Type: CAT_TO_TYPE[r.cat],
                    Genre: [] as string[],
                    Description: r.text,
                  },
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-ink/40 px-4 py-2.5 text-sm font-semibold text-cream transition hover:border-acid/40 hover:bg-cream/5"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Reseñar
              </Link>
            </div>
          </article>
        ))}
      </div>
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

type SessionUser = {
  name?: string;
  surname?: string;
  user_name?: string;
  email?: string;
} | null;

/* Tarjeta compacta del perfil para la barra lateral de Inicio. */
function ProfileCard({ user, onOpen }: { user: SessionUser; onOpen: () => void }) {
  const initial = user?.name?.[0]?.toUpperCase() ?? "?";
  const fullName = user ? `${user.name ?? ""} ${user.surname ?? ""}`.trim() : "";
  return (
    <Card as="article" className="p-6">
      <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu perfil</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface2 font-display text-lg font-bold text-acid ring-1 ring-line">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold text-cream">
            {fullName || "Tu perfil"}
          </p>
          <p className="truncate text-sm text-faint">@{user?.user_name ?? "usuario"}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 w-full rounded-2xl border border-line bg-ink/40 px-4 py-2.5 text-sm font-semibold text-dim transition hover:border-acid/35 hover:text-cream"
      >
        Ver perfil →
      </button>
    </Card>
  );
}

/* Panel completo del perfil (pestaña Perfil): identidad + estadísticas reales
   calculadas a partir de tus reseñas. Seguidores/seguidos llegarán cuando el
   backend exponga los arrays following/followers. */
function ProfilePanel({ user }: { user: SessionUser }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getReviews();
        if (active) setReviews(data);
      } catch {
        /* si falla, simplemente no mostramos estadísticas */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const total = reviews.length;
  const yes = reviews.filter((r) => r.Recommended).length;
  const pct = total ? Math.round((yes / total) * 100) : 0;
  const initial = user?.name?.[0]?.toUpperCase() ?? "?";
  const fullName = user ? `${user.name ?? ""} ${user.surname ?? ""}`.trim() : "";

  return (
    <Card as="article" className="p-7 sm:p-8">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-surface2 font-display text-2xl font-bold text-acid ring-1 ring-line">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu perfil</p>
          <h2 className="mt-1 truncate font-display text-2xl font-semibold text-cream">
            {fullName || "Tu perfil"}
          </h2>
          <p className="truncate text-sm text-faint">@{user?.user_name ?? "usuario"}</p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-dim">Correo</dt>
          <dd className="truncate font-medium text-cream">{user?.email ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-dim">Usuario</dt>
          <dd className="font-medium text-cream">@{user?.user_name ?? "—"}</dd>
        </div>
      </dl>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-ink/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-faint">Veredictos</p>
          <p className="mt-1 font-display text-3xl font-bold text-acid">{loading ? "…" : total}</p>
        </div>
        <div className="rounded-2xl border border-line bg-ink/40 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-faint">Recomienda</p>
          <p className="mt-1 font-display text-3xl font-bold text-cream">{loading ? "…" : `${pct}%`}</p>
        </div>
      </div>

      {!loading && total > 0 && (
        <div className="mt-4">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-ink">
            <div className="bg-acid" style={{ width: `${pct}%` }} />
            <div className="bg-coral" style={{ width: `${100 - pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-faint">
            <span>{yes} sí</span>
            <span>{total - yes} no</span>
          </div>
        </div>
      )}

      <p className="mt-6 border-t border-line pt-6 text-xs text-faint">
        Seguidores y seguidos aparecerán aquí cuando conectemos el backend de seguir.
      </p>
    </Card>
  );
}

/* ---------- página ---------- */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
          <div className="space-y-6">
            {/* zona protagonista: recomendaciones a lo ancho */}
            <Recommendations onSeeAll={() => setActiveTab("recomendaciones")} />
            {/* secundario: tus reseñas, tu círculo y tu perfil */}
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <ReviewsSection limit={3} onSeeAll={() => setActiveTab("resenas")} />
              <aside className="space-y-6">
                <FriendsYes />
                <FriendsNo />
                <ProfileCard user={user} onOpen={() => setActiveTab("perfil")} />
              </aside>
            </div>
          </div>
        );
      case "recomendaciones":
        return <Recommendations />;
      case "resenas":
        return <ReviewsSection />;
      case "circulo":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <FriendsYes />
            <FriendsNo />
          </div>
        );
      case "perfil":
        return <div className="max-w-2xl"><ProfilePanel user={user} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* cabecera: saludo compacto + barra de acciones (buscar y publicar juntos) */}
      <div className="space-y-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
            Hola{user?.name ? `, ${user.name}` : ""}
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Tu espacio de veredictos está listo
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* buscador del catálogo */}
          <div className="relative flex-1">
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

          {/* publicar reseña (junto al buscador) */}
          <Link
            to="/publish-review"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-acid px-5 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d7f56e]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Publicar reseña
          </Link>
        </div>
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
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/product/${p.id}`, { state: { product: p } });
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-ink/60 p-3 transition hover:-translate-y-0.5 hover:border-acid/35"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface2 font-display text-lg font-bold text-acid ring-1 ring-line">
                    {p.Name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cream">{p.Name}</p>
                    <p className="text-xs text-faint">Ver ficha →</p>
                  </div>
                  <Link
                    to="/publish-review"
                    state={{ product: p }}
                    onClick={(e) => e.stopPropagation()}
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
