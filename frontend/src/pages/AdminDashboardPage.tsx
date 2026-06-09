import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/Card";
import ProfilePanel from "@/components/ProfilePanel";
import ProductEditModal from "@/components/ProductEditModal";
import {
  searchProducts,
  getTopRated,
  getWorstRated,
  getAllProducts,
  type Product,
} from "@/services/api";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { id: "inicio", label: "Inicio" },
  { id: "productos", label: "Productos publicados" },
  { id: "perfil", label: "Perfil" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const tabsRef = useRef<HTMLElement>(null);
  const didMount = useRef(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const [topRated, setTopRated] = useState<Product[]>([]);
  const [worstRated, setWorstRated] = useState<Product[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [worstLoading, setWorstLoading] = useState(true);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [erroredImages, setErroredImages] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((id: number) => {
    setErroredImages((prev) => new Set(prev).add(id));
  }, []);

  useEffect(() => {
    if (activeTab !== "inicio") return;
    let active = true;
    setTopLoading(true);
    setWorstLoading(true);
    Promise.all([
      getTopRated(5),
      getWorstRated(5),
    ]).then(([top, worst]) => {
      if (active) {
        setTopRated(top);
        setWorstRated(worst);
        setTopLoading(false);
        setWorstLoading(false);
      }
    }).catch(() => {
      if (active) {
        setTopRated([]);
        setWorstRated([]);
        setTopLoading(false);
        setWorstLoading(false);
      }
    });
    return () => { active = false; };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "productos") return;
    let active = true;
    setProductsLoading(true);
    getAllProducts().then((data) => {
      if (active) {
        setAllProducts(data);
        setProductsLoading(false);
      }
    }).catch(() => {
      if (active) {
        setAllProducts([]);
        setProductsLoading(false);
      }
    });
    return () => { active = false; };
  }, [activeTab]);

  // Catalog search — debounced
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
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setSearching(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    tabsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [activeTab]);

  const isSearching = query.trim().length >= 2;

  const handleProductUpdated = useCallback(() => {
    setEditingProduct(null);
    getAllProducts().then((data) => setAllProducts(data)).catch(() => {});
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "inicio":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <Card as="section" className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">Mejor valorados</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Los mejores</h2>
              {topLoading ? (
                <div className="mt-6 flex justify-center py-8"><Spinner /></div>
              ) : topRated.length === 0 ? (
                <p className="mt-6 text-dim">No hay productos valorados todavía.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {topRated.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-ink/60 p-3 text-left transition hover:-translate-y-0.5 hover:border-acid/35"
                    >
                      {p.Image && !erroredImages.has(p.id) ? (
                        <img src={p.Image} alt={p.Name} className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-line" onError={() => handleImageError(p.id)} />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface2 font-display text-lg font-bold text-acid ring-1 ring-line">
                          {p.Name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-cream">{p.Name}</p>
                        <p className="text-xs text-faint">
                          {p.AverageGrade != null ? `${p.AverageGrade}%` : "Sin nota"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card as="section" className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.34em] text-coral">Peor valorados</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Los peores</h2>
              {worstLoading ? (
                <div className="mt-6 flex justify-center py-8"><Spinner /></div>
              ) : worstRated.length === 0 ? (
                <p className="mt-6 text-dim">No hay productos valorados todavía.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {worstRated.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-ink/60 p-3 text-left transition hover:-translate-y-0.5 hover:border-coral/35"
                    >
                      {p.Image && !erroredImages.has(p.id) ? (
                        <img src={p.Image} alt={p.Name} className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-line" onError={() => handleImageError(p.id)} />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface2 font-display text-lg font-bold text-coral ring-1 ring-line">
                          {p.Name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-cream">{p.Name}</p>
                        <p className="text-xs text-faint">
                          {p.AverageGrade != null ? `${p.AverageGrade}/10` : "Sin nota"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        );

      case "productos":
        return (
          <Card as="section" className="p-7 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold">Productos publicados</h2>
              {productsLoading && <span className="text-acid"><Spinner /></span>}
            </div>

            {productsLoading ? (
              <div className="mt-6 flex justify-center py-12"><Spinner /></div>
            ) : allProducts.length === 0 ? (
              <p className="mt-6 text-dim">No hay productos en el catálogo todavía.</p>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {allProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-ink/60 p-3"
                  >
                    {p.Image && !erroredImages.has(p.id) ? (
                      <img src={p.Image} alt={p.Name} className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-line" onError={() => handleImageError(p.id)} />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface2 font-display text-lg font-bold text-acid ring-1 ring-line">
                        {p.Name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-cream">{p.Name}</p>
                      <p className="text-xs text-faint">
                        {p.AverageGrade != null ? `${p.AverageGrade}/10` : "Sin nota"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-cream transition hover:border-acid/35 hover:bg-cream/5"
                    >
                      Modificar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );

      case "perfil":
        return <div className="max-w-2xl"><ProfilePanel user={user} showTitle /></div>;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
            Hola{user?.name ? `, ${user.name}` : ""}
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Tu espacio de administración
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

          <Link
            to="/publish-product"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-acid px-5 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d7f56e]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Publicar producto
          </Link>
        </div>
      </div>

      {isSearching ? (
        <Card as="section" className="p-7 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.34em] text-acid">
                Búsqueda en el catálogo
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                Resultados para &ldquo;{query.trim()}&rdquo;
              </h2>
            </div>
            {searching && (
              <span className="text-acid"><Spinner /></span>
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
                  {p.Image && !erroredImages.has(p.id) ? (
                    <img src={p.Image} alt={p.Name} className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-line" onError={() => handleImageError(p.id)} />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface2 font-display text-lg font-bold text-acid ring-1 ring-line">
                      {p.Name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cream">{p.Name}</p>
                    <p className="text-xs text-faint">Ver ficha →</p>
                  </div>
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

      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onSave={() => handleProductUpdated()}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}
