import { useEffect, useState } from "react";
import { getReviews, deleteReview, updateReview, type Review } from "@/services/api";
import Card from "@/components/Card";

type ReviewsSectionProps = {
  /** "Vistazo": muestra como mucho N reseñas (las más recientes) y oculta los filtros. */
  limit?: number;
  /** Acción del enlace "Ver todo" (p. ej. cambiar a la pestaña de reseñas). */
  onSeeAll?: () => void;
};

/* Sello de veredicto, en el sistema de diseño (lima = sí, coral = no). */
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

/* Filtro de veredicto: cada estado activo se tiñe con su color de marca. */
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

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type ReviewItemProps = {
  review: Review;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, data: { description: string; recommended: boolean }) => Promise<void>;
};

function ReviewItem({ review, onDelete, onUpdate }: ReviewItemProps) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [draft, setDraft] = useState(review.Description ?? "");
  const [draftRec, setDraftRec] = useState<boolean>(review.Recommended);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const startEdit = () => {
    setDraft(review.Description ?? "");
    setDraftRec(review.Recommended);
    setErr("");
    setMode("edit");
  };

  const cancel = () => {
    setErr("");
    setMode("view");
  };

  const save = async () => {
    if (!draft.trim()) {
      setErr("La reseña no puede estar vacía.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await onUpdate(review.id, { description: draft.trim(), recommended: draftRec });
      setMode("view");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    setErr("");
    try {
      await onDelete(review.id);
      // el padre lo quita de la lista, así que este componente se desmonta
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo borrar.");
      setBusy(false);
      setMode("view");
    }
  };

  /* ---- MODO EDICIÓN ---- */
  if (mode === "edit") {
    return (
      <article className="rounded-2xl border border-acid/40 bg-ink/60 p-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDraftRec(true)}
            aria-pressed={draftRec === true}
            className={`rounded-full border-[1.5px] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition ${
              draftRec ? "border-acid bg-acid/10 text-acid" : "border-line text-faint hover:text-cream"
            }`}
          >
            Recomiendo
          </button>
          <button
            type="button"
            onClick={() => setDraftRec(false)}
            aria-pressed={draftRec === false}
            className={`rounded-full border-[1.5px] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] transition ${
              !draftRec ? "border-coral bg-coral/10 text-coral" : "border-line text-faint hover:text-cream"
            }`}
          >
            No recomiendo
          </button>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          disabled={busy}
          className="mt-3 w-full resize-y rounded-2xl border border-line bg-ink px-4 py-3 text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_4px_rgba(203,242,78,0.14)] disabled:opacity-60"
        />

        {err && <p className="mt-2 text-xs text-coral">{err}</p>}

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-cream transition hover:border-cream/35 hover:bg-cream/5 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-acid px-5 py-2 text-sm font-semibold text-ink transition hover:bg-[#d7f56e] disabled:opacity-70"
          >
            {busy && <Spinner />}
            <span>{busy ? "Guardando…" : "Guardar"}</span>
          </button>
        </div>
      </article>
    );
  }

  /* ---- MODO CONFIRMAR BORRADO ---- */
  if (mode === "confirm") {
    return (
      <article className="rounded-2xl border border-coral/40 bg-coral/5 p-5">
        <p className="font-semibold text-cream">¿Seguro que quieres borrar esta reseña?</p>
        <p className="mt-1 text-sm text-faint">Esta acción no se puede deshacer.</p>
        {err && <p className="mt-2 text-xs text-coral">{err}</p>}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-cream transition hover:border-cream/35 hover:bg-cream/5 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2 text-sm font-semibold text-ink transition hover:bg-[#ff6f5e] disabled:opacity-70"
          >
            {busy && <Spinner />}
            <span>{busy ? "Borrando…" : "Sí, borrar"}</span>
          </button>
        </div>
      </article>
    );
  }

  /* ---- MODO VISTA ---- */
  return (
    <article className="rounded-2xl border border-line bg-ink/60 p-5 transition hover:border-acid/35">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <RecommendedBadge recommended={review.Recommended} />
          {review.ProductName && (
            <span className="truncate text-sm text-faint">sobre {review.ProductName}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={startEdit}
            aria-label="Editar reseña"
            title="Editar"
            className="grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-cream/5 hover:text-cream"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setErr("");
              setMode("confirm");
            }}
            aria-label="Borrar reseña"
            title="Borrar"
            className="grid h-8 w-8 place-items-center rounded-full text-faint transition hover:bg-coral/10 hover:text-coral"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
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

  // borra en el backend y quita de la lista local
  const handleDelete = async (id: number) => {
    await deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  // actualiza en el backend y refleja los cambios en la lista local
  const handleUpdate = async (
    id: number,
    data: { description: string; recommended: boolean },
  ) => {
    await updateReview(id, data);
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, Description: data.description, Recommended: data.recommended } : r,
      ),
    );
  };

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
              <ReviewItem
                key={review.id}
                review={review}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>

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
