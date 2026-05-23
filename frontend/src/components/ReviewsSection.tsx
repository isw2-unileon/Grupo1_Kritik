// ReviewsSection.tsx
// Drop-in replacement for the "#reviews" block of DashboardPage.
// Keeps the existing Kritik visual language: dark slate surfaces,
// cyan accents, rounded cards, and the eyebrow + title header pattern.

export interface Review {
  id: string;
  place: string;
  category: string;
  rating: number; // 0–5
  excerpt: string;
  date: string; // human-readable label, e.g. "Hace 3 días"
}

// Sample data so the section renders before the backend is wired up.
const sampleReviews: Review[] = [
  {
    id: "1",
    place: "Restaurante Mar y Sol",
    category: "Restaurante",
    rating: 5,
    excerpt:
      "Pescado fresquísimo y un servicio muy atento. El arroz caldoso es para repetir.",
    date: "Hace 3 días",
  },
  {
    id: "2",
    place: "Hotel Bosque Verde",
    category: "Alojamiento",
    rating: 4,
    excerpt:
      "Habitaciones tranquilas y un desayuno generoso. El wifi flojeaba por la noche.",
    date: "Hace 1 semana",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Valoración: ${rating} de 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${i < rating ? "fill-cyan-300" : "fill-white/15"}`}
          aria-hidden="true"
        >
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection({
  reviews = sampleReviews,
}: {
  reviews?: Review[];
}) {
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
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-300">
          {count} {count === 1 ? "reseña creada" : "reseñas creadas"}
        </span>
      </div>

      {count === 0 ? (
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
              className="group rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5 transition hover:border-cyan-400/40 hover:bg-slate-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {review.place}
                  </h3>
                  <p className="text-sm text-cyan-300">{review.category}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>

              <p className="mt-3 text-slate-300">{review.excerpt}</p>

              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {review.date}
                </span>
                <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/5"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/5"
                  >
                    Ver
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </article>
  );
}
