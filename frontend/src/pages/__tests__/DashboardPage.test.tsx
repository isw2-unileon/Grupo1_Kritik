import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";

const { mockLogin, mockGetReviews, mockSearchProducts } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockGetReviews: vi.fn(),
  mockSearchProducts: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  login: mockLogin,
  register: vi.fn(),
  getReviews: mockGetReviews,
  searchProducts: mockSearchProducts,
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
  });

  it("renders the latest reviews preview", () => {
    mockGetReviews.mockResolvedValue([]);
    renderDashboard();
    expect(screen.getByText("Tus últimas reseñas")).toBeInTheDocument();
  });

  describe("tabs", () => {
    it("switches between tabs and shows distinct content", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      const tabs = screen.getAllByText("Recomendaciones");
      await user.click(tabs[0]!);
      expect(screen.getByText("Recomendaciones para ti")).toBeInTheDocument();

      await user.click(screen.getByText("Reseñas hechas"));
      expect(screen.getByText("Tu actividad")).toBeInTheDocument();
    });

    it("renders profile panel when Perfil tab is active", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      await user.click(screen.getByText("Perfil"));

      expect(screen.getByText("Tu perfil")).toBeInTheDocument();
      expect(screen.getByText("Veredictos")).toBeInTheDocument();
    });

    it("loads and displays review stats in profile panel", async () => {
      mockGetReviews.mockResolvedValue([
        { id: 1, Description: "Great", Recommended: true, ProductName: "G1", UserName: "u" },
        { id: 2, Description: "Ok", Recommended: true, ProductName: "G2", UserName: "u" },
        { id: 3, Description: "Bad", Recommended: false, ProductName: "G3", UserName: "u" },
      ]);
      renderDashboard();

      const user = userEvent.setup();
      await user.click(screen.getByText("Perfil"));

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });

      expect(screen.getByText("67%")).toBeInTheDocument();
    });

    it("indicates active tab with aria-current", () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const inicioBtn = screen.getByRole("button", { name: "Inicio" });
      expect(inicioBtn).toHaveAttribute("aria-current", "page");
    });

    it("clicking active tab keeps it active", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      const inicioBtn = screen.getByRole("button", { name: "Inicio" });
      await user.click(inicioBtn);

      expect(screen.getByText("Tu espacio de veredictos está listo")).toBeInTheDocument();
    });
  });

  describe("search", () => {
    beforeEach(() => {
      mockSearchProducts.mockReset();
    });

    it("calls searchProducts on input with at least 2 characters", async () => {
      mockSearchProducts.mockReturnValue(new Promise(() => {}));
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      const input = screen.getByLabelText("Buscar en el catálogo");
      await user.type(input, "Ha");

      await waitFor(() => {
        expect(mockSearchProducts).toHaveBeenCalledWith("Ha", expect.any(AbortSignal));
      }, { timeout: 1500 });
    });

    it("shows spinner while searching", async () => {
      mockSearchProducts.mockReturnValue(new Promise(() => {}));
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      const input = screen.getByLabelText("Buscar en el catálogo");
      await user.type(input, "Ha");

      await waitFor(() => {
        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
      }, { timeout: 1500 });
    });

    it("renders search results", async () => {
      mockSearchProducts.mockResolvedValue([
        { id: 1, Name: "Halo", Type: "game", AverageGrade: 85 },
      ]);
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      const input = screen.getByLabelText("Buscar en el catálogo");
      await user.type(input, "Hal");

      await waitFor(() => {
        expect(screen.getByText("Halo")).toBeInTheDocument();
      }, { timeout: 1500 });
    });

    it("shows empty state when no results found", async () => {
      mockSearchProducts.mockResolvedValue([]);
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      const input = screen.getByLabelText("Buscar en el catálogo");
      await user.type(input, "Xyz");

      await waitFor(() => {
        expect(screen.getByText(/No se encontró ningún título/)).toBeInTheDocument();
      }, { timeout: 1500 });
    });

    it("clears search on X button", async () => {
      mockSearchProducts.mockResolvedValue([]);
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      const input = screen.getByLabelText("Buscar en el catálogo");
      await user.type(input, "Ha");

      await waitFor(() => {
        expect(screen.getByLabelText("Limpiar búsqueda")).toBeInTheDocument();
      }, { timeout: 1500 });

      await user.click(screen.getByLabelText("Limpiar búsqueda"));

      expect(screen.getByLabelText("Buscar en el catálogo")).toHaveValue("");
      expect(screen.getByText("Tu espacio de veredictos está listo")).toBeInTheDocument();
    });

    it("hides tab navigation while searching", async () => {
      mockSearchProducts.mockReturnValue(new Promise(() => {}));
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      expect(screen.getByRole("navigation", { name: "Secciones del panel" })).toBeInTheDocument();

      const user = userEvent.setup();
      const input = screen.getByLabelText("Buscar en el catálogo");
      await user.type(input, "Hal");

      await waitFor(() => {
        expect(
          screen.queryByRole("navigation", { name: "Secciones del panel" }),
        ).not.toBeInTheDocument();
      }, { timeout: 1500 });
    });
  });

  describe("recommendations filter", () => {
    it("filters by category and shows only matching items", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      await user.click(screen.getAllByText("Recomendaciones")[0]);

      await user.click(screen.getByText("Series"));

      expect(screen.getByText("Severance")).toBeInTheDocument();
      expect(screen.getByText("Shogun")).toBeInTheDocument();
      expect(screen.getByText("Última señal")).toBeInTheDocument();
      expect(screen.queryByText("Tunic")).not.toBeInTheDocument();
    });

    it("resets filter to show all when clicking Todas", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      await user.click(screen.getAllByText("Recomendaciones")[0]);

      await user.click(screen.getByText("Series"));
      await user.click(screen.getByText("Todas"));

      expect(screen.getByText("Severance")).toBeInTheDocument();
      expect(screen.getByText("Tunic")).toBeInTheDocument();
      expect(screen.getByText("Poor Things")).toBeInTheDocument();
    });
  });
});
