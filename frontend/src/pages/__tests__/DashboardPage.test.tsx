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
  it("renders the tab navigation", () => {
    mockGetReviews.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Reseñas hechas")).toBeInTheDocument();
  });

  it("renders welcome section", () => {
    mockGetReviews.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Tu espacio de veredictos está listo")).toBeInTheDocument();
    expect(screen.getByText("Publicar reseña")).toBeInTheDocument();
  });

  it("renders suggestions and sidebar sections", () => {
    mockGetReviews.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Sugerencias para ti")).toBeInTheDocument();
    expect(screen.getByText("A tus amigos les gustó")).toBeInTheDocument();
    expect(screen.getByText("No les convenció")).toBeInTheDocument();
    expect(screen.getByText("Resumen rápido")).toBeInTheDocument();
  });

  it("renders the latest reviews preview", () => {
    mockGetReviews.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Tus últimas reseñas")).toBeInTheDocument();
  });
});
