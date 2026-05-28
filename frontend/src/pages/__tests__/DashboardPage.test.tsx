import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";

const { mockLogin, mockGetReviews } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockGetReviews: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  login: mockLogin,
  register: vi.fn(),
  getReviews: mockGetReviews,
}));

function renderDashboard() {
  localStorage.setItem("token", "t");
  localStorage.setItem("user", JSON.stringify({ id: 1, email: "a@b.com", name: "A", surname: "B", user_name: "ab" }));

  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("DashboardPage", () => {
  it("renders the header with navigation", () => {
    mockGetReviews.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("renders welcome section", () => {
    mockGetReviews.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Tu espacio de reseñas ya está listo")).toBeInTheDocument();
    expect(screen.getByText("Publicar nueva reseña")).toBeInTheDocument();
  });

  it("renders suggestions and sidebar sections", () => {
    mockGetReviews.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Sugerencias para ti")).toBeInTheDocument();
    expect(screen.getByText("A tus amigos les gustó esto")).toBeInTheDocument();
    expect(screen.getByText("Lo que no les encantó")).toBeInTheDocument();
    expect(screen.getByText("Resumen rápido")).toBeInTheDocument();
    expect(screen.getByText("Accesos rápidos")).toBeInTheDocument();
  });
});
