import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const { mockLogin, mockRegister } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  login: mockLogin,
  register: mockRegister,
}));

const fakeUser = { id: 1, email: "test@test.com", name: "Test", surname: "User", user_name: "testuser" };

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(auth.isAuthenticated)}</span>
      <span data-testid="user">{auth.user ? auth.user.email : "null"}</span>
      <button data-testid="login-btn" onClick={() => auth.login("user", "pass")}>
        Login
      </button>
      <button data-testid="register-btn" onClick={() => auth.register({ email: "a@b.com", password: "pw", name: "N" })}>
        Register
      </button>
      <button data-testid="logout-btn" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}

function renderAuth() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("AuthContext", () => {
  it("starts unauthenticated", () => {
    renderAuth();
    expect(screen.getByTestId("auth")).toHaveTextContent("false");
    expect(screen.getByTestId("user")).toHaveTextContent("null");
  });

  it("restores auth from localStorage", () => {
    localStorage.setItem("token", "restored-token");
    localStorage.setItem("user", JSON.stringify(fakeUser));
    renderAuth();
    expect(screen.getByTestId("auth")).toHaveTextContent("true");
    expect(screen.getByTestId("user")).toHaveTextContent(fakeUser.email);
  });

  it("login stores token and user", async () => {
    mockLogin.mockResolvedValue({ token: "jwt", user: fakeUser });
    renderAuth();

    fireEvent.click(screen.getByTestId("login-btn"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user", "pass");
    });
    expect(localStorage.getItem("token")).toBe("jwt");
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(fakeUser);
  });

  it("register calls register then login", async () => {
    mockRegister.mockResolvedValue({ id: 2, email: "a@b.com", name: "N", surname: "", user_name: "" });
    mockLogin.mockResolvedValue({ token: "reg-token", user: { id: 2, email: "a@b.com", name: "N", surname: "", user_name: "" } });
    renderAuth();

    fireEvent.click(screen.getByTestId("register-btn"));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    expect(localStorage.getItem("token")).toBe("reg-token");
  });

  it("logout clears auth state", async () => {
    localStorage.setItem("token", "t");
    localStorage.setItem("user", JSON.stringify(fakeUser));
    renderAuth();

    fireEvent.click(screen.getByTestId("logout-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("false");
    });
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
