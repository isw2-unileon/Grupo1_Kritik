import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { isEmpty } from "@/utils/validation";
import { searchProducts, createReview, type Product } from "@/services/api";
import Card from "@/components/Card";

/**
 * PublishReviewPage — versión con timeout REAL.
 *
 * Como esta página llama a `api.ts` directamente (no a través de AuthContext),
 * el AbortController cancela el fetch HTTP de verdad cuando salta el timeout.
 *
 * Además, la búsqueda de productos también usa AbortController para evitar
 * respuestas fuera de orden si el usuario escribe rápido.
 */

const SLOW_HINT_MS = 4500;
const TIMEOUT_MS = 12000;

const inputClass =
  "w-full rounded-2xl border border-line bg-ink px-4 py-3 text-cream placeholder:text-faint outline-none transition focus:border-acid focus:shadow-[0_0_0_4px_rgba(203,242,78,0.14)] disabled:cursor-not-allowed disabled:opacity-60";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function PublishReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // estado de búsqueda
  const [productQuery, setProductQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  // estado de la reseña
  const [description, setDescription] = useState("");
  const [recommended, setRecommended] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  // refs para timers y el controller del envío
  const submitCtrl = useRef<AbortController | null>(null);
  const slowTimer = useRef<number | null>(null);
  const failTimer = useRef<number | null>(null);

  // búsqueda con AbortController (cancela peticiones obsoletas al cambiar el texto)
  useEffect(() => {
    if (selected || productQuery.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const items = await searchProducts(productQuery.trim(), controller.signal);
        setResults(items);
        setShowDropdown(true);
        setSearching(false);
      } catch (err) {
        // si la petición se aborta es porque ya hay otra búsqueda en curso: mantenemos el indicador
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setSearching(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [productQuery, selected]);

  // limpieza al desmontar: cancela cualquier envío en curso
  useEffect(() => {
    return () => {
      submitCtrl.current?.abort();
      if (slowTimer.current !== null) window.clearTimeout(slowTimer.current);
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
    };
  }, []);

  // preselección: si llegamos desde una tarjeta (recomendación o resultado de
  // búsqueda) con un producto en el router state, lo dejamos ya elegido.
  useEffect(() => {
    const preset = (location.state as { product?: Product } | null)?.product;
    if (preset && preset.id != null && preset.Name) {
      setSelected(preset);
      setProductQuery(preset.Name);
    }
  }, [location.state]);

  const handleProductChange = (value: string) => {
    setProductQuery(value);
    setSelected(null);
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
    setSlow(false);

    if (!selected) {
      setError("Elige un producto de la lista (solo puedes reseñar productos ya registrados)");
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

    // controller del envío + timers
    const controller = new AbortController();
    submitCtrl.current = controller;

    slowTimer.current = window.setTimeout(() => setSlow(true), SLOW_HINT_MS);
    failTimer.current = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      await createReview(
        {
          product_id: selected.id,
          description: description.trim(),
          recommended,
        },
        controller.signal,
      );
      if (slowTimer.current !== null) window.clearTimeout(slowTimer.current);
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
      navigate("/dashboard");
    } catch (err) {
      if (slowTimer.current !== null) window.clearTimeout(slowTimer.current);
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
      setLoading(false);
      setSlow(false);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "El servidor está tardando demasiado en responder. Comprueba tu conexión e inténtalo de nuevo.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Error al publicar la reseña");
      }
    }
  };

  return (
    <Card className="mx-auto max-w-3xl p-10">
      <div className="mb-8 space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
          Publicar reseña
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-cream">
          Publica tu veredicto
        </h1>
        <p className="text-dim">
          Busca el título que quieres reseñar y comparte tu opinión.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-coral/30 bg-coral/10 px-5 py-3 text-sm text-coral"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* búsqueda de producto */}
        <div className="block">
          <span className="text-sm font-medium text-cream">Producto</span>
          <div className="relative mt-2">
            <input
              type="text"
              value={productQuery}
              onChange={(e) => handleProductChange(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              onBlur={() => window.setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Busca un juego, libro, serie o película…"
              autoComplete="off"
              disabled={loading}
              className={`${inputClass} ${selected || searching ? "pr-11" : ""}`}
            />
            {!selected && searching && (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-dim">
                <Spinner />
              </span>
            )}
            {selected && (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-acid">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </span>
            )}

            {(showDropdown || searching) && productQuery.trim().length >= 2 && !selected && (
              <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-ink shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                {searching ? (
                  <li className="flex items-center gap-2.5 px-4 py-3 text-sm text-faint">
                    <Spinner />
                    Buscando…
                  </li>
                ) : results.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-faint">
                    No existe ningún producto con ese nombre. Solo puedes reseñar productos
                    ya registrados.
                  </li>
                ) : (
                  results.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        // evita que el input pierda el foco antes del clic: si no, el onBlur
                        // cierra el dropdown y el onClick no llega a ejecutarse (no se selecciona)
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePick(product)}
                        className="block w-full px-4 py-3 text-left text-cream transition hover:bg-cream/5"
                      >
                        {product.Name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <p className="mt-2 text-xs text-faint">
            Solo puedes reseñar productos ya registrados en el catálogo.
          </p>
        </div>

        {/* veredicto */}
        <div className="block">
          <span className="text-sm font-medium text-cream">
            ¿Recomiendas este producto?
          </span>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRecommended(true)}
              disabled={loading}
              aria-pressed={recommended === true}
              className={`rounded-3xl border px-4 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                recommended === true
                  ? "border-acid bg-acid/10"
                  : "border-line bg-ink hover:border-cream/35"
              }`}
            >
              <span
                className={`inline-block rounded-full border-[1.5px] border-acid bg-acid/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-acid transition ${
                  recommended === true ? "opacity-100" : "opacity-60"
                }`}
              >
                Sí
              </span>
              <p className="mt-3 font-display text-xl font-semibold text-cream">
                Lo recomiendo
              </p>
              <p className="text-sm text-faint">Vale la pena</p>
            </button>

            <button
              type="button"
              onClick={() => setRecommended(false)}
              disabled={loading}
              aria-pressed={recommended === false}
              className={`rounded-3xl border px-4 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                recommended === false
                  ? "border-coral bg-coral/10"
                  : "border-line bg-ink hover:border-cream/35"
              }`}
            >
              <span
                className={`inline-block rounded-full border-[1.5px] border-coral bg-coral/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-coral transition ${
                  recommended === false ? "opacity-100" : "opacity-60"
                }`}
              >
                No
              </span>
              <p className="mt-3 font-display text-xl font-semibold text-cream">
                No lo recomiendo
              </p>
              <p className="text-sm text-faint">Mejor evitarlo</p>
            </button>
          </div>
        </div>

        {/* descripción */}
        <label className="block">
          <span className="text-sm font-medium text-cream">Tu reseña</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Cuenta cómo fue tu experiencia, qué te gustó y qué mejorarías."
            disabled={loading}
            className={`mt-2 ${inputClass} resize-y`}
          />
        </label>

        {/* acciones */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-line px-5 py-3 text-sm font-semibold text-cream transition hover:border-cream/35 hover:bg-cream/5"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-acid px-7 py-3 text-sm font-semibold text-ink transition hover:bg-[#d7f56e] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading && <Spinner />}
            <span>{loading ? "Publicando…" : "Publicar reseña"}</span>
          </button>
        </div>

        <p
          aria-live="polite"
          className={`min-h-[1.25rem] text-center text-xs transition-opacity duration-300 ${
            slow && loading ? "text-faint opacity-100" : "opacity-0"
          }`}
        >
          Esto está tardando más de lo normal…
        </p>
      </form>
    </Card>
  );
}
