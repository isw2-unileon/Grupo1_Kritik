import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import ReviewsSection from "@/components/ReviewsSection";

const { mockGetReviews } = vi.hoisted(() => ({ mockGetReviews: vi.fn() }));

vi.mock("@/services/api", () => ({
  getReviews: mockGetReviews,
  login: vi.fn(),
  register: vi.fn(),
}));

function renderReviews() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ReviewsSection />
      </AuthProvider>
    </MemoryRouter>
  );
}

afterEach(cleanup);

describe("ReviewsSection", () => {
  it("shows loading state initially", () => {
    mockGetReviews.mockReturnValue(new Promise(() => {}));
    renderReviews();
    expect(screen.getByText("Cargando tus reseñas…")).toBeInTheDocument();
  });

  it("shows empty state when no reviews", async () => {
    mockGetReviews.mockResolvedValue([]);
    renderReviews();

    await waitFor(() => {
      expect(screen.getByText("Todavía no has publicado ninguna reseña.")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    mockGetReviews.mockRejectedValue(new Error("fail"));
    renderReviews();

    await waitFor(() => {
      expect(screen.getByText("No se pudieron cargar tus reseñas")).toBeInTheDocument();
    });
  });

  it("renders list of reviews", async () => {
    mockGetReviews.mockResolvedValue([
      { id: 1, Name: "Great game", Description: "Loved it", Recommended: true, ProductName: "Game1", UserName: "user1" },
      { id: 2, Name: "Not bad", Description: "Meh", Recommended: false, ProductName: "Game2", UserName: "user2" },
    ]);
    renderReviews();

    await waitFor(() => {
      expect(screen.getByText("Game1")).toBeInTheDocument();
      expect(screen.getByText("Game2")).toBeInTheDocument();
    });

    expect(screen.getByText("Recomendado")).toBeInTheDocument();
    expect(screen.getByText("No recomendado")).toBeInTheDocument();
  });

  it("shows review count", async () => {
    mockGetReviews.mockResolvedValue([
      { id: 1, Name: "R1", Description: "D1", Recommended: true, ProductName: "P1", UserName: "u1" },
    ]);
    renderReviews();

    await waitFor(() => {
      expect(screen.getByText("1 reseña creada")).toBeInTheDocument();
    });
  });
});
