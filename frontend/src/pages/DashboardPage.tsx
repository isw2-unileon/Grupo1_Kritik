import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReviewsSection from "@/components/ReviewsSection";
import Card from "@/components/Card";
import UserAvatar from "@/components/UserAvatar";
import ProfilePanel from "@/components/ProfilePanel";
import { searchProducts, searchUsers, getRecommendations, getRandomProducts, getInfluencerRecommendations, getInfluencerNotRecommendations, getFollowing, getUserReviews, type Product, type ProfileUser, type Review } from "@/services/api";

/* ---------- Mock data (recommendations and circle: API not yet available) ---------- */
const CATS = {
  game: { label: "Videojuego", grad: "from-[#3a2d6b] via-[#5b3b8c] to-[#241b3f]" },
  book: { label: "Libro", grad: "from-[#6b3b2d] via-[#a35a2e] to-[#3f261b]" },
  series: { label: "Serie", grad: "from-[#2d5b6b] via-[#2e88a3] to-[#1b333f]" },
  film: { label: "Película", grad: "from-[#6b2d4a] via-[#a32e5e] to-[#3f1b2c]" },
} as const;
type CatKey = keyof typeof CATS;

// type label for the example recommendations (when opening their profile)
const CAT_TO_TYPE: Record<CatKey, string> = {
  game: "Videojuego",
  book: "Libro",
  series: "Serie",
  film: "Película",
};

function catKey(type?: string): CatKey {
  const t = (type ?? "").toLowerCase();
  if (t.includes("serie")) return "series";
  if (t.includes("film") || t.includes("pelíc") || t.includes("pelic") || t.includes("movie")) return "film";
  if (t.includes("game") || t.includes("juego") || t.includes("video")) return "game";
  if (t.includes("libro") || t.includes("book")) return "book";
  return "game";
}


