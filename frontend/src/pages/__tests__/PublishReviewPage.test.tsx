import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import PublishReviewPage from "@/pages/PublishReviewPage";

const { mockSearchProducts, mockCreateReview, mockLogin } = vi.hoisted(() => ({
  mockSearchProducts: vi.fn(),
  mockCreateReview: vi.fn(),
  mockLogin: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  searchProducts: mockSearchProducts,
  createReview: mockCreateReview,
  login: mockLogin,
  register: vi.fn(),
}));

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderPublish() {
  localStorage.setItem("token", "t");
  localStorage.setItem("user", JSON.stringify({ id: 1, email: "a@b.com", name: "A", surname: "B", user_name: "ab" }));

  return render(
    <MemoryRouter initialEntries={["/publish-review"]}>
      <AuthProvider>
        <PublishReviewPage />
        <LocationDisplay />
      </AuthProvider>
    </MemoryRouter>
  );
}

function submitForm() {
  const form = document.querySelector("form");
  if (form) fireEvent.submit(form);
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("PublishReviewPage", () => {
  it("renders the form with product search", () => {
    mockSearchProducts.mockResolvedValue([]);
    mockCreateReview.mockResolvedValue({});
    renderPublish();

    expect(screen.getByText("Publicar una nueva reseña")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Busca un juego, libro, serie o película…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Un resumen corto de tu opinión")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar reseña" })).toBeInTheDocument();
  });

  it("shows error when submitting without selecting a product", async () => {
    mockSearchProducts.mockResolvedValue([]);
    mockCreateReview.mockResolvedValue({});
    renderPublish();

    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Elige un producto de la lista (solo puedes reseñar productos ya registrados)")).toBeInTheDocument();
    });
  });

  it("shows error when submitting without title", async () => {
    mockSearchProducts.mockResolvedValue([{ id: 1, Name: "Game" }]);
    mockCreateReview.mockResolvedValue({});
    renderPublish();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Busca un juego, libro, serie o película…"), "Game");
    await waitFor(() => expect(mockSearchProducts).toHaveBeenCalled());

    const pickButton = await screen.findByText("Game");
    await user.click(pickButton);
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("El título de la reseña es obligatorio")).toBeInTheDocument();
    });
  });

  it("calls createReview and navigates on success", async () => {
    mockSearchProducts.mockResolvedValue([{ id: 1, Name: "Game" }]);
    mockCreateReview.mockResolvedValue({});
    renderPublish();

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Busca un juego, libro, serie o película…"), "Game");
    await waitFor(() => expect(mockSearchProducts).toHaveBeenCalled());

    const pickButton = await screen.findByText("Game");
    await user.click(pickButton);
    await user.type(screen.getByPlaceholderText("Un resumen corto de tu opinión"), "Great game");
    await user.click(screen.getByText("Sí, lo recomiendo"));
    await user.type(screen.getByPlaceholderText("Cuenta cómo fue tu experiencia, qué te gustó y qué mejorarías."), "Really enjoyed it");

    submitForm();

    await waitFor(() => {
      expect(mockCreateReview).toHaveBeenCalledWith({
        title: "Great game",
        product_id: 1,
        description: "Really enjoyed it",
        recommended: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
    });
  });

  it("shows loading state on submit", async () => {
    mockSearchProducts.mockResolvedValue([{ id: 1, Name: "Game" }]);
    mockCreateReview.mockImplementation(() => new Promise(() => {}));

    renderPublish();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Busca un juego, libro, serie o película…"), "Game");
    await waitFor(() => expect(mockSearchProducts).toHaveBeenCalled());

    const pickButton = await screen.findByText("Game");
    await user.click(pickButton);
    await user.type(screen.getByPlaceholderText("Un resumen corto de tu opinión"), "Title");
    await user.click(screen.getByText("Sí, lo recomiendo"));
    await user.type(screen.getByPlaceholderText("Cuenta cómo fue tu experiencia, qué te gustó y qué mejorarías."), "Desc");

    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Publicando...")).toBeInTheDocument();
    });
  });

  it("shows error from API on failure", async () => {
    mockSearchProducts.mockResolvedValue([{ id: 1, Name: "Game" }]);
    mockCreateReview.mockRejectedValue(new Error("Title already exists"));

    renderPublish();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Busca un juego, libro, serie o película…"), "Game");
    await waitFor(() => expect(mockSearchProducts).toHaveBeenCalled());

    const pickButton = await screen.findByText("Game");
    await user.click(pickButton);
    await user.type(screen.getByPlaceholderText("Un resumen corto de tu opinión"), "Title");
    await user.click(screen.getByText("Sí, lo recomiendo"));
    await user.type(screen.getByPlaceholderText("Cuenta cómo fue tu experiencia, qué te gustó y qué mejorarías."), "Desc");

    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Title already exists")).toBeInTheDocument();
    });
  });
});
