import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import Card from "@/components/Card";
import ProductEditModal from "@/components/ProductEditModal";
import { useAuth } from "@/contexts/AuthContext";
import { searchProducts } from "@/services/api";

/* ============================================================
   Title Detail Page — Steam-inspired, with Kritik's identity
   (the Yes/No verdict as "% recommended").

   HOW THE DATA ARRIVES
   The product is received via router state when clicking a card
   (catalog search or recommendations). The page uses that real
   data (Type, Genre, Release Date, Description, Average Score).

   BACKEND PENDING
   The reviews and gallery are PLACEHOLDERS: the backend does not
   yet expose reviews per product (GET /api/reviews only returns
   those of the logged-in user, and there is no GET /api/products/:id).
   The % is calculated from the sample reviews to keep the page
   consistent. To make it real, the backend would simply need to
   expose GetReviewsByProductName, e.g., GET /api/products/:id/reviews,
   and replace SAMPLE_REVIEWS with a call to that API.
   ============================================================ */

type DetailProduct = {
  id: number | string;
  Name: string;
  Type?: string;
  Genre?: string[];
  Description?: string;
  Release?: string; // civil.Date format = "YYYY-MM-DD"
  AverageGrade?: number;
  Image?: string; // single product photo (may be empty)
};

/* cover palettes by type (same as the panel, for consistency) */
const TYPE_STYLES = {
  series: { label: "Serie", grad: "from-[#2d5b6b] via-[#2e88a3] to-[#1b333f]" },
  film: { label: "Película", grad: "from-[#6b2d4a] via-[#a32e5e] to-[#3f1b2c]" },
  game: { label: "Videojuego", grad: "from-[#3a2d6b] via-[#5b3b8c] to-[#241b3f]" },
  book: { label: "Libro", grad: "from-[#6b3b2d] via-[#a35a2e] to-[#3f261b]" },
  other: { label: "Título", grad: "from-[#3a342a] via-[#4a4234] to-[#241f18]" },
} as const;
type CatKey = keyof typeof TYPE_STYLES;

function catFromType(type?: string): CatKey {
  const t = (type ?? "").toLowerCase();
  if (t.includes("serie")) return "series";
  if (t.includes("film") || t.includes("pelíc") || t.includes("pelic") || t.includes("movie")) return "film";
  if (t.includes("game") || t.includes("juego") || t.includes("video")) return "game";
  if (t.includes("libro") || t.includes("book")) return "book";
  return "other";
}

/* ---------- sample reviews (pending backend endpoint) ---------- */
type CommunityReview = {
  id: number;
  author: string;
  verdict: boolean;
  title: string;
  text: string;
  when: string;
};
const SAMPLE_REVIEWS: CommunityReview[] = [
  { id: 1, author: "@lucia", verdict: true, title: "Una obra maestra de ritmo", text: "Cada capítulo te deja con ganas del siguiente. La dirección no da respiro y el reparto está soberbio.", when: "hace 3 días" },
  { id: 2, author: "@dani", verdict: true, title: "Me atrapó desde el minuto uno", text: "No esperaba que me gustara tanto. El guion juega contigo y gana siempre.", when: "hace 1 semana" },
  { id: 3, author: "@sara", verdict: false, title: "Bonita por fuera, vacía por dentro", text: "Visualmente impecable, pero la historia no termina de arrancar. Se me hizo larga.", when: "hace 2 semanas" },
  { id: 4, author: "@marco", verdict: true, title: "De lo mejor del año", text: "Lo repetiría sin dudarlo. Un final que justifica todo el viaje.", when: "hace 3 semanas" },
  { id: 5, author: "@nora", verdict: true, title: "Pequeña joya", text: "No es perfecta, pero tiene corazón y se nota el cariño en cada detalle.", when: "hace 1 mes" },
];

type Tier = { label: string; tone: "acid" | "cream" | "coral" };
function tierFor(pct: number): Tier {
  if (pct >= 90) return { label: "Aclamado por la comunidad", tone: "acid" };
  if (pct >= 80) return { label: "Muy recomendado", tone: "acid" };
  if (pct >= 70) return { label: "Mayormente positivo", tone: "acid" };
  if (pct >= 55) return { label: "Positivo", tone: "cream" };
  if (pct >= 45) return { label: "Opiniones divididas", tone: "cream" };
  if (pct >= 30) return { label: "Mayormente negativo", tone: "coral" };
  return { label: "No recomendado", tone: "coral" };
}
const toneText: Record<Tier["tone"], string> = {
  acid: "text-acid",
  cream: "text-cream",
  coral: "text-coral",
};

