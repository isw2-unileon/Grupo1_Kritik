import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-white/10 bg-slate-950/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
            <Link
              to="/"
              className="text-xl font-semibold tracking-[0.24em] text-cyan-300 transition hover:text-cyan-200"
            >
              Kritik
            </Link>

            <nav className="flex items-center gap-3">
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
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}