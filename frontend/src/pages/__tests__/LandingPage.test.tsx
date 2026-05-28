import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";

vi.mock("@/services/api", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

function renderLanding() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("LandingPage", () => {
  it("renders welcome message", () => {
    renderLanding();
    expect(screen.getByText("Bienvenido a Kritik")).toBeInTheDocument();
  });

  it("renders create account link", () => {
    renderLanding();
    const link = screen.getByText("Crear cuenta");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/register");
  });

  it("renders login link", () => {
    renderLanding();
    const link = screen.getByText("Iniciar sesión");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });

  it("renders info sections", () => {
    renderLanding();
    expect(screen.getByText("Qué hacemos")).toBeInTheDocument();
    expect(screen.getByText("Acerca de nosotros")).toBeInTheDocument();
  });
});