const TABS = [
  { id: "inicio", label: "Inicio" },
  { id: "recomendaciones", label: "Recomendaciones" },
  { id: "resenas", label: "Reseñas hechas" },
  { id: "circulo", label: "Tu círculo" },
  { id: "perfil", label: "Perfil" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ---------- Reusable components ---------- */
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Cover({
  cat,
  name,
  image,
  className = "",
}: {
  cat: CatKey;
  name?: string;
  image?: string;
  className?: string;
}) {
  const c = CATS[cat];
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${c.grad} ${className}`}>
      {image ? (
        // portada real del producto (columna Image); si no hay, se ve el gradiente
        <img
          src={image}
          alt={name ?? ""}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
      )}
      {/* velo oscuro inferior: mantiene el texto legible sobre imagen o gradiente */}
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



/* ---------- Cover carousel (auto-scrolls) ---------- */
// Sample titles for the carousel (until the backend provides real covers)
const FEATURED: { name: string; cat: CatKey }[] = [
  { name: "Dune: Parte Dos", cat: "film" },
  { name: "The Last of Us", cat: "series" },
  { name: "Tunic", cat: "game" },
  { name: "Klara y el Sol", cat: "book" },
  { name: "Severance", cat: "series" },
  { name: "Oppenheimer", cat: "film" },
  { name: "Pachinko", cat: "book" },
  { name: "Hollow Knight", cat: "game" },
  { name: "Shogun", cat: "series" },
  { name: "Poor Things", cat: "film" },
  { name: "La carretera", cat: "book" },
  { name: "Elden Ring", cat: "game" },
];

// Deck (Fisher-Yates): randomized order on every load
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function FeaturedStrip() {
  const navigate = useNavigate();
  // Seed with shuffled sample covers so the strip is never empty; swap in the
  // real random products from the backend (GET /api/products/random) on mount.
  const [items, setItems] = useState<Product[]>(() =>
    shuffle(
      FEATURED.map((f, i) => ({
        id: -(i + 1), // negative ids: placeholders that never collide with real ones
        Name: f.name,
        Type: CAT_TO_TYPE[f.cat],
      })),
    ),
  );

  useEffect(() => {
    const controller = new AbortController();
    getRandomProducts(12, controller.signal)
      .then((data) => {
        if (data.length > 0) setItems(data); // si viene vacío, se quedan las de ejemplo
      })
      .catch(() => {
        /* error de red o RPC get_random_products inexistente -> se mantiene el ejemplo */
      });
    return () => controller.abort();
  }, []);

  // We duplicate the list so the loop is continuous and seamless.
  const loop = useMemo(() => [...items, ...items], [items]);

  const open = (p: Product) =>
    navigate(`/product/${encodeURIComponent(p.Name)}`, { state: { product: p } });

  return (
    <div className="group relative overflow-hidden">
      {/* Blurred edges so the cards blend with the background */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent" />
      <div className="flex w-max animate-[kritik-marquee_50s_linear_infinite] group-hover:[animation-play-state:paused]">
        {loop.map((p, i) => (
          <button
            key={`${p.id}-${i}`}
            type="button"
            onClick={() => open(p)}
            aria-label={`Ver ${p.Name}`}
            className="mr-4 w-32 shrink-0 overflow-hidden rounded-2xl border border-line transition hover:-translate-y-1 hover:border-acid/40"
          >
            <Cover cat={catKey(p.Type)} name={p.Name} image={p.Image} className="aspect-[2/3]" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- sections of the panel ---------- */
const RECO_CATS = [
  { id: "all", label: "Todas" },
  { id: "game", label: "Juegos" },
  { id: "book", label: "Libros" },
  { id: "series", label: "Series" },
  { id: "film", label: "Películas" },
] as const;
type RecoCatId = (typeof RECO_CATS)[number]["id"];

function Recommendations({ limit, onSeeAll }: { limit?: number; onSeeAll?: () => void }) {
  const navigate = useNavigate();
  const preview = typeof limit === "number";
  const [cat, setCat] = useState<RecoCatId>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getRecommendations(preview ? limit : undefined)
      .then((data) => {
        if (active) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setProducts([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [limit, preview]);

  // preview: first N. Full view: all, filtered by category.
  const filtered = !preview && cat !== "all"
    ? products.filter((p) => catKey(p.Type) === cat)
    : products;
  const visible = preview ? filtered.slice(0, limit) : filtered;

  const open = (p: Product) =>
    navigate(`/product/${encodeURIComponent(p.Name)}`, {
      state: { product: p },
    });

  if (loading) {
    return (
      <Card as="section" className={`p-7 sm:p-8 ${preview ? "ring-1 ring-inset ring-acid/30" : ""}`}>
        <div className="flex items-center justify-center py-12">
          <svg className="h-6 w-6 animate-spin text-acid" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </Card>
    );
  }

  return (
    <Card as="section" className={`p-7 sm:p-8 ${preview ? "ring-1 ring-inset ring-acid/30" : ""}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Recomendaciones</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">
            {preview ? "Sugerencias para ti" : "Recomendaciones para ti"}
          </h2>
        </div>
        {preview ? (
          onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="hidden text-sm text-faint transition hover:text-cream sm:block"
            >
              Ver todas →
            </button>
          )
        ) : (
          <span className="self-start rounded-full border border-line bg-ink/50 px-3 py-1 text-sm font-semibold text-dim sm:self-auto">
            {visible.length} {visible.length === 1 ? "título" : "títulos"}
          </span>
        )}
      </div>

      {!preview && (
        <div
          role="group"
          aria-label="Filtrar por categoría"
          className="mt-6 flex flex-wrap items-center gap-1"
        >
          {RECO_CATS.map((cc) => (
            <button
              key={cc.id}
              type="button"
              onClick={() => setCat(cc.id)}
              aria-pressed={cat === cc.id}
              className={
                cat === cc.id
                  ? "rounded-full bg-acid/15 px-3 py-1 text-xs font-bold text-acid ring-1 ring-acid/30"
                  : "rounded-full px-3 py-1 text-xs font-semibold text-faint transition hover:text-cream"
              }
            >
              {cc.label}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-line bg-ink/40 p-8 text-center">
          <p className="text-dim">No hay recomendaciones en esta categoría todavía.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <article
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => open(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(p);
                }
              }}
              className="cursor-pointer overflow-hidden rounded-3xl border border-line bg-ink/60 transition hover:-translate-y-1 hover:border-acid/35"
            >
              <Cover cat={catKey(p.Type)} name={p.Name} image={p.Image} className="aspect-[16/10]" />
              <div className="p-4">
                <p className="text-sm text-dim">"{p.Description}"</p>
                <Link
                  to="/publish-review"
                  state={{ product: p }}
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
      )}

      {preview && onSeeAll && products.length > (limit ?? 0) && (
        <button
          type="button"
          onClick={onSeeAll}
          className="mt-4 w-full rounded-2xl border border-line bg-ink/40 px-4 py-3 text-sm font-semibold text-dim transition hover:border-acid/35 hover:text-cream"
        >
          Ver todas las recomendaciones ({products.length}) →
        </button>
      )}
    </Card>
  );
}

// one clickable row of the circle: opens the real product profile via router state
function CircleRow({ product, accent }: { product: Product; accent: string }) {
  const navigate = useNavigate();
  const open = () =>
    navigate(`/product/${encodeURIComponent(product.Name)}`, { state: { product } });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className={`flex cursor-pointer items-center gap-3 rounded-2xl bg-ink/60 p-3 ring-1 ring-line transition hover:-translate-y-0.5 ${accent}`}
    >
      <Cover cat={catKey(product.Type)} image={product.Image} className="h-12 w-12 shrink-0 rounded-lg" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{product.Name}</p>
        <p className="text-xs text-faint">{product.Type || CATS[catKey(product.Type)].label}</p>
      </div>
    </div>
  );
}

