import { useEffect, useState } from "react";
import { getReviews, type Review } from "@/services/api";
import Card from "@/components/Card";

type ReviewsSectionProps = {
  /** Modo "vistazo": muestra como mucho N reseñas (las más recientes) y oculta los filtros. */
  limit?: number;
  /** Acción del enlace "Ver todas" (p. ej. cambiar a la pestaña de reseñas). */
  onSeeAll?: () => void;
};

/* Sello del veredicto, en el sistema de diseño (lime = sí, coral = no). */
function RecommendedBadge({ recommended }: { recommended: boolean }) {
  return recommended ? (
    <span className="shrink-0 rounded-full border-[1.5px] border-acid bg-acid/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-acid">
      Recomendado
    </span>
  ) : (
    <span className="shrink-0 rounded-full border-[1.5px] border-coral bg-coral/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-coral">
      No recomendado
    </span>
  );
}

/* Filtro por veredicto: cada estado activo se tiñe con su color de marca. */
const VERDICTS = [
  {
    id: "all",
    label: "Todas",
    active: "rounded-full bg-surface2 px-3 py-1 text-xs font-bold text-cream ring-1 ring-line",
  },
  {
    id: "yes",
    label: "Recomiendan",
    active: "rounded-full bg-acid/15 px-3 py-1 text-xs font-bold text-acid ring-1 ring-acid/30",
  },
  {
    id: "no",
    label: "No recomiendan",
    active: "rounded-full bg-coral/15 px-3 py-1 text-xs font-bold text-coral ring-1 ring-coral/30",
  },
] as const;
type VerdictId = (typeof VERDICTS)[number]["id"];

const idle =
  "rounded-full px-3 py-1 text-xs font-semibold text-faint transition hover:text-cream";

function ReviewItem({ review }: { review: Review }) {
  return (
    <article className="rounded-2xl border border-line bg-ink/60 p-5 transition hover:border-acid/35">
      <div className="flex items-center justify-between gap-3">
        <RecommendedBadge recommended={review.Recommended} />
        {review.ProductName && (
          <span className="truncate text-sm text-faint">sobre {review.ProductName}</span>
        )}
      </div>
      <p className="mt-3 leading-relaxed text-dim">
        {review.Description || "Sin descripción."}
      </p>
    </article>
  );
}

export default function ReviewsSection({ limit, onSeeAll }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filtros (solo en modo completo)
  const [verdict, setVerdict] = useState<VerdictId>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getReviews();
        if (active) setReviews(data);
      } catch {
        if (active) setError("No se pudieron cargar tus reseñas");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const preview = typeof limit === "number";
  const count = reviews.length;

  // más recientes primero (id mayor = reseña más nueva)
  const sorted = [...reviews].sort((a, b) => b.id - a.id);

  // en vistazo: las últimas N; en completo: aplica filtros
  const needle = query.trim().toLowerCase();
  const visible = preview
    ? sorted.slice(0, limit)
    : sorted.filter((r) => {
        if (verdict === "yes" && !r.Recommended) return false;
        if (verdict === "no" && r.Recommended) return false;
        if (needle) {
          const hay = `${r.Description ?? ""} ${r.ProductName ?? ""}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      });

  const isFiltering = !preview && visible.length !== count;
  const hasMore = preview && count > (limit ?? 0);

  return (
    <Card as="article" className="p-7 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Tu actividad</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">
            {preview ? "Tus últimas reseñas" : "Reseñas hechas"}
          </h2>
        </div>

        {/* derecha: en vistazo, enlace "ver todo"; en completo, contador */}
        {preview
          ? !loading && !error && count > 0 && onSeeAll && (
              <button
                type="button"
                onClick={onSeeAll}
                className="hidden text-sm text-faint transition hover:text-cream sm:block"
              >
                Ver todo →
              </button>
            )
          : !loading && !error && count > 0 && (
              <span className="self-start rounded-full border border-line bg-ink/50 px-3 py-1 text-sm font-semibold text-dim sm:self-auto">
                {isFiltering ? `${visible.length} de ${count}` : `${count} ${count === 1 ? "reseña" : "reseñas"}`}
              </span>
            )}
      </div>

      {/* filtros: solo en modo completo y si hay reseñas que filtrar */}
      {!preview && !loading && !error && count > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Filtrar por veredicto"
            className="flex items-center gap-1 rounded-full border border-line bg-ink/40 p-1"
          >
            {VERDICTS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVerdict(v.id)}
                aria-pressed={verdict === v.id}
                className={verdict === v.id ? v.active : idle}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtra tus reseñas…"
              autoComplete="off"
              aria-label="Filtrar tus reseñas por texto"
              className="w-full rounded-full border border-line bg-ink py-2 pl-10 pr-9 text-sm text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_4px_rgba(203,242,78,0.14)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar filtro"
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-dim">Cargando tus reseñas…</p>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-coral/30 bg-coral/10 px-5 py-3 text-sm text-coral">
          {error}
        </div>
      ) : count === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-line bg-ink/40 p-8 text-center">
          <p className="text-dim">Todavía no has publicado ninguna reseña.</p>
          <p className="mt-2 text-sm text-faint">Cuando publiques una, aparecerá aquí.</p>
        </div>
      ) : !preview && visible.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-line bg-ink/40 p-8 text-center">
          <p className="text-dim">Ninguna reseña coincide con el filtro.</p>
          <button
            type="button"
            onClick={() => {
              setVerdict("all");
              setQuery("");
            }}
            className="mt-3 text-sm font-semibold text-acid transition hover:underline"
          >
            Quitar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4">
            {visible.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>

          {/* en vistazo, si hay más de las mostradas, CTA en cascada hacia el listado completo */}
          {hasMore && (
            <button
              type="button"
              onClick={onSeeAll}
              className="mt-4 w-full rounded-2xl border border-line bg-ink/40 px-4 py-3 text-sm font-semibold text-dim transition hover:border-acid/35 hover:text-cream"
            >
              Ver todas tus reseñas ({count}) →
            </button>
          )}
        </>
      )}
    </Card>
  );
}
