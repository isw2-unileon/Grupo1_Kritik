import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import App from "@/App";

const { mockGetReviews, mockSearchProducts, mockGetRecommendations } = vi.hoisted(() => ({
  mockGetReviews: vi.fn(),
  mockSearchProducts: vi.fn(),
  mockGetRecommendations: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  login: vi.fn(),
  register: vi.fn(),
  getReviews: mockGetReviews,
  searchProducts: mockSearchProducts,
  searchUsers: vi.fn(() => Promise.resolve([])),
  createReview: vi.fn(),
  getRecommendations: mockGetRecommendations,
  getFollowers: vi.fn(() => Promise.resolve([])),
  getFollowing: vi.fn(() => Promise.resolve([])),
  getRandomProducts: vi.fn(() => Promise.resolve([])),
  getInfluencerRecommendations: vi.fn(() => Promise.resolve([])),
  getInfluencerNotRecommendations: vi.fn(() => Promise.resolve([])),
  getUserReviews: vi.fn(() => Promise.resolve([])),
}));

const fakeUser = { id: 1, email: "a@b.com", name: "Ana", surname: "G", user_name: "ana" };

function authenticatedSetup() {
  mockGetReviews.mockResolvedValue([]);
  mockGetRecommendations.mockResolvedValue([]);
  mockSearchProducts.mockReturnValue(new Promise(() => {}));
  localStorage.setItem("token", "t");
  localStorage.setItem("user", JSON.stringify(fakeUser));
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  window.history.pushState({}, "", "/");
});

// "Inicio" and "Iniciar sesión" appear in both the Header nav and page content,
// so getAllByText is used where needed.

describe("App navigation — Header", () => {
  it("renders Iniciar sesión and Crear cuenta when unauthenticated", () => {
    render(<App />);
    expect(screen.getByText("Crear cuenta")).toBeInTheDocument();
    expect(screen.getAllByText("Iniciar sesión").length).toBeGreaterThan(0);
  });

  it("hides authenticated links when unauthenticated", () => {
    render(<App />);
    expect(screen.queryByText("Publicar")).not.toBeInTheDocument();
    expect(screen.queryByText("Cerrar sesión")).not.toBeInTheDocument();
  });

  it("shows Inicio, Publicar, user name and Cerrar sesión when authenticated", async () => {
    authenticatedSetup();
    render(<App />);

    await screen.findByText("Tu espacio de veredictos está listo");
    expect(screen.getAllByText("Inicio").length).toBeGreaterThan(0);
    expect(screen.getByText("Publicar")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
  });

  it("hides unauthenticated links when authenticated", async () => {
    authenticatedSetup();
    render(<App />);

    await screen.findByText("Tu espacio de veredictos está listo");
    expect(screen.queryByText("Crear cuenta")).not.toBeInTheDocument();
  });

  it("shows avatar with first letter of user name when authenticated", async () => {
    authenticatedSetup();
    render(<App />);

    await screen.findByText("Tu espacio de veredictos está listo");
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
  });

  it("logo links to /", () => {
    localStorage.clear();
    render(<App />);
    const logo = screen.getByText("Kritik");
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });

  it("links Inicio to /dashboard", async () => {
    authenticatedSetup();
    render(<App />);

    await screen.findByText("Tu espacio de veredictos está listo");
    const headerInicio = screen.getAllByText("Inicio")[0];
    expect(headerInicio.closest("a")).toHaveAttribute("href", "/dashboard");
  });

  it("links Publicar to /publish-review", async () => {
    authenticatedSetup();
    render(<App />);

    await screen.findByText("Tu espacio de veredictos está listo");
    expect(screen.getByText("Publicar").closest("a")).toHaveAttribute("href", "/publish-review");
  });

  it("links Iniciar sesión to /login", () => {
    render(<App />);
    const loginLinks = screen.getAllByText("Iniciar sesión");
    const navLink = loginLinks.find((el) => el.tagName === "A");
    expect(navLink).toHaveAttribute("href", "/login");
  });

  it("links Crear cuenta to /register", () => {
    render(<App />);
    expect(screen.getByText("Crear cuenta").closest("a")).toHaveAttribute("href", "/register");
  });

  it("logs out and shows unauthenticated view on Cerrar sesión click", async () => {
    authenticatedSetup();
    render(<App />);

    await screen.findByText("Tu espacio de veredictos está listo");

    const user = userEvent.setup();
    await user.click(screen.getByText("Cerrar sesión"));

    await waitFor(() => {
      expect(screen.getByText("Crear cuenta")).toBeInTheDocument();
    });
    expect(localStorage.getItem("token")).toBeNull();
  });
});