// shared list for the two circle blocks. Pulls the real products that the people
// you follow recommended / did not recommend. Shows a preview (limit) with a
// link to the full circle tab, and picks the empty message by follow state.
/* Area con scroll interno y barra oculta. Muestra un degradado + chevron arriba
   y abajo solo cuando hay mas contenido en esa direccion (se desvanecen al
   llegar al borde), como pista visual de que se puede hacer scroll. */
function ScrollArea({ children, className = "" }: { children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);
  const [down, setDown] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setUp(el.scrollTop > 4);
    setDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(content);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return (
    <div className="relative mt-5">
      <div
        ref={scrollRef}
        onScroll={update}
        className="max-h-[28rem] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={contentRef} className={className}>
          {children}
        </div>
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 flex h-10 items-start justify-center bg-gradient-to-b from-surface to-transparent transition-opacity duration-200 ${up ? "opacity-100" : "opacity-0"}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="mt-0.5 text-dim">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-10 items-end justify-center bg-gradient-to-t from-surface to-transparent transition-opacity duration-200 ${down ? "opacity-100" : "opacity-0"}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="mb-0.5 animate-bounce text-dim">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

function CircleList({
  title,
  heading,
  accentText,
  rowAccent,
  fetcher,
  emptyFollowing,
  emptyNoFollows,
  limit,
  onSeeAll,
}: {
  title: string;
  heading: string;
  accentText: string;
  rowAccent: string;
  fetcher: (limit?: number, signal?: AbortSignal) => Promise<Product[]>;
  emptyFollowing: string;
  emptyNoFollows: string;
  limit?: number;
  onSeeAll?: () => void;
}) {
  const preview = typeof limit === "number";
  const [items, setItems] = useState<Product[]>([]);
  const [followsAnyone, setFollowsAnyone] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetcher(undefined, controller.signal)
      .then(async (data) => {
        if (controller.signal.aborted) return;
        setItems(data);
        // Solo cuando no hay nada que mostrar necesitamos saber si sigues a
        // alguien, para elegir el mensaje de vacío correcto.
        if (data.length === 0) {
          try {
            const following = await getFollowing(controller.signal);
            if (controller.signal.aborted) return;
            setFollowsAnyone(following.length > 0);
          } catch {
            if (controller.signal.aborted) return;
            setFollowsAnyone(null);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setItems([]);
        setFollowsAnyone(null);
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [fetcher, reloadKey]);

  const visible = preview ? items.slice(0, limit) : items;

  return (
    <Card as="article" className="p-6">
      <p className={`text-xs font-medium uppercase tracking-[0.34em] ${accentText}`}>{title}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">{heading}</h2>
      <ScrollArea className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6 text-faint">
            <Spinner />
          </div>
        ) : error ? (
          <div className="py-4">
            <p className="text-sm text-faint">
              No se pudieron cargar las recomendaciones de tu círculo.
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3 rounded-full border border-line px-4 py-1.5 text-sm font-medium text-dim transition hover:border-cream/35 hover:bg-cream/5"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-sm text-faint">
            {followsAnyone ? emptyFollowing : emptyNoFollows}
          </p>
        ) : (
          visible.map((p) => <CircleRow key={p.id} product={p} accent={rowAccent} />)
        )}
      </ScrollArea>
      {preview && onSeeAll && items.length > (limit ?? 0) && (
        <button
          type="button"
          onClick={onSeeAll}
          className="mt-4 w-full rounded-2xl border border-line py-2.5 text-sm font-medium text-dim transition hover:border-cream/35 hover:bg-cream/5"
        >
          Ver más
        </button>
      )}
    </Card>
  );
}

function FriendsYes({ limit, onSeeAll }: { limit?: number; onSeeAll?: () => void }) {
  return (
    <CircleList
      title="Tu círculo · Sí"
      heading="A tu círculo le gustó"
      accentText="text-acid"
      rowAccent="hover:ring-acid/35"
      fetcher={getInfluencerRecommendations}
      emptyFollowing="La gente que sigues aún no ha recomendado nada."
      emptyNoFollows="Aún no sigues a nadie. Sigue a gente para ver lo que recomienda tu círculo."
      limit={limit}
      onSeeAll={onSeeAll}
    />
  );
}

function FriendsNo({ limit, onSeeAll }: { limit?: number; onSeeAll?: () => void }) {
  return (
    <CircleList
      title="Tu círculo · No"
      heading="No les convenció"
      accentText="text-coral"
      rowAccent="hover:ring-coral/35"
      fetcher={getInfluencerNotRecommendations}
      emptyFollowing="La gente que sigues aún no ha descartado nada."
      emptyNoFollows="Aún no sigues a nadie. Sigue a gente para ver lo que recomienda tu círculo."
      limit={limit}
      onSeeAll={onSeeAll}
    />
  );
}

/* Avatares de la gente a la que sigues (cabecera de la pestaña Tu círculo). */
function FollowingStrip() {
  const [people, setPeople] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    getFollowing(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setPeople(data);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setPeople([]);
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  return (
    <Card as="section" className="p-6">
      <p className="text-xs font-medium uppercase tracking-[0.34em] text-dim">Sigues a</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">
        Tu círculo{!loading && people.length > 0 ? ` · ${people.length}` : ""}
      </h2>
      <div className="mt-5">
        {loading ? (
          <div className="flex justify-center py-4 text-faint">
            <Spinner />
          </div>
        ) : error ? (
          <div className="py-2">
            <p className="text-sm text-faint">No se pudo cargar tu círculo.</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3 rounded-full border border-line px-4 py-1.5 text-sm font-medium text-dim transition hover:border-cream/35 hover:bg-cream/5"
            >
              Reintentar
            </button>
          </div>
        ) : people.length === 0 ? (
          <p className="py-2 text-sm text-faint">
            Aún no sigues a nadie. Busca usuarios y síguelos para empezar a construir tu círculo.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {people.map((u) => (
              <Link
                key={u.id}
                to={`/user/${u.id}`}
                title={`@${u.UserName}`}
                className="flex w-16 shrink-0 flex-col items-center gap-2 text-center transition hover:-translate-y-0.5"
              >
                <UserAvatar image={u.Image} name={u.Name} size="md" />
                <span className="w-full truncate text-xs text-dim">{u.Name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* Chip de veredicto compacto para el feed (lima = sí, coral = no). */
function FeedVerdict({ recommended }: { recommended: boolean }) {
  return recommended ? (
    <span className="shrink-0 rounded-full border border-acid bg-acid/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-acid">
      Recomienda
    </span>
  ) : (
    <span className="shrink-0 rounded-full border border-coral bg-coral/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-coral">
      No recomienda
    </span>
  );
}

type FeedItem = { review: Review; author: ProfileUser };

/* Ultimas resenas de la gente a la que sigues. El backend no tiene endpoint de
   feed, asi que se compone juntando getFollowing + las resenas de cada uno y se
   ordena por id descendente (no hay fecha; el id es autoincremental, asi que el
   mas alto es el mas reciente). Son N+1 peticiones: ok con circulos pequenos. */
function CircleFeed({ limit = 12 }: { limit?: number }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followsAnyone, setFollowsAnyone] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const following = await getFollowing(controller.signal);
        if (controller.signal.aborted) return;
        setFollowsAnyone(following.length > 0);
        if (following.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }
        const perUser = await Promise.all(
          following.map((u) =>
            getUserReviews(u.id, controller.signal)
              .then((revs) => revs.map((review) => ({ review, author: u })))
              .catch(() => [] as FeedItem[]),
          ),
        );
        if (controller.signal.aborted) return;
        const all = perUser.flat().sort((a, b) => b.review.id - a.review.id);
        setItems(all.slice(0, limit));
        setLoading(false);
      } catch {
        if (controller.signal.aborted) return;
        setItems([]);
        setError(true);
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [limit, reloadKey]);

  return (
    <Card as="section" className="p-6">
      <p className="text-xs font-medium uppercase tracking-[0.34em] text-dim">Actividad reciente</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">Últimas reseñas de tu círculo</h2>
      <ScrollArea className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6 text-faint">
            <Spinner />
          </div>
        ) : error ? (
          <div className="py-4">
            <p className="text-sm text-faint">No se pudieron cargar las reseñas de tu círculo.</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3 rounded-full border border-line px-4 py-1.5 text-sm font-medium text-dim transition hover:border-cream/35 hover:bg-cream/5"
            >
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-sm text-faint">
            {followsAnyone
              ? "La gente que sigues aún no ha publicado reseñas."
              : "Aún no sigues a nadie. Sigue a gente para ver aquí sus reseñas."}
          </p>
        ) : (
          items.map(({ review, author }) => (
            <article
              key={review.id}
              className="rounded-2xl border border-line bg-ink/60 p-4 transition hover:border-acid/35"
            >
              <div className="flex items-start gap-3">
                <Link to={`/user/${author.id}`} className="shrink-0">
                  <UserAvatar image={author.Image} name={author.Name} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      to={`/user/${author.id}`}
                      className="font-semibold text-cream transition hover:text-acid"
                    >
                      {author.Name}
                    </Link>
                    <span className="text-xs text-faint">@{author.UserName}</span>
                    <FeedVerdict recommended={review.Recommended} />
                  </div>
                  {review.ProductName && (
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${encodeURIComponent(review.ProductName)}`)}
                      className="mt-1 block text-sm text-dim transition hover:text-cream"
                    >
                      sobre <span className="font-medium">{review.ProductName}</span>
                    </button>
                  )}
                  {review.Description && (
                    <p className="mt-2 text-sm leading-relaxed text-cream/90">{review.Description}</p>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </ScrollArea>
    </Card>
  );
}

type SessionUser = {
  name: string;
  surname?: string;
  user_name?: string;
  email?: string;
  image?: string;
} | null;

/* Compact profile card for the sidebar on the Home page. */
function ProfileCard({ user, onOpen }: { user: SessionUser; onOpen: () => void }) {
  const fullName = user ? `${user.name ?? ""} ${user.surname ?? ""}`.trim() : "";
  return (
    <Card as="article" className="p-6">
      <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu perfil</p>
      <div className="mt-4 flex items-center gap-3">
        <UserAvatar image={user?.image} name={user?.name ?? ""} size="md" />
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



/* ---------- page ---------- */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const tabsRef = useRef<HTMLElement>(null);
  const didMount = useRef(false);

  // Catalog search (real API: searchProducts)
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  // which entity the single search bar targets
  const [searchMode, setSearchMode] = useState<"products" | "users">("products");

  // User search (real API: searchUsers) — shares the single search input
  const [userResults, setUserResults] = useState<ProfileUser[]>([]);
  const [userSearching, setUserSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (searchMode !== "products" || q.length < 1) {
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
  }, [query, searchMode]);

  // User search — debounced; runs only when the bar is in "users" mode
  useEffect(() => {
    const q = query.trim();
    if (searchMode !== "users" || q.length < 1) {
      setUserResults([]);
      setUserSearching(false);
      return;
    }
    const controller = new AbortController();
    setUserSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const items = await searchUsers(q, controller.signal);
        setUserResults(items);
        setUserSearching(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setUserResults([]);
        setUserSearching(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchMode]);

// When changing tabs, smoothly scroll to the tabs so the 
// content doesn't "jump" if a tab is shorter than the previous one
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    tabsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [activeTab]);

  const isSearching = query.trim().length >= 1;

  const renderTab = () => {
    switch (activeTab) {
      case "inicio":
        return (
          <div className="space-y-6">
            {/* featured carousel (only on Home) */}
            <FeaturedStrip />
            {/* main area: recommendations (preview) */}
            <Recommendations limit={3} onSeeAll={() => setActiveTab("recomendaciones")} />
            {/* secondary: your reviews, your circle and your profile */}
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <ReviewsSection limit={3} onSeeAll={() => setActiveTab("resenas")} />
              <aside className="space-y-6">
                <FriendsYes limit={3} onSeeAll={() => setActiveTab("circulo")} />
                <FriendsNo limit={3} onSeeAll={() => setActiveTab("circulo")} />
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
          <div className="space-y-6">
            <FollowingStrip />
            <div className="grid gap-6 md:grid-cols-2">
              <FriendsYes />
              <FriendsNo />
            </div>
            <CircleFeed />
          </div>
        );
      case "perfil":
        return         <div className="max-w-2xl"><ProfilePanel user={user} showTitle /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* header: compact greeting + action bar (search and publish together) */}
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
          {/* catalog search */}
          <div className="relative flex-1">
            {/* mode toggles: products (default) / users */}
            <div className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchMode("products")}
                aria-label="Buscar productos"
                aria-pressed={searchMode === "products"}
                title="Buscar productos"
                className={
                  searchMode === "products"
                    ? "grid h-8 w-8 place-items-center rounded-full bg-acid text-ink"
                    : "grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
                }
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("users")}
                aria-label="Buscar usuarios"
                aria-pressed={searchMode === "users"}
                title="Buscar usuarios"
                className={
                  searchMode === "users"
                    ? "grid h-8 w-8 place-items-center rounded-full bg-acid text-ink"
                    : "grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
                }
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchMode === "products" ? "Busca una serie, película, videojuego o libro…" : "Buscar usuarios…"}
              autoComplete="off"
              aria-label={searchMode === "products" ? "Buscar en el catálogo" : "Buscar usuarios"}
              className="w-full rounded-2xl border border-line bg-surface py-3.5 pl-24 pr-11 text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_4px_rgba(203,242,78,0.14)]"
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

          {/* publish review (next to the search bar) */}
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
        searchMode === "users" ? (
          /* ---------- user search results ---------- */
          <Card as="section" className="p-7 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
                  Búsqueda de usuarios
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  Resultados para “{query.trim()}”
                </h2>
              </div>
              {userSearching && (
                <span className="text-acid">
                  <Spinner />
                </span>
              )}
            </div>

            {userResults.length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {userResults.map((u) => (
                  <Link
                    key={u.id}
                    to={`/user/${u.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-ink/60 p-3 transition hover:-translate-y-0.5 hover:border-acid/35"
                  >
                    <UserAvatar image={u.Image} name={u.Name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-cream">{u.Name}</p>
                      <p className="truncate text-xs text-faint">@{u.UserName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : userSearching ? (
              <p className="mt-6 text-dim">Buscando…</p>
            ) : (
              <p className="mt-6 text-dim">No se encontró ningún usuario con ese nombre.</p>
            )}
          </Card>
        ) : (
        /* ---------- search results ---------- */
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
        )
      ) : (
        /* ---------- normal view with tabs ---------- */
        <>
          <nav
            ref={tabsRef}
            aria-label="Secciones del panel"
            className="scroll-mt-24 flex items-center gap-2 overflow-x-auto border-b border-line pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                aria-current={activeTab === t.id ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition ${
                  activeTab === t.id
                    ? "bg-acid font-semibold text-ink"
                    : "font-medium text-dim hover:bg-cream/5 hover:text-cream"
                }`}
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
