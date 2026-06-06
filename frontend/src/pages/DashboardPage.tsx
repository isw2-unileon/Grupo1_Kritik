import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ReviewsSection from "@/components/ReviewsSection";
import Card from "@/components/Card";
import UserAvatar from "@/components/UserAvatar";
import { searchProducts, searchUsers, getReviews, getFollowers, getFollowing, unfollowUser, type Product, type Review, type ProfileUser } from "@/services/api";

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

type Reco = { name: string; cat: CatKey; verdict: boolean; who: string; text: string };
type Circle = { name: string; cat: CatKey; n: number };

const RECOS: Reco[] = [
  { name: "Severance", cat: "series", verdict: true, who: "@lucia", text: "Tensión perfecta, dirección impecable." },
  { name: "Tunic", cat: "game", verdict: true, who: "@dani", text: "Un secreto detrás de cada esquina." },
  { name: "Poor Things", cat: "film", verdict: false, who: "@sara", text: "Visualmente bella, narrativamente fría." },
  { name: "Pachinko", cat: "book", verdict: true, who: "@marco", text: "Generaciones que se te quedan dentro." },
  { name: "Hollow Knight", cat: "game", verdict: true, who: "@nuria", text: "Atmósfera y control impecables." },
  { name: "Starfall VII", cat: "game", verdict: false, who: "@bruno", text: "Bonito, pero repetitivo a las pocas horas." },
  { name: "Klara y el Sol", cat: "book", verdict: true, who: "@elena", text: "Ternura y melancolía a partes iguales." },
  { name: "La carretera", cat: "book", verdict: false, who: "@hugo", text: "Brillante, pero durísima de releer." },
  { name: "Shogun", cat: "series", verdict: true, who: "@aitor", text: "Producción enorme y muy bien contada." },
  { name: "Última señal", cat: "series", verdict: false, who: "@vera", text: "Empieza fuerte y se desinfla al final." },
  { name: "Oppenheimer", cat: "film", verdict: true, who: "@pablo", text: "Tres horas que se pasan volando." },
  { name: "Dune: Parte Dos", cat: "film", verdict: true, who: "@noa", text: "Espectáculo y fondo, por fin juntos." },
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

/* ---------- Reusable components ---------- */
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
  const items = useMemo(() => shuffle(FEATURED), []);
  // We duplicate the list so the loop is continuous and seamless.
  const loop = [...items, ...items];

  const open = (it: { name: string; cat: CatKey }) =>
    navigate(`/product/${encodeURIComponent(it.name)}`, {
      state: {
        product: {
          id: it.name,
          Name: it.name,
          Type: CAT_TO_TYPE[it.cat],
          Genre: [] as string[],
          Description: "",
        },
      },
    });

  return (
    <div className="group relative overflow-hidden">
      {/* Blurred edges so the cards blend with the background */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent" />
      <div className="flex w-max animate-[kritik-marquee_50s_linear_infinite] group-hover:[animation-play-state:paused]">
        {loop.map((it, i) => (
          <button
            key={`${it.name}-${i}`}
            type="button"
            onClick={() => open(it)}
            aria-label={`Ver ${it.name}`}
            className="mr-4 w-32 shrink-0 overflow-hidden rounded-2xl border border-line transition hover:-translate-y-1 hover:border-acid/40"
          >
            <Cover cat={it.cat} name={it.name} className="aspect-[2/3]" />
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
  const preview = typeof limit === "number"; // Home = preview; tab = full view
  const [cat, setCat] = useState<RecoCatId>("all");

  // preview: the first N. Full view: all, with filter by category.
  const list = !preview && cat !== "all" ? RECOS.filter((r) => r.cat === cat) : RECOS;
  const visible = preview ? RECOS.slice(0, limit) : list;

  // opens the profile of the title with its data (example) via router state
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

      {/* Category filters: only in the full version (tab) */}
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
          {visible.map((r) => (
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
      )}

      {/* Preview: link to the full list if there are more */}
      {preview && onSeeAll && RECOS.length > (limit ?? 0) && (
        <button
          type="button"
          onClick={onSeeAll}
          className="mt-4 w-full rounded-2xl border border-line bg-ink/40 px-4 py-3 text-sm font-semibold text-dim transition hover:border-acid/35 hover:text-cream"
        >
          Ver todas las recomendaciones ({RECOS.length}) →
        </button>
      )}
    </Card>
  );
}

// clickable row of the circle: opens the product profile (sample data) via router state
function CircleRow({ f, note, accent }: { f: Circle; note: string; accent: string }) {
  const navigate = useNavigate();
  const open = () =>
    navigate(`/product/${encodeURIComponent(f.name)}`, {
      state: {
        product: {
          id: f.name,
          Name: f.name,
          Type: CAT_TO_TYPE[f.cat],
          Genre: [] as string[],
          Description: "",
        },
      },
    });

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
      <Cover cat={f.cat} className="h-12 w-12 shrink-0 rounded-lg" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{f.name}</p>
        <p className="text-xs text-faint">{note}</p>
      </div>
    </div>
  );
}

function FriendsYes() {
  return (
    <Card as="article" className="p-6">
      <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu círculo · Sí</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">A tus amigos les gustó</h2>
      <div className="mt-5 space-y-3">
        {FRIENDS_YES.map((f) => (
          <CircleRow
            key={f.name}
            f={f}
            accent="hover:ring-acid/35"
            note={`Recomendado por ${f.n} ${f.n === 1 ? "amigo" : "amigos"}`}
          />
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
          <CircleRow
            key={f.name}
            f={f}
            accent="hover:ring-coral/35"
            note={`Descartado por ${f.n} ${f.n === 1 ? "amigo" : "amigos"}`}
          />
        ))}
      </div>
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

/* ---------- Following list modal ---------- */
function FollowingList({
  users,
  unfollowingIds,
  error,
  onClose,
  onUnfollow,
}: {
  users: ProfileUser[];
  unfollowingIds: Set<number>;
  error: string | null;
  onClose: () => void;
  onUnfollow: (id: number) => Promise<void>;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Usuarios que sigues"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-md rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-cream">Siguiendo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
        )}

        <div className="mt-4 max-h-80 space-y-1 overflow-y-auto">
          {users.length === 0 ? (
            <p className="py-8 text-center text-dim">No sigues a nadie todavía.</p>
          ) : (
            users.map((u) => {
              const loading = unfollowingIds.has(u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-ink/40"
                >
                  <Link
                    to={`/user/${u.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UserAvatar image={u.Image} name={u.Name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-cream">{u.Name}</p>
                      <p className="truncate text-xs text-faint">@{u.UserName}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onUnfollow(u.id)}
                    className="shrink-0 rounded-full border border-coral px-3.5 py-1.5 text-xs font-semibold text-coral transition hover:bg-coral/10 disabled:opacity-40"
                  >
                    {loading ? "Dejando de seguir…" : "Dejar de seguir"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* Full profile panel (Profile tab): identity + real statistics
   calculated from your reviews. Followers/following will be available when the
   backend exposes the following/followers arrays. */
function ProfilePanel({ user }: { user: SessionUser }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<ProfileUser[]>([]);
  const [following, setFollowing] = useState<ProfileUser[]>([]);
  const [followLoading, setFollowLoading] = useState(true);
  const [showFollowing, setShowFollowing] = useState(false);
  const [unfollowingIds, setUnfollowingIds] = useState<Set<number>>(new Set());
  const [unfollowError, setUnfollowError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [reviewsData, followersData, followingData] = await Promise.all([
          getReviews(),
          getFollowers(),
          getFollowing(),
        ]);
        if (active) {
          setReviews(reviewsData);
          setFollowers(followersData);
          setFollowing(followingData);
        }
      } catch {
        /* If it fails, we simply don't show statistics */
      } finally {
        if (active) {
          setLoading(false);
          setFollowLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const total = reviews.length;
  const yes = reviews.filter((r) => r.Recommended).length;
  const pct = total ? Math.round((yes / total) * 100) : 0;
  const fullName = user ? `${user.name ?? ""} ${user.surname ?? ""}`.trim() : "";

  const handleUnfollow = async (targetId: number) => {
    setUnfollowError(null);
    setUnfollowingIds((prev) => new Set(prev).add(targetId));
    try {
      await unfollowUser(targetId);
      setFollowing((prev) => prev.filter((u) => u.id !== targetId));
    } catch {
      setUnfollowError("No se pudo dejar de seguir a este usuario.");
    } finally {
      setUnfollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  return (
    <>
    <Card as="article" className="p-7 sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <UserAvatar image={user?.image} name={user?.name ?? ""} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu perfil</p>
            <h2 className="mt-1 truncate font-display text-2xl font-semibold text-cream">
              {fullName || "Tu perfil"}
            </h2>
            <p className="truncate text-sm text-faint">@{user?.user_name ?? "usuario"}</p>
          </div>
        </div>
        <div className="flex items-start gap-6 shrink-0">
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-cream">{followLoading ? "…" : followers.length}</p>
            <p className="text-xs text-faint">seguidores</p>
          </div>
          <button
            type="button"
            onClick={() => setShowFollowing(true)}
            className="text-center transition hover:opacity-80"
          >
            <p className="font-display text-2xl font-bold text-cream">{followLoading ? "…" : following.length}</p>
            <p className="text-xs text-faint">seguidos</p>
          </button>
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

    </Card>

      {showFollowing && (
        <FollowingList
          users={following}
          unfollowingIds={unfollowingIds}
          error={unfollowError}
          onClose={() => { setShowFollowing(false); setUnfollowError(null); }}
          onUnfollow={handleUnfollow}
        />
      )}
    </>
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

  // User search (real API: searchUsers)
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<ProfileUser[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

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

  // User search — debounced, with click-outside close
  useEffect(() => {
    const q = userQuery.trim();
    if (q.length < 2) {
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
  }, [userQuery]);

  useEffect(() => {
    if (!userSearchOpen) return;
    const handler = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setUserSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userSearchOpen]);

// When changing tabs, smoothly scroll to the tabs so the 
// content doesn't "jump" if a tab is shorter than the previous one
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    tabsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [activeTab]);

  const isSearching = query.trim().length >= 2;

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

        <div className="flex justify-end">
          <div ref={userSearchRef} className="relative w-64">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => { setUserQuery(e.target.value); setUserSearchOpen(true); }}
              onFocus={() => userQuery.trim().length >= 2 && setUserSearchOpen(true)}
              placeholder="Buscar usuarios…"
              autoComplete="off"
              aria-label="Buscar usuarios"
              className="w-full rounded-full border border-line bg-surface py-2 pl-4 pr-10 text-sm text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_3px_rgba(203,242,78,0.14)]"
            />
            {userQuery ? (
              <button
                type="button"
                onClick={() => { setUserQuery(""); setUserResults([]); }}
                aria-label="Limpiar búsqueda de usuarios"
                className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            )}
            {userSearchOpen && userQuery.trim().length >= 2 && (
              <div className="absolute right-0 top-full z-50 mt-2 w-full rounded-2xl border border-line bg-surface py-2 shadow-xl">
                {userSearching ? (
                  <p className="px-4 py-2 text-sm text-faint">Buscando…</p>
                ) : userResults.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-faint">Ningún usuario encontrado</p>
                ) : (
                  userResults.map((u) => (
                    <Link
                      key={u.id}
                      to={`/user/${u.id}`}
                      onClick={() => { setUserQuery(""); setUserResults([]); setUserSearchOpen(false); }}
                      className="flex items-center gap-3 px-4 py-2 transition hover:bg-cream/5"
                    >
                      <UserAvatar image={u.Image} name={u.Name} size="xs" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-cream">{u.Name}</p>
                        <p className="truncate text-xs text-faint">@{u.UserName}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* catalog search */}
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
