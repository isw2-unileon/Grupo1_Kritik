import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PublishReviewPage from "./pages/PublishReviewPage";

function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="border-b border-white/10 bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <Link
          to="/"
          className="text-xl font-semibold tracking-[0.24em] text-cyan-300 transition hover:text-cyan-200"
        >
          Kritik
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-300">
                {user?.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${isActive
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-200 hover:bg-white/5"
                  }`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${isActive
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-200 hover:bg-white/5"
                  }`
                }
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
        <Routes>
          <Route path="/" element={<LandingPage />} />
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