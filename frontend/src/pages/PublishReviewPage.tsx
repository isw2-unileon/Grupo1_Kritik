import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isEmpty } from "@/utils/validation";
import { searchProducts, createReview, type Product } from "@/services/api";

const inputClasses =
  "mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20";

export default function PublishReviewPage() {
  const navigate = useNavigate();

  // Product search / selection state.
  const [productQuery, setProductQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Review fields.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommended, setRecommended] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Debounced product search as the user types.
  useEffect(() => {
    if (selected || productQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const items = await searchProducts(productQuery.trim());
        setResults(items);
        setShowDropdown(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productQuery, selected]);

  const handleProductChange = (value: string) => {
    setProductQuery(value);
    setSelected(null); // typing again clears any previous selection
  };

  const handlePick = (product: Product) => {
    setSelected(product);
    setProductQuery(product.Name);
    setShowDropdown(false);
    setResults([]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!selected) {
      setError("Elige un producto de la lista (solo puedes reseñar productos ya registrados)");
      return;
    }
    if (isEmpty(title)) {
      setError("El título de la reseña es obligatorio");
      return;
    }
    if (isEmpty(description)) {
      setError("Escribe el contenido de la reseña");
      return;
    }
    if (recommended === null) {
      setError("Indica si recomiendas el producto o no");
      return;
    }

    setLoading(true);
    try {
      await createReview({
        title: title.trim(),
        product_name: selected.Name,
        description: description.trim(),
        recommended,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar la reseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
      <div className="mb-8 space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
          Publicar reseña
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Publicar una nueva reseña
        </h1>
        <p className="text-slate-400">
          Busca el producto que quieres reseñar y comparte tu opinión.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative block">
          <span className="text-sm font-medium text-slate-200">Producto</span>
          <input
            type="text"
            value={productQuery}
            onChange={(e) => handleProductChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Busca un juego, libro, serie o película…"
            autoComplete="off"
            className={inputClasses}
          />

          {showDropdown && productQuery.trim().length >= 2 && (
            <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              {results.map((product) => (
                <li key={product.Name}>
                  <button
                    type="button"
                    onClick={() => handlePick(product)}
                    className="block w-full px-4 py-3 text-left text-slate-100 transition hover:bg-white/5"
                  >
                    {product.Name}
                  </button>
                </li>
              ))}
              {results.length === 0 && (
                <li className="px-4 py-3 text-sm text-slate-400">
                  No existe ningún producto con ese nombre. Solo puedes reseñar productos ya registrados.
                </li>
              )}
            </ul>
          )}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Título de la reseña</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Un resumen corto de tu opinión"
            className={inputClasses}
          />
        </label>

        <div className="block">
          <span className="text-sm font-medium text-slate-200">
            ¿Recomiendas este producto?
          </span>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setRecommended(true)}
              className={`flex-1 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                recommended === true
                  ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-slate-950/80 text-slate-300 hover:border-white/25"
              }`}
            >
              Sí, lo recomiendo
            </button>
            <button
              type="button"
              onClick={() => setRecommended(false)}
              className={`flex-1 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                recommended === false
                  ? "border-red-400 bg-red-400/10 text-red-300"
                  : "border-white/10 bg-slate-950/80 text-slate-300 hover:border-white/25"
              }`}
            >
              No lo recomiendo
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Tu reseña</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Cuenta cómo fue tu experiencia, qué te gustó y qué mejorarías."
            className={`${inputClasses} resize-y`}
          />
        </label>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
          >
            Volver al inicio
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Publicando..." : "Publicar reseña"}
          </button>
        </div>
      </form>
    </div>
  );
}
