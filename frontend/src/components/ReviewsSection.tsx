import { useEffect, useState } from "react";
import { getReviews, type Review } from "@/services/api";

// Small pill showing whether the review recommends the product.
function RecommendedBadge({ recommended }: { recommended: boolean }) {
  if (recommended) {
    return (
      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        Recomendado
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
      No recomendado
    </span>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const count = reviews.length;

  return (
    <article
      id="reviews"
      className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.25)]"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
            Reseñas hechas
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Tus reseñas recientes
          </h2>
        </div>
        {!loading && !error && (
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-300">
            {count} {count === 1 ? "reseña creada" : "reseñas creadas"}
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-6 text-slate-400">Cargando tus reseñas…</p>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : count === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/60 p-8 text-center">
          <p className="text-slate-300">
            Todavía no has publicado ninguna reseña.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Cuando publiques una, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5 transition hover:border-cyan-400/40 hover:bg-slate-950"
            >
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {review.ProductName}
                </h3>
                <p className="text-sm text-cyan-300">{review.Name}</p>
              </div>

              <p className="mt-3 text-slate-300">{review.Description}</p>

              <div className="mt-4 border-t border-white/5 pt-3">
                <RecommendedBadge recommended={review.Recommended} />
              </div>
            </article>
          ))}
        </div>
      )}
    </article>
  );
}
