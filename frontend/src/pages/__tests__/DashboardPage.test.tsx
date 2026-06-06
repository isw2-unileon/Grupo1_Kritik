import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";

const { mockLogin, mockGetReviews, mockSearchProducts, mockGetFollowers, mockGetFollowing, mockUnfollowUser, mockGetRecommendations } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockGetReviews: vi.fn(),
  mockSearchProducts: vi.fn(),
  mockGetFollowers: vi.fn(),
  mockGetFollowing: vi.fn(),
  mockUnfollowUser: vi.fn(),
  mockGetRecommendations: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  login: mockLogin,
  register: vi.fn(),
  getReviews: mockGetReviews,
  searchProducts: mockSearchProducts,
  getFollowers: mockGetFollowers,
  getFollowing: mockGetFollowing,
  unfollowUser: mockUnfollowUser,
  getRecommendations: mockGetRecommendations,
}));

function renderDashboard(followingOverride?: unknown[], recommendations?: unknown[]) {
  mockGetRecommendations.mockResolvedValue(recommendations ?? []);
  mockGetFollowers.mockResolvedValue([]);
  mockGetFollowing.mockResolvedValue(followingOverride ?? []);
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

    it("opens following list modal when clicking seguiditos count", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard([
        { id: 10, Email: "u1@t.com", Name: "User One", UserName: "userone" },
        { id: 20, Email: "u2@t.com", Name: "User Two", UserName: "usertwo" },
      ]);

      const user = userEvent.setup();
      await user.click(screen.getByText("Perfil"));
      await user.click(screen.getByText("seguidos"));

      expect(screen.getByRole("dialog", { name: "Usuarios que sigues" })).toBeInTheDocument();
      expect(screen.getByText("User One")).toBeInTheDocument();
      expect(screen.getByText("User Two")).toBeInTheDocument();
    });

    it("shows empty state when not following anyone", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard();

      const user = userEvent.setup();
      await user.click(screen.getByText("Perfil"));
      await user.click(screen.getByText("seguidos"));

      expect(screen.getByText("No sigues a nadie todavía.")).toBeInTheDocument();
    });

    it("calls unfollowUser and removes user from list on button click", async () => {
      mockUnfollowUser.mockResolvedValue(undefined);
      mockGetReviews.mockResolvedValue([]);
      renderDashboard([
        { id: 10, Email: "u1@t.com", Name: "User One", UserName: "userone" },
        { id: 20, Email: "u2@t.com", Name: "User Two", UserName: "usertwo" },
      ]);

      const user = userEvent.setup();
      await user.click(screen.getByText("Perfil"));
      await user.click(screen.getByText("seguidos"));

      const unfollowButtons = screen.getAllByText("Dejar de seguir");
      expect(unfollowButtons).toHaveLength(2);

      await user.click(unfollowButtons[0]!);

      await waitFor(() => {
        expect(mockUnfollowUser).toHaveBeenCalledWith(10);
      });

      await waitFor(() => {
        expect(screen.queryByText("User One")).not.toBeInTheDocument();
      });
      expect(screen.getByText("User Two")).toBeInTheDocument();
    });

    it("shows loading text on unfollow button while unfollowing", async () => {
      mockUnfollowUser.mockImplementation(() => new Promise(() => {}));
      mockGetReviews.mockResolvedValue([]);
      renderDashboard([
        { id: 10, Email: "u1@t.com", Name: "User One", UserName: "userone" },
      ]);

      const user = userEvent.setup();
      await user.click(screen.getByText("Perfil"));
      await user.click(screen.getByText("seguidos"));
      await user.click(screen.getByText("Dejar de seguir"));

      expect(screen.getByText("Dejando de seguir…")).toBeInTheDocument();
    });

    it("closes modal on Escape key", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard([
        { id: 10, Email: "u1@t.com", Name: "User One", UserName: "userone" },
      ]);

      const user = userEvent.setup();
      await user.click(screen.getByText("Perfil"));
      await user.click(screen.getByText("seguidos"));

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("following list rows link to /user/:id", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard([
        { id: 10, Email: "u1@t.com", Name: "User One", UserName: "userone" },
      ]);

      const user = userEvent.setup();
      await user.click(screen.getByText("Perfil"));
      await user.click(screen.getByText("seguidos"));

      await waitFor(() => {
        expect(screen.getByText("User One")).toBeInTheDocument();
      });

      const link = screen.getByText("User One").closest("a");
      expect(link).toHaveAttribute("href", "/user/10");
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
    const mockProducts = [
      { id: 1, Name: "Severance", Type: "series", Description: "Tensión perfecta." },
      { id: 2, Name: "Shogun", Type: "series", Description: "Producción enorme." },
      { id: 3, Name: "Última señal", Type: "series", Description: "Se desinfla." },
      { id: 4, Name: "Tunic", Type: "game", Description: "Un secreto detrás de cada esquina." },
      { id: 5, Name: "Poor Things", Type: "film", Description: "Visualmente bella." },
    ];

    it("filters by category and shows only matching items", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard(undefined, mockProducts);

      const user = userEvent.setup();
      await user.click(screen.getAllByText("Recomendaciones")[0]);

      expect(screen.getByText("Severance")).toBeInTheDocument();

      await user.click(screen.getByText("Series"));

      expect(screen.getByText("Shogun")).toBeInTheDocument();
      expect(screen.getByText("Última señal")).toBeInTheDocument();
      expect(screen.queryByText("Tunic")).not.toBeInTheDocument();
    });

    it("resets filter to show all when clicking Todas", async () => {
      mockGetReviews.mockResolvedValue([]);
      renderDashboard(undefined, mockProducts);

      const user = userEvent.setup();
      await user.click(screen.getAllByText("Recomendaciones")[0]);

      await waitFor(() => {
        expect(screen.getByText("Tunic")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Series"));
      expect(screen.queryByText("Tunic")).not.toBeInTheDocument();

      await user.click(screen.getByText("Todas"));
      expect(screen.getByText("Tunic")).toBeInTheDocument();
      expect(screen.getByText("Poor Things")).toBeInTheDocument();
    });
  });
});
