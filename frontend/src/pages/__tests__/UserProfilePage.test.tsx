import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import UserProfilePage from "@/pages/UserProfilePage";

const { mockGetUserProfile, mockGetUserReviews, mockFollowUser, mockUnfollowUser } = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetUserReviews: vi.fn(),
  mockFollowUser: vi.fn(),
  mockUnfollowUser: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  getUserProfile: mockGetUserProfile,
  getUserReviews: mockGetUserReviews,
  followUser: mockFollowUser,
  unfollowUser: mockUnfollowUser,
  login: vi.fn(),
  register: vi.fn(),
  getReviews: vi.fn(),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
  searchProducts: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
}));

function renderProfile(userId: string = "5") {
  localStorage.setItem("token", "t");
  localStorage.setItem("user", JSON.stringify({ id: 1, email: "a@b.com", name: "A", surname: "B", user_name: "ab" }));

  return render(
    <MemoryRouter initialEntries={[`/user/${userId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/user/:id" element={<UserProfilePage />} />
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("UserProfilePage", () => {
  it("shows loading state initially", () => {
    mockGetUserProfile.mockReturnValue(new Promise(() => {}));
    mockGetUserReviews.mockReturnValue(new Promise(() => {}));
    renderProfile();
    expect(screen.getByText("Cargando perfil…")).toBeInTheDocument();
  });

  it("shows error when user not found", async () => {
    mockGetUserProfile.mockRejectedValue(new Error("not found"));
    mockGetUserReviews.mockRejectedValue(new Error("not found"));
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Usuario no encontrado")).toBeInTheDocument();
    });
    expect(screen.getByText("← Volver al inicio")).toBeInTheDocument();
  });

  it("renders profile card with name, username and stats", async () => {
    mockGetUserProfile.mockResolvedValue({
      id: 5,
      Name: "Test User",
      UserName: "testuser",
      FansCount: 42,
      InfluencersCount: 7,
      IsFollowing: false,
    });
    mockGetUserReviews.mockResolvedValue([]);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("seguidores")).toBeInTheDocument();
    expect(screen.getByText("seguidos")).toBeInTheDocument();
  });

  it("shows Seguir button when not following", async () => {
    mockGetUserProfile.mockResolvedValue({
      id: 5, Name: "Test User", UserName: "testuser",
      FansCount: 0, InfluencersCount: 0, IsFollowing: false,
    });
    mockGetUserReviews.mockResolvedValue([]);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Seguir")).toBeInTheDocument();
    });
  });

  it("shows Dejar de seguir button when following", async () => {
    mockGetUserProfile.mockResolvedValue({
      id: 5, Name: "Test User", UserName: "testuser",
      FansCount: 0, InfluencersCount: 0, IsFollowing: true,
    });
    mockGetUserReviews.mockResolvedValue([]);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Dejar de seguir")).toBeInTheDocument();
    });
  });

  it("calls followUser and toggles button when clicking Seguir", async () => {
    mockFollowUser.mockResolvedValue(undefined);
    mockGetUserProfile
      .mockResolvedValueOnce({
        id: 5, Name: "Test User", UserName: "testuser",
        FansCount: 0, InfluencersCount: 0, IsFollowing: false,
      })
      .mockResolvedValueOnce({
        id: 5, Name: "Test User", UserName: "testuser",
        FansCount: 1, InfluencersCount: 0, IsFollowing: true,
      });
    mockGetUserReviews.mockResolvedValue([]);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Seguir")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Seguir"));

    await waitFor(() => {
      expect(mockFollowUser).toHaveBeenCalledWith(5);
    });
    expect(screen.getByText("Dejar de seguir")).toBeInTheDocument();
  });

  it("calls unfollowUser and toggles button when clicking Dejar de seguir", async () => {
    mockUnfollowUser.mockResolvedValue(undefined);
    mockGetUserProfile
      .mockResolvedValueOnce({
        id: 5, Name: "Test User", UserName: "testuser",
        FansCount: 1, InfluencersCount: 0, IsFollowing: true,
      })
      .mockResolvedValueOnce({
        id: 5, Name: "Test User", UserName: "testuser",
        FansCount: 0, InfluencersCount: 0, IsFollowing: false,
      });
    mockGetUserReviews.mockResolvedValue([]);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Dejar de seguir")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Dejar de seguir"));

    await waitFor(() => {
      expect(mockUnfollowUser).toHaveBeenCalledWith(5);
    });
    expect(screen.getByText("Seguir")).toBeInTheDocument();
  });

  it("shows empty state when user has no reviews", async () => {
    mockGetUserProfile.mockResolvedValue({
      id: 5, Name: "Test", UserName: "test",
      FansCount: 0, InfluencersCount: 0, IsFollowing: false,
    });
    mockGetUserReviews.mockResolvedValue([]);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Este usuario aún no ha escrito reseñas.")).toBeInTheDocument();
    });
  });

  it("displays user reviews sorted by most recent", async () => {
    mockGetUserProfile.mockResolvedValue({
      id: 5, Name: "Test", UserName: "test",
      FansCount: 0, InfluencersCount: 0, IsFollowing: false,
    });
    mockGetUserReviews.mockResolvedValue([
      { id: 2, Description: "Second review", Recommended: true, ProductName: "Product 2", UserName: "test" },
      { id: 1, Description: "First review", Recommended: false, ProductName: "Product 1", UserName: "test" },
    ]);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/Product 1/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Product 2/)).toBeInTheDocument();
    expect(screen.getByText("Second review")).toBeInTheDocument();
    expect(screen.getByText("First review")).toBeInTheDocument();
  });

  it("has a back link to /dashboard", async () => {
    mockGetUserProfile.mockResolvedValue({
      id: 5, Name: "Test", UserName: "test",
      FansCount: 0, InfluencersCount: 0, IsFollowing: false,
    });
    mockGetUserReviews.mockResolvedValue([]);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Volver")).toBeInTheDocument();
    });
    expect(screen.getByText("Volver").closest("a")).toHaveAttribute("href", "/dashboard");
  });
});
