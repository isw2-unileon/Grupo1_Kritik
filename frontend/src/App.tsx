import { BrowserRouter, Routes, Route, Navigate, NavLink, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PublishReviewPage from "./pages/PublishReviewPage";
import ProductDetailPage from "./pages/ProductDetailPage";

function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  //  Reusable classes of the new theme
  const ghost =
    "rounded-full px-4 py-2 text-sm font-medium text-dim transition hover:bg-cream/5 hover:text-cream";
  const primary =
    "rounded-full bg-acid px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d7f56e]";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-acid font-display text-xl font-black leading-none text-ink">
            K
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-cream">
            Kritik
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `hidden rounded-full px-4 py-2 text-sm font-medium transition sm:block ${
                    isActive ? "text-acid" : "text-dim hover:text-cream"
                  }`
                }
              >
                Inicio
              </NavLink>
              <NavLink
                to="/publish-review"
                className={({ isActive }) =>
                  `hidden rounded-full px-4 py-2 text-sm font-medium transition sm:block ${
                    isActive ? "text-acid" : "text-dim hover:text-cream"
                  }`
                }
              >
                Publicar
              </NavLink>

              <span className="hidden text-sm text-dim sm:block">{user?.name}</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface2 font-display text-sm font-bold text-acid ring-1 ring-line">
                {user?.name?.charAt(0).toUpperCase() ?? "K"}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-line px-4 py-2 text-sm text-cream transition hover:border-cream/35 hover:bg-cream/5"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive
                    ? "rounded-full bg-acid/10 px-4 py-2 text-sm font-semibold text-acid ring-1 ring-acid/30"
                    : ghost
                }
              >
                Iniciar sesión
              </NavLink>
              <NavLink to="/register" className={primary}>
                Crear cuenta
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative z-10 min-h-dvh text-cream">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/publish-review"
            element={
              <ProtectedRoute>
                <PublishReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProtectedRoute>
                <ProductDetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