function formatRelease(release?: string): string | null {
  if (!release) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(release);
  if (!m) return release;
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const [, y, mo, d] = m;
  return `${Number(d)} ${months[Number(mo) - 1] ?? ""} ${y}`.trim();
}

/* ---------- reusable pieces ---------- */
function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-ink/50 px-3 py-1 text-xs font-medium text-dim backdrop-blur-sm">
      {children}
    </span>
  );
}

function VerdictChip({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="shrink-0 rounded-full border-[1.5px] border-acid bg-acid/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-acid">
      Sí
    </span>
  ) : (
    <span className="shrink-0 rounded-full border-[1.5px] border-coral bg-coral/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
      No
    </span>
  );
}

/* the Kritik "stamp" over the cover */
function VerdictStamp({ recommended }: { recommended: boolean }) {
  return (
    <div
      className={`-rotate-6 rounded-2xl border-[3px] px-5 py-3 text-center ${
        recommended ? "border-acid text-acid" : "border-coral text-coral"
      }`}
      style={{ boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.18)" }}
    >
      <span className="font-display text-xs font-black uppercase leading-none tracking-[0.22em]">
        {recommended ? "Recomendado" : "No recomendado"}
      </span>
    </div>
  );
}

/* ---------- sections ---------- */
function AboutCard({ description }: { description?: string }) {
  return (
    <Card as="section" className="p-7 sm:p-8">
      <h2 className="font-display text-2xl font-semibold">Acerca de</h2>
      <p className="mt-4 leading-relaxed text-dim">
        {description && description.trim()
          ? description
          : "Todavía no hay una descripción para este título en el catálogo."}
      </p>
    </Card>
  );
}

function RecommendationCard({
  pct,
  tier,
  positives,
  total,
}: {
  pct: number;
  tier: Tier;
  positives: number;
  total: number;
}) {
  return (
    <Card as="section" className="p-6">
      <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Veredicto de la comunidad</p>

      <div className="mt-4 flex items-end gap-3">
        <span className={`font-display text-6xl font-black leading-none ${toneText[tier.tone]}`}>
          {pct}
          <span className="text-3xl">%</span>
        </span>
        <span className="pb-1.5 text-sm text-dim">lo recomienda</span>
      </div>
      <p className={`mt-2 font-display text-lg font-semibold ${toneText[tier.tone]}`}>{tier.label}</p>

      {/* Yes / No bar */}
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-coral/30" aria-hidden>
        <div className="h-full bg-acid" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-acid">
          <span className="h-2 w-2 rounded-full bg-acid" />
          {positives} Sí
        </span>
        <span className="text-faint">basado en {total} veredictos</span>
        <span className="inline-flex items-center gap-1.5 text-coral">
          {total - positives} No
          <span className="h-2 w-2 rounded-full bg-coral" />
        </span>
      </div>
      <p className="mt-4 border-t border-line pt-4 text-xs text-faint">
        Cálculo de ejemplo — será real cuando haya reseñas por producto.
      </p>
    </Card>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-dim">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function DetailsCard({
  product,
  release,
  typeLabel,
}: {
  product: DetailProduct;
  release: string | null;
  typeLabel: string;
}) {
  const hasGrade = typeof product.AverageGrade === "number" && product.AverageGrade > 0;
  return (
    <Card as="section" className="p-6">
      <h2 className="font-display text-xl font-semibold">Ficha</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <DetailRow label="Tipo">
          <span className="font-semibold">{typeLabel}</span>
        </DetailRow>
        {product.Genre && product.Genre.length > 0 && (
          <DetailRow label="Género">
            <span className="font-semibold">{product.Genre.join(", ")}</span>
          </DetailRow>
        )}
        {release && (
          <DetailRow label="Estreno">
            <span className="font-semibold">{release}</span>
          </DetailRow>
        )}
        {hasGrade && (
          <DetailRow label="Nota media">
            <span className="font-display font-bold text-acid">{product.AverageGrade}/100</span>
          </DetailRow>
        )}
        <DetailRow label="ID en catálogo">
          <span className="font-mono text-xs text-faint">#{product.id}</span>
        </DetailRow>
      </dl>
    </Card>
  );
}

function CommunityReviews({ reviews }: { reviews: CommunityReview[] }) {
  return (
    <Card as="section" className="p-7 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">La comunidad opina</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Veredictos</h2>
          <p className="mt-2 max-w-md text-sm text-faint">
            Ejemplo por ahora — aquí aparecerán las reseñas reales cuando el backend
            las exponga por producto.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-acid/30 bg-acid/10 px-3 py-1 text-xs font-semibold text-acid">
          Próximamente
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {reviews.map((r) => (
          <article key={r.id} className="rounded-2xl border border-line bg-ink/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface2 font-display text-sm font-bold text-acid ring-1 ring-line">
                  {r.author.replace("@", "").charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-cream">{r.author}</p>
                  <p className="text-xs text-faint">{r.when}</p>
                </div>
              </div>
              <VerdictChip yes={r.verdict} />
            </div>
            <p className="mt-3 font-display text-lg font-semibold">{r.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-dim">{r.text}</p>
          </article>
        ))}
      </div>
    </Card>
  );
}

/* ---------- page ---------- */
export default function ProductDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const stateProduct = (location.state as { product?: DetailProduct } | null)?.product;

  const { isAdmin } = useAuth();

  // The name comes from the state (when clicking a card) or from the URL (/product/<name>).
  const name = stateProduct?.Name ?? (id ? decodeURIComponent(id) : "");

  const [product, setProduct] = useState<DetailProduct | null>(stateProduct ?? null);
  const [loading, setLoading] = useState(!stateProduct);
  const [notFound, setNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // WITHOUT TOUCHING THE BACKEND: we request the REAL product by name using the existing
  // endpoint (GET /api/products?q=). The product from state, if available, renders instantly;
  // once searchProducts resolves, we replace it with the real data from the DB.
  useEffect(() => {
    if (!name) {
      if (!stateProduct) setNotFound(true);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const results = await searchProducts(name, controller.signal);
        const match = results.find((p) => p.Name === name) ?? results[0];
        if (match) {
          setProduct(match);
          setNotFound(false);
        } else if (!stateProduct) {
          setNotFound(true);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Not in the catalog: if we had data from state, we keep it.
        if (!stateProduct) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  if (loading && !product) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Título</p>
        <p className="mt-3 text-dim">Cargando ficha…</p>
      </div>
    );
  }

  // No data: it does not exist in the catalog or the direct link is invalid.
  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Título</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">No encontramos este título</h1>
        <p className="mt-3 text-dim">
          Puede que no exista en el catálogo o que el enlace no sea válido. Vuelve al panel y
          elígelo de nuevo.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d7f56e]"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  const cat = catFromType(product.Type);
  const style = TYPE_STYLES[cat];

  // Reviews by product: pending backend. Example for now.
  const reviews = SAMPLE_REVIEWS;
  const total = reviews.length;
  const positives = reviews.filter((r) => r.verdict).length;
  const pct = total ? Math.round((positives / total) * 100) : 0;
  const tier = tierFor(pct);
  const recommended = pct >= 50;
  const release = formatRelease(product.Release);

  return (
    <div className="space-y-8">
      {/* back */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-dim transition hover:text-cream"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver al catálogo
      </Link>

      {/* HERO / cover */}
      <section className={`relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br ${style.grad}`}>
        {product.Image ? (
          // single product photo; if the URL fails, we hide it and keep the gradient
          <img
            src={product.Image}
            alt={product.Name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg,rgba(0,0,0,.15) 0%,transparent 32%,rgba(0,0,0,.72) 100%)" }}
        />
        <div className="relative z-10 flex min-h-[300px] flex-col justify-end p-7 sm:min-h-[360px] sm:p-10">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cream/75">{style.label}</p>
              <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.03] tracking-tight text-cream sm:text-6xl">
                {product.Name}
              </h1>
              {product.Genre && product.Genre.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.Genre.map((g) => (
                    <Tag key={g}>{g}</Tag>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden shrink-0 sm:block">
              <VerdictStamp recommended={recommended} />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        {/* main column */}
        <div className="space-y-6">
          <AboutCard description={product.Description} />
          <CommunityReviews reviews={reviews} />
        </div>

        {/* lateral bar */}
        <aside className="space-y-6">
          <RecommendationCard pct={pct} tier={tier} positives={positives} total={total} />
          <DetailsCard product={product} release={release} typeLabel={style.label} />
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-acid px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d7f56e]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Modificar producto
            </button>
          ) : (
            <Link
              to="/publish-review"
              state={{ product }}
              className="flex items-center justify-center gap-2 rounded-full bg-acid px-6 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d7f56e]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Publica tu veredicto
            </Link>
          )}
        </aside>
      </div>

      {showEditModal && product && (
        <ProductEditModal
          product={product}
          onSave={(updated) => {
            setProduct(updated);
            setShowEditModal(false);
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
